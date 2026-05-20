import AppDashboardLayout from '@/Layouts/AppDashboardLayout';
import { Link, router, usePage } from '@inertiajs/react';

const GLASS_PANEL =
    'border border-glassBorder bg-[linear-gradient(145deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.01)_100%)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-[20px]';

const statusLabels = {
    active: 'Actif',
    trialing: 'Essai',
    past_due: 'En retard',
    canceled: 'Annule',
    inactive: 'Inactif',
};

const statusStyles = {
    active: 'border-neonMint/30 bg-neonMint/10 text-neonMint',
    trialing: 'border-neonBlue/30 bg-neonBlue/10 text-neonBlue',
    past_due: 'border-[#FF8A00]/30 bg-[#FF8A00]/10 text-[#FF8A00]',
    canceled: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
    inactive: 'border-white/10 bg-white/5 text-gray-300',
};

const statCards = [
    ['Utilisateurs', 'total_users', 'Comptes inscrits'],
    ['Abonnements valides', 'active_subscriptions', 'Acces actifs'],
    ['MRR', 'mrr', 'Revenu mensuel'],
];

const auditLabels = {
    suspend: 'a suspendu',
    restore: 'a reactive',
};

function LogoIcon() {
    return (
        <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#10B981] to-[#059669] shadow-[0_0_22px_rgba(16,185,129,0.32),inset_0_1px_0_rgba(255,255,255,0.28)] ring-1 ring-white/20"
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
                d="M12 3C9.24 3 7 5.24 7 8v3.5L5 14h14l-2-2.5V8c0-2.76-2.24-5-5-5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
            <path d="M10 18c0 1.1.9 2 2 2s2-.9 2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function navClass(active) {
    return active
        ? 'flex items-center gap-3 rounded-xl border border-white/5 border-l-4 border-l-[#10B981] bg-[#10B981]/15 py-2.5 pl-2.5 pr-3 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm'
        : 'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white';
}

export default function AdminDashboard() {
    const { auth, stats, users, auditLogs } = usePage().props;

    const formatCurrency = (value) =>
        new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
        }).format(Number(value ?? 0));

    const formatDate = (value) =>
        value
            ? new Intl.DateTimeFormat('fr-FR', {
                  dateStyle: 'medium',
              }).format(new Date(value))
            : 'Non';

    const suspendUser = (user) => {
        if (!window.confirm(`Suspendre le compte de ${user.name} ?`)) {
            return;
        }

        router.patch(route('admin.users.suspend', user.id), {}, { preserveScroll: true });
    };

    const restoreUser = (user) => {
        if (!window.confirm(`Reactiver le compte de ${user.name} ?`)) {
            return;
        }

        router.patch(route('admin.users.restore', user.id), {}, { preserveScroll: true });
    };

    const canViewDashboard = (user) => user.role !== 'admin';

    return (
        <AppDashboardLayout title="Administration">
            <div className="selection:bg-neonBlue selection:text-obsidian relative -m-8 min-h-full bg-obsidian bg-neon-gradient px-8 pb-8 pt-8 font-display">
                <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                    <div className="absolute left-[-10%] top-[-20%] h-[50%] w-[50%] rounded-full bg-neonBlue/20 blur-[150px]" />
                    <div className="absolute bottom-[-20%] right-[-10%] h-[40%] w-[40%] rounded-full bg-neonMint/10 blur-[120px]" />
                </div>

                <div className="relative z-0 mx-auto max-w-[1600px] space-y-8">
                            <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                {statCards.map(([label, key, helper]) => (
                                    <div
                                        key={key}
                                        className={`${GLASS_PANEL} group relative overflow-hidden rounded-2xl p-6 transition-colors duration-500 hover:border-neonMint/30`}
                                    >
                                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-r from-[#00F0FF]/12 via-[#00FF9D]/8 to-transparent" />
                                        <div className="relative z-10">
                                            <h3 className="mb-1 text-sm font-medium uppercase tracking-wider text-gray-400">
                                                {label}
                                            </h3>
                                            <p className="text-4xl font-bold tracking-tighter text-white">
                                                {key === 'mrr' ? formatCurrency(stats[key]) : stats[key]}
                                            </p>
                                            <p className="mt-3 text-sm text-gray-400">{helper}</p>
                                        </div>
                                    </div>
                                ))}
                            </section>

                            <section className={`${GLASS_PANEL} overflow-hidden rounded-3xl`}>
                                <div className="border-b border-glassBorder px-6 py-5">
                                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h2 className="text-lg font-semibold tracking-wide text-white">
                                                Comptes utilisateurs
                                            </h2>
                                            <p className="mt-1 text-sm text-gray-400">
                                                Gestion des abonnements et suspensions.
                                            </p>
                                        </div>
                                        <span className="rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white">
                                            Liste admin
                                        </span>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-left">
                                        <thead>
                                            <tr className="border-b border-glassBorder">
                                                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Utilisateur</th>
                                                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Role</th>
                                                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Statut Stripe</th>
                                                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Offre</th>
                                                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Montant</th>
                                                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Suspendu</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-glassBorder text-sm">
                                            {users.map((user) => (
                                                <tr key={user.id} className="transition-colors hover:bg-white/5">
                                                    <td className="whitespace-nowrap px-6 py-4">
                                                        <p className="font-medium text-white">{user.name}</p>
                                                        <p className="text-gray-400">{user.email}</p>
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-gray-300">{user.role}</td>
                                                    <td className="whitespace-nowrap px-6 py-4">
                                                        <span
                                                            className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-medium ${
                                                                statusStyles[user.stripe_status] ??
                                                                'border-white/10 bg-white/5 text-gray-300'
                                                            }`}
                                                        >
                                                            {statusLabels[user.stripe_status] ?? user.stripe_status}
                                                        </span>
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-gray-300">
                                                        {user.stripe_price_id ?? 'Aucune'}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-gray-300">
                                                        {user.subscription_amount ? formatCurrency(user.subscription_amount) : '0,00 EUR'}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-gray-300">
                                                        {formatDate(user.suspended_at)}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-right">
                                                        {auth.user.id === user.id ? (
                                                            <span className="text-xs font-medium text-gray-500">Votre compte</span>
                                                        ) : (
                                                            <div className="flex justify-end gap-2">
                                                                {canViewDashboard(user) ? (
                                                                    <Link
                                                                        href={route('admin.users.dashboard', user.id)}
                                                                        className="rounded-lg border border-neonBlue/30 bg-neonBlue/10 px-3 py-1.5 text-xs font-semibold text-neonBlue transition hover:bg-neonBlue/20"
                                                                    >
                                                                        Voir dashboard
                                                                    </Link>
                                                                ) : (
                                                                    <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-500">
                                                                        Abonnement requis
                                                                    </span>
                                                                )}

                                                                {user.suspended_at ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => restoreUser(user)}
                                                                        className="rounded-lg border border-neonMint/30 bg-neonMint/10 px-3 py-1.5 text-xs font-semibold text-neonMint transition hover:bg-neonMint/20"
                                                                    >
                                                                        Reactiver
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => suspendUser(user)}
                                                                        className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-400/20"
                                                                    >
                                                                        Suspendre
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            <section className={`${GLASS_PANEL} overflow-hidden rounded-3xl`}>
                                <div className="border-b border-glassBorder px-6 py-5">
                                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h2 className="text-lg font-semibold tracking-wide text-white">
                                                Dernieres actions admin
                                            </h2>
                                            <p className="mt-1 text-sm text-gray-400">
                                                Journal des suspensions et reactivations.
                                            </p>
                                        </div>
                                        <span className="rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white">
                                            Journal
                                        </span>
                                    </div>
                                </div>

                                <div className="divide-y divide-glassBorder">
                                    {auditLogs.length === 0 ? (
                                        <p className="px-6 py-5 text-sm text-gray-400">
                                            Aucune action admin enregistree pour le moment.
                                        </p>
                                    ) : (
                                        auditLogs.map((log) => (
                                            <div
                                                key={log.id}
                                                className="flex flex-col gap-1 px-6 py-4 transition-colors hover:bg-white/5 sm:flex-row sm:items-center sm:justify-between"
                                            >
                                                <p className="text-sm text-gray-300">
                                                    <span className="font-semibold text-white">
                                                        {log.admin?.name ?? 'Admin'}
                                                    </span>{' '}
                                                    {auditLabels[log.action] ?? log.action}{' '}
                                                    <span className="font-semibold text-white">
                                                        {log.target_user?.name ?? 'Utilisateur'}
                                                    </span>
                                                </p>
                                                <p className="text-xs text-gray-500">{formatDate(log.created_at)}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>
                </div>
            </div>
        </AppDashboardLayout>
    );
}
