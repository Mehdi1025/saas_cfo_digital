import { Link } from '@inertiajs/react';
import {
    ChevronDown,
    Download,
    FileEdit,
    FileText,
    Plus,
    UserPlus,
} from 'lucide-react';
import { useId, useMemo } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import DonutChartCard from '@/Components/FinFlow/DonutChartCard';
import FinancialAnalysisCard from '@/Components/FinFlow/FinancialAnalysisCard';
import {
    KpiChiffreAffaires,
    KpiDevisEnAttente,
    KpiFacturesEnRetard,
    KpiNouveauxClients,
} from '@/Components/FinFlow/DashboardKpiCards';

const cardBase =
    'relative overflow-hidden rounded-xl border border-slate-800 bg-[#151d2c] p-5 shadow-sm';

const chartCardBase =
    'relative flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[#1e293b] bg-[#111827] p-6 shadow-sm';

const statusBadgeClass = {
    success: 'bg-emerald-500/15 text-emerald-500',
    warning: 'bg-amber-500/15 text-amber-500',
    danger: 'bg-red-500/15 text-red-400',
};

function formatMoney(amount) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
    }).format(amount || 0);
}

function ChartTooltip({ active, payload, label }) {
    if (!active || !payload?.length) {
        return null;
    }
    return (
        <div className="rounded-lg border border-slate-700 bg-[#1e293b] px-3 py-2 text-xs shadow-lg">
            <p className="font-medium text-slate-200">{label}</p>
            <p className="text-[#3b82f6]">{payload[0].value}k €</p>
        </div>
    );
}

