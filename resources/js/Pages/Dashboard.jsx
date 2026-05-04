import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Dashboard() {
    const mockDashboardData = {
        kpis_mensuels: {
            mois_actuel: '2026-04',
            chiffre_affaires: 125000.5,
            charges_totales: 78000.0,
            marge_nette: 47000.5,
            cac: 150.0,
            ltv: 2400.0,
        },
        graphique_evolution: [
            { mois: '2026-02', ca: 98000.0, charges: 65000.0 },
            { mois: '2026-03', ca: 110000.0, charges: 70000.0 },
            { mois: '2026-04', ca: 125000.5, charges: 78000.0 },
        ],
    };

    const kpis = mockDashboardData.kpis_mensuels;
    const evolution = mockDashboardData.graphique_evolution;

    const formatCurrency = (value) =>
        new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0,
        }).format(value);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Dashboard metier
                </h2>
            }
        >
            <Head title="Dashboard metier" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <h3 className="text-2xl font-bold">
                                Suivi financier
                            </h3>

                            <p className="mt-2 text-sm text-gray-500">
                                Vue du mois : {kpis.mois_actuel}
                            </p>

                            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                                <div className="rounded-xl border border-gray-200 bg-white p-4">
                                    <p className="text-sm text-gray-500">
                                        Chiffre d'affaires
                                    </p>
                                    <p className="mt-2 text-xl font-bold text-gray-900">
                                        {formatCurrency(kpis.chiffre_affaires)}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-gray-200 bg-white p-4">
                                    <p className="text-sm text-gray-500">
                                        Charges totales
                                    </p>
                                    <p className="mt-2 text-xl font-bold text-gray-900">
                                        {formatCurrency(kpis.charges_totales)}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-gray-200 bg-white p-4">
                                    <p className="text-sm text-gray-500">
                                        Marge nette
                                    </p>
                                    <p className="mt-2 text-xl font-bold text-green-700">
                                        {formatCurrency(kpis.marge_nette)}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-gray-200 bg-white p-4">
                                    <p className="text-sm text-gray-500">
                                        CAC
                                    </p>
                                    <p className="mt-2 text-xl font-bold text-gray-900">
                                        {formatCurrency(kpis.cac)}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-gray-200 bg-white p-4">
                                    <p className="text-sm text-gray-500">
                                        LTV
                                    </p>
                                    <p className="mt-2 text-xl font-bold text-gray-900">
                                        {formatCurrency(kpis.ltv)}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-8">
                                <h4 className="text-lg font-semibold text-gray-900">
                                    Evolution sur 3 mois
                                </h4>

                                <div className="mt-4 overflow-x-auto">
                                    <table className="min-w-full border-collapse">
                                        <thead>
                                            <tr className="border-b border-gray-200 text-left">
                                                <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                                                    Mois
                                                </th>
                                                <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                                                    CA
                                                </th>
                                                <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                                                    Charges
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {evolution.map((item) => (
                                                <tr
                                                    key={item.mois}
                                                    className="border-b border-gray-100"
                                                >
                                                    <td className="px-4 py-3 text-sm text-gray-800">
                                                        {item.mois}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-800">
                                                        {formatCurrency(item.ca)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-800">
                                                        {formatCurrency(item.charges)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
