<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Notifications\Notification;

final class LiveRefresh extends Notification
{
    public function __construct(
        private readonly string $event,
    ) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['broadcast'];
    }

    public function broadcastType(): string
    {
        return $this->event;
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => $this->event,
            'event' => $this->event,
        ];
    }
}
