<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Payment;
use App\Models\User;
use App\Notifications\SalaryPaid;

final readonly class PaymentService
{
    public function pay(User $employee, float $amount, User $actor, ?string $period = null, ?string $comment = null): Payment
    {
        $payment = Payment::query()->create([
            'user_id' => $employee->id,
            'amount' => $amount,
            'paid_on' => now()->toDateString(),
            'paid_by' => $actor->id,
            'period' => $period,
            'comment' => $comment,
        ]);

        ActivityLog::record($actor, 'payment.created', $payment, [
            'amount' => $amount,
            'employee_id' => $employee->id,
        ]);

        $employee->notify(new SalaryPaid($payment));

        return $payment;
    }
}
