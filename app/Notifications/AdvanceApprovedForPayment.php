<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\AdvanceRequest;
use Illuminate\Notifications\Notification;

final class AdvanceApprovedForPayment extends Notification
{
    public function __construct(
        private readonly AdvanceRequest $advance,
    ) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function broadcastType(): string
    {
        return 'advance.approved_for_payment';
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        $advance = $this->advance->loadMissing('user');

        return [
            'type' => 'advance.approved_for_payment',
            'event' => 'advance.approved_for_payment',
            'advance_id' => $advance->id,
            'user' => $advance->user?->name,
            'amount' => (float) $advance->amount,
            'url' => '/accountant/advances',
            'message' => sprintf(
                'Аванс одобрен — нужна выплата: %s · %s ₸',
                $advance->user?->name ?? 'сотрудник',
                number_format((float) $advance->amount, 0, '.', ' ')
            ),
        ];
    }
}
