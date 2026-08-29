<?php

declare(strict_types=1);

namespace App\Notifications\Channels;

use App\Notifications\Events\ImmediateBroadcastNotificationCreated;
use Illuminate\Broadcasting\BroadcastException;
use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Notifications\Channels\BroadcastChannel;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

final class ImmediateBroadcastChannel extends BroadcastChannel
{
    public function __construct(Dispatcher $events)
    {
        parent::__construct($events);
    }

    /**
     * @param  mixed  $notifiable
     */
    public function send($notifiable, Notification $notification): mixed
    {
        $message = $this->getData($notifiable, $notification);

        $event = new ImmediateBroadcastNotificationCreated(
            $notifiable,
            $notification,
            is_array($message) ? $message : $message->data,
        );

        if ($message instanceof BroadcastMessage) {
            $event->onConnection($message->connection)
                ->onQueue($message->queue);
        }

        try {
            return $this->events->dispatch($event);
        } catch (BroadcastException $exception) {
            report($exception);

            return null;
        }
    }
}
