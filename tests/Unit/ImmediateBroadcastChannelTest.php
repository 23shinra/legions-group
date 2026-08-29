<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Notifications\Channels\ImmediateBroadcastChannel;
use App\Notifications\LiveRefresh;
use Illuminate\Broadcasting\BroadcastException;
use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Support\Facades\Exceptions;
use Mockery;
use Tests\TestCase;

final class ImmediateBroadcastChannelTest extends TestCase
{
    public function test_broadcast_outage_is_reported_and_does_not_fail_the_send(): void
    {
        Exceptions::fake();

        $events = Mockery::mock(Dispatcher::class);
        $events->shouldReceive('dispatch')
            ->once()
            ->andThrow(new BroadcastException('Reverb unavailable'));

        $channel = new ImmediateBroadcastChannel($events);

        $channel->send((object) ['id' => 1], new LiveRefresh('advance.status'));

        Exceptions::assertReported(BroadcastException::class);
    }
}
