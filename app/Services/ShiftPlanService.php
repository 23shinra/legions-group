<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\UserRole;
use App\Models\ObjectAssignment;
use App\Models\ShiftPlan;
use App\Models\User;
use App\Models\WorkObject;
use Carbon\Carbon;

final readonly class ShiftPlanService
{
    public function __construct(
        private RealtimeNotifier $realtime,
    ) {}

    /**
     * @param  list<array{user_id: int, work_object_id: int|null}>  $rows
     */
    public function saveForDate(Carbon $date, array $rows, User $actor): void
    {
        foreach ($rows as $row) {
            $userId = (int) ($row['user_id'] ?? 0);
            $objectId = $row['work_object_id'] ?? null;

            if ($userId <= 0) {
                continue;
            }

            if ($objectId === null || $objectId === '') {
                ShiftPlan::query()
                    ->where('user_id', $userId)
                    ->whereDate('work_date', $date->toDateString())
                    ->delete();

                continue;
            }

            ShiftPlan::query()->updateOrCreate(
                [
                    'user_id' => $userId,
                    'work_date' => $date->toDateString(),
                ],
                [
                    'work_object_id' => (int) $objectId,
                    'created_by' => $actor->id,
                ],
            );
        }

        if ($date->isToday()) {
            $this->applyDate($date);
        }

        $affected = User::query()
            ->with('brigade.brigadier')
            ->whereIn('id', collect($rows)->pluck('user_id')->filter()->unique())
            ->get();

        $this->realtime->ping(
            $affected
                ->map(static fn (User $user) => $user->brigade?->brigadier)
                ->filter()
                ->concat($affected),
            'roster.changed',
            $actor->id,
        );
        $this->realtime->pingRoles([UserRole::Manager], 'roster.changed', $actor->id);
    }

    public function plannedObject(User $user, ?Carbon $date = null): ?WorkObject
    {
        $day = ($date ?? today())->toDateString();

        return ShiftPlan::query()
            ->with('workObject')
            ->where('user_id', $user->id)
            ->whereDate('work_date', $day)
            ->first()
            ?->workObject;
    }

    public function applyDate(Carbon $date): void
    {
        $plans = ShiftPlan::query()
            ->with(['user', 'workObject'])
            ->whereDate('work_date', $date->toDateString())
            ->get();

        foreach ($plans as $plan) {
            if ($plan->user === null || $plan->workObject === null) {
                continue;
            }

            $this->syncAssignment($plan->user, $plan->workObject);
        }
    }

    public function applyTodayFor(User $user): ?WorkObject
    {
        $object = $this->plannedObject($user, today());

        if ($object === null) {
            return null;
        }

        $this->syncAssignment($user, $object);

        return $object;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function roster(Carbon $date): array
    {
        $plans = ShiftPlan::query()
            ->whereDate('work_date', $date->toDateString())
            ->get()
            ->keyBy('user_id');

        return User::query()
            ->with('brigade:id,name')
            ->whereIn('role', [UserRole::Worker, UserRole::Brigadier])
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'position', 'brigade_id', 'role'])
            ->map(static function (User $user) use ($plans): array {
                $plan = $plans->get($user->id);

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'position' => $user->position,
                    'role' => $user->role->value,
                    'brigade' => $user->brigade?->name,
                    'brigade_id' => $user->brigade_id,
                    'work_object_id' => $plan?->work_object_id,
                ];
            })
            ->all();
    }

    private function syncAssignment(User $user, WorkObject $object): void
    {
        $current = ObjectAssignment::query()
            ->where('user_id', $user->id)
            ->whereNull('ended_on')
            ->latest('started_on')
            ->first();

        if ($current !== null && (int) $current->work_object_id === (int) $object->id) {
            return;
        }

        if ($current !== null) {
            $current->update(['ended_on' => today()->toDateString()]);
        }

        ObjectAssignment::query()->create([
            'user_id' => $user->id,
            'work_object_id' => $object->id,
            'started_on' => today()->toDateString(),
        ]);
    }
}
