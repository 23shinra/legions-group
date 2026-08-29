<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\UserRole;
use App\Models\Brigade;
use App\Models\TimeEntry;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;

final readonly class ReportService
{
    public function __construct(
        private PayrollService $payroll,
    ) {}

    /**
     * @return array{summary: array<string, float|int>, reports: list<array<string, mixed>>}
     */
    public function employeeReport(?Carbon $from = null, ?Carbon $to = null): array
    {
        $from ??= now()->startOfMonth();
        $to ??= now()->endOfMonth();

        $workers = User::query()
            ->with('brigade')
            ->whereIn('role', [UserRole::Worker, UserRole::Brigadier])
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        $reports = [];
        $totalHours = 0;
        $totalAccrued = 0.0;
        $totalPaid = 0.0;
        $totalAdvances = 0.0;
        $totalLates = 0;
        $lateCounts = $this->lateCounts($workers->pluck('id')->all(), $from, $to);

        foreach ($workers as $worker) {
            $balance = $this->payroll->balanceFor($worker, $from, $to);
            $lates = $lateCounts[$worker->id] ?? 0;
            $reports[] = [
                'id' => $worker->id,
                'period' => $from->format('d.m.Y').' — '.$to->format('d.m.Y'),
                'employee' => $worker->name,
                'brigade' => $worker->brigade?->name,
                'hours' => $balance['minutes'],
                'days' => $balance['days'],
                'lates' => $lates,
                'accrued' => $balance['accrued'],
                'advances' => $balance['advances'],
                'paid' => $balance['paid'],
                'remaining' => $balance['remaining'],
            ];
            $totalHours += $balance['minutes'];
            $totalAccrued += $balance['accrued'];
            $totalPaid += $balance['paid'];
            $totalAdvances += $balance['advances'];
            $totalLates += $lates;
        }

        return [
            'summary' => [
                'totalEmployees' => $workers->count(),
                'totalHours' => $totalHours,
                'totalLates' => $totalLates,
                'totalAccrued' => round($totalAccrued, 2),
                'totalPaid' => round($totalPaid, 2),
                'totalAdvances' => round($totalAdvances, 2),
                'totalRemaining' => round($totalAccrued - $totalAdvances - $totalPaid, 2),
            ],
            'reports' => $reports,
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    public function employeeReportRow(User $worker, ?Carbon $from = null, ?Carbon $to = null): ?array
    {
        if (! in_array($worker->role, [UserRole::Worker, UserRole::Brigadier], true) || ! $worker->is_active) {
            return null;
        }

        $from ??= now()->startOfMonth();
        $to ??= now()->endOfMonth();

        $worker->loadMissing('brigade');
        $balance = $this->payroll->balanceFor($worker, $from, $to);
        $lates = $this->lateCounts([$worker->id], $from, $to)[$worker->id] ?? 0;

        return [
            'id' => $worker->id,
            'period' => $from->format('d.m.Y').' — '.$to->format('d.m.Y'),
            'employee' => $worker->name,
            'brigade' => $worker->brigade?->name,
            'hours' => $balance['minutes'],
            'days' => $balance['days'],
            'lates' => $lates,
            'accrued' => $balance['accrued'],
            'advances' => $balance['advances'],
            'paid' => $balance['paid'],
            'remaining' => $balance['remaining'],
        ];
    }

    /**
     * @return array{summary: array<string, float|int>, rows: list<array<string, mixed>>}
     */
    public function financialOverview(?Carbon $from = null, ?Carbon $to = null): array
    {
        $report = $this->employeeReport($from, $to);

        return [
            'summary' => $report['summary'],
            'rows' => $report['reports'],
        ];
    }

    /**
     * @return array{summary: array<string, float|int>, reports: list<array<string, mixed>>}
     */
    public function brigadeReport(?Carbon $from = null, ?Carbon $to = null): array
    {
        $from ??= now()->startOfMonth();
        $to ??= now()->endOfMonth();

        $brigades = Brigade::query()->with(['members' => fn ($q) => $q->where('is_active', true)])->orderBy('name')->get();
        $reports = [];
        $totalHours = 0;
        $totalAccrued = 0.0;
        $totalPaid = 0.0;
        $totalAdvances = 0.0;
        $totalLates = 0;
        $memberIds = $brigades->flatMap(fn (Brigade $brigade) => $brigade->members->pluck('id'))->unique()->all();
        $lateCounts = $this->lateCounts($memberIds, $from, $to);

        foreach ($brigades as $brigade) {
            $hours = 0;
            $days = 0;
            $lates = 0;
            $accrued = 0.0;
            $advances = 0.0;
            $paid = 0.0;

            foreach ($brigade->members as $member) {
                if (! in_array($member->role, [UserRole::Worker, UserRole::Brigadier], true)) {
                    continue;
                }

                $balance = $this->payroll->balanceFor($member, $from, $to);
                $hours += $balance['minutes'];
                $days += $balance['days'];
                $lates += $lateCounts[$member->id] ?? 0;
                $accrued += $balance['accrued'];
                $advances += $balance['advances'];
                $paid += $balance['paid'];
            }

            $remaining = $accrued - $advances - $paid;
            $reports[] = [
                'id' => $brigade->id,
                'brigade' => $brigade->name,
                'period' => $from->format('d.m.Y').' — '.$to->format('d.m.Y'),
                'members' => $brigade->members->count(),
                'hours' => $hours,
                'days' => $days,
                'lates' => $lates,
                'accrued' => round($accrued, 2),
                'advances' => round($advances, 2),
                'paid' => round($paid, 2),
                'remaining' => round($remaining, 2),
            ];

            $totalHours += $hours;
            $totalAccrued += $accrued;
            $totalPaid += $paid;
            $totalAdvances += $advances;
            $totalLates += $lates;
        }

        return [
            'summary' => [
                'totalBrigades' => $brigades->count(),
                'totalHours' => $totalHours,
                'totalLates' => $totalLates,
                'totalAccrued' => round($totalAccrued, 2),
                'totalPaid' => round($totalPaid, 2),
                'totalAdvances' => round($totalAdvances, 2),
                'totalRemaining' => round($totalAccrued - $totalAdvances - $totalPaid, 2),
            ],
            'reports' => $reports,
        ];
    }

    /**
     * @return array{summary: array<string, float|int>, reports: list<array<string, mixed>>}
     */
    public function objectReport(\App\Models\WorkObject $object): array
    {
        $from = $object->start_date?->copy()->startOfDay() ?? now()->startOfMonth();
        $to = $object->closed_at?->copy() ?? now();

        $userIds = TimeEntry::query()
            ->where('work_object_id', $object->id)
            ->distinct()
            ->pluck('user_id');

        $reports = [];
        $totalHours = 0;
        $totalAccrued = 0.0;
        $totalPaid = 0.0;
        $totalAdvances = 0.0;
        $totalLates = 0;
        $users = User::query()->whereIn('id', $userIds)->orderBy('name')->get();
        $lateCounts = $this->lateCounts($users->pluck('id')->all(), $from, $to, $object->id);

        foreach ($users as $user) {
            $balance = $this->payroll->balanceFor($user, $from, $to, $object);
            $lates = $lateCounts[$user->id] ?? 0;
            $reports[] = [
                'id' => $user->id,
                'employee' => $user->name,
                'object' => $object->name,
                'period' => $from->format('d.m.Y').' — '.$to->format('d.m.Y'),
                'hours' => $balance['minutes'],
                'days' => $balance['days'],
                'lates' => $lates,
                'accrued' => $balance['accrued'],
                'advances' => $balance['advances'],
                'paid' => $balance['paid'],
                'remaining' => $balance['remaining'],
            ];
            $totalHours += $balance['minutes'];
            $totalAccrued += $balance['accrued'];
            $totalPaid += $balance['paid'];
            $totalAdvances += $balance['advances'];
            $totalLates += $lates;
        }

        return [
            'summary' => [
                'totalEmployees' => count($reports),
                'totalHours' => $totalHours,
                'totalLates' => $totalLates,
                'totalAccrued' => round($totalAccrued, 2),
                'totalPaid' => round($totalPaid, 2),
                'totalAdvances' => round($totalAdvances, 2),
                'totalRemaining' => round($totalAccrued - $totalAdvances - $totalPaid, 2),
            ],
            'reports' => $reports,
        ];
    }

    /**
     * First confirmed arrival of each Almaty day after 09:00 counts as late.
     *
     * @param  list<int>  $userIds
     * @return array<int, int>
     */
    private function lateCounts(array $userIds, Carbon $from, Carbon $to, ?int $objectId = null): array
    {
        if ($userIds === []) {
            return [];
        }

        $fromLocal = Carbon::parse($from->toDateString(), AttendanceDigestService::TIMEZONE)->startOfDay();
        $toLocal = Carbon::parse($to->toDateString(), AttendanceDigestService::TIMEZONE)->endOfDay();

        $query = TimeEntry::query()
            ->whereIn('user_id', $userIds)
            ->whereNotNull('confirmed_at')
            ->whereBetween('started_at', [$fromLocal->copy()->utc(), $toLocal->copy()->utc()])
            ->orderBy('started_at');

        if ($objectId !== null) {
            $query->where('work_object_id', $objectId);
        }

        $seenDays = [];
        $lates = [];

        foreach ($query->get(['user_id', 'started_at']) as $entry) {
            $startedLocal = $entry->started_at?->copy()->timezone(AttendanceDigestService::TIMEZONE);

            if ($startedLocal === null) {
                continue;
            }

            $dayKey = $entry->user_id.'|'.$startedLocal->toDateString();

            if (isset($seenDays[$dayKey])) {
                continue;
            }

            $seenDays[$dayKey] = true;
            $lateAfter = $startedLocal->copy()->startOfDay()->setTime(AttendanceDigestService::LATE_HOUR, 0);

            if ($startedLocal->greaterThan($lateAfter)) {
                $lates[$entry->user_id] = ($lates[$entry->user_id] ?? 0) + 1;
            }
        }

        return $lates;
    }

    public function todayMinutesForBrigade(Brigade $brigade): int
    {
        return (int) TimeEntry::query()
            ->where('brigade_id', $brigade->id)
            ->whereNotNull('confirmed_at')
            ->whereDate('started_at', today())
            ->sum('worked_minutes');
    }

    public function todayOpenMinutes(): int
    {
        $closed = (int) TimeEntry::query()
            ->whereDate('started_at', today())
            ->whereNotNull('confirmed_at')
            ->whereNotNull('ended_at')
            ->sum('worked_minutes');

        $open = TimeEntry::query()
            ->whereDate('started_at', today())
            ->whereNotNull('confirmed_at')
            ->whereNull('ended_at')
            ->get()
            ->sum(fn (TimeEntry $entry): int => (int) $entry->started_at->diffInMinutes(now()));

        return $closed + (int) $open;
    }

    /**
     * @return Collection<int, User>
     */
    public function workersAtWorkToday(): Collection
    {
        $ids = TimeEntry::query()
            ->whereDate('started_at', today())
            ->whereNotNull('confirmed_at')
            ->whereNull('ended_at')
            ->pluck('user_id');

        return User::query()->whereIn('id', $ids)->get();
    }
}
