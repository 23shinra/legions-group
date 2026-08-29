<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\TimeEntry;
use App\Models\User;
use Illuminate\Notifications\Notification;

final class ShiftEnded extends Notification
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
        return 'time.ended';
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        $worker = $this->entry->user;
        $isWorker = $notifiable instanceof User && $worker !== null
            && (int) $notifiable->id === (int) $worker->id;

        $minutes = (int) ($this->entry->worked_minutes ?? 0);
        $hours = intdiv($minutes, 60);
        $mins = $minutes % 60;

        return [
            'type' => 'time.ended',
            'event' => 'time.ended',
            'entry_id' => $this->entry->id,
            'user' => $worker?->name,
            'message' => $isWorker
                ? sprintf('Смена завершена (%d ч %d мин)', $hours, $mins)
                : sprintf(
                    '%s завершил смену (%d ч %d мин)',
                    $worker?->name ?? 'Строитель',
                    $hours,
                    $mins,
                ),
            'url' => $isWorker
                ? '/worker'
                : ($this->entry->work_object_id
                    ? '/brigadier?object='.$this->entry->work_object_id
                    : '/brigadier'),
        ];
    }
}
