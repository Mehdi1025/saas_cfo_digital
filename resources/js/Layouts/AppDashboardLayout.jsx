import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

function navItemClass(active) {
    return active
        ? 'flex items-center gap-3 rounded-xl border border-white/5 border-l-4 border-l-[#10B981] bg-[#10B981]/15 py-2.5 pl-2.5 pr-3 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm'
        : 'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white';
}

function navIconClass(active) {
    return active ? 'h-5 w-5 shrink-0 text-white' : 'h-5 w-5 shrink-0 text-zinc-400';
}

function LogoIcon({ className = 'h-10 w-10' }) {
    return (
        <div
            className={`flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#10B981] to-[#059669] shadow-[0_0_22px_rgba(16,185,129,0.32),inset_0_1px_0_rgba(255,255,255,0.28)] ring-1 ring-white/20 ${className}`}
            aria-hidden
        >
            <svg className="h-[56%] w-[56%] text-white" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="13" width="4.5" height="7" rx="2" fill="currentColor" opacity="0.38" />
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

function IconUser({ className }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
            <circle cx="10" cy="6.5" r="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M4.5 17c.7-3 2.6-4.5 5.5-4.5s4.8 1.5 5.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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

function IconSettings({ className }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
            <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 3v1.5M10 15.5V17M3 10h1.5M15.5 10H17M5.05 5.05l1.06 1.06M13.89 13.89l1.06 1.06M5.05 14.95l1.06-1.06M13.89 6.11l1.06-1.06" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function IconFile({ className }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M6 3.5h5.5L15 7v9.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11.5 3.5V7H15" stroke="currentColor" strokeWidth="1.5" />
        </svg>
    );
}

function IconFilePlus({ className }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M6 3.5h5.5L15 7v9.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 9.5v4M8 11.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function IconUsers({ className }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
            <circle cx="7.5" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3.5 16c.5-2.2 2-3.5 4-3.5s3.5 1.3 4 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="13.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 14.5c1.2-.2 2.4.5 3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function IconCube({ className }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M10 3.5 16 7v6l-6 3.5L4 13V7l6-3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M10 10 16 7M10 10V16.5M10 10 4 7" stroke="currentColor" strokeWidth="1.5" />
        </svg>
    );
}

function IconInbox({ className }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
            <path
                d="M3.5 5.5A2 2 0 0 1 5.5 3.5h9A2 2 0 0 1 16.5 5.5V14.5A2 2 0 0 1 14.5 16.5H5.5A2 2 0 0 1 3.5 14.5V5.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
            />
            <path d="M3.5 8.5h3l1 2h5l1-2h3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
    );
}

function IconBanknotes({ className }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
            <rect x="2.5" y="5.5" width="15" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="10" cy="10" r="2" stroke="currentColor" strokeWidth="1.5" />
        </svg>
    );
}

function IconChart({ className }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M4 15V9M8 15V6M12 15v-4M16 15V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function NavSectionLabel({ children }) {
    return (
        <p className="mb-2 mt-4 px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 first:mt-0">
            {children}
        </p>
    );
}

function pathMatches(path, href, exact = false) {
    if (exact) {
        return path === href;
    }

    return path === href || path.startsWith(`${href}/`);
}

function IconSparkles({ className }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path d="M9.2 12.5a1.2 1.2 0 0 0-1-1.04l-3.7-.95a.3.3 0 0 1 0-.58l3.7-.95a1.2 1.2 0 0 0 1-1.04l.95-3.7a.3.3 0 0 1 .58 0l.95 3.7a1.2 1.2 0 0 0 1 1.04l3.7.95a.3.3 0 0 1 0 .58l-3.7.95a1.2 1.2 0 0 0-1 1.04l-.95 3.7a.3.3 0 0 1-.58 0l-.95-3.7Z" />
        </svg>
    );
}

