<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\UserRole;
use App\Models\ActivityLog;
use App\Models\Payment;
use App\Models\User;
use App\Notifications\SalaryPaid;
use Carbon\Carbon;

final readonly class PaymentService
{
    public function __construct(
        private PayrollService $payroll,
        private RealtimeNotifier $realtime,
    ) {}

    public function pay(
        User $employee,
        float $amount,
        User $actor,
        ?string $period = null,
        ?string $comment = null,
        ?Carbon $paidOn = null,
        ?int $workObjectId = null,
    ): Payment {
        $payment = Payment::query()->create([
            'user_id' => $employee->id,
            'amount' => $amount,
            'paid_on' => ($paidOn ?? now())->toDateString(),
            'paid_by' => $actor->id,
            'period' => $period,
            'comment' => $comment,
            'work_object_id' => $workObjectId,
        ]);

        ActivityLog::record($actor, 'payment.created', $payment, [
            'amount' => $amount,
            'employee_id' => $employee->id,
            'member' => $employee->name,
        ]);

        $employee->notify(new SalaryPaid($payment));
        $this->realtime->pingRoles([UserRole::Manager, UserRole::Accountant], 'payment.paid', $actor->id);

        return $payment;
    }

    public function payObjectSettlement(\App\Models\WorkObject $object, User $actor): int
    {
        $employees = $object->settlement['employees'] ?? [];
        $count = 0;
        $from = $object->start_date?->copy()->startOfDay();
        $to = $object->closed_at?->copy() ?? now();

        foreach ($employees as $row) {
            if (empty($row['user_id'])) {
                continue;
            }

            $employee = User::query()->find((int) $row['user_id']);

            if ($employee === null) {
                continue;
            }

            $remaining = (float) $this->payroll->balanceFor($employee, $from, $to, $object)['remaining'];

            if ($remaining <= 0) {
                continue;
            }

            $this->pay(
                $employee,
                $remaining,
                $actor,
                $object->name,
                'Выплата при закрытии объекта',
                null,
                $object->id,
            );
            $count++;
        }

        return $count;
    }
}
