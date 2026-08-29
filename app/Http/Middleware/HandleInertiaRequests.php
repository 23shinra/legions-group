<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'role' => $request->user()->role instanceof \BackedEnum
                        ? $request->user()->role->value
                        : $request->user()->role,
                    'phone' => $request->user()->phone,
                    'brigade_id' => $request->user()->brigade_id,
                    'position' => $request->user()->position,
                ] : null,
            ],
            'notifications' => $request->user()
                ? $request->user()->unreadNotifications()
                    ->latest()
                    ->limit(20)
                    ->get()
                    ->map(fn ($n) => [
                        'id' => $n->id,
                        'type' => data_get($n->data, 'type'),
                        'message' => data_get($n->data, 'message'),
                        'url' => data_get($n->data, 'url'),
                        'created_at' => $n->created_at?->toIso8601String(),
                    ])
                    ->values()
                : [],
            'payroll' => \App\Support\PayDefaults::toArray(),
            'vapidPublicKey' => config('webpush.vapid.public_key'),
            'hasPushSubscription' => (bool) $request->user()?->pushSubscriptions()->exists(),
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
