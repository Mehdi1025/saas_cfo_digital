import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

function KpiCard({ title, value, helper, accent = 'cyan' }) {
    const accents = {
        cyan: 'from-cyan-400/16 via-cyan-400/6 to-transparent text-cyan-300',
        emerald:
            'from-emerald-400/16 via-emerald-400/6 to-transparent text-emerald-300',
        violet: 'from-violet-400/16 via-violet-400/6 to-transparent text-violet-300',
        slate: 'from-white/12 via-white/4 to-transparent text-slate-300',
    };

    return (
        <div className="relative overflow-hidden rounded-[1.75rem] border border-white/6 bg-white/[0.035] p-5 shadow-[0_20px_40px_rgba(2,6,23,0.20)]">
            <div
                className={`pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-r ${accents[accent]}`}
                aria-hidden
            />
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                {title}
            </p>
            <p className="mt-3 text-[2rem] font-semibold leading-none text-white">
                {value}
            </p>
            <p className="mt-4 text-sm text-slate-400">{helper}</p>
        </div>
    );
}

function AlertCard({ title, message, tone = 'neutral' }) {
    const toneStyles = {
        sain: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100',
        attention: 'border-amber-400/20 bg-amber-400/10 text-amber-100',
        critique: 'border-red-500/20 bg-red-500/10 text-red-100',
        neutral: 'border-white/10 bg-white/[0.03] text-slate-200',
    };

    return (
        <div className={`rounded-2xl border p-4 ${toneStyles[tone]}`}>
            <p className="text-sm font-semibold">{title}</p>
            <p className="mt-2 text-sm leading-6 opacity-90">{message}</p>
        </div>
    );
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
    const hasFinancialData = evolution.length > 0;

    const chartData = evolution.map((item) => ({
        mois: item.mois,
        revenus: item.ca,
        charges: item.charges,
    }));

    const recentRows = [...chartData].reverse().slice(0, 4);

    const formatCurrency = (value) =>
        new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0,
        }).format(Number(value ?? 0));

    const formatCompactCurrency = (value) => {
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
    };

    const formatAxisValue = (value) => {
        if (value >= 1000) {
            return `${new Intl.NumberFormat('fr-FR', {
                maximumFractionDigits: 0,
            }).format(value / 1000)} k€`;
        }

        return `${new Intl.NumberFormat('fr-FR', {
            maximumFractionDigits: 0,
        }).format(value)} €`;
    };

    const ratioLtvCac =
        kpis.cac !== null && kpis.ltv !== null && kpis.cac > 0
            ? kpis.ltv / kpis.cac
            : null;
    const chargesRatio =
        kpis.chiffre_affaires > 0
            ? kpis.charges_totales / kpis.chiffre_affaires
            : null;

    const healthScore = (() => {
        if (!hasFinancialData) {
            return null;
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

    const healthLabel =
        healthScore === null
            ? 'Score disponible apres vos premieres saisies.'
            : healthScore >= 80
              ? 'Excellente sante financiere globale ce mois-ci.'
              : healthScore >= 60
                ? 'Situation saine avec quelques points a surveiller.'
                : 'Situation fragile a suivre de pres.';

    const healthRingStyle =
        healthScore === null
            ? {
                  background:
                      'conic-gradient(rgba(148,163,184,0.25) 0deg, rgba(148,163,184,0.25) 360deg)',
              }
            : {
                  background: `conic-gradient(#18f1bd 0deg ${healthScore * 3.6}deg, rgba(255,255,255,0.08) ${healthScore * 3.6}deg 360deg)`,
              };

    const alertItems = [];

    if (alert) {
        alertItems.push({
            title:
                alert.niveau === 'critique'
                    ? 'Alerte critique'
                    : alert.niveau === 'attention'
                      ? 'Attention'
                      : 'Situation saine',
            message: alert.message,
            tone: alert.niveau,
        });
    }

    if (kpis.cac === null || kpis.ltv === null) {
        alertItems.push({
            title: 'Donnees incompletes',
            message:
                'Le CAC ou la LTV necessitent un nombre de clients superieur a zero.',
            tone: 'neutral',
        });
    }

    if (!alertItems.length) {
        alertItems.push({
            title: 'Aucune alerte bloquante',
            message:
                'Vos indicateurs ne presentent pas de risque majeur sur le mois courant.',
            tone: 'neutral',
        });
    }

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                        Dashboard metier
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                        <h2 className="text-4xl font-semibold tracking-tight text-white">
                            Vue d&apos;ensemble financiere
                        </h2>
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                            {kpis.mois_actuel ?? 'Aucune periode'}
                        </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-400">
                        Suivez vos indicateurs du mois, vos alertes et
                        l&apos;evolution recente de votre activite.
                    </p>
                </div>
            }
        >
            <Head title="Tableau de bord mensuel" />

            <div className="space-y-6">
                <div className="grid gap-4 xl:grid-cols-4">
                    <KpiCard
                        title="Chiffre d'affaires"
                        value={formatCompactCurrency(kpis.chiffre_affaires)}
                        helper={`Vue du mois : ${kpis.mois_actuel ?? 'Aucune periode'}`}
                        accent="cyan"
                    />
                    <KpiCard
                        title="Marge nette"
                        value={formatCompactCurrency(kpis.marge_nette)}
                        helper="Lecture directe de votre rentabilite mensuelle."
                        accent="emerald"
                    />
                    <KpiCard
                        title="CAC"
                        value={kpis.cac === null ? 'N/A' : formatCompactCurrency(kpis.cac)}
                        helper={
                            kpis.cac === null
                                ? 'Pas de donnees clients pour ce calcul.'
                                : 'Cout d acquisition moyen par client.'
                        }
                        accent="slate"
                    />
                    <KpiCard
                        title="LTV"
                        value={kpis.ltv === null ? 'N/A' : formatCompactCurrency(kpis.ltv)}
                        helper={
                            kpis.ltv === null
                                ? 'Pas de donnees clients pour ce calcul.'
                                : 'Valeur moyenne generee par client.'
                        }
                        accent="violet"
                    />
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.72fr_0.95fr]">
                    <div className="space-y-6">
                        <section className="rounded-[2rem] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.022),rgba(255,255,255,0.015))] p-6 shadow-[0_25px_60px_rgba(2,6,23,0.22)]">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <h3 className="text-[1.75rem] font-semibold text-white">
                                        Revenus vs Charges Totales
                                    </h3>
                                    <p className="mt-2 text-sm text-slate-400">
                                        Evolution sur les derniers mois
                                        enregistres.
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
                                        <AreaChart
                                            data={chartData}
                                            margin={{
                                                top: 12,
                                                right: 16,
                                                left: 6,
                                                bottom: 8,
                                            }}
                                        >
                                            <defs>
                                                <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
                                                    <stop offset="0%" stopColor="#20d7ff" stopOpacity={0.35} />
                                                    <stop offset="100%" stopColor="#20d7ff" stopOpacity={0.02} />
                                                </linearGradient>
                                                <linearGradient id="chargesFill" x1="0" x2="0" y1="0" y2="1">
                                                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.20} />
                                                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
                                                </linearGradient>
                                            </defs>
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
                                                tick={{ fontSize: 12 }}
                                            />
                                            <YAxis
                                                stroke="#94a3b8"
                                                tickLine={false}
                                                axisLine={false}
                                                width={80}
                                                tickMargin={10}
                                                tick={{ fontSize: 12 }}
                                                tickFormatter={formatAxisValue}
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
                                            <Area
                                                type="monotone"
                                                dataKey="revenus"
                                                name="Revenus"
                                                stroke="#20d7ff"
                                                fill="url(#revenueFill)"
                                                strokeWidth={3}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="charges"
                                                name="Charges Totales"
                                                stroke="#f59e0b"
                                                fill="url(#chargesFill)"
                                                strokeWidth={2.4}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="mt-8 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
                                    <p className="text-lg font-medium text-white">
                                        Aucune donnee financiere pour le moment
                                    </p>
                                    <p className="mt-3 text-sm text-slate-400">
                                        Utilisez la section Saisie mensuelle
                                        pour creer vos premiers indicateurs.
                                    </p>
                                </div>
                            )}
                        </section>

                        <section className="rounded-[2rem] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.022),rgba(255,255,255,0.015))] p-6 shadow-[0_25px_60px_rgba(2,6,23,0.22)]">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-xl font-semibold text-white">
                                        Flux recents
                                    </h3>
                                    <p className="mt-2 text-sm text-slate-400">
                                        Dernieres periodes prises en compte dans
                                        votre suivi.
                                    </p>
                                </div>
                                <span className="text-sm font-medium text-cyan-300">
                                    Vue detaillee
                                </span>
                            </div>

                            <div className="mt-6 overflow-hidden rounded-2xl border border-white/6">
                                <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 border-b border-white/6 bg-white/[0.03] px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                    <span>Date</span>
                                    <span>Revenus</span>
                                    <span>Charges</span>
                                </div>
                                {recentRows.length ? (
                                    recentRows.map((row) => (
                                        <div
                                            key={row.mois}
                                            className="grid grid-cols-[1fr_1fr_1fr] gap-4 border-b border-white/6 px-5 py-4 text-sm text-slate-300 last:border-b-0"
                                        >
                                            <span>{row.mois}</span>
                                            <span className="text-cyan-200">
                                                {formatCurrency(row.revenus)}
                                            </span>
                                            <span className="text-amber-200">
                                                {formatCurrency(row.charges)}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-5 py-6 text-sm text-slate-400">
                                        Aucune periode recente disponible.
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    <div className="space-y-6">
                        <section className="rounded-[2rem] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.022),rgba(255,255,255,0.015))] p-6 shadow-[0_25px_60px_rgba(2,6,23,0.22)]">
                            <h3 className="text-xl font-semibold text-white">
                                Score de sante
                            </h3>

                            <div className="relative mx-auto mt-8 flex h-52 w-52 items-center justify-center">
                                <div
                                    className="absolute inset-0 rounded-full"
                                    style={healthRingStyle}
                                />
                                <div className="absolute inset-[18px] rounded-full bg-[#0c1119]" />
                                <div className="relative text-center">
                                    <p className="text-5xl font-semibold text-white">
                                        {healthScore ?? '--'}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-400">
                                        /100
                                    </p>
                                </div>
                            </div>

                            <p className="mt-6 text-center text-sm text-slate-300">
                                {healthLabel}
                            </p>
                        </section>

                        <section className="rounded-[2rem] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.022),rgba(255,255,255,0.015))] p-6 shadow-[0_25px_60px_rgba(2,6,23,0.22)]">
                            <h3 className="text-xl font-semibold text-white">
                                Alertes
                            </h3>
                            <div className="mt-5 space-y-4">
                                {alertItems.map((item, index) => (
                                    <AlertCard
                                        key={`${item.title}-${index}`}
                                        title={item.title}
                                        message={item.message}
                                        tone={item.tone}
                                    />
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
