import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';

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

export default function AdminDashboard() {
    const { stats, users } = usePage().props;

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
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