function RevenueChart({ data }) {
    const gradId = useId().replace(/:/g, '');

    const yMax = useMemo(() => {
        const max = Math.max(...data.map((d) => d.value), 0);
        return Math.max(5, Math.ceil(max / 5) * 5);
    }, [data]);

    const yTicks = useMemo(() => {
        const step = yMax <= 10 ? 2 : 5;
        const ticks = [];
        for (let i = 0; i <= yMax; i += step) {
            ticks.push(i);
        }
        return ticks.length > 1 ? ticks : [0, yMax];
    }, [yMax]);

    return (
        <div className={`${chartCardBase} lg:col-span-2`}>
            <div className="mb-1 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-white">
                        Évolution du Chiffre d&apos;Affaires
                    </h2>
                    <p className="mt-0.5 text-sm text-[#94a3b8]">
                        Vue sur les 6 derniers mois
                    </p>
                </div>
                <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg border border-[#1e293b] bg-[#1e293b] px-3 py-1.5 text-xs font-medium text-[#94a3b8] transition hover:border-slate-600 hover:text-slate-200"
                >
                    6 Derniers Mois
                    <ChevronDown className="h-3.5 w-3.5 opacity-70" strokeWidth={2} />
                </button>
            </div>
            <div className="mt-5 h-[280px] w-full min-w-0 sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 8, left: 4, bottom: 4 }}
                    >
                        <defs>
                            <linearGradient
                                id={`gradCa-${gradId}`}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="#3b82f6"
                                    stopOpacity={0.22}
                                />
                                <stop
                                    offset="92%"
                                    stopColor="#3b82f6"
                                    stopOpacity={0.02}
                                />
                                <stop
                                    offset="100%"
                                    stopColor="#3b82f6"
                                    stopOpacity={0}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#1e293b"
                            strokeOpacity={0.9}
                            vertical={false}
                        />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                            dy={8}
                        />
                        <YAxis
                            domain={[0, yMax]}
                            ticks={yTicks}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                            tickFormatter={(v) => (v === 0 ? '0' : `${v}k`)}
                            width={42}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fill={`url(#gradCa-${gradId})`}
                            dot={{
                                r: 4,
                                fill: '#111827',
                                stroke: '#3b82f6',
                                strokeWidth: 2,
                            }}
                            activeDot={{ r: 5, fill: '#3b82f6', stroke: '#fff' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export function DashboardHeaderActions() {
    return (
        <div className="flex flex-wrap items-center gap-3">
            <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-600 bg-transparent px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-white/5"
            >
                <Download className="h-4 w-4" strokeWidth={2} />
                Rapport
            </button>
            <Link
                href={route('factures.create')}
                className="inline-flex items-center gap-2 rounded-xl bg-[#3b82f6] px-4 py-2.5 text-sm font-medium text-white shadow-[0_0_20px_rgba(59,130,246,0.2)] transition hover:bg-blue-600"
            >
                <Plus className="h-4 w-4" strokeWidth={2} />
                Créer Facture
            </Link>
        </div>
    );
}

export default function DashboardHome({
    kpis,
    revenue_chart,
    invoice_distribution,
    recent_activity,
}) {
    return (
        <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <KpiChiffreAffaires
                    label="CA Encaissé"
                    value={formatMoney(kpis.ca_encaisse.amount)}
                    trendPercent={kpis.ca_encaisse.trend_percent}
                    sparklineValues={kpis.ca_encaisse.sparkline}
                />
                <KpiDevisEnAttente
                    value={formatMoney(kpis.devis_en_attente.amount)}
                    count={kpis.devis_en_attente.count}
                    sparklineValues={kpis.devis_en_attente.sparkline}
                />
                <KpiFacturesEnRetard
                    count={kpis.factures_en_retard.count}
                    sparklineValues={kpis.factures_en_retard.sparkline}
                />
                <KpiNouveauxClients
                    count={kpis.nouveaux_clients.count}
                    trendPercent={kpis.nouveaux_clients.trend_percent}
                    sparklineValues={kpis.nouveaux_clients.sparkline}
                />
            </div>

            <FinancialAnalysisCard />

            <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
                <RevenueChart data={revenue_chart} />
                <div className="flex min-h-0 lg:col-span-1">
                    <DonutChartCard
                        className="w-full"
                        data={invoice_distribution.data}
                        centerValue={String(invoice_distribution.total)}
                        centerSubtext="Factures"
                    />
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className={`${cardBase} lg:col-span-2`}>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="font-display text-lg font-semibold text-slate-100">
                            Activité Récente
                        </h2>
                        <Link
                            href={route('factures.index')}
                            className="text-xs font-medium text-[#3b82f6] transition hover:text-blue-400"
                        >
                            Voir tout
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] text-left text-sm">
                            <thead>
                                <tr className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                    <th className="pb-3 pr-4 font-medium">
                                        Client / Réf
                                    </th>
                                    <th className="pb-3 pr-4 font-medium">
                                        Type
                                    </th>
                                    <th className="pb-3 pr-4 font-medium">
                                        Montant
                                    </th>
                                    <th className="pb-3 pr-4 font-medium">
                                        Statut
                                    </th>
                                    <th className="pb-3 text-right font-medium">
                                        Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-200">
                                {recent_activity.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="py-8 text-center text-slate-500"
                                        >
                                            Aucune activité récente.
                                        </td>
                                    </tr>
                                ) : (
                                    recent_activity.map((row) => (
                                        <tr
                                            key={row.id}
                                            className="border-t border-slate-800/80"
                                        >
                                            <td className="py-3.5 pr-4">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${row.avatar_class}`}
                                                    >
                                                        {row.initials}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-100">
                                                            {row.client}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {row.ref}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3.5 pr-4 text-slate-400">
                                                {row.type}
                                            </td>
                                            <td className="py-3.5 pr-4 font-semibold text-slate-100">
                                                {row.amount}
                                            </td>
                                            <td className="py-3.5 pr-4">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass[row.status_variant]}`}
                                                >
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="py-3.5 text-right text-slate-400">
                                                {row.date}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className={cardBase}>
                    <h2 className="mb-4 font-display text-lg font-semibold text-slate-100">
                        Raccourcis
                    </h2>
                    <div className="flex flex-col gap-3">
                        <Link
                            href={route('factures.create')}
                            className="flex gap-4 rounded-xl border border-slate-800 bg-[#1e293b]/40 p-4 transition hover:bg-[#1e293b]/70"
                        >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-[#3b82f6]">
                                <FileText className="h-5 w-5" strokeWidth={2} />
                            </div>
                            <div className="min-w-0">
                                <p className="font-semibold text-slate-100">
                                    Nouvelle Facture
                                </p>
                                <p className="mt-0.5 text-xs text-slate-400">
                                    Créer et envoyer une facture
                                </p>
                            </div>
                        </Link>
                        <Link
                            href={route('devis.create')}
                            className="flex gap-4 rounded-xl border border-slate-800 bg-[#1e293b]/40 p-4 transition hover:bg-[#1e293b]/70"
                        >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500">
                                <FileEdit className="h-5 w-5" strokeWidth={2} />
                            </div>
                            <div className="min-w-0">
                                <p className="font-semibold text-slate-100">
                                    Nouveau Devis
                                </p>
                                <p className="mt-0.5 text-xs text-slate-400">
                                    Proposer une offre commerciale
                                </p>
                            </div>
                        </Link>
                        <Link
                            href={route('clients.index')}
                            className="flex gap-4 rounded-xl border border-slate-800 bg-[#1e293b]/40 p-4 transition hover:bg-[#1e293b]/70"
                        >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400">
                                <UserPlus className="h-5 w-5" strokeWidth={2} />
                            </div>
                            <div className="min-w-0">
                                <p className="font-semibold text-slate-100">
                                    Ajouter Client
                                </p>
                                <p className="mt-0.5 text-xs text-slate-400">
                                    Enregistrer un nouveau contact
                                </p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
