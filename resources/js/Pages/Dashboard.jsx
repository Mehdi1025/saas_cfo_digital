import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';

export default function Dashboard() {
    const { auth, dashboardData } = usePage().props;

    const {
        data,
        setData,
        post,
        processing,
        errors,
        reset,
        recentlySuccessful,
    } = useForm({
        month: '',
        revenue: '',
        charges: '',
        marketing_budget: '',
        clients_count: '',
    });

    const kpis = dashboardData?.kpis_mensuels ?? {
        mois_actuel: null,
        chiffre_affaires: 0,
        charges_totales: 0,
        marge_nette: 0,
        cac: 0,
        ltv: 0,
    };

    const evolution = dashboardData?.graphique_evolution ?? [];

    const canAccessApp = auth?.user?.can_access_app;
    const stripeStatus = auth?.user?.stripe_status;

    const formatCurrency = (value) =>
        new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0,
        }).format(value);

    const submit = (event) => {
        event.preventDefault();

        post(route('financial-records.store'), {
            onSuccess: () =>
                reset('month', 'revenue', 'charges', 'marketing_budget', 'clients_count'),
        });
    };

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
                            {!canAccessApp ? (
                                <div className="rounded-xl border border-red-200 bg-red-50 p-6">
                                    <h3 className="text-2xl font-bold text-red-700">
                                        Acces au dashboard bloque
                                    </h3>
                                    <p className="mt-3 text-sm text-red-600">
                                        Votre abonnement ne permet pas d'acceder
                                        aux KPI pour le moment.
                                    </p>
                                    <p className="mt-2 text-sm text-gray-700">
                                        Statut actuel : {stripeStatus ?? 'inconnu'}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <h3 className="text-2xl font-bold">
                                        Suivi financier
                                    </h3>

                                    <p className="mt-2 text-sm text-gray-500">
                                        Vue du mois : {kpis.mois_actuel}
                                    </p>

                                    <form
                                        onSubmit={submit}
                                        className="mt-6 border-b border-gray-200 pb-8"
                                    >
                                        <h4 className="text-lg font-semibold text-gray-900">
                                            Saisie mensuelle
                                        </h4>

                                        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                                            <div>
                                                <InputLabel
                                                    htmlFor="month"
                                                    value="Mois"
                                                />
                                                <TextInput
                                                    id="month"
                                                    type="month"
                                                    className="mt-1 block w-full"
                                                    value={data.month}
                                                    onChange={(event) =>
                                                        setData('month', event.target.value)
                                                    }
                                                />
                                                <InputError
                                                    message={errors.month}
                                                    className="mt-2"
                                                />
                                            </div>

                                            <div>
                                                <InputLabel
                                                    htmlFor="revenue"
                                                    value="Chiffre d'affaires"
                                                />
                                                <TextInput
                                                    id="revenue"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    className="mt-1 block w-full"
                                                    value={data.revenue}
                                                    onChange={(event) =>
                                                        setData('revenue', event.target.value)
                                                    }
                                                />
                                                <InputError
                                                    message={errors.revenue}
                                                    className="mt-2"
                                                />
                                            </div>

                                            <div>
                                                <InputLabel
                                                    htmlFor="charges"
                                                    value="Charges"
                                                />
                                                <TextInput
                                                    id="charges"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    className="mt-1 block w-full"
                                                    value={data.charges}
                                                    onChange={(event) =>
                                                        setData('charges', event.target.value)
                                                    }
                                                />
                                                <InputError
                                                    message={errors.charges}
                                                    className="mt-2"
                                                />
                                            </div>

                                            <div>
                                                <InputLabel
                                                    htmlFor="marketing_budget"
                                                    value="Budget marketing"
                                                />
                                                <TextInput
                                                    id="marketing_budget"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    className="mt-1 block w-full"
                                                    value={data.marketing_budget}
                                                    onChange={(event) =>
                                                        setData(
                                                            'marketing_budget',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                                <InputError
                                                    message={errors.marketing_budget}
                                                    className="mt-2"
                                                />
                                            </div>

                                            <div>
                                                <InputLabel
                                                    htmlFor="clients_count"
                                                    value="Clients"
                                                />
                                                <TextInput
                                                    id="clients_count"
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    className="mt-1 block w-full"
                                                    value={data.clients_count}
                                                    onChange={(event) =>
                                                        setData(
                                                            'clients_count',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                                <InputError
                                                    message={errors.clients_count}
                                                    className="mt-2"
                                                />
                                            </div>
                                        </div>

                                        {recentlySuccessful && (
                                            <p className="mb-3 mt-4 text-sm font-medium text-green-600">
                                                Donnees enregistrees avec succes.
                                            </p>
                                        )}

                                        <div className="mt-5">
                                            <PrimaryButton disabled={processing}>
                                                Enregistrer
                                            </PrimaryButton>
                                        </div>
                                    </form>

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
                                                            Chiffre d'affaires
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
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
