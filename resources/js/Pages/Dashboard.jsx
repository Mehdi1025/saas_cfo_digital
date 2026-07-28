import AppDashboardLayout from '@/Layouts/AppDashboardLayout';
import ConnectBankButton from '@/Components/Banking/ConnectBankButton';
import CashflowTimeMachine from '@/Components/Dashboard/CashflowTimeMachine';
import FioKpiDashboard from '@/Components/Dashboard/FioKpiDashboard';
import KpiProfileOnboardingModal from '@/Components/Dashboard/KpiProfileOnboardingModal';
import CfoPageShell from '@/Components/CfoPageShell';
import SimulationAiInsightBlock from '@/Components/Dashboard/SimulationAiInsightBlock';
import SimulationControlsPanel from '@/Components/Dashboard/SimulationControlsPanel';
import SimulationModeToggle from '@/Components/Dashboard/SimulationModeToggle';
import { getActiveDashboardKpis } from '@/config/kpiProfiles';
import { useDashboardSimulation } from '@/hooks/useDashboardSimulation';
import { useBankingReturnScroll } from '@/hooks/useBankingReturnScroll';
import { buildKpiAnalytics } from '@/utils/kpiAnalytics';
import { buildFioChartData } from '@/utils/financialSimulation';
import { buildProfileAlerts } from '@/utils/profileAlerts';
import { useForm, usePage, Link } from '@inertiajs/react';
import axios from 'axios';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
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
    'border border-glassBorder bg-[linear-gradient(145deg,rgba(11,16,24,0.94)_0%,rgba(8,12,18,0.9)_100%)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.4)]';

const NEON_BLUE = '#00F0FF';
const NEON_MINT = '#00FF9D';
const ORANGE = '#FF8A00';

const SparklineArea = memo(function SparklineArea({ data, stroke, fillId }) {
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
                    isAnimationActive={false}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
});

