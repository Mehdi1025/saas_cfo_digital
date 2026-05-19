import { Head, Link, usePage } from '@inertiajs/react';

function navItemClass(active) {
    return active
        ? 'flex items-center gap-3 rounded-2xl border border-white/5 bg-[#306EFF]/20 px-3.5 py-3 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
        : 'flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white';
}

function navIconClass(active) {
    return active ? 'h-5 w-5 shrink-0 text-[#78A6FF]' : 'h-5 w-5 shrink-0 text-zinc-500';
}

function LogoIcon({ className = 'h-11 w-11' }) {
    return (
        <div
            className={`flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#41E7C7] to-[#0EB38A] shadow-[0_0_22px_rgba(65,231,199,0.18),inset_0_1px_0_rgba(255,255,255,0.28)] ring-1 ring-white/15 ${className}`}
            aria-hidden
        >
            <svg className="h-[56%] w-[56%] text-[#07131A]" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="13" width="4.5" height="7" rx="2" fill="currentColor" opacity="0.42" />
                <rect x="9.75" y="9" width="4.5" height="11" rx="2" fill="currentColor" opacity="0.72" />
                <rect x="15.5" y="4" width="4.5" height="16" rx="2" fill="currentColor" />
            </svg>
        </div>
    );
}

function IconGrid({ className }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
            <rect x="3" y="3" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <rect x="12" y="3" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <rect x="3" y="12" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <rect x="12" y="12" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
    );
}

function IconClipboard({ className }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
            <path
                d="M6 3.5H14L17 6.5V16C17 16.8284 16.3284 17.5 15.5 17.5H6.5C5.67157 17.5 5 16.8284 5 16V5C5 4.17157 5.67157 3.5 6.5 3.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
            />
            <path d="M8 9.5H12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M8 12.5H12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function IconChartBar({ className }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M4 16V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M10 16V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M16 16V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function IconUser({ className }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
            <circle cx="10" cy="6.5" r="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M4.5 17c.7-3 2.6-4.5 5.5-4.5s4.8 1.5 5.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function IconSearch({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.7" />
            <path d="M20 20l-4.2-4.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
    );
}

