<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Enums\AdvanceStatus;
use App\Models\AdvanceRequest;
use App\Notifications\Concerns\PushesToPwa;
use Illuminate\Notifications\Notification;

final class AdvanceStatusChanged extends Notification
{
    use PushesToPwa;

    public function __construct(
        private readonly AdvanceRequest $advance,
    ) {}

    public function broadcastType(): string
    {
        return 'advance.status';
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        $amount = number_format((float) $this->advance->amount, 0, '.', ' ');
        $status = $this->advance->status;

        $message = match ($status) {
            AdvanceStatus::Approved => sprintf('Аванс одобрен — %s ₸', $amount),
            AdvanceStatus::Rejected => sprintf('Аванс отклонён — %s ₸', $amount),
            AdvanceStatus::Paid => sprintf('Аванс выплачен — %s ₸', $amount),
            default => sprintf('Аванс %s ₸: %s', $amount, $status->label()),
        };

        return [
            'type' => 'advance.status',
            'event' => 'advance.status',
            'advance_id' => $this->advance->id,
            'status' => $status->value,
            'amount' => (float) $this->advance->amount,
            'url' => '/worker/advances',
            'message' => $message,
        ];
    }
}
