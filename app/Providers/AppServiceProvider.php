<?php

namespace App\Providers;

use App\Notifications\Channels\ImmediateBroadcastChannel;
use Illuminate\Notifications\Channels\BroadcastChannel;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->app->bind(BroadcastChannel::class, ImmediateBroadcastChannel::class);

        Vite::prefetch(concurrency: 3);
    }
}
