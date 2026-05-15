import { Link } from '@inertiajs/react';

function BrandIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
            <path
                d="M12 3a9 9 0 1 0 9 9h-9V3Z"
                fill="#17c99b"
                opacity="0.95"
            />
            <path
                d="M12 3a9 9 0 0 1 9 9h-9V3Z"
                fill="#7c5cff"
                opacity="0.85"
            />
            <path
                d="M12 12h9a9 9 0 0 1-2.64 6.36L12 12Z"
                fill="#21d4fd"
                opacity="0.9"
            />
        </svg>
    );
}

function GoogleIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
            <path
                fill="#fff"
                d="M21.6 12.23c0-.78-.07-1.53-.2-2.23H12v4.22h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.32 2.98-7.52Z"
            />
            <path
                fill="#fff"
                d="M12 22c2.7 0 4.97-.9 6.62-2.44l-3.24-2.51c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.76-5.59-4.12H3.06v2.6A9.99 9.99 0 0 0 12 22Z"
                opacity="0.78"
            />
            <path
                fill="#fff"
                d="M6.41 13.88A6 6 0 0 1 6.1 12c0-.65.11-1.28.31-1.88v-2.6H3.06A9.99 9.99 0 0 0 2 12c0 1.61.39 3.13 1.06 4.48l3.35-2.6Z"
                opacity="0.62"
            />
            <path
                fill="#fff"
                d="M12 6c1.47 0 2.78.5 3.82 1.5l2.87-2.87C16.96 3 14.7 2 12 2a9.99 9.99 0 0 0-8.94 5.52l3.35 2.6C7.2 7.76 9.4 6 12 6Z"
                opacity="0.9"
            />
        </svg>
    );
}

function MicrosoftIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
            <path fill="#fff" d="M3 3h8.5v8.5H3V3Z" opacity="0.95" />
            <path fill="#fff" d="M12.5 3H21v8.5h-8.5V3Z" opacity="0.75" />
            <path fill="#fff" d="M3 12.5h8.5V21H3v-8.5Z" opacity="0.65" />
            <path fill="#fff" d="M12.5 12.5H21V21h-8.5v-8.5Z" opacity="0.85" />
        </svg>
    );
}

function AuthTabs({ mode }) {
    const activeClass =
        'bg-slate-700/80 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]';
    const idleClass = 'text-slate-400 hover:text-white';

    return (
        <div className="grid rounded-full border border-white/5 bg-black/35 p-1 text-xs font-semibold">
            <div className="grid grid-cols-2">
                <Link
                    href={route('login')}
                    className={`rounded-full px-5 py-2 text-center transition ${
                        mode === 'login' ? activeClass : idleClass
                    }`}
                >
                    Connexion
                </Link>
                <Link
                    href={route('register')}
                    className={`rounded-full px-5 py-2 text-center transition ${
                        mode === 'register' ? activeClass : idleClass
                    }`}
                >
                    Creer un compte
                </Link>
            </div>
        </div>
    );
}

export default function AuthShell({ children, mode, title, subtitle }) {
    return (
        <div className="relative min-h-screen overflow-hidden bg-[#020707] text-white">
            <div
                aria-hidden
                className="absolute inset-0"
                style={{
                    background:
                        'radial-gradient(circle at 75% 20%, rgba(20,184,166,0.2), transparent 34%), radial-gradient(circle at 20% 80%, rgba(14,165,233,0.12), transparent 36%), linear-gradient(90deg, rgba(4,18,18,0.98), rgba(3,8,9,0.92))',
                }}
            />
            <div
                aria-hidden
                className="absolute inset-0 opacity-30"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                }}
            />
            <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,rgba(0,0,0,0.82)_72%)]"
            />

            <main className="relative z-10 mx-auto grid min-h-screen w-full max-w-7xl items-center gap-12 px-6 py-10 lg:grid-cols-[1fr_0.9fr] lg:px-12">
                <section className="hidden lg:block">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/70 shadow-[0_0_40px_rgba(20,184,166,0.25)]">
                        <BrandIcon />
                    </div>

                    <h1 className="mt-8 text-6xl font-black leading-[0.98] tracking-tight">
                        Mini CFO
                        <span className="block text-[#22d3a6]">Digital.</span>
                    </h1>

                    <p className="mt-6 max-w-md text-lg leading-8 text-slate-400">
                        L&apos;intelligence financiere propulsee par l&apos;IA.
                        Maitrisez votre tresorerie avec une precision
                        chirurgicale.
                    </p>

                    <div className="mt-20 grid max-w-2xl grid-cols-2 gap-6">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.4)]">
                            <p className="text-3xl font-black">$2.4B+</p>
                            <p className="mt-2 text-sm text-slate-400">
                                Flux geres mensuellement
                            </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.4)]">
                            <p className="text-3xl font-black">99.9%</p>
                            <p className="mt-2 text-sm text-slate-400">
                                Precision predictive IA
                            </p>
                        </div>
                    </div>
                </section>

                <section className="mx-auto w-full max-w-md">
                    <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-[0_30px_100px_rgba(0,0,0,0.65)] backdrop-blur-xl">
                        <AuthTabs mode={mode} />

                        <div className="mt-9">
                            <h2 className="text-2xl font-bold text-white">
                                {title}
                            </h2>
                            <p className="mt-2 text-sm text-slate-400">
                                {subtitle}
                            </p>
                        </div>

                        <div className="mt-8">{children}</div>

                        <div className="my-8 flex items-center gap-4">
                            <div className="h-px flex-1 bg-white/10" />
                            <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                                Ou continuer avec
                            </span>
                            <div className="h-px flex-1 bg-white/10" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.1]"
                            >
                                <GoogleIcon />
                                Google
                            </button>
                            <button
                                type="button"
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.1]"
                            >
                                <MicrosoftIcon />
                                Microsoft
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 flex items-center justify-center gap-4 text-xs text-slate-500">
                        <a href="#" className="transition hover:text-slate-300">
                            Conditions d&apos;utilisation
                        </a>
                        <span>-</span>
                        <a href="#" className="transition hover:text-slate-300">
                            Politique de confidentialite
                        </a>
                    </div>
                </section>
            </main>
        </div>
    );
}
