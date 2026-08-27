<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\UserRole;
use App\Models\Brigade;
use App\Models\Payment;
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

        foreach ($workers as $worker) {
            $balance = $this->payroll->balanceFor($worker, $from, $to);
            $reports[] = [
                'id' => $worker->id,
                'period' => $from->format('d.m.Y').' — '.$to->format('d.m.Y'),
                'employee' => $worker->name,
                'brigade' => $worker->brigade?->name,
                'hours' => $balance['minutes'],
                'days' => $balance['days'],
                'accrued' => $balance['accrued'],
                'advances' => $balance['advances'],
                'paid' => $balance['paid'],
                'remaining' => $balance['remaining'],
            ];
            $totalHours += $balance['minutes'];
            $totalAccrued += $balance['accrued'];
            $totalPaid += $balance['paid'];
            $totalAdvances += $balance['advances'];
        }

        return [
            'summary' => [
                'totalEmployees' => $workers->count(),
                'totalHours' => $totalHours,
                'totalAccrued' => round($totalAccrued, 2),
                'totalPaid' => round($totalPaid, 2),
                'totalAdvances' => round($totalAdvances, 2),
                'totalRemaining' => round($totalAccrued - $totalAdvances - $totalPaid, 2),
            ],
            'reports' => $reports,
        ];
    }

    /**
     * @return array{summary: array<string, float|int>, rows: list<array<string, mixed>>}
     */
    public function financialOverview(): array
    {
        $report = $this->employeeReport();

        return [
            'summary' => $report['summary'],
            'rows' => $report['reports'],
        ];
    }

    public function todayMinutesForBrigade(Brigade $brigade): int
    {
        return (int) TimeEntry::query()
            ->where('brigade_id', $brigade->id)
            ->whereDate('started_at', today())
            ->sum('worked_minutes');
    }

    public function todayOpenMinutes(): int
    {
        $closed = (int) TimeEntry::query()
            ->whereDate('started_at', today())
            ->whereNotNull('ended_at')
            ->sum('worked_minutes');

        $open = TimeEntry::query()
            ->whereDate('started_at', today())
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
            ->whereNull('ended_at')
            ->pluck('user_id');

        return User::query()->whereIn('id', $ids)->get();
    }
}
