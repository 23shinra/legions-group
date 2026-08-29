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

        <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=3">
        <link rel="icon" href="/favicon.ico?v=3" sizes="any">
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png?v=3">
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png?v=3">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=3">
        <link rel="manifest" href="/site.webmanifest?v=3">

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
