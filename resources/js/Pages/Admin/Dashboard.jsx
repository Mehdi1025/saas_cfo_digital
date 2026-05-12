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
    active: 'bg-green-100 text-green-800',
    trialing: 'bg-blue-100 text-blue-800',
    past_due: 'bg-amber-100 text-amber-800',
    canceled: 'bg-red-100 text-red-800',
    inactive: 'bg-gray-100 text-gray-700',
};

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
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Administration
                </h2>
            }
        >
            <Head title="Administration" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-lg bg-white p-6 shadow-sm">
                            <p className="text-sm font-medium text-gray-500">
                                Utilisateurs
                            </p>
                            <p className="mt-3 text-3xl font-bold text-gray-900">
                                {stats.total_users}
                            </p>
                        </div>

                        <div className="rounded-lg bg-white p-6 shadow-sm">
                            <p className="text-sm font-medium text-gray-500">
                                Abonnements valides
                            </p>
                            <p className="mt-3 text-3xl font-bold text-gray-900">
                                {stats.active_subscriptions}
                            </p>
                        </div>

                        <div className="rounded-lg bg-white p-6 shadow-sm">
                            <p className="text-sm font-medium text-gray-500">
                                MRR
                            </p>
                            <p className="mt-3 text-3xl font-bold text-gray-900">
                                {formatCurrency(stats.mrr)}
                            </p>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                        <div className="border-b border-gray-200 px-6 py-5">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Comptes utilisateurs
                            </h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Utilisateur
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Role
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Statut Stripe
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Offre
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Montant
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Suspendu
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {users.map((user) => (
                                        <tr key={user.id}>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {user.name}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {user.email}
                                                </p>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                                                {user.role}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                        statusStyles[
                                                            user.stripe_status
                                                        ] ??
                                                        'bg-gray-100 text-gray-700'
                                                    }`}
                                                >
                                                    {statusLabels[
                                                        user.stripe_status
                                                    ] ?? user.stripe_status}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                                                {user.stripe_price_id ?? 'Aucune'}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                                                {user.subscription_amount
                                                    ? formatCurrency(
                                                          user.subscription_amount,
                                                      )
                                                    : '0,00 EUR'}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
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
