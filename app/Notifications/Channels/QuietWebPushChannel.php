<?php

declare(strict_types=1);

namespace App\Notifications\Channels;

use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use Throwable;

final class QuietWebPushChannel
{
    public function __construct(private WebPushChannel $channel) {}

    public function send(mixed $notifiable, Notification $notification): void
    {
        try {
            $this->channel->send($notifiable, $notification);
        } catch (Throwable $exception) {
            report($exception);
        }
    }
}
