<?php

return [
    'inertiajs/inertia-laravel' => [
        'providers' => [
            'Inertia\\ServiceProvider',
        ],
    ],
    'laravel-notification-channels/webpush' => [
        'providers' => [
            'NotificationChannels\\WebPush\\WebPushServiceProvider',
        ],
    ],
    'laravel/reverb' => [
        'providers' => [
            'Laravel\\Reverb\\ApplicationManagerServiceProvider',
            'Laravel\\Reverb\\ReverbServiceProvider',
        ],
    ],
    'laravel/sanctum' => [
        'providers' => [
            'Laravel\\Sanctum\\SanctumServiceProvider',
        ],
    ],
    'laravel/tinker' => [
        'providers' => [
            'Laravel\\Tinker\\TinkerServiceProvider',
        ],
    ],
    'maatwebsite/excel' => [
        'aliases' => [
            'Excel' => 'Maatwebsite\\Excel\\Facades\\Excel',
        ],
        'providers' => [
            'Maatwebsite\\Excel\\ExcelServiceProvider',
        ],
    ],
    'nesbot/carbon' => [
        'providers' => [
            'Carbon\\Laravel\\ServiceProvider',
        ],
    ],
    'tightenco/ziggy' => [
        'providers' => [
            'Tighten\\Ziggy\\ZiggyServiceProvider',
        ],
    ],
];
