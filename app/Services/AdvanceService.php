<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\AdvanceStatus;
use App\Enums\UserRole;
use App\Models\ActivityLog;
use App\Models\AdvanceRequest;
use App\Models\User;
use App\Notifications\AdvanceApprovedForPayment;
use App\Notifications\AdvanceStatusChanged;
use App\Notifications\NewAdvanceRequest;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;

final readonly class AdvanceService
{
    public const MIN_SHIFTS = 1;

    public function __construct(
        private PayrollService $payroll,
    ) {}

    /**
     * @return array{can_request: bool, worked_days: int, required_days: int, message: string|null, remaining: float}
     */
    public function eligibility(User $worker): array
    {
        $balance = $this->payroll->balanceFor($worker);
        $workedDays = (int) $balance['days'];
        $canRequest = $workedDays >= self::MIN_SHIFTS;

        return [
            'can_request' => $canRequest,
            'worked_days' => $workedDays,
            'required_days' => self::MIN_SHIFTS,
            'message' => $canRequest
                ? null
                : 'У вас недостаточно отработанных смен на аванс',
            'remaining' => (float) $balance['remaining'],
        ];
    }

    public function request(User $worker, float $amount, ?string $comment = null): AdvanceRequest
    {
        $eligibility = $this->eligibility($worker);

        if (! $eligibility['can_request']) {
            throw ValidationException::withMessages([
                'amount' => $eligibility['message'] ?? 'У вас недостаточно отработанных смен на аванс',
            ]);
        }

        $balance = $this->payroll->balanceFor($worker);
        $warnings = [];

        if ($amount > $balance['remaining'] && $balance['remaining'] >= 0) {
            $warnings[] = 'Недостаточно начисленной суммы для выдачи аванса.';
        }

        if ($worker->max_advance !== null && $amount > (float) $worker->max_advance) {
            $warnings[] = 'Сумма превышает максимальный доступный аванс.';
        }

        $advance = AdvanceRequest::query()->create([
            'user_id' => $worker->id,
            'amount' => $amount,
            'comment' => $comment,
            'status' => AdvanceStatus::Pending,
        ]);

        ActivityLog::record($worker, 'advance.requested', $advance, [
            'amount' => $amount,
            'warnings' => $warnings,
        ]);

        $managers = User::query()
            ->whereIn('role', [UserRole::Manager, UserRole::Accountant])
            ->get();
        Notification::send($managers, new NewAdvanceRequest($advance));

        if ($worker->brigade?->brigadier) {
            $worker->brigade->brigadier->notify(new NewAdvanceRequest($advance));
        }

        return $advance;
    }

    public function approve(AdvanceRequest $advance, User $actor, ?string $comment = null): AdvanceRequest
    {
        if ($advance->status !== AdvanceStatus::Pending) {
            throw ValidationException::withMessages(['status' => 'Заявка уже обработана.']);
        }

        $advance->update([
            'status' => AdvanceStatus::Approved,
            'reviewed_by' => $actor->id,
            'reviewed_at' => now(),
            'review_comment' => $comment,
        ]);

        $advance = $advance->fresh(['user']);

        ActivityLog::record($actor, 'advance.approved', $advance);

        if ($advance->user) {
            $advance->user->notify(new AdvanceStatusChanged($advance));
        }

        $accountants = User::query()
            ->where('role', UserRole::Accountant)
            ->get();

        Notification::send($accountants, new AdvanceApprovedForPayment($advance));

        return $advance;
    }

    public function reject(AdvanceRequest $advance, User $actor, ?string $comment = null): AdvanceRequest
    {
        if ($advance->status !== AdvanceStatus::Pending) {
            throw ValidationException::withMessages(['status' => 'Заявка уже обработана.']);
        }

        $advance->update([
            'status' => AdvanceStatus::Rejected,
            'reviewed_by' => $actor->id,
            'reviewed_at' => now(),
            'review_comment' => $comment,
        ]);

        ActivityLog::record($actor, 'advance.rejected', $advance);
        $advance->user->notify(new AdvanceStatusChanged($advance));

        return $advance->fresh(['user']);
    }

    public function markPaid(AdvanceRequest $advance, User $actor): AdvanceRequest
    {
        if ($advance->status !== AdvanceStatus::Approved) {
            throw ValidationException::withMessages(['status' => 'Выплатить можно только одобренный аванс.']);
        }

        $advance->update([
            'status' => AdvanceStatus::Paid,
            'paid_by' => $actor->id,
            'paid_at' => now(),
        ]);

        ActivityLog::record($actor, 'advance.paid', $advance);
        $advance->user->notify(new AdvanceStatusChanged($advance));

        return $advance->fresh(['user']);
    }
}
