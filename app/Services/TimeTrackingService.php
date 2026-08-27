<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\ObjectAssignment;
use App\Models\TimeEntry;
use App\Models\User;
use App\Models\WorkObject;
use App\Enums\ObjectStatus;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final readonly class TimeTrackingService
{
    public function start(User $user, ?float $latitude = null, ?float $longitude = null): TimeEntry
    {
        if ($user->activeTimeEntry() !== null) {
            throw ValidationException::withMessages([
                'time' => 'Смена уже начата.',
            ]);
        }

        $object = $this->resolveObject($user);

        $entry = TimeEntry::query()->create([
            'user_id' => $user->id,
            'brigade_id' => $user->brigade_id,
            'work_object_id' => $object?->id,
            'started_at' => now(),
            'latitude' => $latitude,
            'longitude' => $longitude,
        ]);

        ActivityLog::record($user, 'time.started', $entry, [
            'object_id' => $object?->id,
        ]);

        return $entry;
    }

    public function end(User $user, int $breakMinutes = 0): TimeEntry
    {
        $entry = $user->activeTimeEntry();

        if ($entry === null) {
            throw ValidationException::withMessages([
                'time' => 'Нет открытой смены.',
            ]);
        }

        $endedAt = now();
        $rawMinutes = max(0, (int) $entry->started_at->diffInMinutes($endedAt));
        $worked = max(0, $rawMinutes - max(0, $breakMinutes));

        $entry->update([
            'ended_at' => $endedAt,
            'break_minutes' => max(0, $breakMinutes),
            'worked_minutes' => $worked,
        ]);

        ActivityLog::record($user, 'time.ended', $entry, [
            'worked_minutes' => $worked,
        ]);

        return $entry->fresh();
    }

    private function resolveObject(User $user): ?WorkObject
    {
        $assignment = ObjectAssignment::query()
            ->where('user_id', $user->id)
            ->whereNull('ended_on')
            ->latest('started_on')
            ->first();

        if ($assignment) {
            return WorkObject::query()->find($assignment->work_object_id);
        }

        if ($user->brigade_id) {
            return WorkObject::query()
                ->where('brigade_id', $user->brigade_id)
                ->whereIn('status', [ObjectStatus::Active, ObjectStatus::Planned])
                ->latest('start_date')
                ->first();
        }

        return null;
    }
}
