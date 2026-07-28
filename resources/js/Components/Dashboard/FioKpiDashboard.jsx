import SimulationAiInsightBlock from '@/Components/Dashboard/SimulationAiInsightBlock';
import SimulationControlsPanel from '@/Components/Dashboard/SimulationControlsPanel';
import SimulationModeToggle from '@/Components/Dashboard/SimulationModeToggle';
import { getActiveDashboardKpis, getProfileById, PROFILE_SIGNALS } from '@/config/kpiProfiles';
import {
    buildKpiAnalytics,
    buildProfileChartPanels,
    buildProfileStatsSummary,
    getKpiMetric,
} from '@/utils/kpiAnalytics';
import { buildProfileAlerts } from '@/utils/profileAlerts';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Minus, Pencil, Sparkles, Zap } from 'lucide-react';
import { memo, useMemo } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

const GLASS_PANEL =
    'border border-glassBorder bg-[linear-gradient(145deg,rgba(11,16,24,0.94)_0%,rgba(8,12,18,0.9)_100%)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.4)]';

function TrendBadge({ trend }) {
    const tone = trend?.tone ?? 'neutral';
    const Icon = tone === 'up' ? ArrowUpRight : tone === 'down' ? ArrowDownRight : Minus;
    const className =
        tone === 'up'
            ? 'border-neonMint/25 bg-neonMint/10 text-neonMint'
            : tone === 'down'
              ? 'border-rose-400/25 bg-rose-400/10 text-rose-300'
              : 'border-white/10 bg-white/5 text-slate-400';

    return (
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${className}`}>
            <Icon className="h-3 w-3" />
            {trend?.label ?? 'N/A'}
        </span>
    );
}

function AlertToneBadge({ tone }) {
    const className =
        tone === 'critique'
            ? 'border-red-500/30 bg-red-500/10 text-red-300'
            : tone === 'attention'
              ? 'border-[#FF8A00]/30 bg-[#FF8A00]/10 text-[#FF8A00]'
              : tone === 'sain'
                ? 'border-neonMint/30 bg-neonMint/10 text-neonMint'
                : 'border-white/10 bg-white/5 text-slate-300';

    const label =
        tone === 'critique'
            ? 'Critique'
            : tone === 'attention'
              ? 'Vigilance'
              : tone === 'sain'
                ? 'Sain'
                : 'Info';

    return (
        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${className}`}>
            {label}
        </span>
    );
}

const MiniAreaChart = memo(function MiniAreaChart({ data, color, fillId, dashed = false }) {
    if (!data?.length) {
        return null;
    }

    return (
        <ResponsiveContainer width="100%" height={56}>
            <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <defs>
                    <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.45} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <Area
                    type="monotone"
                    dataKey="v"
                    stroke={color}
                    strokeWidth={2}
                    strokeDasharray={dashed ? '6 4' : undefined}
                    fill={`url(#${fillId})`}
                    isAnimationActive={false}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
});

function ChartTooltip({ active, payload, label, valueFormat = 'number' }) {
    if (!active || !payload?.length) {
        return null;
    }

    const formatValue = (value) => {
        if (typeof value !== 'number') {
            return value;
        }

        if (valueFormat === 'currency') {
            return new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
            }).format(value);
        }

        if (valueFormat === 'percent') {
            return `${value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`;
        }

        return value.toLocaleString('fr-FR');
    };

    return (
        <div className="rounded-xl border border-white/10 bg-[#0a1018]/95 px-3 py-2 text-xs shadow-2xl backdrop-blur-md">
            <p className="mb-1 font-medium text-white">{label}</p>
            {payload.map((entry) => (
                <p key={entry.name} style={{ color: entry.color }}>
                    {entry.name}: {formatValue(entry.value)}
                </p>
            ))}
        </div>
    );
}

