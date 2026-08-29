<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\AdvanceRequest;
use App\Notifications\Concerns\PushesToPwa;
use Illuminate\Notifications\Notification;

final class AdvanceApprovedForPayment extends Notification
{
    use PushesToPwa;

    public function __construct(
        private readonly AdvanceRequest $advance,
    ) {}

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
