<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\AdvanceStatus;
use App\Enums\PayType;
use App\Models\TimeEntry;
use App\Models\User;
use App\Models\WorkObject;
use App\Support\PayDefaults;
use App\Services\AttendanceDigestService;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Collection;

final readonly class PayrollService
{
    /**
     * @return array{accrued: float, advances: float, paid: float, remaining: float, minutes: int, days: int}
     */
    public function balanceFor(User $user, ?Carbon $from = null, ?Carbon $to = null, ?WorkObject $object = null): array
    {
        $minutes = $this->workedMinutes($user, $from, $to, $object);
        $days = $this->workedDays($user, $from, $to, $object);
        $accrued = $this->accruedAmount($user, $minutes, $days, $from, $to, $object);
        // Advances/payments have no reliable object link — scope by period only.
        // Accrued hours remain object-scoped when $object is provided.
        $advances = $this->paidAdvancesTotal($user, $from, $to);
        $paid = $this->paymentsTotal($user, $from, $to);

        return [
            'accrued' => round($accrued, 2),
            'advances' => round($advances, 2),
            'paid' => round($paid, 2),
            'remaining' => round($accrued - $advances - $paid, 2),
            'minutes' => $minutes,
            'days' => $days,
        ];
    }

    public function accruedAmount(
        User $user,
        int $minutes,
        int $days,
        ?Carbon $from = null,
        ?Carbon $to = null,
        ?WorkObject $object = null,
    ): float {
        $rate = (float) $user->rate;

        return match ($user->pay_type) {
            PayType::Hourly, PayType::Custom => $this->accruedHourlyWithOvertime($user, $from, $to, $object, $rate),
            PayType::Daily => $this->accruedDailyWithOvertime($user, $from, $to, $object, $rate),
            PayType::Fixed => $this->fixedForPeriod($rate, $from, $to),
            default => $this->accruedHourlyWithOvertime($user, $from, $to, $object, $rate),
        };
    }

    public function workedMinutes(User $user, ?Carbon $from = null, ?Carbon $to = null, ?WorkObject $object = null): int
    {
        $query = TimeEntry::query()
            ->where('user_id', $user->id)
            ->whereNotNull('confirmed_at')
            ->whereNotNull('ended_at');

        if ($from) {
            $query->where('started_at', '>=', $from->copy()->startOfDay());
        }

        if ($to) {
            $query->where('started_at', '<=', $to->copy()->endOfDay());
        }

        if ($object) {
            $query->where('work_object_id', $object->id);
        }

        return (int) $query->sum('worked_minutes');
    }

    public function workedDays(User $user, ?Carbon $from = null, ?Carbon $to = null, ?WorkObject $object = null): int
    {
        $query = TimeEntry::query()
            ->where('user_id', $user->id)
            ->whereNotNull('confirmed_at')
            ->whereNotNull('ended_at');

        if ($from) {
            $query->where('started_at', '>=', $from->copy()->startOfDay());
        }

        if ($to) {
            $query->where('started_at', '<=', $to->copy()->endOfDay());
        }

        if ($object) {
            $query->where('work_object_id', $object->id);
        }

        return (int) $query->selectRaw('COUNT(DISTINCT DATE(started_at)) as days')->value('days');
    }

    public function advancesTotal(User $user, ?Carbon $from = null, ?Carbon $to = null): float
    {
        $query = $user->advanceRequests()
            ->whereIn('status', [AdvanceStatus::Paid, AdvanceStatus::Approved]);

        if ($from) {
            $query->where('created_at', '>=', $from->copy()->startOfDay());
        }

        if ($to) {
            $query->where('created_at', '<=', $to->copy()->endOfDay());
        }

        return (float) $query->sum('amount');
    }

    public function paidAdvancesTotal(User $user, ?Carbon $from = null, ?Carbon $to = null): float
    {
        $query = $user->advanceRequests()->where('status', AdvanceStatus::Paid);

        if ($from) {
            $query->where('paid_at', '>=', $from->copy()->startOfDay());
        }

        if ($to) {
            $query->where('paid_at', '<=', $to->copy()->endOfDay());
        }

        return (float) $query->sum('amount');
    }

    public function paymentsTotal(User $user, ?Carbon $from = null, ?Carbon $to = null, ?WorkObject $object = null): float
    {
        $query = $user->payments();

        if ($from) {
            $query->where('paid_on', '>=', $from->toDateString());
        }

        if ($to) {
            $query->where('paid_on', '<=', $to->toDateString());
        }

        if ($object) {
            $query->where('work_object_id', $object->id);
        }

        return (float) $query->sum('amount');
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function balancesForUsers(Collection $users): Collection
    {
        return $users->map(function (User $user): array {
            $balance = $this->balanceFor($user);

            return [
                'user' => $user,
                ...$balance,
            ];
        });
    }

    /**
     * @return array{
     *     accrued: float,
     *     advances: float,
     *     paid: float,
     *     remaining: float,
     *     minutes: int,
     *     days: int,
     *     work_days: int|null,
     *     days_left: int|null,
     *     projected_remaining: float,
     *     available_for_advance: float,
     *     object: array{id: int, name: string, address: string|null}|null
     * }
     */
    public function objectSummary(User $user, ?WorkObject $object): array
    {
        if ($object === null) {
            $balance = $this->balanceFor($user);

            return [
                ...$balance,
                'work_days' => null,
                'days_left' => null,
                'projected_remaining' => 0.0,
                'available_for_advance' => $this->availableForAdvance($user),
                'object' => null,
            ];
        }

        $balance = $this->balanceFor($user, null, null, $object);
        $workDays = $object->work_days;
        $daysLeft = $workDays !== null
            ? max(0, $workDays - $balance['days'])
            : null;
        $projectedRemaining = $daysLeft !== null
            ? round($this->projectedEarningsForDaysLeft(
                $user,
                $daysLeft,
                $balance['days'],
                $balance['minutes'],
                $workDays,
            ), 2)
            : 0.0;

        return [
            ...$balance,
            'work_days' => $workDays,
            'days_left' => $daysLeft,
            'projected_remaining' => $projectedRemaining,
            'available_for_advance' => $this->availableForAdvance($user, $object),
            'object' => [
                'id' => $object->id,
                'name' => $object->name,
                'address' => $object->address,
            ],
        ];
    }

    public function availableForAdvance(User $user, ?WorkObject $object = null): float
    {
        $balance = $this->balanceFor($user, null, null, $object);
        $accrued = max(0.0, (float) $balance['accrued']);

        if ($accrued <= 0) {
            return 0.0;
        }

        $pendingAdvances = (float) $user->advanceRequests()
            ->whereIn('status', [AdvanceStatus::Pending, AdvanceStatus::Approved])
            ->sum('amount');

        $remaining = (float) $balance['remaining'];
        $available = max(0.0, $remaining - $pendingAdvances);

        return round(min($accrued, $available), 2);
    }

    /**
     * @return array{
     *     accrued: float,
     *     paid_advances: float,
     *     paid_salary: float,
     *     reserved_advances: float,
     *     remaining: float,
     *     available_for_advance: float
     * }
     */
    public function advanceBreakdown(User $user, ?WorkObject $object = null): array
    {
        $balance = $this->balanceFor($user, null, null, $object);
        $reserved = (float) $user->advanceRequests()
            ->whereIn('status', [AdvanceStatus::Pending, AdvanceStatus::Approved])
            ->sum('amount');

        return [
            'accrued' => round((float) $balance['accrued'], 2),
            'paid_advances' => round((float) $balance['advances'], 2),
            'paid_salary' => round((float) $balance['paid'], 2),
            'reserved_advances' => round($reserved, 2),
            'remaining' => round((float) $balance['remaining'], 2),
            'available_for_advance' => $this->availableForAdvance($user, $object),
        ];
    }

    private function projectedEarningsForDaysLeft(
        User $user,
        int $daysLeft,
        int $workedDays,
        int $workedMinutes,
        ?int $workDays,
    ): float {
        if ($daysLeft <= 0) {
            return 0.0;
        }

        $rate = (float) $user->rate;

        return match ($user->pay_type) {
            PayType::Daily => $daysLeft * ($rate > 0 ? $rate : PayDefaults::DAILY_RATE),
            PayType::Hourly, PayType::Custom => $daysLeft * PayDefaults::DAILY_RATE,
            PayType::Fixed => $workDays && $workDays > 0
                ? ($rate / $workDays) * $daysLeft
                : 0.0,
            default => $daysLeft * PayDefaults::DAILY_RATE,
        };
    }

    private function accruedHourlyWithOvertime(
        User $user,
        ?Carbon $from,
        ?Carbon $to,
        ?WorkObject $object,
        float $rate,
    ): float {
        $hourly = $rate > 0 ? $rate : PayDefaults::hourlyRate();
        $total = 0.0;

        foreach ($this->minutesByDay($user, $from, $to, $object) as $minutes) {
            $regular = min($minutes, PayDefaults::workdayMinutes());
            $overtime = max(0, $minutes - PayDefaults::workdayMinutes());
            $total += ($regular / 60) * $hourly;
            $total += ($overtime / 60) * PayDefaults::OVERTIME_RATE;
        }

        return $total;
    }

    private function accruedDailyWithOvertime(
        User $user,
        ?Carbon $from,
        ?Carbon $to,
        ?WorkObject $object,
        float $rate,
    ): float {
        $daily = $rate > 0 ? $rate : PayDefaults::DAILY_RATE;
        $total = 0.0;

        foreach ($this->minutesByDay($user, $from, $to, $object) as $minutes) {
            $total += $daily;
            $overtime = max(0, $minutes - PayDefaults::workdayMinutes());
            $total += ($overtime / 60) * PayDefaults::OVERTIME_RATE;
        }

        return $total;
    }

    /**
     * @return array<string, int>
     */
    private function minutesByDay(
        User $user,
        ?Carbon $from,
        ?Carbon $to,
        ?WorkObject $object,
    ): array {
        $query = TimeEntry::query()
            ->where('user_id', $user->id)
            ->whereNotNull('confirmed_at')
            ->whereNotNull('ended_at');

        if ($from) {
            $query->where('started_at', '>=', $from->copy()->startOfDay());
        }

        if ($to) {
            $query->where('started_at', '<=', $to->copy()->endOfDay());
        }

        if ($object) {
            $query->where('work_object_id', $object->id);
        }

        $byDay = [];

        foreach ($query->get(['started_at', 'worked_minutes']) as $entry) {
            $day = $entry->started_at
                ?->copy()
                ->timezone(AttendanceDigestService::TIMEZONE)
                ->toDateString();

            if ($day === null) {
                continue;
            }

            $byDay[$day] = ($byDay[$day] ?? 0) + (int) $entry->worked_minutes;
        }

        return $byDay;
    }

    private function fixedForPeriod(float $rate, ?Carbon $from, ?Carbon $to): float
    {
        if ($from === null && $to === null) {
            return $rate;
        }

        $start = $from?->copy()->startOfMonth() ?? now()->startOfMonth();
        $end = $to?->copy()->endOfMonth() ?? now()->endOfMonth();
        $months = CarbonPeriod::create($start->copy()->startOfMonth(), '1 month', $end)->count();

        return $rate * max(1, $months);
    }
}
