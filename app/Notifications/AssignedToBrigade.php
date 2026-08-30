<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Brigade;
use App\Models\User;
use App\Notifications\Concerns\PushesToPwa;
use Illuminate\Notifications\Notification;

final class AssignedToBrigade extends Notification
{
    use PushesToPwa;

    public function __construct(
        private readonly Brigade $brigade,
    ) {}

    public static function sendToWorker(User $employee, Brigade $brigade, mixed $previousBrigadeId): void
    {
        if (! $employee->isWorker()) {
            return;
        }

        if ($previousBrigadeId !== null && (int) $previousBrigadeId === (int) $brigade->id) {
            return;
        }

        $employee->notify(new self($brigade));
    }

    public function broadcastType(): string
    {
        return 'roster.assigned';
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        $name = $this->brigade->displayName();

        return [
            'type' => 'roster.assigned',
            'event' => 'roster.assigned',
            'brigade_id' => $this->brigade->id,
            'message' => sprintf('Вас прикрепили к бригаде %s', $name),
            'url' => '/worker',
        ];
    }
}
