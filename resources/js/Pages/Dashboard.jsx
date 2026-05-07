import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

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
    const alert = dashboardData?.alerte ?? null;

    const evolution = dashboardData?.graphique_evolution ?? [];
    const chartData = evolution.map((item) => ({
        mois: item.mois,
        chiffreAffaires: item.ca,
        charges: item.charges,
    }));
    const hasFinancialData = evolution.length > 0;

    const canAccessApp = auth?.user?.can_access_app;
    const stripeStatus = auth?.user?.stripe_status;

    const formatCurrency = (value) =>
        new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0,
        }).format(value);

    const formatMetricValue = (value) =>
        value === null ? 'Pas de donnees' : formatCurrency(value);

    const alertStyles = {
        critique: {
            container: 'border-red-200 bg-red-50 text-red-900',
            title: 'Alerte critique',
        },
        attention: {
            container: 'border-amber-200 bg-amber-50 text-amber-900',
            title: 'Attention',
        },
        sain: {
            container: 'border-green-200 bg-green-50 text-green-900',
            title: 'Situation saine',
        },
    };

    const formatChartAxisValue = (value) => {
        if (value >= 1000) {
            return `${new Intl.NumberFormat('fr-FR', {
                maximumFractionDigits: 0,
            }).format(value / 1000)} k€`;
        }

        return `${new Intl.NumberFormat('fr-FR', {
            maximumFractionDigits: 0,
        }).format(value)} €`;
    };

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

                                    {!hasFinancialData && (
                                        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                                            <h4 className="text-lg font-semibold text-blue-900">
                                                Aucune donnee financiere pour le moment
                                            </h4>
                                            <p className="mt-2 text-sm text-blue-800">
                                                Commencez par saisir votre premier mois pour
                                                afficher vos indicateurs et votre graphique.
                                            </p>
                                        </div>
                                    )}

                                    {alert && (
                                        <div
                                            className={`mt-6 rounded-2xl border p-5 ${
                                                alertStyles[alert.niveau]?.container
                                            }`}
                                        >
                                            <h4 className="text-lg font-semibold">
                                                {alertStyles[alert.niveau]?.title}
                                            </h4>
                                            <p className="mt-2 text-sm">
                                                {alert.message}
                                            </p>
                                        </div>
                                    )}

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
                                                {formatMetricValue(kpis.cac)}
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                                            <p className="text-sm text-gray-500">
                                                LTV
                                            </p>
                                            <p className="mt-2 text-xl font-bold text-gray-900">
                                                {formatMetricValue(kpis.ltv)}
                                            </p>
                                        </div>
                                    </div>

                                    {hasFinancialData && (
                                        <div className="mt-8">
                                            <h4 className="text-lg font-semibold text-gray-900">
                                                Evolution sur 3 mois
                                            </h4>
                                            <p className="mt-1 text-sm text-gray-500">
                                                Comparez rapidement le chiffre d'affaires et les
                                                charges des derniers mois saisis.
                                            </p>

                                            <div className="mt-4 rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-5 shadow-sm">
                                                <div className="h-96 w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart
                                                            data={chartData}
                                                            margin={{
                                                                top: 28,
                                                                right: 24,
                                                                left: 24,
                                                                bottom: 8,
                                                            }}
                                                            barGap={12}
                                                            barCategoryGap="28%"
                                                        >
                                                            <CartesianGrid
                                                                strokeDasharray="3 3"
                                                                stroke="#e5e7eb"
                                                                vertical={false}
                                                            />
                                                            <XAxis
                                                                dataKey="mois"
                                                                stroke="#6b7280"
                                                                tickLine={false}
                                                                axisLine={false}
                                                                tick={{ fontSize: 13 }}
                                                            />
                                                            <YAxis
                                                                stroke="#6b7280"
                                                                tickLine={false}
                                                                axisLine={false}
                                                                width={72}
                                                                tick={{ fontSize: 13 }}
                                                                tickMargin={10}
                                                                tickFormatter={formatChartAxisValue}
                                                            />
                                                            <Tooltip
                                                                formatter={(value) =>
                                                                    formatCurrency(Number(value))
                                                                }
                                                                labelStyle={{ color: '#111827' }}
                                                                contentStyle={{
                                                                    borderRadius: '1rem',
                                                                    border: '1px solid #e5e7eb',
                                                                    boxShadow:
                                                                        '0 10px 25px rgba(15, 23, 42, 0.08)',
                                                                }}
                                                            />
                                                            <Legend
                                                                wrapperStyle={{
                                                                    paddingTop: '18px',
                                                                }}
                                                            />
                                                            <Bar
                                                                dataKey="chiffreAffaires"
                                                                name="Chiffre d'affaires"
                                                                fill="#2563eb"
                                                                radius={[10, 10, 0, 0]}
                                                            />
                                                            <Bar
                                                                dataKey="charges"
                                                                name="Charges"
                                                                fill="#f97316"
                                                                radius={[10, 10, 0, 0]}
                                                            />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
