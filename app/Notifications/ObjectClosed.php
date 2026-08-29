<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\WorkObject;
use Illuminate\Notifications\Notification;

final class ObjectClosed extends Notification
{
    /**
     * @param  array{total_remaining?: float}  $settlement
     */
    public function __construct(
        private readonly WorkObject $object,
        private readonly array $settlement = [],
    ) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function broadcastType(): string
    {
        return 'object.closed';
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        $total = (float) ($this->settlement['total_remaining'] ?? 0);

        return [
            'type' => 'object.closed',
            'event' => 'object.closed',
            'object_id' => $this->object->id,
            'message' => sprintf(
                'Объект «%s» закрыт. К выплате: %s ₸',
                $this->object->name,
                number_format($total, 0, '.', ' '),
            ),
            'url' => '/manager/objects/'.$this->object->id,
        ];
    }
}
