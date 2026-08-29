<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Payment;
use Illuminate\Notifications\Notification;

final class SalaryPaid extends Notification
{
    public function __construct(
        private readonly Payment $payment,
    ) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function broadcastType(): string
    {
        return 'payment.paid';
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'payment.paid',
            'event' => 'payment.paid',
            'payment_id' => $this->payment->id,
            'amount' => (float) $this->payment->amount,
            'message' => sprintf(
                'Выплата произведена: %s ₸',
                number_format((float) $this->payment->amount, 0, '.', ' ')
            ),
            'url' => '/worker/salary',
        ];
    }
}
