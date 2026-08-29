<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Enums\UserRole;
use App\Models\User;
use App\Models\WorkObject;
use App\Notifications\Concerns\PushesToPwa;
use Illuminate\Notifications\Notification;

final class ObjectClosed extends Notification
{
    use PushesToPwa;

    /**
     * @param  array{total_remaining?: float}  $settlement
     */
    public function __construct(
        private readonly WorkObject $object,
        private readonly array $settlement = [],
    ) {}

    public function broadcastType(): string
    {
        return 'object.closed';
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        $total = (float) ($this->settlement['total_remaining'] ?? 0);
        $role = $notifiable instanceof User ? $notifiable->role : null;
        $url = match ($role) {
            UserRole::Accountant => '/accountant/payments',
            UserRole::Brigadier => '/brigadier',
            default => '/manager/objects/'.$this->object->id,
        };

        return [
            'type' => 'object.closed',
            'event' => 'object.closed',
            'object_id' => $this->object->id,
            'message' => sprintf(
                'Объект «%s» закрыт. К выплате: %s ₸',
                $this->object->name,
                number_format($total, 0, '.', ' '),
            ),
            'url' => $url,
        ];
    }
}
