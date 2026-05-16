import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';

const statusLabels = {
    active: 'Actif',
    trialing: 'Essai',
    past_due: 'En retard',
    canceled: 'Annule',
    inactive: 'Inactif',
};

const statusStyles = {
    active: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
    trialing: 'border-sky-400/30 bg-sky-400/10 text-sky-200',
    past_due: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
    canceled: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
    inactive: 'border-slate-400/20 bg-slate-400/10 text-slate-300',
};

const statCards = [
    ['Utilisateurs', 'total_users', 'Comptes inscrits', 'cyan'],
    ['Abonnements valides', 'active_subscriptions', 'Acces actifs', 'emerald'],
    ['MRR', 'mrr', 'Revenu mensuel', 'violet'],
];

const auditLabels = {
    suspend: 'a suspendu',
    restore: 'a reactive',
};

const statAccentStyles = {
    cyan: {
        glow: 'from-cyan-400/20 via-cyan-400/8 to-transparent',
        text: 'text-cyan-300',
    },
    emerald: {
        glow: 'from-emerald-400/20 via-emerald-400/8 to-transparent',
        text: 'text-emerald-300',
    },
    violet: {
        glow: 'from-violet-400/18 via-violet-400/6 to-transparent',
        text: 'text-violet-300',
    },
};

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

        router.patch(route('admin.users.suspend', user.id), {}, {
            preserveScroll: true,
        });
    };

    const restoreUser = (user) => {
        if (!window.confirm(`Reactiver le compte de ${user.name} ?`)) {
            return;
        }

        router.patch(route('admin.users.restore', user.id), {}, {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold tracking-tight text-white">
                        Tableau de bord admin
                    </h2>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-400">
                        Administration
                    </span>
                </div>
            }
        >
            <Head title="Administration" />

            <div className="relative -mx-4 -my-6 min-h-[calc(100vh-5rem)] overflow-hidden px-4 py-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background:
                            'linear-gradient(115deg, rgba(20,184,166,0.28) 0%, rgba(15,118,110,0.14) 19%, transparent 45%), radial-gradient(circle at 78% 24%, rgba(59,130,246,0.10), transparent 36%)',
                    }}
                />
                <div className="pointer-events-none absolute -left-44 top-10 h-96 w-96 rounded-full bg-emerald-500/14 blur-[130px]" />

                <div className="relative z-10 mx-auto max-w-7xl space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                        {statCards.map(([label, key, helper, accent]) => {
                            const accentStyle = statAccentStyles[accent];

                            return (
                            <div
                                key={key}
                                className="group relative min-h-[8.5rem] overflow-hidden rounded-[1.45rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_22px_70px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:-translate-y-0.5 hover:border-emerald-400/25"
                            >
                                <div
                                    className={`pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-r ${accentStyle.glow}`}
                                    aria-hidden
                                />
                                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                                    {label}
                                </p>
                                <p className="mt-3 text-[2.1rem] font-bold leading-none text-white">
                                    {key === 'mrr'
                                        ? formatCurrency(stats[key])
                                        : stats[key]}
                                </p>
                                <p className="mt-2 text-sm text-slate-500">
                                    {helper}
                                </p>
                            </div>
                        )})}
                    </div>

                    <div className="overflow-hidden rounded-[1.65rem] border border-white/10 bg-white/[0.045] shadow-[0_22px_70px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(255,255,255,0.06)]">
                        <div className="border-b border-white/10 px-6 py-5">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <h3 className="text-lg font-bold text-white">
                                    Comptes utilisateurs
                                </h3>
                                <span className="rounded-xl border border-white/10 bg-white/[0.08] px-3 py-1.5 text-xs font-semibold text-slate-300">
                                    Liste admin
                                </span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-white/10">
                                <thead className="bg-white/[0.03]">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                            Utilisateur
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                            Role
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                            Statut Stripe
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                            Offre
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                            Montant
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                            Suspendu
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {users.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="transition hover:bg-white/[0.03]"
                                        >
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <p className="text-sm font-medium text-white">
                                                    {user.name}
                                                </p>
                                                <p className="text-sm text-slate-400">
                                                    {user.email}
                                                </p>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-300">
                                                {user.role}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <span
                                                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                                                        statusStyles[
                                                            user.stripe_status
                                                        ] ??
                                                        'border-slate-400/20 bg-slate-400/10 text-slate-300'
                                                    }`}
                                                >
                                                    {statusLabels[
                                                        user.stripe_status
                                                    ] ?? user.stripe_status}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-300">
                                                {user.stripe_price_id ?? 'Aucune'}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-300">
                                                {user.subscription_amount
                                                    ? formatCurrency(
                                                          user.subscription_amount,
                                                      )
                                                    : '0,00 EUR'}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-300">
                                                {formatDate(user.suspended_at)}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-right">
                                                {auth.user.id === user.id ? (
                                                    <span className="text-xs font-medium text-slate-500">
                                                        Votre compte
                                                    </span>
                                                ) : user.suspended_at ? (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            restoreUser(user)
                                                        }
                                                        className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-400/20 hover:shadow-[0_0_24px_rgba(16,185,129,0.2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40"
                                                    >
                                                        Reactiver
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            suspendUser(user)
                                                        }
                                                        className="rounded-full border border-rose-400/30 bg-rose-400/10 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-400/20 hover:shadow-[0_0_24px_rgba(244,63,94,0.16)] focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40"
                                                    >
                                                        Suspendre
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-[1.65rem] border border-white/10 bg-white/[0.045] shadow-[0_22px_70px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(255,255,255,0.06)]">
                        <div className="border-b border-white/10 px-6 py-5">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <h3 className="text-lg font-bold text-white">
                                    Dernieres actions admin
                                </h3>
                                <span className="rounded-xl border border-white/10 bg-white/[0.08] px-3 py-1.5 text-xs font-semibold text-slate-300">
                                    Journal
                                </span>
                            </div>
                        </div>

                        <div className="divide-y divide-white/10">
                            {auditLogs.length === 0 ? (
                                <p className="px-6 py-5 text-sm text-slate-400">
                                    Aucune action admin enregistree pour le moment.
                                </p>
                            ) : (
                                auditLogs.map((log) => (
                                    <div
                                        key={log.id}
                                        className="flex flex-col gap-1 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <p className="text-sm text-slate-300">
                                            <span className="font-semibold text-white">
                                                {log.admin?.name ?? 'Admin'}
                                            </span>{' '}
                                            {auditLabels[log.action] ??
                                                log.action}{' '}
                                            <span className="font-semibold text-white">
                                                {log.target_user?.name ??
                                                    'Utilisateur'}
                                            </span>
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {formatDate(log.created_at)}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
