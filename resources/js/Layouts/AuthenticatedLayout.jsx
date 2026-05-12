import ApplicationLogo from '@/Components/ApplicationLogo';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);

    const dashboardRoute =
        user.role === 'admin' ? route('admin.dashboard') : route('dashboard');
    const dashboardLabel = user.role === 'admin' ? 'Admin' : 'Tableau de bord';

    return (
        <div className="min-h-screen bg-[#0b1220] text-slate-100">
            <div className="flex min-h-screen">
                <aside className="hidden w-72 shrink-0 border-r border-white/5 bg-[#111a2b] lg:flex lg:flex-col">
                    <div className="border-b border-white/5 px-6 py-6">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="rounded-xl bg-cyan-400/10 p-2 text-cyan-300">
                                <ApplicationLogo className="h-8 w-auto fill-current" />
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-white">
                                    Mini CFO Digital
                                </p>
                                <p className="text-sm text-slate-400">
                                    Pilotage financier
                                </p>
                            </div>
                        </Link>
                    </div>

                    <nav className="flex-1 px-5 py-6">
                        <p className="px-3 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                            Menu principal
                        </p>

                        <div className="mt-4 space-y-2">
                            <Link
                                href={dashboardRoute}
                                className="block rounded-2xl bg-indigo-500/90 px-4 py-3 text-sm font-medium text-white shadow-[0_12px_30px_rgba(79,70,229,0.25)]"
                            >
                                {dashboardLabel}
                            </Link>

                            <Link
                                href={route('profile.edit')}
                                className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
                            >
                                Profil
                            </Link>
                        </div>
                    </nav>

                    <div className="border-t border-white/5 px-5 py-5">
                        <div className="rounded-2xl bg-white/[0.04] p-4">
                            <p className="text-sm font-semibold text-white">
                                {user.name}
                            </p>
                            <p className="mt-1 text-sm text-slate-400">
                                {user.email}
                            </p>

                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="mt-4 w-full rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/5"
                            >
                                Se deconnecter
                            </Link>
                        </div>
                    </div>
                </aside>

                <div className="flex min-h-screen flex-1 flex-col">
                    <div className="border-b border-white/5 bg-[#0f1728] lg:hidden">
                        <div className="flex items-center justify-between px-4 py-4 sm:px-6">
                            <Link href="/" className="flex items-center gap-3">
                                <div className="rounded-xl bg-cyan-400/10 p-2 text-cyan-300">
                                    <ApplicationLogo className="h-7 w-auto fill-current" />
                                </div>
                                <span className="text-base font-semibold text-white">
                                    Mini CFO Digital
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
                                ' border-t border-white/5 bg-[#111a2b]'
                            }
                        >
                            <div className="space-y-1 px-4 pb-4 pt-4">
                                <ResponsiveNavLink
                                    href={dashboardRoute}
                                    active={route().current(
                                        user.role === 'admin'
                                            ? 'admin.dashboard'
                                            : 'dashboard',
                                    )}
                                >
                                    {dashboardLabel}
                                </ResponsiveNavLink>

                                <ResponsiveNavLink href={route('profile.edit')}>
                                    Profil
                                </ResponsiveNavLink>

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

                    <header className="border-b border-white/5 bg-[#0f1728]">
                        <div className="flex items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
                            <div>
                                {header ?? (
                                    <h2 className="text-xl font-semibold text-white">
                                        Tableau de bord
                                    </h2>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="hidden rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-2 text-sm text-slate-400 md:block">
                                    {user.role === 'admin'
                                        ? 'Espace administration'
                                        : 'Suivi financier mensuel'}
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/90 text-sm font-semibold text-white">
                                    {user.name.charAt(0).toUpperCase()}
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
