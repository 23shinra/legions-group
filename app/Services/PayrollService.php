<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\AdvanceStatus;
use App\Enums\PayType;
use App\Models\TimeEntry;
use App\Models\User;
use App\Models\WorkObject;
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
        $accrued = $this->accruedAmount($user, $minutes, $days, $from, $to);
        $advances = $this->paidAdvancesTotal($user, $from, $to);
        $paid = $this->paymentsTotal($user, $from, $to, $object);

        return [
            'accrued' => round($accrued, 2),
            'advances' => round($advances, 2),
            'paid' => round($paid, 2),
            'remaining' => round($accrued - $advances - $paid, 2),
            'minutes' => $minutes,
            'days' => $days,
        ];
    }

    public function accruedAmount(User $user, int $minutes, int $days, ?Carbon $from = null, ?Carbon $to = null): float
    {
        $rate = (float) $user->rate;

        return match ($user->pay_type) {
            PayType::Hourly => ($minutes / 60) * $rate,
            PayType::Daily => $days * $rate,
            PayType::Fixed => $this->fixedForPeriod($rate, $from, $to),
            PayType::Custom => ($minutes / 60) * $rate,
            default => ($minutes / 60) * $rate,
        };
    }

    public function workedMinutes(User $user, ?Carbon $from = null, ?Carbon $to = null, ?WorkObject $object = null): int
    {
        $query = TimeEntry::query()
            ->where('user_id', $user->id)
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