function IconSettings({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
                d="M12 15.2A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4Z"
                stroke="currentColor"
                strokeWidth="1.5"
            />
            <path
                d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a1.3 1.3 0 0 1 0 1.8l-1.1 1.1a1.3 1.3 0 0 1-1.8 0l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9v.3A1.3 1.3 0 0 1 13.7 22h-1.4a1.3 1.3 0 0 1-1.3-1.3v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a1.3 1.3 0 0 1-1.8 0l-1.1-1.1a1.3 1.3 0 0 1 0-1.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6h-.3A1.3 1.3 0 0 1 2 13.7v-1.4A1.3 1.3 0 0 1 3.3 11h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a1.3 1.3 0 0 1 0-1.8l1.1-1.1a1.3 1.3 0 0 1 1.8 0l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9v-.3A1.3 1.3 0 0 1 10.3 2h1.4A1.3 1.3 0 0 1 13 3.3v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a1.3 1.3 0 0 1 1.8 0l1.1 1.1a1.3 1.3 0 0 1 0 1.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6h.3a1.3 1.3 0 0 1 1.3 1.3v1.4a1.3 1.3 0 0 1-1.3 1.3h-.2a1 1 0 0 0-.9.6Z"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function IconBell({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
                d="M12 3C9.23858 3 7 5.23858 7 8V11.5L5 14H19L17 11.5V8C17 5.23858 14.7614 3 12 3Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
            <path d="M10 18C10 19.1046 10.8954 20 12 20C13.1046 20 14 19.1046 14 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

export default function AppDashboardLayout({ children, title, badge }) {
    const page = usePage();
    const { auth } = page.props;
    const path = (page.url.split('?')[0] || '/').replace(/\/$/, '') || '/';
    const user = auth?.user;
    const userName = user?.name ?? 'Utilisateur';
    const userRole = user?.role ?? 'user';
    const isAdmin = userRole === 'admin';

    const navItems = isAdmin
        ? [
              { href: '/admin', label: 'Dashboard admin', active: path === '/admin', icon: IconGrid },
              { href: '/profile', label: 'Profil', active: path === '/profile', icon: IconUser },
          ]
        : [
              { href: '/dashboard', label: 'Tableau de bord', active: path === '/dashboard', icon: IconGrid },
              { href: '/saisie-mensuelle', label: 'Saisie mensuelle', active: path === '/saisie-mensuelle', icon: IconClipboard },
              { href: '/dashboard_test/rapports', label: 'Rapports', active: path === '/dashboard_test/rapports', icon: IconChartBar },
          ];

    const searchPlaceholder = isAdmin
        ? 'Rechercher un client, un abonnement...'
        : 'Rechercher une periode, un KPI, une saisie...';

    return (
        <div className="flex h-screen w-full overflow-hidden bg-[#070C14] font-sans text-white antialiased">
            <Head title={title} />

            <aside className="relative hidden h-screen w-[262px] shrink-0 overflow-hidden border-r border-white/5 bg-[linear-gradient(180deg,#162537_0%,#101927_100%)] lg:flex lg:flex-col">
                <div className="border-b border-white/5 px-6 pb-6 pt-6">
                    <div className="flex items-center gap-3">
                        <LogoIcon />
                        <div>
                            <p className="text-2xl font-display font-bold tracking-tight text-white">
                                Mini CFO Digital
                            </p>
                            <p className="mt-1 text-sm text-zinc-400">Pilotage financier</p>
                        </div>
                    </div>
                </div>

                <div className="px-6 pt-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
                        Menu principal
                    </p>
                </div>

                <nav className="flex flex-1 flex-col gap-2 px-4 py-5">
                    {navItems.map((item) => {
                        const Icon = item.icon;

                        return (
                            <Link key={item.href} href={item.href} className={navItemClass(item.active)}>
                                <Icon className={navIconClass(item.active)} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-white/5 p-4">
                    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-sm font-bold uppercase text-white">
                                {userName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-white">{userName}</p>
                                <p className="truncate text-xs text-zinc-500">{isAdmin ? 'Admin' : 'Client'}</p>
                            </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                            <Link
                                href="/profile"
                                className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center text-xs font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white"
                            >
                                Profil
                            </Link>
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white"
                            >
                                Deconnexion
                            </Link>
                        </div>
                    </div>
                </div>
            </aside>

            <div className="relative flex min-w-0 flex-1 flex-col bg-[#0A1020]">
                <header className="relative flex shrink-0 items-center justify-between border-b border-white/5 bg-[radial-gradient(circle_at_top_left,_rgba(44,91,172,0.28)_0%,_rgba(18,28,48,0.96)_48%,_#0A1020_100%)] px-5 py-3.5 lg:px-8">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                        <div className="lg:hidden">
                            <LogoIcon className="h-10 w-10" />
                        </div>
                        <div className="hidden max-w-2xl flex-1 lg:block">
                            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                                <IconSearch className="h-5 w-5 shrink-0 text-zinc-500" />
                                <input
                                    type="text"
                                    placeholder={searchPlaceholder}
                                    className="w-full border-0 bg-transparent p-0 text-sm text-zinc-300 placeholder:text-zinc-500 focus:outline-none focus:ring-0"
                                />
                                <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-zinc-500">
                                    / 
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="ml-4 flex shrink-0 items-center gap-2 lg:gap-3">
                        {badge && (
                            <span className="hidden rounded-full border border-[#10B981]/25 bg-[#10B981]/10 px-3 py-1 text-xs font-medium text-[#6EE7B7] lg:inline-flex">
                                {badge}
                            </span>
                        )}
                        <button
                            type="button"
                            className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-zinc-400 transition hover:bg-white/10 hover:text-white"
                            aria-label="Parametres"
                        >
                            <IconSettings className="h-5 w-5" />
                        </button>
                        <button
                            type="button"
                            className="relative rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-zinc-400 transition hover:bg-white/10 hover:text-white"
                            aria-label="Notifications"
                        >
                            <IconBell className="h-5 w-5" />
                            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#3B82F6] shadow-[0_0_8px_rgba(59,130,246,0.85)]" />
                        </button>
                        <div className="hidden h-9 w-px bg-white/10 lg:block" />
                        <div className="hidden items-center gap-3 lg:flex">
                            <div className="text-right">
                                <p className="text-sm font-semibold text-white">{userName}</p>
                                <p className="text-xs text-zinc-500">{isAdmin ? 'Admin' : 'Client'}</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-sm font-bold uppercase text-white">
                                {userName.charAt(0)}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="relative flex-1 overflow-y-auto bg-[#0A1020]">
                    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
                        <div className="absolute left-[-12%] top-[-10%] h-[38rem] w-[38rem] rounded-full bg-[#0EA5E9]/10 blur-[140px]" />
                        <div className="absolute bottom-[-18%] right-[-8%] h-[30rem] w-[30rem] rounded-full bg-[#10B981]/10 blur-[140px]" />
                    </div>

                    <div className="relative z-[1] min-h-full px-5 py-6 lg:px-8 lg:py-8">
                        <div className="mx-auto max-w-[1600px]">{children}</div>
                    </div>
                </main>
            </div>
        </div>
    );
}
