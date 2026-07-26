@php
    $inertiaDarkShellBg = null;
    if (request()->is('test') || request()->is('dashboard_test') || request()->is('dashboard_test/*')) {
        $inertiaDarkShellBg = '#09090B';
    } elseif (request()->path() === '' || request()->is('/')) {
        $inertiaDarkShellBg = '#050505';
    } elseif (request()->is('billing', 'billing/*')) {
        $inertiaDarkShellBg = '#050505';
    } elseif (
        request()->is('login', 'register', 'forgot-password', 'reset-password*', 'verify-email*', 'confirm-password')
    ) {
        $inertiaDarkShellBg = '#020707';
    } elseif (request()->routeIs([
        'dashboard',
        'financial-entry.index',
        'financial-records.store',
        'admin.dashboard',
        'admin.users.suspend',
        'admin.users.restore',
        'profile.edit',
        'profile.update',
        'profile.destroy',
    ])) {
        $inertiaDarkShellBg = '#09090B';
    }
@endphp
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @if ($inertiaDarkShellBg) style="background-color:{{ $inertiaDarkShellBg }}" @endif>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        @if ($inertiaDarkShellBg)
            <meta name="theme-color" content="{{ $inertiaDarkShellBg }}">
            @if (request()->path() === '' || request()->is('/'))
                <link rel="preload" as="image" href="{{ asset('images/copifi-logo.png') }}">
            @endif
            <style>
                html, body, #app {
                    background-color: {{ $inertiaDarkShellBg }} !important;
                    min-height: 100vh;
                    min-height: 100dvh;
                }
            </style>
        @endif

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Syne:wght@500;600;700;800&display=swap"
            rel="stylesheet"
        />

        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx'])
        @inertiaHead
    </head>
    <body class="font-sans antialiased" @if ($inertiaDarkShellBg) style="background-color:{{ $inertiaDarkShellBg }};min-height:100vh;min-height:100dvh" @endif>
        @inertia
    </body>
</html>
