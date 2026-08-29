<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use App\Models\WorkObject;

final readonly class WorkerContextService
{
    public function __construct(
        private ShiftPlanService $shiftPlans,
    ) {}

    public function activeObject(User $user): ?WorkObject
    {
        $user->loadMissing('brigade');

        $activeEntry = $user->activeTimeEntry();

        if ($activeEntry?->workObject) {
            return $activeEntry->workObject;
        }

        $planned = $this->shiftPlans->applyTodayFor($user);

        if ($planned !== null) {
            return $planned;
        }

        return $user->brigade?->activeObject();
    }

    public function tomorrowObject(User $user): ?WorkObject
    {
        return $this->shiftPlans->plannedObject($user, today()->addDay());
    }
}