function MainChartTooltip({ active, payload, label }) {
    if (!active || !payload?.length) {
        return null;
    }

    return (
        <div className="rounded-lg border border-white/10 bg-obsidian px-3 py-2 text-xs shadow-xl">
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

function formatShortDate(value) {
    if (!value) {
        return '—';
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return String(value);
    }

    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(parsed);
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
        }).format(numericValue / 1000)}k €`;
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
    const { dashboardData, viewedUser, aiInsight, aiInsightStatus = 'unavailable', flash, auth, banking } = usePage().props;
    const hasActiveSubscription = Boolean(auth?.user?.can_access_app);
    const needsKpiOnboarding = Boolean(auth?.user?.needs_kpi_onboarding) && !viewedUser;
    const [showKpiOnboarding, setShowKpiOnboarding] = useState(needsKpiOnboarding);
    useBankingReturnScroll('open-banking');
    const kpiProfile = auth?.user?.kpi_profile;
    const kpiPreferences = auth?.user?.kpi_preferences ?? { enabled_secondary: [] };
    const [isAiInsightOpen, setIsAiInsightOpen] = useState(false);
    const [resolvedAiInsight, setResolvedAiInsight] = useState(aiInsight);
    const [resolvedAiInsightStatus, setResolvedAiInsightStatus] = useState(aiInsightStatus);
    const {
        data: aiInsightForm,
        setData: setAiInsightForm,
        patch: updateAiInsight,
        processing: isUpdatingAiInsight,
        errors: aiInsightErrors,
        recentlySuccessful: aiInsightUpdated,
    } = useForm({
        edited_content: aiInsight?.edited_content ?? aiInsight?.content ?? '',
    });

    useEffect(() => {
        setShowKpiOnboarding(needsKpiOnboarding);
    }, [needsKpiOnboarding]);

    useEffect(() => {
        if (resolvedAiInsightStatus !== 'pending') {
            return undefined;
        }

        let cancelled = false;

        axios
            .get(route('dashboard.ai-insight'), {
                params: viewedUser?.id ? { viewed_user_id: viewedUser.id } : {},
            })
            .then((response) => {
                if (cancelled) {
                    return;
                }

                setResolvedAiInsight(response.data?.aiInsight ?? null);
                setResolvedAiInsightStatus(response.data?.aiInsightStatus ?? 'unavailable');
            })
            .catch(() => {
                if (cancelled) {
                    return;
                }

                setResolvedAiInsightStatus('unavailable');
            });

        return () => {
            cancelled = true;
        };
    }, [resolvedAiInsightStatus, viewedUser?.id]);

    useEffect(() => {
        if (!resolvedAiInsight) {
            return;
        }

        setAiInsightForm(
            'edited_content',
            resolvedAiInsight.edited_content ?? resolvedAiInsight.content ?? '',
        );
    }, [resolvedAiInsight, setAiInsightForm]);

    const submitAiInsightUpdate = (event) => {
        event.preventDefault();

        if (!resolvedAiInsight?.id) {
            return;
        }

        updateAiInsight(route('admin.ai-insights.update', resolvedAiInsight.id), {
            preserveScroll: true,
        });
    };

    const kpis = dashboardData?.kpis_mensuels ?? {
        mois_actuel: null,
        chiffre_affaires: 0,
        charges_totales: 0,
        marge_nette: 0,
        cac: null,
        ltv: null,
        clients_count: 0,
        marketing_budget: 0,
    };

    const alert = dashboardData?.alerte ?? null;
    const evolution = dashboardData?.graphique_evolution ?? [];
    const chartData = useMemo(
        () =>
            evolution.map((item) => ({
                month: item.mois,
                revenus: Number(item.ca ?? 0),
                charges: Number(item.charges ?? 0),
                clients_count: Number(item.clients_count ?? 0),
                marketing_budget: Number(item.marketing_budget ?? 0),
            })),
        [evolution],
    );
    const hasFinancialData = chartData.length > 0;

    const {
        simulationMode,
        setSimulationMode,
        sliders,
        updateSlider,
        resetSimulation,
        activeChartData,
        simulationChart,
        healthScore,
        healthTone,
        simulatedInsight,
        isSimulatingInsight,
        simulationError,
        simulatedHorizonKpis,
    } = useDashboardSimulation({
        historicalChartData: chartData,
        baselineKpis: kpis,
        hasFinancialData,
        viewedUserId: viewedUser?.id,
    });

    const displayKpis = useMemo(
        () => (simulationMode && simulatedHorizonKpis ? simulatedHorizonKpis : kpis),
        [simulationMode, simulatedHorizonKpis, kpis],
    );

    const fioChartData = useMemo(
        () => buildFioChartData(chartData, simulationMode, simulationChart),
        [chartData, simulationMode, simulationChart],
    );

    const activeKpisForProfile = useMemo(() => {
        if (!kpiProfile) {
            return [];
        }

        return getActiveDashboardKpis(kpiProfile, kpiPreferences);
    }, [kpiProfile, kpiPreferences]);

    const kpiFormatters = useMemo(
        () => ({ formatCompactCurrency, formatPercentage, formatCurrency }),
        [],
    );

    const fioAnalytics = useMemo(() => {
        if (!kpiProfile || viewedUser) {
            return null;
        }

        return buildKpiAnalytics(fioChartData, displayKpis, kpiFormatters);
    }, [kpiProfile, viewedUser, fioChartData, displayKpis, kpiFormatters]);

    const profileAlertBundle = useMemo(() => {
        if (!kpiProfile || viewedUser || !fioAnalytics) {
            return null;
        }

        return buildProfileAlerts({
            activeKpis: activeKpisForProfile,
            analytics: fioAnalytics,
            kpis: displayKpis,
            backendAlert: alert,
            simulationMode,
        });
    }, [kpiProfile, viewedUser, fioAnalytics, activeKpisForProfile, displayKpis, alert, simulationMode]);


    const netMarginPercentage =
        kpis.chiffre_affaires > 0
            ? (kpis.marge_nette / kpis.chiffre_affaires) * 100
            : null;

    const healthPie = useMemo(
        () => [
            { name: 'Score', value: healthScore },
            { name: 'Reste', value: Math.max(0, 100 - healthScore) },
        ],
        [healthScore],
    );

    const recentRows = useMemo(() => {
        const bankTransactions = banking?.recent_transactions ?? [];

        if (bankTransactions.length > 0) {
            return bankTransactions.map((transaction) => {
                const amount = Number(transaction.amount ?? 0);
                const isCredit = amount >= 0;

                return {
                    id: `bank-${transaction.id}`,
                    date: formatShortDate(transaction.date),
                    description: transaction.label || 'Operation bancaire',
                    category: isCredit ? 'Entree' : 'Sortie',
                    categoryTone: isCredit ? 'credit' : 'debit',
                    amount,
                    source: 'bank',
                };
            });
        }

        return [...chartData].reverse().slice(0, 3).map((row) => ({
            id: `manual-${row.month}`,
            date: row.month,
            description: 'Periode financiere',
            category: 'Revenu',
            categoryTone: 'revenue',
            amount: Number(row.revenus ?? 0),
            source: 'manual',
        }));
    }, [banking?.recent_transactions, chartData]);
    const revenuesSpark = useMemo(
        () => sparklineFrom(chartData.map((item) => item.revenus)),
        [chartData],
    );
    const marginSpark = useMemo(
        () =>
            sparklineFrom(
                chartData.map((item) =>
                    item.revenus > 0 ? ((item.revenus - item.charges) / item.revenus) * 100 : 0,
                ),
            ),
        [chartData],
    );
    const ltvSpark = useMemo(
        () => sparklineFrom(chartData.map(() => kpis.ltv ?? 0)),
        [chartData, kpis.ltv],
    );

    const alertItems = useMemo(() => {
        if (profileAlertBundle) {
            return profileAlertBundle.items;
        }

        const items = [];

        if (alert) {
            items.push({
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
            items.push({
                tone: 'neutral',
                title: 'Donnees incompletes',
                message:
                    'Le CAC ou la LTV necessitent un nombre de clients superieur a zero.',
            });
        }

        if (!items.length) {
            items.push({
                tone: 'neutral',
                title: 'Aucune alerte bloquante',
                message:
                    'Vos indicateurs ne presentent pas de risque majeur sur le mois courant.',
            });
        }

        return items;
    }, [profileAlertBundle, alert, kpis.cac, kpis.ltv]);

    const renderMainChartTooltip = useCallback((props) => <MainChartTooltip {...props} />, []);

    const aiInsightEmptyMessage =
        resolvedAiInsightStatus === 'missing_data'
            ? 'Saisissez vos donnees mensuelles pour generer l analyse IA.'
            : resolvedAiInsightStatus === 'pending'
              ? 'Analyse IA en cours de generation...'
              : 'L analyse IA est momentanement indisponible. Le dashboard reste accessible.';

    return (
        <AppDashboardLayout
            title="Tableau de bord mensuel"
            badge={kpis.mois_actuel ?? 'Aucune periode'}
        >
            <CfoPageShell simulationMode={simulationMode}>
                <div className="mx-auto max-w-[1600px] space-y-8">
                    {flash?.success ? (
                        <div className="rounded-2xl border border-neonMint/30 bg-neonMint/10 px-4 py-3 text-sm text-neonMint">
                            {flash.success}
                        </div>
                    ) : null}
                    {flash?.error ? (
                        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                            {flash.error}
                        </div>
                    ) : null}

                    {!hasActiveSubscription && !viewedUser && (
                        <section className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-amber-100">
                                        Debloquez toutes les fonctionnalites
                                    </p>
                                    <p className="mt-1 text-sm text-amber-100/80">
                                        Vous etes sur le plan gratuit. Abonnez-vous pour acceder au
                                        copilote IA, a la facturation et aux outils avances.
                                    </p>
                                </div>
                                <Link
                                    href={route('profile.edit') + '#subscription'}
                                    className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#18c98f] px-5 py-3 text-sm font-bold text-black transition hover:bg-[#25e0a4]"
                                >
                                    Voir les offres
                                </Link>
                            </div>
                        </section>
                    )}

                    {kpiProfile && !viewedUser ? (
                        <FioKpiDashboard
                            profileId={kpiProfile}
                            preferences={kpiPreferences}
                            kpis={displayKpis}
                            chartData={fioChartData}
                            formatters={kpiFormatters}
                            onEditProfile={() => setShowKpiOnboarding(true)}
                            simulationMode={simulationMode}
                            hasFinancialData={hasFinancialData}
                            onSimulationModeChange={setSimulationMode}
                            sliders={sliders}
                            onSliderChange={updateSlider}
                            onResetSimulation={resetSimulation}
                            simulatedInsight={simulatedInsight}
                            isSimulatingInsight={isSimulatingInsight}
                            simulationError={simulationError}
                            backendAlert={alert}
                        />
                    ) : !viewedUser && needsKpiOnboarding ? (
                        <section className={`${GLASS_PANEL} relative overflow-hidden rounded-3xl p-1`}>
                            <div className="relative overflow-hidden rounded-[23px] bg-obsidian/80 px-6 py-14 text-center sm:px-10 sm:py-16">
                                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,157,0.08),transparent_55%)]" />
                                <div className="relative mx-auto max-w-lg">
                                    <span className="inline-flex items-center gap-2 rounded-full border border-neonMint/20 bg-neonMint/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-neonMint">
                                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neonMint" />
                                        Console Fio
                                    </span>
                                    <h2 className="font-display mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                        Configurez votre cockpit
                                    </h2>
                                    <p className="mx-auto mt-3 text-sm leading-relaxed text-slate-400">
                                        Choisissez votre profil metier pour afficher instantanement vos indicateurs
                                        essentiels, courbes d evolution et alertes sectorielles.
                                    </p>
                                </div>
                            </div>
                        </section>
                    ) : (
                <section id="kpi-grid" className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                    <div className={`${GLASS_PANEL} group relative overflow-hidden rounded-2xl p-6 transition-colors duration-500 hover:border-neonBlue/30`}>
                        <div className="absolute right-0 top-0 p-4 opacity-20 transition-opacity group-hover:opacity-40">
                            <svg className="h-10 w-10 text-neonBlue" viewBox="0 0 24 24" fill="none" aria-hidden>
                                <path d="M4 16l4-4 4 4 8-8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M16 8h4v4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div className="relative z-10 flex h-full flex-col justify-between">
                            <div>
                                <h3 className="mb-1 text-sm font-medium uppercase tracking-wider text-gray-400">
                                    Chiffre d&apos;affaires
                                </h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold tracking-tighter text-white">
                                        {formatCompactCurrency(kpis.chiffre_affaires)}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-6 h-12 w-full">
                                <SparklineArea data={revenuesSpark} stroke={NEON_BLUE} fillId="sp-revenue" />
                            </div>
                        </div>
                    </div>

                    <div className={`${GLASS_PANEL} group relative overflow-hidden rounded-2xl p-6 transition-colors duration-500 hover:border-neonMint/30`}>
                        <div className="absolute right-0 top-0 p-4 opacity-20 transition-opacity group-hover:opacity-40">
                            <svg className="h-10 w-10 text-neonMint" viewBox="0 0 24 24" fill="none" aria-hidden>
                                <path d="M8 8.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" stroke="currentColor" strokeWidth="1.5" />
                                <path d="M16 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" stroke="currentColor" strokeWidth="1.5" />
                                <path d="M16 8L8 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </div>
                        <div className="relative z-10 flex h-full flex-col justify-between">
                            <div>
                                <h3 className="mb-1 text-sm font-medium uppercase tracking-wider text-gray-400">
                                    Marge nette
                                </h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold tracking-tighter text-white">
                                        {formatPercentage(netMarginPercentage)}
                                    </span>
                                </div>
                                <p className="mt-3 text-sm text-neonMint/70">
                                    Montant net : {formatCurrency(kpis.marge_nette)}
                                </p>
                            </div>
                            <div className="mt-6 h-12 w-full">
                                <SparklineArea data={marginSpark} stroke={NEON_MINT} fillId="sp-margin" />
                            </div>
                        </div>
                    </div>

                    <div className={`${GLASS_PANEL} group relative overflow-hidden rounded-2xl p-6 transition-colors duration-500 hover:border-white/20`}>
                        <div className="absolute right-0 top-0 p-4 opacity-10">
                            <svg className="h-10 w-10 text-white" viewBox="0 0 24 24" fill="none" aria-hidden>
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" />
                                <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
                                <path d="M20 8v6M23 11h-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </div>
                        <div className="relative z-10 flex h-full flex-col justify-between">
                            <div>
                                <div className="mb-1 flex items-start justify-between">
                                    <h3 className="text-sm font-medium uppercase tracking-wider text-gray-400">CAC</h3>
                                    {kpis.cac === null && (
                                        <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-medium text-gray-500">
                                            Pas de donnees
                                        </span>
                                    )}
                                </div>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className={`text-3xl tracking-tighter ${kpis.cac === null ? 'font-light italic text-gray-600' : 'font-bold text-white'}`}>
                                        {kpis.cac === null ? 'N/A' : formatCompactCurrency(kpis.cac)}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-6 flex items-center gap-2 text-xs text-gray-500">
                                <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                                </svg>
                                <span>Cout d&apos;acquisition moyen par client</span>
                            </div>
                        </div>
                    </div>

                    <div className={`${GLASS_PANEL} group relative overflow-hidden rounded-2xl p-6 transition-colors duration-500 hover:border-neonBlue/30`}>
                        <div className="absolute right-0 top-0 p-4 opacity-20 transition-opacity group-hover:opacity-40">
                            <svg className="h-10 w-10 text-neonBlue" viewBox="0 0 24 24" fill="none" aria-hidden>
                                <path d="M12 3 4 10l8 11 8-11-8-7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div className="relative z-10 flex h-full flex-col justify-between">
                            <div>
                                <h3 className="mb-1 text-sm font-medium uppercase tracking-wider text-gray-400">LTV</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold tracking-tighter text-white">
                                        {kpis.ltv === null ? 'N/A' : formatCompactCurrency(kpis.ltv)}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-6 h-12 w-full">
                                <SparklineArea data={ltvSpark} stroke={NEON_BLUE} fillId="sp-ltv" />
                            </div>
                        </div>
                    </div>
                </section>
                    )}

                    {!kpiProfile && (
                    <section className={`${GLASS_PANEL} rounded-2xl p-5`}>
                        <SimulationModeToggle
                            enabled={simulationMode}
                            onChange={setSimulationMode}
                            disabled={!hasFinancialData}
                        />
                        {!hasFinancialData && (
                            <p className="mt-3 text-sm text-gray-500">
                                Ajoutez une saisie mensuelle pour activer le simulateur What-If.
                            </p>
                        )}
                    </section>
                    )}

                    {viewedUser && (
                        <section className={`${GLASS_PANEL} rounded-2xl p-4`}>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neonMint">
                                        Vue administrateur
                                    </p>
                                    <h2 className="mt-1 text-lg font-semibold text-white">
                                        Dashboard de {viewedUser.name}
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-400">
                                        {viewedUser.email}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-300">
                                    Statut Stripe : {viewedUser.stripe_status ?? 'Non defini'}
                                </div>
                            </div>
                        </section>
                    )}

                    <section id="open-banking" className={`${GLASS_PANEL} scroll-mt-28 rounded-2xl p-5 sm:p-6`}>
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neonBlue">
                                    Open Banking
                                </p>
                                <h2 className="mt-1 text-lg font-semibold text-white">
                                    Connectez votre banque
                                </h2>
                                <p className="mt-1 max-w-xl text-sm text-gray-400">
                                    Connexion via Bridge, agrégateur open banking français. En sandbox,
                                    choisissez Demo Bank et utilisez le login{' '}
                                    <span className="font-mono text-neonMint">success</span>.
                                </p>
                            </div>
                            <ConnectBankButton
                                className="w-full lg:w-auto lg:min-w-[320px]"
                                returnTo="dashboard"
                                returnSection="open-banking"
                            />
                        </div>

                        {banking?.accounts?.length > 0 && (
                            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                {banking.accounts.map((account) => (
                                    <div
                                        key={account.id}
                                        className="rounded-xl border border-neonMint/20 bg-neonMint/5 px-4 py-3"
                                    >
                                        <p className="text-sm font-semibold text-white">{account.bank_name}</p>
                                        <p className="mt-1 text-xs text-slate-400">
                                            {account.iban ?? 'Compte connecte'} · {account.type}
                                        </p>
                                        <p className="font-display mt-2 text-xl font-bold text-neonMint">
                                            {formatCurrency(account.balance)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <CashflowTimeMachine />

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    <div className="space-y-8 lg:col-span-2">
                        {(!kpiProfile || viewedUser) && (
                        <section id="main-chart-section" className={`${GLASS_PANEL} relative overflow-hidden rounded-3xl p-1`}>
                            <div className="h-full rounded-[23px] bg-obsidian/70 p-6">
                                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-lg font-semibold tracking-wide text-white">
                                            Revenus vs Charges Totales
                                        </h2>
                                        <p className="mt-1 text-sm text-gray-400">
                                            {simulationMode
                                                ? 'Historique solide + projection 6 mois (pointille)'
                                                : 'Evolution sur les mois enregistres'}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            className="rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-white/20"
                                        >
                                            12M
                                        </button>
                                        <button
                                            type="button"
                                            className="rounded-lg border border-transparent bg-transparent px-3 py-1 text-xs font-medium text-gray-400 transition-colors hover:text-white"
                                        >
                                            YTD
                                        </button>
                                    </div>
                                </div>

                                {hasFinancialData ? (
                                    <div className="h-[400px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={activeChartData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                                                <defs>
                                                    <linearGradient id="fillRev" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor={NEON_BLUE} stopOpacity={0.22} />
                                                        <stop offset="100%" stopColor={NEON_BLUE} stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="fillChg" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor={ORANGE} stopOpacity={0.12} />
                                                        <stop offset="100%" stopColor={ORANGE} stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="fillRevSim" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor={NEON_BLUE} stopOpacity={0.12} />
                                                        <stop offset="100%" stopColor={NEON_BLUE} stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="fillChgSim" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor={ORANGE} stopOpacity={0.08} />
                                                        <stop offset="100%" stopColor={ORANGE} stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                                                <XAxis
                                                    dataKey="month"
                                                    tick={{ fill: '#9CA3AF', fontSize: 12, fontFamily: 'Space Grotesk, sans-serif' }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />
                                                <YAxis
                                                    tick={{ fill: '#9CA3AF', fontSize: 12, fontFamily: 'Space Grotesk, sans-serif' }}
                                                    tickFormatter={(v) => `${v >= 1000 ? Math.round(v / 1000) : v}k €`}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    width={48}
                                                />
                                                <Tooltip content={renderMainChartTooltip} />
                                                <Area
                                                    type="monotone"
                                                    dataKey="chargesHist"
                                                    name="Charges Totales"
                                                    stroke={ORANGE}
                                                    strokeWidth={2}
                                                    fill="url(#fillChg)"
                                                    connectNulls={false}
                                                    isAnimationActive={false}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="revenusHist"
                                                    name="Revenus"
                                                    stroke={NEON_BLUE}
                                                    strokeWidth={3}
                                                    fill="url(#fillRev)"
                                                    connectNulls={false}
                                                    isAnimationActive={false}
                                                />
                                                {simulationMode && (
                                                    <>
                                                        <Area
                                                            type="monotone"
                                                            dataKey="chargesSim"
                                                            name="Charges (simulation)"
                                                            stroke={ORANGE}
                                                            strokeWidth={2}
                                                            strokeDasharray="8 6"
                                                            fill="url(#fillChgSim)"
                                                            connectNulls
                                                            isAnimationActive={false}
                                                        />
                                                        <Area
                                                            type="monotone"
                                                            dataKey="revenusSim"
                                                            name="Revenus (simulation)"
                                                            stroke={NEON_BLUE}
                                                            strokeWidth={3}
                                                            strokeDasharray="8 6"
                                                            fill="url(#fillRevSim)"
                                                            connectNulls
                                                            isAnimationActive={false}
                                                        />
                                                    </>
                                                )}
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center">
                                        <p className="text-lg font-semibold text-white">Aucune donnee financiere</p>
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
                                    {simulationMode && (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <div className="h-0.5 w-5 border-t-2 border-dashed border-neonBlue" />
                                                <span className="text-sm text-gray-400">Projection revenus</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-0.5 w-5 border-t-2 border-dashed border-[#FF8A00]" />
                                                <span className="text-sm text-gray-400">Projection charges</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {simulationMode && (
                                    <SimulationControlsPanel
                                        sliders={sliders}
                                        onChange={updateSlider}
                                        onReset={resetSimulation}
                                    />
                                )}
                            </div>
                        </section>
                        )}

                        <section id="recent-transactions" className={`${GLASS_PANEL} rounded-3xl p-6`}>
                            <div className="mb-6 flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-semibold tracking-wide text-white">Flux Recents</h2>
                                    <p className="mt-1 text-xs text-gray-500">
                                        {recentRows[0]?.source === 'bank'
                                            ? 'Dernieres operations synchronisees via Bridge'
                                            : 'Dernieres periodes saisies manuellement'}
                                    </p>
                                </div>
                                {banking?.accounts?.length > 0 && recentRows[0]?.source !== 'bank' && (
                                    <span className="rounded-full border border-neonBlue/20 bg-neonBlue/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-neonBlue">
                                        Banque connectee
                                    </span>
                                )}
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left">
                                    <thead>
                                        <tr className="border-b border-glassBorder">
                                            <th className="pb-3 text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                                            <th className="pb-3 text-xs font-medium uppercase tracking-wider text-gray-500">Description</th>
                                            <th className="pb-3 text-xs font-medium uppercase tracking-wider text-gray-500">Categorie</th>
                                            <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Montant</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-glassBorder text-sm">
                                        {recentRows.length ? (
                                            recentRows.map((row) => (
                                                <tr key={row.id} className="transition-colors hover:bg-white/5">
                                                    <td className="py-4 text-gray-400">{row.date}</td>
                                                    <td className="py-4 font-medium text-white">{row.description}</td>
                                                    <td className="py-4">
                                                        <span
                                                            className={`rounded-md border px-2.5 py-1 text-xs ${
                                                                row.categoryTone === 'credit'
                                                                    ? 'border-neonMint/20 bg-neonMint/10 text-neonMint'
                                                                    : row.categoryTone === 'debit'
                                                                      ? 'border-orange-400/20 bg-orange-400/10 text-orange-300'
                                                                      : 'border-neonBlue/20 bg-neonBlue/10 text-neonBlue'
                                                            }`}
                                                        >
                                                            {row.category}
                                                        </span>
                                                    </td>
                                                    <td
                                                        className={`py-4 text-right font-medium ${
                                                            row.amount >= 0 ? 'text-neonMint' : 'text-orange-300'
                                                        }`}
                                                    >
                                                        {formatCurrency(row.amount)}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="py-5 text-sm text-gray-400">
                                                    {banking?.accounts?.length > 0
                                                        ? 'Aucune transaction synchronisee. Utilisez Resynchroniser dans la section Open Banking.'
                                                        : 'Connectez votre banque ou saisissez vos donnees mensuelles pour afficher vos flux.'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>

                    <div className="space-y-8">
                        <section id="health-score" className={`${GLASS_PANEL} relative flex min-h-[320px] flex-col items-center justify-center rounded-3xl p-6`}>
                            <h2 className="absolute left-6 top-6 text-lg font-semibold tracking-wide text-white">Score de sante</h2>
                            {simulationMode && (
                                <span className="absolute right-6 top-6 rounded-md border border-neonBlue/20 bg-neonBlue/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-neonBlue">
                                    Simule
                                </span>
                            )}

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
                                            isAnimationActive={false}
                                        >
                                            <Cell fill={healthTone.color} />
                                            <Cell fill="rgba(255,255,255,0.05)" />
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                    <span
                                        className={`text-5xl font-bold text-white transition-opacity duration-200 ${healthTone.glow}`}
                                    >
                                        {healthScore}
                                    </span>
                                    <span className="mt-1 text-sm font-medium uppercase tracking-widest text-gray-400">/100</span>
                                </div>
                            </div>
                            <p className="mt-6 max-w-[80%] text-center text-sm text-gray-400">
                                {simulationMode
                                    ? `Projection a 6 mois — ${healthTone.label}.`
                                    : 'Score calcule depuis vos donnees financieres.'}
                            </p>
                        </section>

                        <section id="alerts-panel" className={`${GLASS_PANEL} rounded-3xl p-6`}>
                            <div className="mb-6 flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/10">
                                    <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                        <path d="M7 2v11h3v9l7-12h-4l4-8H7z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold tracking-wide text-white">
                                        {profileAlertBundle ? 'Alertes profil Fio' : 'Alertes'}
                                    </h2>
                                    {profileAlertBundle && (
                                        <p className="mt-0.5 text-xs text-gray-500">
                                            {simulationMode
                                                ? 'Projection What-If · indicateurs 2a du profil'
                                                : 'Indicateurs essentiels + alerte de votre profil metier'}
                                        </p>
                                    )}
                                </div>
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
                                        <div key={`${item.title}-${index}`} className={`relative overflow-hidden rounded-xl border p-4 ${toneClass}`}>
                                            <div className="absolute bottom-0 left-0 top-0 w-1 bg-current shadow-[0_0_10px_currentColor]" />
                                            <div className="pl-2">
                                                <h4 className="mb-1 text-sm font-semibold">{item.title}</h4>
                                                <p className="text-xs leading-relaxed text-gray-400">{item.message}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </div>
                </div>

                    <section className={`${GLASS_PANEL} rounded-3xl p-6`}>
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neonBlue">
                                        Analyse IA
                                    </p>
                                    <h2 className="mt-2 text-lg font-semibold tracking-wide text-white">
                                        Lecture financière du mois
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-400">
                                        {simulationMode
                                            ? 'Analyse What-If en direct via Groq.'
                                            : resolvedAiInsight
                                              ? resolvedAiInsight.is_edited
                                                  ? 'Analyse corrigee par un administrateur.'
                                                  : 'Analyse generee automatiquement par Groq.'
                                              : aiInsightEmptyMessage}
                                    </p>
                                </div>

                                {resolvedAiInsight ? (
                                    <button
                                        type="button"
                                        onClick={() => setIsAiInsightOpen((open) => !open)}
                                        className="w-fit rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-gray-200 transition hover:bg-white/15 hover:text-white"
                                    >
                                        {isAiInsightOpen ? 'Masquer le diagnostic' : 'Afficher le diagnostic'}
                                    </button>
                                ) : (
                                    <span className="w-fit rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-gray-400">
                                        En attente
                                    </span>
                                )}
                            </div>

                            {!simulationMode && !resolvedAiInsight && (
                                <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm leading-7 text-gray-300">
                                    <p className="font-semibold text-white">
                                        Analyse non disponible pour le moment
                                    </p>
                                    <p className="mt-2 text-gray-400">
                                        {aiInsightEmptyMessage}
                                    </p>
                                </div>
                            )}

                            <SimulationAiInsightBlock
                                enabled={simulationMode}
                                insight={simulatedInsight}
                                isLoading={isSimulatingInsight}
                                error={simulationError}
                            />

                            {!simulationMode && resolvedAiInsight && isAiInsightOpen && (
                                <div className="mt-5 space-y-5">
                                    <div className="whitespace-pre-line rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm leading-7 text-gray-300">
                                        {resolvedAiInsight.content}
                                    </div>

                                    {viewedUser && (
                                        <form
                                            onSubmit={submitAiInsightUpdate}
                                            className="rounded-2xl border border-neonMint/20 bg-neonMint/5 p-5"
                                        >
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neonMint">
                                                        Correction admin
                                                    </p>
                                                    <h3 className="mt-1 text-base font-semibold text-white">
                                                        Modifier l&apos;analyse IA visible par le client
                                                    </h3>
                                                    <p className="mt-1 text-sm text-gray-400">
                                                        Cette correction sera utilisee a la place du texte genere par Groq.
                                                    </p>
                                                </div>
                                                {aiInsightUpdated && (
                                                    <span className="rounded-lg border border-neonMint/30 bg-neonMint/10 px-3 py-1.5 text-xs font-semibold text-neonMint">
                                                        Enregistre
                                                    </span>
                                                )}
                                            </div>

                                            <textarea
                                                value={aiInsightForm.edited_content}
                                                onChange={(event) => setAiInsightForm('edited_content', event.target.value)}
                                                rows="8"
                                                className="mt-4 w-full rounded-xl border border-white/10 bg-black/40 p-4 text-sm leading-6 text-white placeholder:text-gray-500 focus:border-neonMint/60 focus:ring-neonMint/20"
                                            />

                                            {aiInsightErrors.edited_content && (
                                                <p className="mt-2 text-sm text-rose-300">
                                                    {aiInsightErrors.edited_content}
                                                </p>
                                            )}

                                            <div className="mt-4 flex justify-end">
                                                <button
                                                    type="submit"
                                                    disabled={isUpdatingAiInsight}
                                                    className="rounded-lg border border-neonMint/30 bg-neonMint/10 px-4 py-2 text-sm font-semibold text-neonMint transition hover:bg-neonMint/20 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    {isUpdatingAiInsight ? 'Enregistrement...' : 'Enregistrer la correction'}
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            )}
                        </section>
                </div>

                <KpiProfileOnboardingModal
                    isOpen={showKpiOnboarding}
                    onClose={() => setShowKpiOnboarding(false)}
                    initialProfile={kpiProfile}
                    initialPreferences={kpiPreferences}
                    isFirstVisit={needsKpiOnboarding}
                />
            </CfoPageShell>
        </AppDashboardLayout>
    );
}
