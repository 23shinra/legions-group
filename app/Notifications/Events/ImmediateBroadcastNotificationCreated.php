<?php

declare(strict_types=1);

namespace App\Notifications\Events;

use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Notifications\Events\BroadcastNotificationCreated;

final class ImmediateBroadcastNotificationCreated extends BroadcastNotificationCreated implements ShouldBroadcastNow {}
