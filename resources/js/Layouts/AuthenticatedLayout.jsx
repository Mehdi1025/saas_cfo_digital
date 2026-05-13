import ApplicationLogo from '@/Components/ApplicationLogo';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

function LayoutNavIcon({ type }) {
    if (type === 'dashboard') {
        return (
            <svg
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <rect x="3" y="3" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                <rect x="12" y="3" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                <rect x="3" y="12" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                <rect x="12" y="12" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
        );
    }

    if (type === 'entry') {
        return (
            <svg
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
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

    if (type === 'profile') {
        return (
            <svg
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M10 10.5C12.0711 10.5 13.75 8.82107 13.75 6.75C13.75 4.67893 12.0711 3 10 3C7.92893 3 6.25 4.67893 6.25 6.75C6.25 8.82107 7.92893 10.5 10 10.5Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                />
                <path
                    d="M4.5 16.5C5.52158 14.4958 7.60346 13.125 10 13.125C12.3965 13.125 14.4784 14.4958 15.5 16.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                />
            </svg>
        );
    }

    return null;
}

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);

    const isAdmin = user.role === 'admin';
    const isActiveSubscriber = ['active', 'trialing'].includes(
        user.stripe_status ?? '',
    );

    const navItems = isAdmin
        ? [
              {
                  href: route('admin.dashboard'),
                  label: 'Admin',
                  active: route().current('admin.dashboard'),
                  icon: 'dashboard',
              },
              {
                  href: route('profile.edit'),
                  label: 'Profil',
                  active: route().current('profile.edit'),
                  icon: 'profile',
              },
          ]
        : [
              {
                  href: route('dashboard'),
                  label: 'Tableau de bord',
                  active: route().current('dashboard'),
                  icon: 'dashboard',
              },
              {
                  href: route('financial-entry.index'),
                  label: 'Saisie mensuelle',
                  active: route().current('financial-entry.index'),
                  icon: 'entry',
              },
              {
                  href: route('profile.edit'),
                  label: 'Profil',
                  active: route().current('profile.edit'),
                  icon: 'profile',
              },
          ];

    const desktopNavItemClasses = (active) =>
        active
            ? 'flex items-center gap-3 rounded-2xl border border-white/8 bg-gradient-to-r from-[#4e6573] via-[#315b67] to-[#2b4f59] px-4 py-3 text-sm font-medium text-white shadow-[0_16px_30px_rgba(23,190,159,0.16)]'
            : 'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white';

    const topBadge = isAdmin
        ? 'ESPACE ADMIN'
        : isActiveSubscriber
          ? 'ABONNEMENT : ACTIF'
          : 'ABONNEMENT : INACTIF';

    const topBadgeClasses = isAdmin
        ? 'border-white/10 bg-white/[0.04] text-slate-300'
        : isActiveSubscriber
          ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.08)]'
          : 'border-amber-400/20 bg-amber-500/10 text-amber-300';

    return (
        <div className="relative min-h-screen bg-[#090e15] text-slate-100">
            <div
                className="pointer-events-none fixed inset-0 -z-50 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.20),_transparent_18%),linear-gradient(180deg,_#173b39_0%,_#0f1722_12%,_#0a0d14_30%,_#090b11_100%)]"
                aria-hidden
            />

            <div className="flex min-h-screen">
                <aside className="hidden w-60 shrink-0 border-r border-white/6 bg-[linear-gradient(180deg,rgba(22,121,112,0.20),rgba(11,22,31,0.96)_18%,rgba(9,12,18,0.99)_100%)] lg:flex lg:flex-col">
                    <div className="border-b border-white/6 px-6 py-5">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="rounded-2xl bg-[#18f1bd]/14 p-2 text-[#45f5cd]">
                                <ApplicationLogo className="h-8 w-auto fill-current" />
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-white">
                                    Mini CFO
                                </p>
                                <p className="text-sm text-slate-400">
                                    Pilotage financier
                                </p>
                            </div>
                        </Link>
                    </div>

                    <nav className="flex-1 px-4 py-6">
                        <p className="px-3 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                            Menu principal
                        </p>

                        <div className="mt-4 space-y-2">
                            {navItems.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={desktopNavItemClasses(item.active)}
                                >
                                    <LayoutNavIcon type={item.icon} />
                                    <span>{item.label}</span>
                                </Link>
                            ))}
                        </div>
                    </nav>

                    <div className="border-t border-white/6 px-4 py-5">
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
                        >
                            <svg
                                className="h-4 w-4"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M7.5 5.83333V4.83333C7.5 4.28105 7.94772 3.83333 8.5 3.83333H14.1667C14.7189 3.83333 15.1667 4.28105 15.1667 4.83333V15.1667C15.1667 15.7189 14.7189 16.1667 14.1667 16.1667H8.5C7.94772 16.1667 7.5 15.7189 7.5 15.1667V14.1667"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                />
                                <path
                                    d="M11.6667 10H3.75M3.75 10L6.66667 7.08333M3.75 10L6.66667 12.9167"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            <span>Se deconnecter</span>
                        </Link>
                    </div>
                </aside>

                <div className="flex min-h-screen flex-1 flex-col">
                    <div className="border-b border-white/6 bg-[#0d1522] lg:hidden">
                        <div className="flex items-center justify-between px-4 py-4 sm:px-6">
                            <Link href="/" className="flex items-center gap-3">
                                <div className="rounded-xl bg-[#18f1bd]/14 p-2 text-[#45f5cd]">
                                    <ApplicationLogo className="h-7 w-auto fill-current" />
                                </div>
                                <span className="text-base font-semibold text-white">
                                    Mini CFO
                                </span>
                            </Link>

                            <button
                                onClick={() =>
                                    setShowingNavigationDropdown(
                                        (previousState) => !previousState,
                                    )
                                }
                                className="inline-flex items-center justify-center rounded-xl border border-white/10 p-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
                            >
                                <svg
                                    className="h-6 w-6"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        className={
                                            !showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={
                                            showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        <div
                            className={
                                (showingNavigationDropdown ? 'block' : 'hidden') +
                                ' border-t border-white/6 bg-[#111a2b]'
                            }
                        >
                            <div className="space-y-1 px-4 pb-4 pt-4">
                                {navItems.map((item) => (
                                    <ResponsiveNavLink
                                        key={item.label}
                                        href={item.href}
                                        active={item.active}
                                    >
                                        {item.label}
                                    </ResponsiveNavLink>
                                ))}

                                <ResponsiveNavLink
                                    method="post"
                                    href={route('logout')}
                                    as="button"
                                >
                                    Se deconnecter
                                </ResponsiveNavLink>
                            </div>
                        </div>
                    </div>

                    <header className="border-b border-white/6 bg-[#0f1724]/96 backdrop-blur">
                        <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                            <div className="min-w-0">{header}</div>

                            <div className="flex items-center gap-3 pl-4">
                                <div
                                    className={`hidden rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] md:block ${topBadgeClasses}`}
                                >
                                    {topBadge}
                                </div>

                                <button
                                    type="button"
                                    className="hidden h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-slate-300 transition hover:bg-white/6 hover:text-white md:inline-flex"
                                >
                                    <svg
                                        className="h-4 w-4"
                                        viewBox="0 0 20 20"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M10 4.16667C7.69881 4.16667 5.83333 6.03215 5.83333 8.33333V10.3447C5.83333 10.7728 5.65971 11.1827 5.35106 11.4854L4.58333 12.2385V13.3333H15.4167V12.2385L14.6489 11.4854C14.3403 11.1827 14.1667 10.7728 14.1667 10.3447V8.33333C14.1667 6.03215 12.3012 4.16667 10 4.16667Z"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M8.33333 15.4167C8.33333 16.3371 9.07953 17.0833 10 17.0833C10.9205 17.0833 11.6667 16.3371 11.6667 15.4167"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </button>

                                <div className="hidden h-10 w-px bg-white/8 md:block" />

                                <div className="hidden items-center gap-3 md:flex">
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-white">
                                            {user.name}
                                        </p>
                                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                                            {isAdmin ? 'Admin' : 'CFO'}
                                        </p>
                                    </div>
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-semibold text-white">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
