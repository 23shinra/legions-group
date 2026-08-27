<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final class NotificationController
{
    public function markRead(Request $request, string $id): RedirectResponse
    {
        $notification = $request->user()
            ?->notifications()
            ->where('id', $id)
            ->first();

        $notification?->markAsRead();

        $url = data_get($notification?->data, 'url');

        if (is_string($url) && $url !== '') {
            return redirect($url);
        }

        return back();
    }

    public function markAllRead(Request $request): RedirectResponse
    {
        $request->user()?->unreadNotifications->markAsRead();

        return back();
    }
}
