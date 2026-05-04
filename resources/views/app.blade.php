<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        @php
            $viteHotFile = public_path('hot');
            $viteManifest = public_path('build/manifest.json');
            $viteReady = file_exists($viteHotFile) || file_exists($viteManifest);
        @endphp

        @routes

        @if ($viteReady)
            @viteReactRefresh
            @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @endif

        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @if ($viteReady)
            @inertia
        @else
            <main style="min-height:100vh;display:grid;place-items:center;padding:2rem;background:#f8fafc;color:#0f172a;">
                <section style="max-width:42rem;background:white;border:1px solid #e2e8f0;border-radius:1rem;padding:2rem;box-shadow:0 10px 30px rgba(15,23,42,.08);">
                    <p style="margin:0 0 .75rem;font-size:.875rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#2563eb;">Configuration requise</p>
                    <h1 style="margin:0 0 1rem;font-size:1.75rem;line-height:1.2;">Les assets front ne sont pas encore générés.</h1>
                    <p style="margin:0 0 1rem;font-size:1rem;line-height:1.7;color:#334155;">Le serveur Laravel fonctionne, mais l'interface React/Inertia n'est pas encore compilée. Lancez le front une fois pour terminer l'installation locale.</p>
                    <pre style="margin:0;padding:1rem;border-radius:.75rem;background:#0f172a;color:#e2e8f0;overflow:auto;">npm install
npm run dev</pre>
                </section>
            </main>
        @endif
    </body>
</html>
