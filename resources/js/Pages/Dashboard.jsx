import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

export default function Dashboard() {
    const { dashboardData } = usePage().props;

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
        cac: null,
        ltv: null,
    };

    const alert = dashboardData?.alerte ?? null;
    const evolution = dashboardData?.graphique_evolution ?? [];
    const hasFinancialData = evolution.length > 0;

    const chartData = evolution.map((item) => ({
        mois: item.mois,
        chiffreAffaires: item.ca,
        charges: item.charges,
    }));

    const alertStyles = {
        critique: {
            container: 'border-red-500/20 bg-red-500/10 text-red-100',
            title: 'Alerte critique',
        },
        attention: {
            container: 'border-amber-400/20 bg-amber-400/10 text-amber-100',
            title: 'Attention',
        },
        sain: {
            container: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100',
            title: 'Situation saine',
        },
    };

    const formatCurrency = (value) =>
        new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0,
        }).format(Number(value ?? 0));

    const formatMetricValue = (value) =>
        value === null ? 'Pas de donnees' : formatCurrency(value);

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
                <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-slate-500">
                        Dashboard metier
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold text-white">
                        Vue d&apos;ensemble financiere
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                        Suivez vos indicateurs du mois, vos alertes et
                        l&apos;evolution recente de votre activite.
                    </p>
                </div>
            }
        >
            <Head title="Dashboard metier" />

            <div className="space-y-6">
                <div className="grid gap-4 xl:grid-cols-4">
                    <div className="rounded-3xl border border-white/5 bg-white/[0.04] p-5 shadow-[0_20px_45px_rgba(2,6,23,0.18)]">
                        <p className="text-sm text-slate-400">
                            Chiffre d&apos;affaires
                        </p>
                        <p className="mt-3 text-3xl font-semibold text-white">
                            {formatCurrency(kpis.chiffre_affaires)}
                        </p>
                        <p className="mt-3 text-sm text-emerald-300">
                            Vue du mois : {kpis.mois_actuel ?? 'Aucune periode'}
                        </p>
                    </div>

                    <div className="rounded-3xl border border-white/5 bg-white/[0.04] p-5 shadow-[0_20px_45px_rgba(2,6,23,0.18)]">
                        <p className="text-sm text-slate-400">
                            Charges totales
                        </p>
                        <p className="mt-3 text-3xl font-semibold text-white">
                            {formatCurrency(kpis.charges_totales)}
                        </p>
                        <p className="mt-3 text-sm text-slate-400">
                            Controle des depenses du mois en cours.
                        </p>
                    </div>

                    <div className="rounded-3xl border border-white/5 bg-white/[0.04] p-5 shadow-[0_20px_45px_rgba(2,6,23,0.18)]">
                        <p className="text-sm text-slate-400">Marge nette</p>
                        <p className="mt-3 text-3xl font-semibold text-white">
                            {formatCurrency(kpis.marge_nette)}
                        </p>
                        <p className="mt-3 text-sm text-cyan-300">
                            Lecture directe de votre rentabilite mensuelle.
                        </p>
                    </div>

                    <div className="rounded-3xl border border-white/5 bg-white/[0.04] p-5 shadow-[0_20px_45px_rgba(2,6,23,0.18)]">
                        <p className="text-sm text-slate-400">
                            CAC / LTV
                        </p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                                    CAC
                                </p>
                                <p className="mt-2 text-xl font-semibold text-white">
                                    {formatMetricValue(kpis.cac)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                                    LTV
                                </p>
                                <p className="mt-2 text-xl font-semibold text-white">
                                    {formatMetricValue(kpis.ltv)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
                    <div className="rounded-3xl border border-white/5 bg-[#111a2b] p-6 shadow-[0_25px_60px_rgba(2,6,23,0.22)]">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h3 className="text-2xl font-semibold text-white">
                                    Evolution du chiffre d&apos;affaires
                                </h3>
                                <p className="mt-2 text-sm text-slate-400">
                                    Comparez le chiffre d&apos;affaires et les
                                    charges sur les derniers mois saisis.
                                </p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300">
                                {hasFinancialData
                                    ? `${chartData.length} derniers mois`
                                    : 'Aucune donnee'}
                            </div>
                        </div>

                        {hasFinancialData ? (
                            <div className="mt-8 h-[420px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={chartData}
                                        margin={{
                                            top: 12,
                                            right: 18,
                                            left: 8,
                                            bottom: 8,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="4 4"
                                            stroke="#22314d"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="mois"
                                            stroke="#94a3b8"
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{ fontSize: 13 }}
                                        />
                                        <YAxis
                                            stroke="#94a3b8"
                                            tickLine={false}
                                            axisLine={false}
                                            width={76}
                                            tickMargin={10}
                                            tick={{ fontSize: 13 }}
                                            tickFormatter={formatChartAxisValue}
                                        />
                                        <Tooltip
                                            formatter={(value) =>
                                                formatCurrency(Number(value))
                                            }
                                            labelStyle={{ color: '#0f172a' }}
                                            contentStyle={{
                                                borderRadius: '1rem',
                                                border: '1px solid #1e293b',
                                                backgroundColor: '#ffffff',
                                                boxShadow:
                                                    '0 18px 40px rgba(15, 23, 42, 0.16)',
                                            }}
                                        />
                                        <Legend
                                            wrapperStyle={{
                                                paddingTop: '18px',
                                                color: '#cbd5e1',
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="chiffreAffaires"
                                            name="Chiffre d'affaires"
                                            stroke="#4f7cff"
                                            strokeWidth={3}
                                            dot={{
                                                r: 4,
                                                strokeWidth: 2,
                                                fill: '#0b1220',
                                            }}
                                            activeDot={{
                                                r: 6,
                                                strokeWidth: 2,
                                                fill: '#4f7cff',
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="charges"
                                            name="Charges"
                                            stroke="#22c55e"
                                            strokeWidth={3}
                                            dot={{
                                                r: 4,
                                                strokeWidth: 2,
                                                fill: '#0b1220',
                                            }}
                                            activeDot={{
                                                r: 6,
                                                strokeWidth: 2,
                                                fill: '#22c55e',
                                            }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="mt-8 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
                                <p className="text-lg font-medium text-white">
                                    Aucune donnee financiere pour le moment
                                </p>
                                <p className="mt-3 text-sm text-slate-400">
                                    Commencez par saisir votre premier mois pour
                                    afficher votre courbe d&apos;evolution.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-3xl border border-white/5 bg-[#111a2b] p-6 shadow-[0_25px_60px_rgba(2,6,23,0.22)]">
                            <h3 className="text-xl font-semibold text-white">
                                Saisie mensuelle
                            </h3>
                            <p className="mt-2 text-sm text-slate-400">
                                Ajoutez ou mettez a jour vos chiffres du mois.
                            </p>

                            <form onSubmit={submit} className="mt-6 space-y-4">
                                <div>
                                    <InputLabel
                                        htmlFor="month"
                                        value="Mois"
                                        className="text-slate-300"
                                    />
                                    <TextInput
                                        id="month"
                                        type="month"
                                        className="mt-2 block w-full border-white/10 bg-white/[0.03] text-white"
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
                                        className="text-slate-300"
                                    />
                                    <TextInput
                                        id="revenue"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="mt-2 block w-full border-white/10 bg-white/[0.03] text-white"
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
                                        className="text-slate-300"
                                    />
                                    <TextInput
                                        id="charges"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="mt-2 block w-full border-white/10 bg-white/[0.03] text-white"
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
                                        className="text-slate-300"
                                    />
                                    <TextInput
                                        id="marketing_budget"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="mt-2 block w-full border-white/10 bg-white/[0.03] text-white"
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
                                        className="text-slate-300"
                                    />
                                    <TextInput
                                        id="clients_count"
                                        type="number"
                                        min="0"
                                        step="1"
                                        className="mt-2 block w-full border-white/10 bg-white/[0.03] text-white"
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

                                {recentlySuccessful && (
                                    <p className="text-sm font-medium text-emerald-300">
                                        Donnees enregistrees avec succes.
                                    </p>
                                )}

                                <div className="pt-2">
                                    <PrimaryButton disabled={processing}>
                                        Enregistrer
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>

                        {alert && (
                            <div
                                className={`rounded-3xl border p-6 ${
                                    alertStyles[alert.niveau]?.container
                                }`}
                            >
                                <h3 className="text-lg font-semibold">
                                    {alertStyles[alert.niveau]?.title}
                                </h3>
                                <p className="mt-2 text-sm leading-6">
                                    {alert.message}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
