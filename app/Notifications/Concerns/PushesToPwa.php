<?php

declare(strict_types=1);

namespace App\Notifications\Concerns;

use App\Notifications\Channels\QuietWebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

trait PushesToPwa
{
    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast', QuietWebPushChannel::class];
    }

    public function toWebPush(object $notifiable, object $notification): WebPushMessage
    {
        $data = $this->toArray($notifiable);
        $type = (string) ($data['type'] ?? $data['event'] ?? 'legionis');
        $tag = $type;

        foreach (['advance_id', 'entry_id', 'payment_id', 'object_id', 'user_id'] as $key) {
            if (! empty($data[$key])) {
                $tag .= '-'.$data[$key];
                break;
            }
        }

        return (new WebPushMessage)
            ->title($this->pushTitle($type))
            ->body((string) ($data['message'] ?? 'Новое уведомление'))
            ->icon('/icon-192.png?v=4')
            ->badge('/favicon-32.png?v=4')
            ->data([
                'url' => $data['url'] ?? '/',
                'type' => $type,
            ])
            ->tag($tag)
            ->renotify(false)
            ->requireInteraction(false)
            ->options(['TTL' => 3600]);
    }

    private function pushTitle(string $type): string
    {
        return match (true) {
            str_contains($type, 'advance') => 'Аванс',
            str_contains($type, 'payment') => 'Выплата',
            str_contains($type, 'time') || str_contains($type, 'arrival') => 'Смена',
            str_contains($type, 'object') => 'Объект',
            str_contains($type, 'attendance') => 'Посещаемость',
            default => 'Legionis Group',
        };
    }
}
