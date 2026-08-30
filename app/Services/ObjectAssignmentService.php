<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\UserRole;
use App\Models\Brigade;
use App\Models\ObjectAssignment;
use App\Models\User;
use App\Models\WorkObject;
use App\Notifications\AssignedToBrigade;
use Illuminate\Validation\ValidationException;

final readonly class ObjectAssignmentService
{
    public function __construct(
        private RealtimeNotifier $realtime,
    ) {}

    public function currentAssignment(User $member): ?ObjectAssignment
    {
        return ObjectAssignment::query()
            ->with('workObject')
            ->where('user_id', $member->id)
            ->whereNull('ended_on')
            ->latest('started_on')
            ->first();
    }

    public function ensureMemberOnObject(User $member, WorkObject $object): ObjectAssignment
    {
        if ($object->isClosed()) {
            throw ValidationException::withMessages([
                'work_object_id' => 'Объект закрыт.',
            ]);
        }

        if ((int) $object->brigade_id !== (int) $member->brigade_id) {
            throw ValidationException::withMessages([
                'work_object_id' => 'Объект не относится к бригаде сотрудника.',
            ]);
        }

        $current = $this->currentAssignment($member);

        if ($current !== null && (int) $current->work_object_id === (int) $object->id) {
            return $current;
        }

        if ($current !== null) {
            throw ValidationException::withMessages([
                'member' => 'Сначала перенесите строителя на этот объект.',
            ]);
        }

        return ObjectAssignment::query()->create([
            'user_id' => $member->id,
            'work_object_id' => $object->id,
            'started_on' => today()->toDateString(),
        ]);
    }

    public function assertMemberOnObject(User $member, WorkObject $object): ObjectAssignment
    {
        if ($object->isClosed()) {
            throw ValidationException::withMessages([
                'work_object_id' => 'Объект закрыт.',
            ]);
        }

        if ((int) $object->brigade_id !== (int) $member->brigade_id) {
            throw ValidationException::withMessages([
                'work_object_id' => 'Объект не относится к бригаде сотрудника.',
            ]);
        }

        $current = $this->currentAssignment($member);

        if ($current === null || (int) $current->work_object_id !== (int) $object->id) {
            throw ValidationException::withMessages([
                'member' => 'Строитель не назначен на этот объект. Сначала перенесите его.',
            ]);
        }

        return $current;
    }

    public function transferMember(User $brigadier, User $member, WorkObject $object): ObjectAssignment
    {
        $this->assertBrigadierManagesMember($brigadier, $member);
        $this->assertObjectBelongsToBrigade($brigadier, $object);

        if ($member->activeTimeEntry() !== null || $member->pendingTimeEntry() !== null) {
            throw ValidationException::withMessages([
                'member' => 'Завершите или подтвердите смену перед переносом на другой объект.',
            ]);
        }

        ObjectAssignment::query()
            ->where('user_id', $member->id)
            ->whereNull('ended_on')
            ->update(['ended_on' => today()->toDateString()]);

        $assignment = ObjectAssignment::query()->create([
            'user_id' => $member->id,
            'work_object_id' => $object->id,
            'started_on' => today()->toDateString(),
        ]);

        $this->realtime->pingAround($member, 'roster.changed');

        return $assignment;
    }

    public function placeOnObject(User $member, WorkObject $object): ObjectAssignment
    {
        if ($object->isClosed()) {
            throw ValidationException::withMessages([
                'work_object_id' => 'Объект закрыт.',
            ]);
        }

        if (! in_array($member->role, [UserRole::Worker, UserRole::Brigadier], true) || ! $member->is_active) {
            throw ValidationException::withMessages([
                'user_id' => 'Можно назначить только активного сотрудника.',
            ]);
        }

        if ($member->activeTimeEntry() !== null || $member->pendingTimeEntry() !== null) {
            throw ValidationException::withMessages([
                'user_id' => 'Сначала завершите или подтвердите смену.',
            ]);
        }

        if ($object->brigade_id !== null && (int) $member->brigade_id !== (int) $object->brigade_id) {
            $previousBrigadeId = $member->brigade_id;
            $member->update(['brigade_id' => $object->brigade_id]);
            $brigade = $object->brigade ?? Brigade::query()->find($object->brigade_id);

            if ($brigade !== null) {
                AssignedToBrigade::sendToWorker($member, $brigade, $previousBrigadeId);
            }
        }

        $current = $this->currentAssignment($member);

        if ($current !== null && (int) $current->work_object_id === (int) $object->id) {
            return $current;
        }

        if ($current !== null) {
            $current->update(['ended_on' => today()->toDateString()]);
        }

        $assignment = ObjectAssignment::query()->create([
            'user_id' => $member->id,
            'work_object_id' => $object->id,
            'started_on' => today()->toDateString(),
        ]);

        $this->realtime->pingAround($member, 'roster.changed');

        return $assignment;
    }

    public function removeFromObject(User $member, WorkObject $object): void
    {
        if ($member->activeTimeEntry() !== null || $member->pendingTimeEntry() !== null) {
            throw ValidationException::withMessages([
                'member' => 'Сначала завершите или подтвердите смену.',
            ]);
        }

        ObjectAssignment::query()
            ->where('user_id', $member->id)
            ->where('work_object_id', $object->id)
            ->whereNull('ended_on')
            ->update(['ended_on' => today()->toDateString()]);

        $this->realtime->pingAround($member, 'roster.changed');
    }

    /**
     * Assign active brigade members (without an open shift) onto the object.
     */
    public function assignBrigadeMembersToObject(WorkObject $object): void
    {
        if ($object->brigade_id === null || $object->isClosed()) {
            return;
        }

        $members = User::query()
            ->where('brigade_id', $object->brigade_id)
            ->where('is_active', true)
            ->whereIn('role', [UserRole::Worker, UserRole::Brigadier])
            ->get();

        foreach ($members as $member) {
            if ($member->activeTimeEntry() !== null || $member->pendingTimeEntry() !== null) {
                continue;
            }

            $current = $this->currentAssignment($member);

            if ($current !== null && (int) $current->work_object_id === (int) $object->id) {
                continue;
            }

            if ($current !== null) {
                $current->update(['ended_on' => today()->toDateString()]);
            }

            ObjectAssignment::query()->create([
                'user_id' => $member->id,
                'work_object_id' => $object->id,
                'started_on' => today()->toDateString(),
            ]);
        }
    }

    private function assertBrigadierManagesMember(User $brigadier, User $member): void
    {
        if (! $brigadier->isBrigadier() || $brigadier->brigade_id === null) {
            throw ValidationException::withMessages([
                'brigade' => 'Бригада не назначена.',
            ]);
        }

        if ($member->brigade_id !== $brigadier->brigade_id || $member->role !== UserRole::Worker) {
            throw ValidationException::withMessages([
                'member' => 'Сотрудник не входит в вашу бригаду.',
            ]);
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
