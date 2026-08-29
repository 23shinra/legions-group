<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\TimeEntry;
use App\Models\User;
use Illuminate\Notifications\Notification;

final class ArrivalConfirmed extends Notification
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
        return 'time.arrival_confirmed';
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        $worker = $this->entry->user;
        $isWorker = $notifiable instanceof User && $worker !== null
            && (int) $notifiable->id === (int) $worker->id;

        return [
            'type' => 'time.arrival_confirmed',
            'event' => 'time.arrival_confirmed',
            'entry_id' => $this->entry->id,
            'user_id' => $this->entry->user_id,
            'message' => $isWorker
                ? 'Бригадир подтвердил приход — смена начата'
                : sprintf('%s вышел на объект', $worker?->name ?? 'Строитель'),
            'url' => $isWorker ? '/worker' : '/manager',
        ];
    }
}
