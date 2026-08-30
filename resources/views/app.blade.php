<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        <meta name="theme-color" content="#f2f2f2">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-title" content="Legionis">
        <meta name="application-name" content="Legionis">
        <meta name="mobile-web-app-title" content="Legionis">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        @php
            $buildManifestPath = public_path('build/manifest.json');
            $buildId = is_file($buildManifestPath) ? (string) filemtime($buildManifestPath) : '0';
        @endphp
        <meta name="lg-build-id" content="{{ $buildId }}">
        <script>
            (function () {
                var buildId = document.querySelector('meta[name="lg-build-id"]')?.getAttribute('content');
                var storageKey = 'lg-build-id';
                var previousBuildId = null;

                try {
                    previousBuildId = localStorage.getItem(storageKey);
                } catch (error) {}

                if (buildId && previousBuildId && previousBuildId !== buildId) {
                    try {
                        localStorage.setItem(storageKey, buildId);
                    } catch (error) {}

                    var cleanup = function () {
                        var reloadUrl = window.location.pathname + window.location.search;
                        var separator = reloadUrl.indexOf('?') === -1 ? '?' : '&';
                        window.location.replace(reloadUrl + separator + '_=' + Date.now());
                    };

                    if ('serviceWorker' in navigator) {
                        navigator.serviceWorker.getRegistrations()
                            .then(function (registrations) {
                                return Promise.all(registrations.map(function (registration) {
                                    return registration.unregister();
                                }));
                            })
                            .finally(cleanup);
                    } else {
                        cleanup();
                    }

                    return;
                }

                if (buildId) {
                    try {
                        localStorage.setItem(storageKey, buildId);
                    } catch (error) {}
                }

                window.setTimeout(function () {
                    var root = document.getElementById('app');

                    if (!root || root.dataset.mounted === '1') {
                        return;
                    }

                    root.innerHTML = ''
                        + '<div style="min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui,sans-serif;text-align:center;background:#f2f2f2;color:#111;">'
                        + '<div style="max-width:320px;">'
                        + '<p style="font-size:18px;font-weight:700;margin:0 0 12px;">Не удалось загрузить приложение</p>'
                        + '<p style="font-size:14px;line-height:1.5;margin:0 0 16px;color:#555;">Обновите страницу. Если не поможет — очистите данные Safari для сайта.</p>'
                        + '<button type="button" onclick="location.reload()" style="border:0;border-radius:999px;padding:12px 18px;font-size:15px;font-weight:600;background:#111;color:#fff;">Обновить</button>'
                        + '</div></div>';
                }, 8000);
            })();
        </script>
        <script>
            (function () {
                try {
                    var t = localStorage.getItem('lg-theme-v2');
                    if (t !== 'light' && t !== 'dark') {
                        t = 'light';
                    }
                    document.documentElement.setAttribute('data-theme', t);
                    var meta = document.querySelector('meta[name="theme-color"]');
                    if (meta) meta.setAttribute('content', t === 'dark' ? '#0c0c0c' : '#f2f2f2');
                } catch (e) {}
            })();
        </script>

        <title inertia>{{ config('app.name', 'Legionis Group') }}</title>

        <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=4">
        <link rel="icon" href="/favicon.ico?v=4" sizes="any">
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png?v=4">
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png?v=4">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=4">
        <link rel="manifest" href="/site.webmanifest?v=5">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700,800" rel="stylesheet" />

        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
