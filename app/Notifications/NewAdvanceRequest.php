<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\AdvanceRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

final class NewAdvanceRequest extends Notification
{
    use Queueable;

    public function __construct(
        private readonly AdvanceRequest $advance,
    ) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'advance.new',
            'advance_id' => $this->advance->id,
            'user' => $this->advance->user?->name,
            'amount' => (float) $this->advance->amount,
            'message' => sprintf(
                'Новый запрос аванса: %s — %s ₸',
                $this->advance->user?->name ?? 'сотрудник',
                number_format((float) $this->advance->amount, 0, '.', ' ')
            ),
        ];
    }
}
