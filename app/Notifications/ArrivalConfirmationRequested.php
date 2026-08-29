<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\TimeEntry;
use Illuminate\Notifications\Notification;

final class ArrivalConfirmationRequested extends Notification
{
    public function __construct(
        private readonly TimeEntry $entry,
    ) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function broadcastType(): string
    {
        return 'time.arrival_pending';
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        $objectId = $this->entry->work_object_id;

        return [
            'type' => 'time.arrival_pending',
            'event' => 'time.arrival_pending',
            'entry_id' => $this->entry->id,
            'user' => $this->entry->user?->name,
            'message' => sprintf(
                '%s отметил приход — подтвердите',
                $this->entry->user?->name ?? 'Строитель',
            ),
            'url' => $objectId
                ? '/brigadier?object='.$objectId
                : '/brigadier',
        ];
    }
}
