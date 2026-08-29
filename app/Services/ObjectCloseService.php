<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\ObjectStatus;
use App\Enums\UserRole;
use App\Models\ActivityLog;
use App\Models\TimeEntry;
use App\Models\User;
use App\Models\WorkObject;
use App\Notifications\ObjectClosed;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final readonly class ObjectCloseService
{
    public function __construct(
        private PayrollService $payroll,
        private RealtimeNotifier $realtime,
    ) {}

    /**
     * @return array{employees: list<array<string, mixed>>, total_remaining: float}
     */
    public function close(WorkObject $object, User $actor): array
    {
        if ($object->isClosed()) {
            throw ValidationException::withMessages(['object' => 'Объект уже закрыт.']);
        }

        return DB::transaction(function () use ($object, $actor): array {
            $userIds = TimeEntry::query()
                ->where('work_object_id', $object->id)
                ->distinct()
                ->pluck('user_id');

            $employees = [];
            $totalRemaining = 0.0;

            $from = $object->start_date?->copy()->startOfDay();
            $to = now();

            foreach (User::query()->whereIn('id', $userIds)->get() as $user) {
                $balance = $this->payroll->balanceFor($user, $from, $to, $object);
                $employees[] = [
                    'user_id' => $user->id,
                    'name' => $user->name,
                    'accrued' => $balance['accrued'],
                    'advances' => $balance['advances'],
                    'paid' => $balance['paid'],
                    'remaining' => $balance['remaining'],
                    'minutes' => $balance['minutes'],
                ];
                $totalRemaining += $balance['remaining'];
            }

            usort($employees, static fn (array $a, array $b): int => strcmp($a['name'], $b['name']));

            $settlement = [
                'employees' => $employees,
                'total_remaining' => round($totalRemaining, 2),
                'closed_at' => now()->toIso8601String(),
                'closed_by' => $actor->id,
            ];

            $object->update([
                'status' => ObjectStatus::Closed,
                'closed_at' => now(),
                'closed_by' => $actor->id,
                'settlement' => $settlement,
            ]);

            ActivityLog::record($actor, 'object.closed', $object, $settlement);

            $fresh = $object->fresh(['brigade.brigadier']);
            $recipients = User::query()
                ->whereIn('role', [UserRole::Manager, UserRole::Accountant])
                ->where('is_active', true)
                ->get();

            if ($fresh?->brigade?->brigadier) {
                $recipients->push($fresh->brigade->brigadier);
            }

            foreach ($recipients->unique('id') as $recipient) {
                if ((int) $recipient->id === (int) $actor->id) {
                    continue;
                }

                $recipient->notify(new ObjectClosed($fresh, $settlement));
            }

            $this->realtime->ping($userIds, 'object.closed', $actor->id);

            return $settlement;
        });
    }
}
