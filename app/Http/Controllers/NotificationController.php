<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

final class NotificationController
{
    public function index(Request $request): JsonResponse
    {
        $notifications = $request->user()
            ?->unreadNotifications()
            ->latest()
            ->limit(20)
            ->get() ?? new EloquentCollection;

        return response()->json([
            'notifications' => $this->mapNotifications($notifications),
        ]);
    }

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

    /** @param EloquentCollection<int, DatabaseNotification> $notifications
     * @return list<array<string, mixed>>
     */
    private function mapNotifications(EloquentCollection $notifications): array
    {
        return $notifications
            ->map(fn (DatabaseNotification $notification): array => [
                'id' => $notification->id,
                'type' => data_get($notification->data, 'type'),
                'message' => data_get($notification->data, 'message'),
                'url' => data_get($notification->data, 'url'),
                'created_at' => $notification->created_at?->toIso8601String(),
            ])
            ->values()
            ->all();
    }
}