function ProfileChartPanel({ panel, chartLabels, simulationMode = false }) {
    const valueFormat = panel.id === 'margin-pct' ? 'percent' : 'currency';
    const chartRows = chartLabels.map((label, index) => {
        const row = { label };

        panel.series.forEach((serie) => {
            row[serie.key] = serie.data[index] ?? 0;
        });

        return row;
    });

    return (
        <div className={`${GLASS_PANEL} overflow-hidden rounded-[24px] p-5 sm:p-6`}>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Courbe Fio</p>
                    <h3 className="font-display mt-1 text-lg font-bold text-white">{panel.title}</h3>
                    <p className="text-xs text-slate-400">
                        {simulationMode ? `${panel.subtitle} · projection 6 mois incluse` : panel.subtitle}
                    </p>
                </div>
                {simulationMode && (
                    <span className="rounded-full border border-neonBlue/25 bg-neonBlue/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-neonBlue">
                        What-If
                    </span>
                )}
            </div>
            <div className="h-[240px] w-full">
                {panel.type === 'bar' ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartRows}>
                            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                            <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                            <Tooltip content={<ChartTooltip valueFormat={valueFormat} />} />
                            {panel.series.map((serie) => (
                                <Bar key={serie.key} dataKey={serie.key} name={serie.label} fill={serie.color} radius={[6, 6, 0, 0]} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                ) : panel.type === 'lines' ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartRows}>
                            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                            <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
                            <Tooltip content={<ChartTooltip valueFormat={valueFormat} />} />
                            {panel.series.map((serie) => (
                                <Line
                                    key={serie.key}
                                    type="monotone"
                                    dataKey={serie.key}
                                    name={serie.label}
                                    stroke={serie.color}
                                    strokeWidth={2.5}
                                    dot={false}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartRows}>
                            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                            <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
                            <Tooltip content={<ChartTooltip valueFormat={valueFormat} />} />
                            {panel.series.map((serie, index) => (
                                <Area
                                    key={serie.key}
                                    type="monotone"
                                    dataKey={serie.key}
                                    name={serie.label}
                                    stroke={serie.color}
                                    strokeWidth={index === 0 ? 2.5 : 2}
                                    fill={serie.color}
                                    fillOpacity={panel.type === 'combo' ? 0.08 : 0.18}
                                />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
            <div className="mt-4 flex flex-wrap gap-4 border-t border-white/6 pt-4">
                {panel.series.map((serie) => (
                    <div key={serie.key} className="flex items-center gap-2">
                        <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: serie.color, boxShadow: `0 0 10px ${serie.color}88` }}
                        />
                        <span className="text-xs text-slate-400">{serie.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function FioKpiCard({ kpi, metric, index, isTriggered = false, simulationMode = false }) {
    const isEssential = kpi.tier === 'essential';
    const color = isEssential ? '#00FF9D' : '#00F0FF';

    return (
        <motion.article
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.035, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`group relative overflow-hidden rounded-[22px] p-5 transition duration-500 ${GLASS_PANEL} ${
                isTriggered
                    ? 'border-amber-400/35 shadow-[0_0_24px_rgba(251,191,36,0.08)]'
                    : isEssential
                      ? 'hover:border-neonMint/35'
                      : 'hover:border-neonBlue/30'
            }`}
        >
            <div
                className={`absolute inset-y-0 left-0 w-[3px] ${
                    isTriggered ? 'bg-amber-400' : kpi.alert ? 'bg-amber-400/70' : isEssential ? 'bg-neonMint' : 'bg-slate-500'
                }`}
            />
            <div className="relative z-10">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{kpi.group}</p>
                        <h3 className="mt-1 text-sm font-medium leading-snug text-slate-100">{kpi.name}</h3>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        {isTriggered && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                                <AlertTriangle className="h-3 w-3" />
                                Alerte
                            </span>
                        )}
                        <TrendBadge trend={metric.trend} />
                    </div>
                </div>

                <div className="mt-5">
                    {metric.live ? (
                        <>
                            <p className="font-display text-[2rem] font-bold leading-none tracking-tight text-white">
                                {metric.value ?? '—'}
                            </p>
                            {metric.hint ? <p className="mt-2 text-xs text-slate-400">{metric.hint}</p> : null}
                            {simulationMode && (
                                <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-neonBlue/80">
                                    Valeur projetee
                                </p>
                            )}
                        </>
                    ) : (
                        <p className="text-sm text-slate-500">{metric.hint ?? 'Donnees bientot disponibles'}</p>
                    )}
                </div>

                {metric.sparkline?.length > 0 && (
                    <div className="mt-4 opacity-90">
                        <MiniAreaChart
                            data={metric.sparkline}
                            color={color}
                            fillId={`mini-${kpi.id}`}
                            dashed={simulationMode}
                        />
                    </div>
                )}
            </div>
        </motion.article>
    );
}

function ProfileAlertsStrip({ alerts, simulationMode }) {
    const criticalCount = alerts.filter((item) => item.tone === 'critique').length;
    const watchCount = alerts.filter((item) => item.tone === 'attention').length;
    const preview = alerts.slice(0, 2);

    if (!preview.length) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.45 }}
            className={`${GLASS_PANEL} mt-5 overflow-hidden rounded-3xl p-1`}
        >
            <div className="relative space-y-3 rounded-[23px] bg-obsidian/75 p-4 sm:p-5">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,138,0,0.06),transparent_55%)]" />
                <div className="relative flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-400/10">
                            <Zap className="h-4 w-4 text-amber-300" />
                        </span>
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                Signaux profil
                            </p>
                            <p className="text-sm font-semibold text-white">
                                Alertes {simulationMode ? '· projection' : '· temps reel'}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wider">
                        {criticalCount > 0 && (
                            <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-red-300">
                                {criticalCount} critique{criticalCount > 1 ? 's' : ''}
                            </span>
                        )}
                        {watchCount > 0 && (
                            <span className="rounded-full border border-[#FF8A00]/30 bg-[#FF8A00]/10 px-2.5 py-1 text-[#FF8A00]">
                                {watchCount} vigilance
                            </span>
                        )}
                    </div>
                </div>
                <div className="relative grid gap-3 md:grid-cols-2">
                    {preview.map((item, index) => (
                        <div
                            key={`${item.title}-${index}`}
                            className="rounded-2xl border border-white/6 bg-white/[0.03] p-4 transition duration-300 hover:border-white/12 hover:bg-white/[0.05]"
                        >
                            <div className="mb-2 flex items-center justify-between gap-2">
                                <p className="text-xs font-semibold text-white">{item.title}</p>
                                <AlertToneBadge tone={item.tone} />
                            </div>
                            <p className="text-xs leading-relaxed text-slate-400">{item.message}</p>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

function HeroStatPill({ label, value, accent = 'mint' }) {
    const accentClass =
        accent === 'blue'
            ? 'border-neonBlue/20 bg-neonBlue/5 text-neonBlue'
            : accent === 'amber'
              ? 'border-amber-400/20 bg-amber-400/5 text-amber-200'
              : 'border-neonMint/20 bg-neonMint/5 text-neonMint';

    return (
        <div className={`rounded-2xl border px-3 py-2.5 text-center backdrop-blur-sm ${accentClass}`}>
            <p className="font-display text-xl font-bold leading-none text-white">{value}</p>
            <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.16em] opacity-80">{label}</p>
        </div>
    );
}

function HeadlineKpiTile({ kpi, metric, triggered, simulationMode, index }) {
    const color = kpi.tier === 'essential' ? '#00FF9D' : '#00F0FF';

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + index * 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className={`group relative overflow-hidden rounded-[22px] p-4 ${GLASS_PANEL} ${
                triggered
                    ? 'border-amber-400/30 shadow-[0_0_24px_rgba(251,191,36,0.08)]'
                    : 'hover:border-neonMint/30'
            }`}
        >
            <div
                className={`absolute inset-y-0 left-0 w-[3px] ${
                    triggered ? 'bg-amber-400' : 'bg-neonMint'
                }`}
            />
            <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-neonMint/5 blur-2xl transition group-hover:bg-neonMint/10" />
            <div className="relative">
                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {kpi.name}
                </p>
                <p className="font-display mt-2 text-2xl font-bold tracking-tight text-white">
                    {metric.value ?? '—'}
                </p>
                <div className="mt-3 flex items-center justify-between gap-2">
                    <TrendBadge trend={metric.trend} />
                    {triggered && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-200">
                            <AlertTriangle className="h-3 w-3" />
                            Alerte
                        </span>
                    )}
                </div>
                {metric.sparkline?.length > 1 && (
                    <div className="mt-3 h-11 opacity-85">
                        <MiniAreaChart
                            data={metric.sparkline}
                            color={color}
                            fillId={`headline-${kpi.id}`}
                            dashed={simulationMode}
                        />
                    </div>
                )}
            </div>
        </motion.div>
    );
}

export default function FioKpiDashboard({
    profileId,
    preferences,
    kpis,
    chartData,
    formatters,
    onEditProfile,
    simulationMode = false,
    hasFinancialData = true,
    onSimulationModeChange,
    sliders,
    onSliderChange,
    onResetSimulation,
    simulatedInsight,
    isSimulatingInsight,
    simulationError,
    backendAlert = null,
}) {
    const profile = getProfileById(profileId);
    const activeKpis = useMemo(
        () => getActiveDashboardKpis(profileId, preferences),
        [profileId, preferences],
    );

    const analytics = useMemo(
        () => buildKpiAnalytics(chartData, kpis, formatters),
        [chartData, kpis, formatters],
    );

    const profileAlerts = useMemo(
        () =>
            buildProfileAlerts({
                activeKpis,
                analytics,
                kpis,
                backendAlert,
                simulationMode,
            }),
        [activeKpis, analytics, kpis, backendAlert, simulationMode],
    );

    const chartPanels = useMemo(
        () => buildProfileChartPanels(activeKpis, analytics),
        [activeKpis, analytics],
    );

    const statsSummary = useMemo(
        () => buildProfileStatsSummary(analytics, activeKpis),
        [analytics, activeKpis],
    );

    const headlineKpis = useMemo(
        () => activeKpis.filter((kpi) => kpi.tier === 'essential').slice(0, 4),
        [activeKpis],
    );

    const triggeredSet = useMemo(() => new Set(profileAlerts.triggeredKpiIds), [profileAlerts.triggeredKpiIds]);
    const profileSignals = PROFILE_SIGNALS[profileId] ?? [];
    const alertCount = profileAlerts.items.filter((item) => item.tone === 'critique' || item.tone === 'attention').length;

    return (
        <section id="fio-kpi-board" className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className={`${GLASS_PANEL} relative overflow-hidden rounded-3xl p-1`}
            >
                <div className="relative overflow-hidden rounded-[23px] bg-obsidian/80 px-6 py-8 sm:px-8 sm:py-10">
                    <div
                        className="pointer-events-none absolute inset-0 opacity-[0.35]"
                        aria-hidden
                        style={{
                            backgroundImage:
                                'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                            backgroundSize: '48px 48px',
                        }}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(0,255,157,0.12),transparent_42%),radial-gradient(circle_at_10%_90%,rgba(0,240,255,0.1),transparent_38%)]" />
                    <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-neonMint/10 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-neonBlue/10 blur-3xl" />

                    <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                            <div className="relative shrink-0">
                                <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[20px] border border-neonMint/25 bg-[linear-gradient(145deg,rgba(0,255,157,0.14)_0%,rgba(0,240,255,0.06)_100%)] text-3xl shadow-[0_0_48px_rgba(0,255,157,0.12),inset_0_1px_1px_rgba(255,255,255,0.12)]">
                                    {profile.icon}
                                </div>
                                <span className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-obsidian bg-neonMint text-obsidian shadow-[0_0_16px_rgba(0,255,157,0.45)]">
                                    <Sparkles className="h-3.5 w-3.5" />
                                </span>
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center gap-2 rounded-full border border-neonMint/20 bg-neonMint/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-neonMint">
                                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neonMint shadow-[0_0_8px_rgba(0,255,157,0.8)]" />
                                        Console Fio
                                    </span>
                                    {simulationMode && (
                                        <span className="rounded-full border border-neonBlue/30 bg-neonBlue/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-neonBlue">
                                            Simulation active
                                        </span>
                                    )}
                                    {kpis?.mois_actuel ? (
                                        <span className="rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-slate-400">
                                            {kpis.mois_actuel}
                                        </span>
                                    ) : null}
                                </div>

                                <h2 className="font-display mt-4 text-[clamp(1.75rem,4vw,2.75rem)] font-bold leading-[1.05] tracking-tight">
                                    <span className="bg-gradient-to-br from-white via-white to-slate-400 bg-clip-text text-transparent">
                                        {profile.name}
                                    </span>
                                </h2>
                                <p className="mt-1 text-sm font-medium capitalize tracking-wide text-neonBlue/90">
                                    {profile.sub}
                                </p>
                                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
                                    {simulationMode
                                        ? 'Projection What-If a 6 mois — KPI, courbes et alertes recalculés en direct selon vos hypotheses.'
                                        : `${activeKpis.length} indicateurs actifs · tendances M-1 et courbes d evolution sur vos saisies mensuelles.`}
                                </p>

                                {profileSignals.length > 0 && (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {profileSignals.slice(0, 4).map((signal) => (
                                            <span
                                                key={signal}
                                                className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-[11px] text-slate-400 transition hover:border-white/14 hover:text-slate-300"
                                            >
                                                {signal}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 xl:items-stretch">
                            <div className="grid grid-cols-3 gap-2">
                                <HeroStatPill label="KPI actifs" value={activeKpis.length} accent="mint" />
                                <HeroStatPill
                                    label="Alimentes"
                                    value={`${statsSummary.liveCount}/${statsSummary.totalEssentials}`}
                                    accent="blue"
                                />
                                <HeroStatPill label="Alertes" value={alertCount} accent="amber" />
                            </div>
                            <button
                                type="button"
                                onClick={onEditProfile}
                                className="group inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_100%)] px-4 py-3 text-xs font-semibold text-slate-100 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] transition duration-300 hover:border-neonMint/35 hover:bg-neonMint/10 hover:text-white"
                            >
                                <Pencil className="h-3.5 w-3.5 transition group-hover:text-neonMint" />
                                Ajuster mes KPI
                            </button>
                        </div>
                    </div>

                    {statsSummary.liveCount > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.15 }}
                            className="relative mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-white/6 bg-black/25 px-4 py-3 backdrop-blur-sm"
                        >
                            <span
                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                                    statsSummary.momentum === 'positive'
                                        ? 'border border-neonMint/25 bg-neonMint/10 text-neonMint'
                                        : statsSummary.momentum === 'cautious'
                                          ? 'border border-rose-400/25 bg-rose-400/10 text-rose-300'
                                          : 'border border-white/10 bg-white/5 text-slate-400'
                                }`}
                            >
                                {statsSummary.momentum === 'positive'
                                    ? 'Dynamique favorable'
                                    : statsSummary.momentum === 'cautious'
                                      ? 'Points de vigilance'
                                      : 'Tendances stables'}
                            </span>
                            <p className="text-xs text-slate-400">
                                {statsSummary.upCount} en hausse · {statsSummary.downCount} en baisse vs M-1
                            </p>
                        </motion.div>
                    )}
                </div>
            </motion.div>

            {headlineKpis.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {headlineKpis.map((kpi, index) => (
                        <HeadlineKpiTile
                            key={kpi.id}
                            kpi={kpi}
                            metric={getKpiMetric(analytics, kpi.id)}
                            triggered={triggeredSet.has(kpi.id)}
                            simulationMode={simulationMode}
                            index={index}
                        />
                    ))}
                </div>
            )}

            <ProfileAlertsStrip alerts={profileAlerts.items} simulationMode={simulationMode} />

            <section className={`${GLASS_PANEL} rounded-[24px] p-5 sm:p-6`}>
                <SimulationModeToggle
                    enabled={simulationMode}
                    onChange={onSimulationModeChange}
                    disabled={!hasFinancialData}
                />
                {!hasFinancialData && (
                    <p className="mt-3 text-sm text-gray-500">
                        Ajoutez une saisie mensuelle pour activer le simulateur What-If.
                    </p>
                )}
                {simulationMode && hasFinancialData && (
                    <>
                        <SimulationControlsPanel
                            sliders={sliders}
                            onChange={onSliderChange}
                            onReset={onResetSimulation}
                        />
                        <SimulationAiInsightBlock
                            enabled={simulationMode}
                            insight={simulatedInsight}
                            isLoading={isSimulatingInsight}
                            error={simulationError}
                        />
                    </>
                )}
            </section>

            {chartPanels.length > 0 && (
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                    {chartPanels.map((panel, index) => (
                        <motion.div
                            key={panel.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.08 + index * 0.06 }}
                            className={index === 0 && chartPanels.length % 2 === 1 ? 'xl:col-span-2' : ''}
                        >
                            <ProfileChartPanel
                                panel={panel}
                                chartLabels={analytics.chartLabels}
                                simulationMode={simulationMode}
                            />
                        </motion.div>
                    ))}
                </div>
            )}

            <div>
                <div className="mb-4 flex items-end justify-between gap-3">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                            Grille detaillee
                        </p>
                        <h3 className="font-display text-xl font-bold text-white">Tous vos indicateurs</h3>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {activeKpis.map((kpi, index) => (
                        <FioKpiCard
                            key={kpi.id}
                            kpi={kpi}
                            index={index}
                            metric={getKpiMetric(analytics, kpi.id)}
                            isTriggered={triggeredSet.has(kpi.id)}
                            simulationMode={simulationMode}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
