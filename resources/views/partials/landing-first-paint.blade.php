@if (request()->path() === '' || request()->is('/'))
    <div id="landing-first-paint" aria-hidden="true">
        <div class="lfp-bg"></div>
        <div class="lfp-glow lfp-glow--emerald"></div>
        <div class="lfp-glow lfp-glow--sky"></div>

        <header class="lfp-nav">
            <img src="{{ asset('images/copifi-logo.png') }}" alt="" width="152" height="48" decoding="async" fetchpriority="high">
        </header>

        <main class="lfp-hero">
            <p class="lfp-badge">Facturation + pilotage · prêt pour la réforme 2026</p>
            <h1 class="lfp-title">
                Pilotez, facturez,<br>
                <em>décidez.</em>
            </h1>
            <p class="lfp-lead">
                Bien plus qu'un logiciel de facturation. Copifi réunit vos devis, factures et paiements conformes à la réforme 2026 —
                et le pilotage complet de votre entreprise.
            </p>
        </main>
    </div>

    <style>
        #landing-first-paint {
            position: fixed;
            inset: 0;
            z-index: 9990;
            overflow: hidden;
            background: #050505;
            color: #fff;
            font-family: Inter, ui-sans-serif, system-ui, sans-serif;
        }

        body.inertia-ready #landing-first-paint {
            display: none;
        }

        #landing-first-paint .lfp-bg {
            position: absolute;
            inset: 0;
            background:
                radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.15), transparent 50%),
                radial-gradient(circle at 80% 50%, rgba(56, 189, 248, 0.1), transparent 50%);
        }

        #landing-first-paint .lfp-glow {
            position: absolute;
            border-radius: 9999px;
            filter: blur(120px);
            pointer-events: none;
        }

        #landing-first-paint .lfp-glow--emerald {
            left: -25%;
            top: 33%;
            width: 420px;
            height: 420px;
            background: rgba(16, 185, 129, 0.2);
        }

        #landing-first-paint .lfp-glow--sky {
            right: -25%;
            bottom: 25%;
            width: 380px;
            height: 380px;
            background: rgba(56, 189, 248, 0.15);
        }

        #landing-first-paint .lfp-nav {
            position: fixed;
            left: 50%;
            top: 1.25rem;
            z-index: 1;
            display: flex;
            align-items: center;
            width: 94%;
            max-width: 72rem;
            padding: 0.85rem 1.25rem;
            transform: translateX(-50%);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 9999px;
            background: rgba(10, 14, 20, 0.75);
            backdrop-filter: blur(12px);
        }

        #landing-first-paint .lfp-nav img {
            height: 2.5rem;
            width: auto;
        }

        #landing-first-paint .lfp-hero {
            position: relative;
            z-index: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            max-width: 56rem;
            margin: 0 auto;
            padding: 8rem 1.5rem 2rem;
            text-align: center;
        }

        #landing-first-paint .lfp-badge {
            margin: 0 0 2rem;
            padding: 0.4rem 1rem;
            border: 1px solid rgba(16, 185, 129, 0.3);
            border-radius: 9999px;
            background: rgba(16, 185, 129, 0.1);
            color: #6ee7b7;
            font-size: 11px;
            letter-spacing: 0.18em;
            text-transform: uppercase;
        }

        #landing-first-paint .lfp-title {
            margin: 0;
            font-size: clamp(2.5rem, 8vw, 4.5rem);
            font-weight: 700;
            line-height: 1.06;
            letter-spacing: -0.04em;
        }

        #landing-first-paint .lfp-title em {
            font-family: 'Instrument Serif', Georgia, serif;
            font-style: italic;
            font-weight: 400;
            background: linear-gradient(to right, #a7f3d0, #7dd3fc);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
        }

        #landing-first-paint .lfp-lead {
            max-width: 42rem;
            margin: 1.5rem 0 0;
            color: #a1a1aa;
            font-size: clamp(1rem, 2.5vw, 1.25rem);
            font-weight: 300;
            line-height: 1.6;
        }
    </style>
@endif
