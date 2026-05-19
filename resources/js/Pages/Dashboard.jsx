import AppDashboardLayout from '@/Layouts/AppDashboardLayout';
import { Link, usePage } from '@inertiajs/react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

const GLASS_PANEL =
    'border border-glassBorder bg-[linear-gradient(145deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.01)_100%)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-[20px]';

const NEON_BLUE = '#00F0FF';
const NEON_MINT = '#00FF9D';
const ORANGE = '#FF8A00';
const EURO_SYMBOL = '\u20AC';

function SparklineArea({ data, stroke, fillId }) {
    return (
        <ResponsiveContainer width="100%" height={48}>
            <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <defs>
                    <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <XAxis dataKey="i" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <Area
                    type="monotone"
                    dataKey="v"
                    stroke={stroke}
                    strokeWidth={2}
                    fill={`url(#${fillId})`}
                    isAnimationActive
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

function MainChartTooltip({ active, payload, label }) {
    if (!active || !payload?.length) {
        return null;
    }

    return (
        <div className="rounded-lg border border-white/10 bg-obsidian/95 px-3 py-2 text-xs shadow-xl backdrop-blur-md">
            <p className="mb-1 font-medium text-white">{label}</p>
            {payload.map((p) => (
                <p key={p.dataKey} className="text-gray-300">
                    <span className="font-semibold" style={{ color: p.color }}>
                        {p.name}
                    </span>
                    : {formatCurrency(p.value)}
                </p>
            ))}
        </div>
    );
}

function formatCurrency(value) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
    }).format(Number(value ?? 0));
}

function formatCompactCurrency(value) {
    if (value === null) {
        return 'N/A';
    }

    const numericValue = Number(value ?? 0);

    if (Math.abs(numericValue) >= 1000) {
        return `${new Intl.NumberFormat('fr-FR', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
        }).format(numericValue / 1000)}k ${EURO_SYMBOL}`;
    }

    return formatCurrency(numericValue);
}

function formatPercentage(value) {
    if (value === null || Number.isNaN(Number(value))) {
        return 'N/A';
    }

    return `${new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    }).format(Number(value))}%`;
}

function sparklineFrom(values) {
    const source = values.length ? values : [0, 0, 0, 0, 0, 0, 0];

    return source.slice(-7).map((v, i) => ({ i, v: Number(v ?? 0) }));
}

