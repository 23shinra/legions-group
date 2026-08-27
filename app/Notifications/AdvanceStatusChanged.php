<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\AdvanceRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

final class AdvanceStatusChanged extends Notification
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
        $status = $this->advance->status->label();

        return [
            'type' => 'advance.status',
            'advance_id' => $this->advance->id,
            'status' => $this->advance->status->value,
            'amount' => (float) $this->advance->amount,
            'url' => '/worker/advances',
            'message' => sprintf(
                'Аванс %s ₸: %s',
                number_format((float) $this->advance->amount, 0, '.', ' '),
                $status
            ),
        ];
    }
}
