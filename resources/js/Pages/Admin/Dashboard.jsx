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
    ['Utilisateurs', 'total_users'],
    ['Abonnements valides', 'active_subscriptions'],
    ['MRR', 'mrr'],
];

const auditLabels = {
    suspend: 'a suspendu',
    restore: 'a reactive',
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
                <h2 className="text-xl font-semibold leading-tight text-slate-100">
                    Administration
                </h2>
            }
        >
            <Head title="Administration" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <div className="grid gap-4 md:grid-cols-3">
                        {statCards.map(([label, key]) => (
                            <div
                                key={key}
                                className="rounded-xl border border-white/10 bg-slate-950/70 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.28)]"
                            >
                                <p className="text-sm font-medium text-slate-400">
                                    {label}
                                </p>
                                <p className="mt-3 text-3xl font-bold text-white">
                                    {key === 'mrr'
                                        ? formatCurrency(stats[key])
                                        : stats[key]}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70 shadow-[0_18px_45px_rgba(0,0,0,0.28)]">
                        <div className="border-b border-white/10 px-6 py-5">
                            <h3 className="text-lg font-semibold text-white">
                                Comptes utilisateurs
                            </h3>
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
                                                        className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-400/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40"
                                                    >
                                                        Reactiver
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            suspendUser(user)
                                                        }
                                                        className="rounded-full border border-rose-400/30 bg-rose-400/10 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-400/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40"
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

                    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70 shadow-[0_18px_45px_rgba(0,0,0,0.28)]">
                        <div className="border-b border-white/10 px-6 py-5">
                            <h3 className="text-lg font-semibold text-white">
                                Dernieres actions admin
                            </h3>
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
