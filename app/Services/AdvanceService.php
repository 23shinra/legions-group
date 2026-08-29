<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\AdvancePaymentMethod;
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
        private WorkerContextService $workerContext,
        private RealtimeNotifier $realtime,
    ) {}

    /**
     * @return array{
     *     can_request: bool,
     *     worked_days: int,
     *     worked_minutes: int,
     *     required_days: int,
     *     work_days: int|null,
     *     days_left: int|null,
     *     message: string|null,
     *     accrued: float,
     *     remaining: float,
     *     projected_remaining: float,
     *     available_for_advance: float,
     *     paid_advances: float,
     *     paid_salary: float,
     *     reserved_advances: float
     * }
     */
    public function eligibility(User $worker): array
    {
        $object = $this->workerContext->activeObject($worker);
        $summary = $this->payroll->objectSummary($worker, $object);
        $breakdown = $this->payroll->advanceBreakdown($worker, $object);
        $workedDays = (int) $summary['days'];
        $canRequest = $workedDays >= self::MIN_SHIFTS;
        $accrued = max(0.0, (float) $breakdown['accrued']);
        $available = min($accrued, (float) $breakdown['available_for_advance']);

        if ($worker->max_advance !== null) {
            $available = min($available, (float) $worker->max_advance);
        }

        return [
            'can_request' => $canRequest,
            'worked_days' => $workedDays,
            'worked_minutes' => (int) $summary['minutes'],
            'required_days' => self::MIN_SHIFTS,
            'work_days' => $summary['work_days'],
            'days_left' => $summary['days_left'],
            'message' => $canRequest
                ? null
                : 'У вас недостаточно отработанных смен на аванс',
            'accrued' => $accrued,
            'remaining' => (float) $breakdown['remaining'],
            'projected_remaining' => (float) $summary['projected_remaining'],
            'available_for_advance' => round($available, 2),
            'paid_advances' => (float) $breakdown['paid_advances'],
            'paid_salary' => (float) $breakdown['paid_salary'],
            'reserved_advances' => (float) $breakdown['reserved_advances'],
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

        $accrued = (float) $eligibility['accrued'];
        $available = (float) $eligibility['available_for_advance'];

        if ($amount > $accrued) {
            throw ValidationException::withMessages([
                'amount' => sprintf(
                    'Вы не можете запросить больше, чем заработали по факту (%s ₸).',
                    number_format($accrued, 0, '.', ' '),
                ),
            ]);
        }

        if ($amount > $available) {
            throw ValidationException::withMessages([
                'amount' => sprintf(
                    'Доступно к авансу не более %s ₸ (из заработанных %s ₸).',
                    number_format($available, 0, '.', ' '),
                    number_format($accrued, 0, '.', ' '),
                ),
            ]);
        }

        $advance = AdvanceRequest::query()->create([
            'user_id' => $worker->id,
            'amount' => $amount,
            'comment' => $comment,
            'status' => AdvanceStatus::Pending,
        ]);

        ActivityLog::record($worker, 'advance.requested', $advance, [
            'amount' => $amount,
            'member' => $worker->name,
        ]);

        $advance->load('user.brigade.brigadier');

        $recipients = User::query()
            ->whereIn('role', [UserRole::Manager, UserRole::Accountant])
            ->get();

        $brigadier = $advance->user?->brigade?->brigadier;

        if ($brigadier !== null) {
            $recipients = $recipients->push($brigadier)->unique('id');
        }

        Notification::send($recipients, new NewAdvanceRequest($advance));

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

        ActivityLog::record($actor, 'advance.approved', $advance, [
            'member' => $advance->user?->name,
            'amount' => (float) $advance->amount,
        ]);

        if ($advance->user) {
            $advance->user->notify(new AdvanceStatusChanged($advance));
        }

        $accountants = User::query()
            ->where('role', UserRole::Accountant)
            ->get();

        Notification::send($accountants, new AdvanceApprovedForPayment($advance));

        $this->pingAdvanceWatchers($advance, $actor, 'advance.status');

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

        ActivityLog::record($actor, 'advance.rejected', $advance, [
            'member' => $advance->user?->name,
            'amount' => (float) $advance->amount,
        ]);
        $advance->user->notify(new AdvanceStatusChanged($advance));
        $this->pingAdvanceWatchers($advance, $actor, 'advance.status');

        return $advance->fresh(['user']);
    }

    public function markPaid(
        AdvanceRequest $advance,
        User $actor,
        AdvancePaymentMethod $method,
        ?string $receiptPath = null,
        ?string $note = null,
    ): AdvanceRequest {
        if ($advance->status !== AdvanceStatus::Approved) {
            throw ValidationException::withMessages(['status' => 'Выплатить можно только одобренный руководителем аванс.']);
        }

        if ($method === AdvancePaymentMethod::Transfer && ($receiptPath === null || $receiptPath === '')) {
            throw ValidationException::withMessages(['receipt' => 'Прикрепите чек перевода.']);
        }

        $paymentNote = $method === AdvancePaymentMethod::Cash
            ? ($note !== null && trim($note) !== '' ? trim($note) : 'Выдан нал')
            : $note;

        $advance->update([
            'status' => AdvanceStatus::Paid,
            'paid_by' => $actor->id,
            'paid_at' => now(),
            'payment_method' => $method,
            'payment_receipt_path' => $receiptPath,
            'payment_note' => $paymentNote,
        ]);

        ActivityLog::record($actor, 'advance.paid', $advance, [
            'payment_method' => $method->value,
            'member' => $advance->user?->name,
            'amount' => (float) $advance->amount,
        ]);
        $advance->user->notify(new AdvanceStatusChanged($advance));
        $this->pingAdvanceWatchers($advance, $actor, 'advance.status');

        return $advance->fresh(['user']);
    }

    private function pingAdvanceWatchers(AdvanceRequest $advance, User $actor, string $event): void
    {
        $advance->loadMissing('user.brigade.brigadier');

        $this->realtime->ping([
            $advance->user?->brigade?->brigadier,
        ], $event, $actor->id);

        $this->realtime->pingRoles([UserRole::Manager, UserRole::Accountant], $event, $actor->id);
    }
}
