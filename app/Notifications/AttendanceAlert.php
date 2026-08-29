<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Enums\UserRole;
use App\Models\User;
use App\Notifications\Concerns\PushesToPwa;
use Illuminate\Notifications\Notification;

final class AttendanceAlert extends Notification
{
    use PushesToPwa;

    public function __construct(
        private readonly string $kind,
        private readonly User $worker,
        private readonly string $detail = '',
    ) {}

    public function broadcastType(): string
    {
        return 'attendance.'.$this->kind;
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        $url = '/manager';

        if ($notifiable instanceof User && $notifiable->role === UserRole::Brigadier) {
            $url = '/brigadier';
        }

        $message = $this->kind === 'late'
            ? sprintf('%s опоздал%s', $this->worker->name, $this->detail !== '' ? ' — '.$this->detail : '')
            : sprintf('%s не вышел на работу', $this->worker->name);

        return [
            'type' => 'attendance.'.$this->kind,
            'event' => 'attendance.'.$this->kind,
            'kind' => $this->kind,
            'user_id' => $this->worker->id,
            'user' => $this->worker->name,
            'message' => $message,
            'url' => $url,
        ];
    }
}
