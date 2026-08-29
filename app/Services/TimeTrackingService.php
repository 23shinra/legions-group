<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\ObjectAssignment;
use App\Models\TimeEntry;
use App\Models\User;
use App\Models\WorkObject;
use App\Enums\UserRole;
use App\Notifications\ArrivalConfirmed;
use App\Notifications\ArrivalConfirmationRequested;
use App\Notifications\AttendanceAlert;
use App\Notifications\ShiftEnded;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;

final readonly class TimeTrackingService
{
    public function __construct(
        private ObjectAssignmentService $assignments,
        private ShiftPlanService $shiftPlans,
        private RealtimeNotifier $realtime,
    ) {}


    public function requestArrival(
        User $worker,
        ?float $latitude = null,
        ?float $longitude = null,
    ): TimeEntry {
        if (! $worker->isWorker()) {
            throw ValidationException::withMessages([
                'time' => 'Отметить приход могут только строители.',
            ]);
        }

        $this->closeStaleOpenEntries($worker);

        if ($worker->activeTimeEntry() !== null) {
            throw ValidationException::withMessages([
                'time' => 'Смена уже начата.',
            ]);
        }

        if ($worker->pendingTimeEntry() !== null) {
            throw ValidationException::withMessages([
                'time' => 'Ожидается подтверждение бригадира.',
            ]);
        }

        $object = $this->resolveAssignedObject($worker);

        if ($object === null) {
            throw ValidationException::withMessages([
                'object' => 'Объект не назначен. Обратитесь к бригадиру.',
            ]);
        }

        $entry = TimeEntry::query()->create([
            'user_id' => $worker->id,
            'brigade_id' => $worker->brigade_id,
            'work_object_id' => $object->id,
            'started_at' => now(),
            'latitude' => $latitude,
            'longitude' => $longitude,
        ]);

        ActivityLog::record($worker, 'time.arrival_requested', $entry, [
            'object_id' => $object->id,
            'member' => $worker->name,
        ]);

        $worker->loadMissing('brigade.brigadier');
        $brigadier = $worker->brigade?->brigadier;

        if ($brigadier !== null) {
            $brigadier->notify(new ArrivalConfirmationRequested($entry->load('user')));
        }

        $this->realtime->pingRoles([UserRole::Manager], 'time.arrival_pending');

        return $entry;
    }

    public function confirmArrival(
        User $brigadier,
        User $member,
        Carbon $startedAt,
        WorkObject $object,
    ): TimeEntry {
        $this->assertBrigadierManagesMember($brigadier, $member);
        $this->closeStaleOpenEntries($member);
        $this->assertValidShiftTime($startedAt);
        $this->assertObjectBelongsToBrigade($brigadier, $object);
        $this->assignments->assertMemberOnObject($member, $object);

        if ($member->activeTimeEntry() !== null) {
            throw ValidationException::withMessages([
                'time' => 'Смена у сотрудника уже начата.',
            ]);
        }

        $pending = $member->pendingTimeEntry();

        if ($pending === null) {
            throw ValidationException::withMessages([
                'time' => 'Строитель ещё не отметил приход.',
            ]);
        }

        if ((int) $pending->work_object_id !== (int) $object->id) {
            throw ValidationException::withMessages([
                'work_object_id' => 'Запрос прихода относится к другому объекту.',
            ]);
        }

        $pending->update([
            'started_at' => $startedAt,
            'confirmed_at' => now(),
            'confirmed_by' => $brigadier->id,
        ]);

        ActivityLog::record($brigadier, 'time.arrival_confirmed', $pending, [
            'member_id' => $member->id,
            'member' => $member->name,
            'object_id' => $object->id,
        ]);

        $fresh = $pending->fresh(['user', 'workObject']);

        if ($fresh?->user !== null) {
            $fresh->user->notify(new ArrivalConfirmed($fresh));
        }

        User::query()
            ->where('role', UserRole::Manager)
            ->where('is_active', true)
            ->whereKeyNot($member->id)
            ->get()
            ->each(fn (User $manager) => $manager->notify(new ArrivalConfirmed($fresh)));

        $this->notifyIfLate($fresh, $member);

        return $fresh;
    }

    public function endForMember(
        User $brigadier,
        User $member,
        ?Carbon $endedAt = null,
        int $breakMinutes = 0,
    ): TimeEntry {
        $this->assertBrigadierManagesMember($brigadier, $member);
        $this->closeStaleOpenEntries($member);

        $entry = $member->activeTimeEntry();

        if ($entry === null) {
            throw ValidationException::withMessages([
                'time' => 'У сотрудника нет открытой смены.',
            ]);
        }

        return $this->closeEntry($entry, $endedAt, $breakMinutes, $brigadier, [
            'member_id' => $member->id,
        ]);
    }

    public function endForWorker(
        User $worker,
        ?Carbon $endedAt = null,
        int $breakMinutes = 0,
    ): TimeEntry {
        if (! $worker->isWorker() && ! $worker->isBrigadier()) {
            throw ValidationException::withMessages([
                'time' => 'Завершить смену могут только сотрудники.',
            ]);
        }

        $this->closeStaleOpenEntries($worker);

        $entry = $worker->activeTimeEntry();

        if ($entry === null) {
            throw ValidationException::withMessages([
                'time' => 'У вас нет открытой смены.',
            ]);
        }

        return $this->closeEntry($entry, $endedAt, $breakMinutes, $worker);
    }

    /**
     * @param  array<string, mixed>  $extraMeta
     */
    private function closeEntry(
        TimeEntry $entry,
        ?Carbon $endedAt,
        int $breakMinutes,
        User $actor,
        array $extraMeta = [],
    ): TimeEntry {
        $endedAt ??= now();
        $breakMinutes = max(0, $breakMinutes);

        if ($endedAt->lessThan($entry->started_at)) {
            throw ValidationException::withMessages([
                'time' => 'Время окончания не может быть раньше начала смены.',
            ]);
        }

        $rawMinutes = max(0, (int) $entry->started_at->diffInMinutes($endedAt));

        if ($breakMinutes >= $rawMinutes && $rawMinutes > 0) {
            throw ValidationException::withMessages([
                'break_minutes' => 'Перерыв не может быть больше или равен длительности смены.',
            ]);
        }

        $workedMinutes = max(0, $rawMinutes - $breakMinutes);

        $entry->update([
            'ended_at' => $endedAt,
            'break_minutes' => $breakMinutes,
            'worked_minutes' => $workedMinutes,
        ]);

        $entry->loadMissing('user');

        ActivityLog::record($actor, 'time.ended', $entry, [
            ...$extraMeta,
            'member' => $entry->user?->name,
            'worked_minutes' => $workedMinutes,
            'break_minutes' => $breakMinutes,
        ]);

        $fresh = $entry->fresh(['user', 'workObject']);
        $fresh?->user?->loadMissing('brigade.brigadier');
        $worker = $fresh?->user;
        $brigadier = $worker?->brigade?->brigadier;

        if ($worker !== null && (int) $worker->id !== (int) $actor->id) {
            $worker->notify(new ShiftEnded($fresh));
        }

        if ($brigadier !== null && (int) $brigadier->id !== (int) $actor->id) {
            $brigadier->notify(new ShiftEnded($fresh));
        }

        $this->realtime->pingRoles([UserRole::Manager], 'time.ended', $actor->id);

        return $fresh;
    }

    private function resolveAssignedObject(User $user): ?WorkObject
    {
        $planned = $this->shiftPlans->applyTodayFor($user);

        if ($planned !== null) {
            return $planned;
        }

        $assignment = ObjectAssignment::query()
            ->with('workObject')
            ->where('user_id', $user->id)
            ->whereNull('ended_on')
            ->latest('started_on')
            ->first();

        return $assignment?->workObject;
    }

    private function closeStaleOpenEntries(User $user): void
    {
        $user->timeEntries()
            ->whereNull('ended_at')
            ->whereDate('started_at', '<', today())
            ->get()
            ->each(function (TimeEntry $entry): void {
                $endedAt = $entry->started_at->copy()->endOfDay();
                $breakMinutes = (int) ($entry->break_minutes ?? 0);
                $workedMinutes = $entry->isConfirmed()
                    ? max(0, (int) $entry->started_at->diffInMinutes($endedAt) - $breakMinutes)
                    : 0;

                $entry->update([
                    'ended_at' => $endedAt,
                    'worked_minutes' => $workedMinutes,
                ]);
            });
    }

    private function assertBrigadierManagesMember(User $brigadier, User $member): void
    {
        if (! $brigadier->isBrigadier() || $brigadier->brigade_id === null) {
            throw ValidationException::withMessages([
                'brigade' => 'Бригада не назначена.',
            ]);
        }

        if ($member->brigade_id !== $brigadier->brigade_id || ! $member->isWorker()) {
            throw ValidationException::withMessages([
                'member' => 'Сотрудник не входит в вашу бригаду.',
            ]);
        }
    }

    private function assertValidShiftTime(Carbon $moment): void
    {
        if (! $moment->isToday()) {
            throw ValidationException::withMessages([
                'started_at' => 'Можно отметить только смену на сегодня.',
            ]);
        }

        if ($moment->isFuture()) {
            throw ValidationException::withMessages([
                'started_at' => 'Время прихода не может быть в будущем.',
            ]);
        }
    }

    private function notifyIfLate(?TimeEntry $entry, User $member): void
    {
        if ($entry?->started_at === null) {
            return;
        }

        $startedLocal = $entry->started_at->copy()->timezone(AttendanceDigestService::TIMEZONE);
        $lateAfter = $startedLocal->copy()->startOfDay()->setTime(AttendanceDigestService::LATE_HOUR, 0);

        if ($startedLocal->lessThanOrEqualTo($lateAfter)) {
            return;
        }

        $detail = 'приход в '.$startedLocal->format('H:i');
        $member->loadMissing('brigade.brigadier');

        $recipients = User::query()
            ->where('role', UserRole::Manager)
            ->where('is_active', true)
            ->get();

        if ($member->brigade?->brigadier) {
            $recipients->push($member->brigade->brigadier);
        }

        foreach ($recipients->unique('id') as $recipient) {
            $recipient->notify(new AttendanceAlert('late', $member, $detail));
        }
    }

    private function assertObjectBelongsToBrigade(User $brigadier, WorkObject $object): void
    {
        if ($object->isClosed()) {
            throw ValidationException::withMessages([
                'work_object_id' => 'Объект закрыт.',
            ]);
        }

        if ((int) $object->brigade_id !== (int) $brigadier->brigade_id) {
            throw ValidationException::withMessages([
                'work_object_id' => 'Объект не относится к вашей бригаде.',
            ]);
        }
    }
}