function IconMenu({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
}

function IconClose({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
}

function SidebarContent({ navSections, onNavigate }) {
    return (
        <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
            <div className="border-b border-white/5 px-5 pb-5 pt-6">
                <div className="flex items-center gap-3">
                    <LogoIcon />
                    <span className="truncate text-xl font-display font-bold tracking-tight text-white">
                        Copifi
                    </span>
                </div>
            </div>

            <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-5">
                {navSections.map((section) => (
                    <div key={section.label}>
                        <NavSectionLabel>{section.label}</NavSectionLabel>
                        <div className="flex flex-col gap-1.5">
                            {section.items.map((item) => {
                                const Icon = item.icon;
                                const [itemPath, itemHash] = item.href.split('#');
                                const isHashLink = Boolean(itemHash);

                                const handleHashClick = (event) => {
                                    onNavigate?.();
                                    const currentPath = (window.location.pathname || '/').replace(/\/$/, '') || '/';
                                    const normalizedItemPath = (itemPath || '/').replace(/\/$/, '') || '/';

                                    if (currentPath === normalizedItemPath) {
                                        event.preventDefault();
                                        const target = document.getElementById(itemHash);
                                        if (target) {
                                            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                            window.history.replaceState(null, '', item.href);
                                        }
                                    }
                                };

                                if (isHashLink) {
                                    return (
                                        <a
                                            key={item.href}
                                            href={item.href}
                                            className={navItemClass(item.active)}
                                            onClick={handleHashClick}
                                        >
                                            <Icon className={navIconClass(item.active)} />
                                            {item.label}
                                        </a>
                                    );
                                }

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={navItemClass(item.active)}
                                        onClick={onNavigate}
                                    >
                                        <Icon className={navIconClass(item.active)} />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>
        </div>
    );
}

const headerChromeClass = 'bg-[radial-gradient(ellipse_at_top_left,_rgba(17,83,77,0.42)_0%,_#050505_62%)]';

export default function AppDashboardLayout({ children, title, badge }) {
    const { auth } = usePage().props;
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const path = (usePage().url.split('?')[0] || '/').replace(/\/$/, '') || '/';
    const user = auth?.user;
    const userName = user?.name ?? 'Utilisateur';
    const userRole = user?.role ?? 'user';
    const isAdmin = userRole === 'admin';
    const headerBadge = badge ?? (isAdmin ? 'Espace admin' : 'Abonnement : actif');

    const navSections = isAdmin
        ? [
              {
                  label: 'Administration',
                  items: [
                      { href: '/admin', label: 'Admin', active: path === '/admin', icon: IconGrid },
                      { href: '/profile', label: 'Profil', active: path === '/profile', icon: IconUser },
                  ],
              },
          ]
        : [
              {
                  label: 'Pilotage',
                  items: [
                      { href: '/dashboard', label: 'Tableau de bord', active: path === '/dashboard', icon: IconGrid },
                      { href: '/copilote', label: 'Copilote IA', active: path === '/copilote', icon: IconSparkles },
                      { href: '/saisie-mensuelle', label: 'Saisie mensuelle', active: path === '/saisie-mensuelle', icon: IconClipboard },
                  ],
              },
              {
                  label: 'Facturation',
                  items: [
                      { href: '/facturation', label: 'Vue facturation', active: path === '/facturation', icon: IconChart },
                      { href: '/factures', label: 'Liste des factures', active: pathMatches(path, '/factures', true) || (path.startsWith('/factures/') && path !== '/factures/nouveau'), icon: IconFile },
                      { href: '/factures/nouveau', label: 'Création de facture', active: path === '/factures/nouveau', icon: IconFilePlus },
                      { href: '/devis', label: 'Liste des devis', active: pathMatches(path, '/devis', true) || (path.startsWith('/devis/') && path !== '/devis/nouveau'), icon: IconClipboard },
                      { href: '/devis/nouveau', label: 'Création de devis', active: path === '/devis/nouveau', icon: IconFilePlus },
                      { href: '/achats/factures-fournisseurs', label: 'Factures fournisseurs', active: pathMatches(path, '/achats/factures-fournisseurs'), icon: IconInbox },
                      { href: '/clients', label: 'Gestion des clients', active: pathMatches(path, '/clients'), icon: IconUsers },
                      { href: '/catalogue', label: 'Catalogue produits', active: pathMatches(path, '/catalogue'), icon: IconCube },
                      { href: '/paiements', label: 'Suivi des paiements', active: pathMatches(path, '/paiements'), icon: IconBanknotes },
                      { href: '/parametres', label: 'Paramètres', active: path === '/parametres', icon: IconSettings },
                  ],
              },
              {
                  label: 'Compte',
                  items: [
                      { href: '/profile', label: 'Profil', active: path === '/profile', icon: IconUser },
                  ],
              },
          ];

    return (
        <div className="flex h-screen w-full overflow-hidden bg-[#050505] font-sans text-white antialiased">
            <Head title={title} />

            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        aria-label="Fermer le menu"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    <aside className="relative flex h-full w-72 max-w-[86vw] shrink-0 flex-col overflow-hidden border-r border-white/5 bg-[radial-gradient(ellipse_at_top_left,_rgba(17,83,77,0.4)_0%,_#050505_72%)] shadow-2xl">
                        <button
                            type="button"
                            className="absolute right-4 top-5 z-10 rounded-lg border border-white/10 bg-white/5 p-2 text-zinc-300 transition hover:bg-white/10 hover:text-white"
                            aria-label="Fermer le menu"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <IconClose className="h-5 w-5" />
                        </button>
                        <SidebarContent
                            navSections={navSections}
                            onNavigate={() => setIsMobileMenuOpen(false)}
                        />
                    </aside>
                </div>
            )}

            <aside className="relative hidden h-screen w-64 shrink-0 flex-col overflow-hidden border-r border-white/5 bg-[radial-gradient(ellipse_at_top_left,_rgba(17,83,77,0.4)_0%,_#050505_72%)] lg:flex">
                <SidebarContent navSections={navSections} />
            </aside>

            <div className="relative flex min-w-0 flex-1 flex-col">
                <header
                    className={`flex shrink-0 flex-col gap-4 border-b border-white/5 px-4 pb-5 pt-6 sm:px-5 lg:flex-row lg:items-center lg:justify-between lg:pr-8 ${headerChromeClass}`}
                >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <button
                            type="button"
                            className="relative z-20 shrink-0 rounded-lg border border-white/10 bg-white/5 p-2 text-zinc-300 transition hover:bg-white/10 hover:text-white lg:hidden"
                            aria-label="Ouvrir le menu"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <IconMenu className="h-5 w-5" />
                        </button>
                        <h1 className="min-w-0 truncate text-xl font-display font-bold leading-tight tracking-tight text-white sm:text-2xl">
                            {title}
                        </h1>
                        <span className="hidden shrink-0 rounded-full border border-[#10B981]/25 bg-[#10B981]/10 px-3 py-1 text-xs font-medium leading-none text-[#5eead4] sm:inline-flex">
                            {headerBadge}
                        </span>
                    </div>

                    <div className="flex w-full shrink-0 flex-wrap items-center justify-between gap-3 lg:w-auto lg:justify-end lg:gap-4">
                        <div className="flex items-center gap-2 rounded-full border border-[#10B981]/35 bg-[#10B981]/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white">
                            <span
                                className="h-2 w-2 shrink-0 rounded-full bg-[#10B981] shadow-[0_0_10px_rgba(16,185,129,0.95)]"
                                aria-hidden
                            />
                            {isAdmin ? 'Admin' : 'Abonnement : actif'}
                        </div>

                        <button
                            type="button"
                            className="relative rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
                            aria-label="Notifications"
                        >
                            <IconBell className="h-5 w-5" />
                            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.85)] ring-2 ring-[#09231F]" />
                        </button>

                        <span className="inline-block h-10 w-px shrink-0 self-center bg-white/10" aria-hidden />

                        <div className="flex items-center gap-3">
                            <div className="text-right leading-none">
                                <p className="text-sm font-bold leading-tight text-white">{userName}</p>
                                <p className="mt-0.5 text-xs lowercase leading-tight text-zinc-500">{userRole}</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-bold uppercase text-white">
                                {userName.charAt(0)}
                            </div>
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-300 transition hover:bg-white/10 hover:text-white"
                            >
                                Deconnexion
                            </Link>
                        </div>
                    </div>
                </header>

                <main className="relative flex-1 overflow-y-auto bg-obsidian p-8 [contain:layout]">
                    <div className="relative z-[1]">{children}</div>
                </main>
            </div>
        </div>
    );
}