export default function Dashboard() {
    const { dashboardData } = usePage().props;

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
    const chartData = evolution.map((item) => ({
        month: item.mois,
        revenus: Number(item.ca ?? 0),
        charges: Number(item.charges ?? 0),
    }));
    const hasFinancialData = chartData.length > 0;

    const ratioLtvCac =
        kpis.cac !== null && kpis.ltv !== null && kpis.cac > 0
            ? kpis.ltv / kpis.cac
            : null;
    const netMarginPercentage =
        kpis.chiffre_affaires > 0
            ? (kpis.marge_nette / kpis.chiffre_affaires) * 100
            : null;
    const chargesRatio =
        kpis.chiffre_affaires > 0
            ? kpis.charges_totales / kpis.chiffre_affaires
            : null;

    const healthScore = (() => {
        if (!hasFinancialData) {
            return 0;
        }

        let score = 50;

        if (kpis.marge_nette > 0) {
            score += 20;
        } else if (kpis.marge_nette < 0) {
            score -= 25;
        }

        if (ratioLtvCac !== null) {
            if (ratioLtvCac > 3) {
                score += 20;
            } else if (ratioLtvCac >= 1) {
                score += 8;
            } else {
                score -= 18;
            }
        }

        if (chargesRatio !== null) {
            if (chargesRatio <= 0.5) {
                score += 10;
            } else if (chargesRatio <= 0.7) {
                score += 5;
            } else {
                score -= 10;
            }
        }

        return Math.max(0, Math.min(100, score));
    })();

    const healthPie = [
        { name: 'Score', value: healthScore },
        { name: 'Reste', value: 100 - healthScore },
    ];

    const recentRows = [...chartData].reverse().slice(0, 3);
    const revenuesSpark = sparklineFrom(chartData.map((item) => item.revenus));
    const marginSpark = sparklineFrom(
        chartData.map((item) =>
            item.revenus > 0 ? ((item.revenus - item.charges) / item.revenus) * 100 : 0,
        ),
    );
    const ltvSpark = sparklineFrom(chartData.map(() => kpis.ltv ?? 0));

    const alertItems = [];

    if (alert) {
        alertItems.push({
            tone: alert.niveau,
            title:
                alert.niveau === 'critique'
                    ? 'Alerte critique'
                    : alert.niveau === 'attention'
                      ? 'Attention : indicateur a surveiller'
                      : 'Sain : indicateurs favorables',
            message: alert.message,
        });
    }

    if (kpis.cac === null || kpis.ltv === null) {
        alertItems.push({
            tone: 'neutral',
            title: 'Donnees incompletes',
            message:
                'Le CAC ou la LTV necessitent un nombre de clients superieur a zero.',
        });
    }

    if (!alertItems.length) {
        alertItems.push({
            tone: 'neutral',
            title: 'Aucune alerte bloquante',
            message:
                'Vos indicateurs ne presentent pas de risque majeur sur le mois courant.',
        });
    }

    const currentMonthLabel = kpis.mois_actuel ? `Vue du mois : ${kpis.mois_actuel}` : 'Aucune periode suivie';

    return (
        <AppDashboardLayout title="Tableau de bord mensuel" badge={kpis.mois_actuel ?? 'Aucune periode'}>
            <div className="relative z-0 mx-auto max-w-[1600px] space-y-8">
                <section className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-zinc-500">
                            Dashboard metier
                        </p>
                        <h2 className="mt-3 text-3xl font-bold tracking-tight text-white lg:text-[2.5rem]">
                            Vue d&apos;ensemble financiere
                        </h2>
                        <p className="mt-3 max-w-2xl text-sm text-gray-400">
                            Suivez vos indicateurs du mois, vos alertes et l&apos;evolution recente de votre activite.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                        >
                            Rapport
                        </button>
                        <Link
                            href="/saisie-mensuelle"
                            className="rounded-xl bg-[#3B82F6] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(59,130,246,0.25)] transition hover:bg-[#4C8DFF]"
                        >
                            Saisie mensuelle
                        </Link>
                    </div>
                </section>

                <section id="kpi-grid" className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                    <div
                        className={`${GLASS_PANEL} group relative overflow-hidden rounded-[26px] p-5 transition-colors duration-500 hover:border-neonBlue/30`}
                    >
                        <div className="absolute right-0 top-0 p-4 opacity-20 transition-opacity group-hover:opacity-40">
                            <svg
                                className="h-10 w-10 text-neonBlue"
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden
                            >
                                <path
                                    d="M4 16l4-4 4 4 8-8"
                                    stroke="currentColor"
                                    strokeWidth="1.75"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M16 8h4v4"
                                    stroke="currentColor"
                                    strokeWidth="1.75"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                        <div className="relative z-10 flex h-full flex-col justify-between">
                            <div>
                                <h3 className="mb-1 text-sm font-medium uppercase tracking-wider text-gray-400">
                                    Chiffre d&apos;affaires
                                </h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-[3rem] font-bold tracking-tighter text-white">
                                        {formatCompactCurrency(kpis.chiffre_affaires)}
                                    </span>
                                </div>
                                <p className="mt-3 text-sm text-neonBlue/80">{currentMonthLabel}</p>
                            </div>
                            <div className="mt-6 h-12 w-full">
                                <SparklineArea
                                    data={revenuesSpark}
                                    stroke={NEON_BLUE}
                                    fillId="sp-revenue"
                                />
                            </div>
                        </div>
                    </div>

                    <div
                        className={`${GLASS_PANEL} group relative overflow-hidden rounded-[26px] p-5 transition-colors duration-500 hover:border-neonMint/30`}
                    >
                        <div className="absolute right-0 top-0 p-4 opacity-20 transition-opacity group-hover:opacity-40">
                            <svg
                                className="h-10 w-10 text-neonMint"
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden
                            >
                                <path
                                    d="M8 8.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                />
                                <path
                                    d="M16 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                />
                                <path
                                    d="M16 8L8 16"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>
                        <div className="relative z-10 flex h-full flex-col justify-between">
                            <div>
                                <h3 className="mb-1 text-sm font-medium uppercase tracking-wider text-gray-400">
                                    Marge nette
                                </h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-[3rem] font-bold tracking-tighter text-white">
                                        {formatPercentage(netMarginPercentage)}
                                    </span>
                                </div>
                                <p className="mt-3 text-sm text-neonMint/70">
                                    Montant net : {formatCurrency(kpis.marge_nette)}
                                </p>
                            </div>
                            <div className="mt-6 h-12 w-full">
                                <SparklineArea
                                    data={marginSpark}
                                    stroke={NEON_MINT}
                                    fillId="sp-margin"
                                />
                            </div>
                        </div>
                    </div>

                    <div
                        className={`${GLASS_PANEL} group relative overflow-hidden rounded-[26px] p-5 transition-colors duration-500 hover:border-white/20`}
                    >
                        <div className="absolute right-0 top-0 p-4 opacity-10">
                            <svg
                                className="h-10 w-10 text-white"
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden
                            >
                                <path
                                    d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                />
                                <circle
                                    cx="8.5"
                                    cy="7"
                                    r="4"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                />
                                <path
                                    d="M20 8v6M23 11h-6"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>
                        <div className="relative z-10 flex h-full flex-col justify-between">
                            <div>
                                <div className="mb-1 flex items-start justify-between">
                                    <h3 className="text-sm font-medium uppercase tracking-wider text-gray-400">
                                        CAC
                                    </h3>
                                    {kpis.cac === null && (
                                        <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-medium text-gray-500">
                                            Pas de donnees
                                        </span>
                                    )}
                                </div>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span
                                        className={`text-[2.7rem] tracking-tighter ${
                                            kpis.cac === null
                                                ? 'font-light italic text-gray-600'
                                                : 'font-bold text-white'
                                        }`}
                                    >
                                        {kpis.cac === null
                                            ? 'N/A'
                                            : formatCompactCurrency(kpis.cac)}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-6 flex items-center gap-2 text-xs text-gray-500">
                                <svg
                                    className="h-3.5 w-3.5 shrink-0"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    aria-hidden
                                >
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                                </svg>
                                <span>Cout d&apos;acquisition moyen par client</span>
                            </div>
                        </div>
                    </div>

                    <div
                        className={`${GLASS_PANEL} group relative overflow-hidden rounded-[26px] p-5 transition-colors duration-500 hover:border-neonBlue/30`}
                    >
                        <div className="absolute right-0 top-0 p-4 opacity-20 transition-opacity group-hover:opacity-40">
                            <svg
                                className="h-10 w-10 text-neonBlue"
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden
                            >
                                <path
                                    d="M12 3 4 10l8 11 8-11-8-7Z"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                        <div className="relative z-10 flex h-full flex-col justify-between">
                            <div>
                                <h3 className="mb-1 text-sm font-medium uppercase tracking-wider text-gray-400">
                                    LTV
                                </h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-[3rem] font-bold tracking-tighter text-white">
                                        {kpis.ltv === null ? 'N/A' : formatCompactCurrency(kpis.ltv)}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-6 h-12 w-full">
                                <SparklineArea
                                    data={ltvSpark}
                                    stroke={NEON_BLUE}
                                    fillId="sp-ltv"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    <div className="space-y-8 lg:col-span-2">
                        <section
                            id="main-chart-section"
                            className={`${GLASS_PANEL} relative overflow-hidden rounded-3xl p-1`}
                        >
                            <div className="h-full rounded-[23px] bg-obsidian/40 p-6 backdrop-blur-md">
                                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-lg font-semibold tracking-wide text-white">
                                            Evolution du chiffre d&apos;affaires
                                        </h2>
                                        <p className="mt-1 text-sm text-gray-400">
                                            Comparez rapidement le chiffre d&apos;affaires et les charges sur les derniers mois.
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            className="rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-white/20"
                                        >
                                            12 derniers mois
                                        </button>
                                    </div>
                                </div>

                                {hasFinancialData ? (
                                    <div className="h-[400px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart
                                                data={chartData}
                                                margin={{ top: 10, right: 10, bottom: 10, left: 0 }}
                                            >
                                                <defs>
                                                    <linearGradient id="fillRev" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor={NEON_BLUE} stopOpacity={0.22} />
                                                        <stop offset="100%" stopColor={NEON_BLUE} stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="fillChg" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor={ORANGE} stopOpacity={0.12} />
                                                        <stop offset="100%" stopColor={ORANGE} stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid
                                                    stroke="rgba(255,255,255,0.05)"
                                                    vertical={false}
                                                />
                                                <XAxis
                                                    dataKey="month"
                                                    tick={{
                                                        fill: '#9CA3AF',
                                                        fontSize: 12,
                                                        fontFamily: 'Space Grotesk, sans-serif',
                                                    }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />
                                                <YAxis
                                                    tick={{
                                                        fill: '#9CA3AF',
                                                        fontSize: 12,
                                                        fontFamily: 'Space Grotesk, sans-serif',
                                                    }}
                                                    tickFormatter={(v) =>
                                                        `${v >= 1000 ? Math.round(v / 1000) : v}k ${EURO_SYMBOL}`
                                                    }
                                                    axisLine={false}
                                                    tickLine={false}
                                                    width={52}
                                                />
                                                <Tooltip content={<MainChartTooltip />} />
                                                <Area
                                                    type="monotone"
                                                    dataKey="charges"
                                                    name="Charges Totales"
                                                    stroke={ORANGE}
                                                    strokeWidth={2}
                                                    fill="url(#fillChg)"
                                                    isAnimationActive
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="revenus"
                                                    name="Revenus"
                                                    stroke={NEON_BLUE}
                                                    strokeWidth={3}
                                                    fill="url(#fillRev)"
                                                    isAnimationActive
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center">
                                        <p className="text-lg font-semibold text-white">
                                            Aucune donnee financiere
                                        </p>
                                        <p className="mt-2 text-sm text-gray-400">
                                            Ajoutez une saisie mensuelle pour afficher vos graphiques.
                                        </p>
                                    </div>
                                )}

                                <div className="mt-4 flex flex-wrap justify-center gap-6 border-t border-glassBorder pt-4">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-neonBlue shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
                                        <span className="text-sm text-gray-300">Revenus</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-[#FF8A00] shadow-[0_0_8px_rgba(255,138,0,0.5)]" />
                                        <span className="text-sm text-gray-300">Charges Totales</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section id="recent-transactions" className={`${GLASS_PANEL} rounded-3xl p-6`}>
                            <div className="mb-6 flex items-center justify-between">
                                <h2 className="text-lg font-semibold tracking-wide text-white">
                                    Dernieres periodes
                                </h2>
                                <span className="flex items-center text-sm text-neonBlue">
                                    Historique
                                    <svg
                                        className="ml-1 h-3.5 w-3.5"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        aria-hidden
                                    >
                                        <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" />
                                    </svg>
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left">
                                    <thead>
                                        <tr className="border-b border-glassBorder">
                                            <th className="pb-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                                                Date
                                            </th>
                                            <th className="pb-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                                                Description
                                            </th>
                                            <th className="pb-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                                                Categorie
                                            </th>
                                            <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                                Montant
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-glassBorder text-sm">
                                        {recentRows.length ? (
                                            recentRows.map((row) => (
                                                <tr
                                                    key={row.month}
                                                    className="transition-colors hover:bg-white/5"
                                                >
                                                    <td className="py-4 text-gray-400">{row.month}</td>
                                                    <td className="py-4 font-medium text-white">
                                                        Synthese mensuelle
                                                    </td>
                                                    <td className="py-4">
                                                        <span className="rounded-md border border-neonBlue/20 bg-neonBlue/10 px-2.5 py-1 text-xs text-neonBlue">
                                                            Revenu
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-right font-medium text-neonBlue">
                                                        {formatCurrency(row.revenus)}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="py-5 text-sm text-gray-400">
                                                    Aucun flux recent disponible.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>

                    <div className="space-y-8">
                        <section
                            id="health-score"
                            className={`${GLASS_PANEL} relative flex min-h-[310px] flex-col items-center justify-center rounded-3xl p-6`}
                        >
                            <div className="absolute left-6 right-6 top-6 flex items-center justify-between">
                                <h2 className="text-lg font-semibold tracking-wide text-white">
                                Score de sante
                                </h2>
                                <button
                                    type="button"
                                    className="text-gray-500 transition hover:text-white"
                                    aria-label="Plus d options"
                                >
                                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                        <path d="M12 7a1.75 1.75 0 1 0 0-3.5A1.75 1.75 0 0 0 12 7Zm0 7a1.75 1.75 0 1 0 0-3.5A1.75 1.75 0 0 0 12 14Zm0 7a1.75 1.75 0 1 0 0-3.5A1.75 1.75 0 0 0 12 21Z" />
                                    </svg>
                                </button>
                            </div>

                            <div className="relative mt-8 h-48 w-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={healthPie}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius="85%"
                                            outerRadius="100%"
                                            dataKey="value"
                                            stroke="#09090B"
                                            strokeWidth={2}
                                            paddingAngle={0}
                                        >
                                            <Cell fill={NEON_MINT} />
                                            <Cell fill="rgba(255,255,255,0.05)" />
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                    <span
                                        className="text-5xl font-bold text-white"
                                        style={{ textShadow: '0 0 10px rgba(0, 255, 157, 0.5)' }}
                                    >
                                        {healthScore}
                                    </span>
                                    <span className="mt-1 text-sm font-medium uppercase tracking-widest text-gray-400">
                                        /100
                                    </span>
                                </div>
                            </div>
                            <p className="mt-6 max-w-[80%] text-center text-sm text-gray-400">
                                Lecture globale de votre sante financiere sur la periode courante.
                            </p>
                        </section>

                        <section id="alerts-panel" className={`${GLASS_PANEL} rounded-3xl p-6`}>
                            <div className="mb-6 flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/10">
                                    <svg
                                        className="h-4 w-4 text-white"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        aria-hidden
                                    >
                                        <path d="M7 2v11h3v9l7-12h-4l4-8H7z" />
                                    </svg>
                                </div>
                                <h2 className="text-lg font-semibold tracking-wide text-white">
                                    Alertes
                                </h2>
                            </div>

                            <div className="space-y-4">
                                {alertItems.map((item, index) => {
                                    const toneClass =
                                        item.tone === 'sain'
                                            ? 'border-neonMint/20 bg-neonMint/5 text-neonMint'
                                            : item.tone === 'attention'
                                              ? 'border-[#FF8A00]/20 bg-[#FF8A00]/5 text-[#FF8A00]'
                                              : item.tone === 'critique'
                                                ? 'border-red-500/20 bg-red-500/5 text-red-300'
                                                : 'border-white/10 bg-white/5 text-gray-300';

                                    return (
                                        <div
                                            key={`${item.title}-${index}`}
                                            className={`relative overflow-hidden rounded-xl border p-4 ${toneClass}`}
                                        >
                                            <div className="absolute bottom-0 left-0 top-0 w-1 bg-current shadow-[0_0_10px_currentColor]" />
                                            <div className="pl-2">
                                                <h4 className="mb-1 text-sm font-semibold">
                                                    {item.title}
                                                </h4>
                                                <p className="text-xs leading-relaxed text-gray-400">
                                                    {item.message}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        <section className={`${GLASS_PANEL} rounded-3xl p-6`}>
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold tracking-wide text-white">
                                    Rappel metier
                                </h2>
                                <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-gray-400">
                                    Temps reel
                                </span>
                            </div>
                            <p className="text-sm leading-relaxed text-gray-400">
                                Revenus, CAC, LTV et score de sante se recalculent automatiquement apres chaque saisie mensuelle.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </AppDashboardLayout>
    );
}
