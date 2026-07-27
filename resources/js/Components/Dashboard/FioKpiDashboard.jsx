import {
    getActiveDashboardKpis,
    getProfileById,
    resolveKpiDisplay,
} from '@/config/kpiProfiles';
import { motion } from 'framer-motion';
import { AlertTriangle, Pencil, Sparkles } from 'lucide-react';
import { memo, useMemo } from 'react';

const GLASS_PANEL =
    'border border-glassBorder bg-[linear-gradient(145deg,rgba(11,16,24,0.94)_0%,rgba(8,12,18,0.9)_100%)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.4)]';

const SparklineArea = memo(function SparklineArea({ data, stroke, fillId }) {
    if (!data?.length) {
        return null;
    }

    return (
        <svg viewBox="0 0 120 32" className="h-8 w-full" preserveAspectRatio="none">
            <defs>
                <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
                    <stop offset="100%" stopColor={stroke} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polyline
                fill="none"
                stroke={stroke}
                strokeWidth="2"
                points={data
                    .map((point, index) => {
                        const x = (index / Math.max(data.length - 1, 1)) * 120;
                        const max = Math.max(...data.map((p) => p.v), 1);
                        const y = 28 - (point.v / max) * 24;
                        return `${x},${y}`;
                    })
                    .join(' ')}
            />
        </svg>
    );
});

function FioKpiCard({ kpi, display, sparkline, index }) {
    const isEssential = kpi.tier === 'essential';
    const stroke = isEssential ? '#00FF9D' : '#00F0FF';

    return (
        <motion.article
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className={`group relative overflow-hidden rounded-2xl p-5 transition duration-500 ${GLASS_PANEL} ${
                isEssential
                    ? 'hover:border-neonMint/35 hover:shadow-[0_0_40px_rgba(0,255,157,0.08)]'
                    : 'hover:border-neonBlue/25'
            }`}
        >
            <div
                className={`absolute inset-y-0 left-0 w-[3px] ${
                    kpi.alert ? 'bg-amber-400' : isEssential ? 'bg-neonMint' : 'bg-slate-600'
                }`}
            />
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-neonMint/5 blur-2xl transition group-hover:bg-neonMint/10" />

            <div className="relative z-10 flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                            {kpi.group}
                        </p>
                        <h3 className="mt-1 text-sm font-medium leading-snug text-slate-200">{kpi.name}</h3>
                    </div>
                    <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            isEssential
                                ? 'bg-neonMint/15 text-neonMint'
                                : 'border border-slate-600 text-slate-400'
                        }`}
                    >
                        {isEssential ? 'Essentiel' : 'Secondaire'}
                    </span>
                </div>

                {kpi.sub ? <p className="mt-2 text-[11px] text-slate-500">{kpi.sub}</p> : null}

                <div className="mt-5 flex flex-1 flex-col justify-end">
                    {display.live && display.value ? (
                        <>
                            <p className="font-display text-3xl font-bold tracking-tight text-white">{display.value}</p>
                            {display.hint ? (
                                <p className="mt-1 text-xs text-slate-400">{display.hint}</p>
                            ) : null}
                            {sparkline ? (
                                <div className="mt-4 opacity-80">
                                    <SparklineArea data={sparkline} stroke={stroke} fillId={`kpi-sp-${kpi.id}`} />
                                </div>
                            ) : null}
                        </>
                    ) : (
                        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-4">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                {kpi.alert ? (
                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                                ) : (
                                    <Sparkles className="h-3.5 w-3.5 text-slate-600" />
                                )}
                                <span>
                                    {kpi.alert
                                        ? 'Alerte active des que les donnees seront connectees'
                                        : 'Donnees bientot disponibles via facturation & banque'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.article>
    );
}

export default function FioKpiDashboard({
    profileId,
    preferences,
    kpis,
    netMarginPercentage,
    sparks,
    formatters,
    onEditProfile,
}) {
    const profile = getProfileById(profileId);
    const activeKpis = useMemo(
        () => getActiveDashboardKpis(profileId, preferences),
        [profileId, preferences],
    );

    const sparkMap = {
        ca_periode: sparks.revenue,
        marge_globale: sparks.margin,
        cac_ltv: sparks.ltv,
    };

    return (
        <section id="fio-kpi-board" className="space-y-5">
            <div
                className={`relative overflow-hidden rounded-[24px] p-6 sm:p-7 ${GLASS_PANEL}`}
            >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,255,157,0.08),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(0,240,255,0.06),transparent_40%)]" />
                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-neonMint/20 bg-neonMint/10 text-3xl">
                            {profile.icon}
                        </div>
                        <div>
                            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-neonMint">
                                <Sparkles className="h-3.5 w-3.5" />
                                Console Fio
                            </p>
                            <h2 className="font-display mt-1 text-2xl font-bold tracking-tight text-white">
                                {profile.name}
                            </h2>
                            <p className="mt-1 max-w-xl text-sm text-slate-400">
                                {activeKpis.length} indicateurs actifs sur votre dashboard —{' '}
                                {activeKpis.filter((kpi) => kpi.tier === 'essential').length} essentiels,{' '}
                                {activeKpis.filter((kpi) => kpi.tier === 'secondary').length} secondaires
                                selectionnes.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onEditProfile}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:border-neonMint/30 hover:bg-neonMint/10 hover:text-white"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                        Ajuster mes KPI
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {activeKpis.map((kpi, index) => (
                    <FioKpiCard
                        key={kpi.id}
                        kpi={kpi}
                        index={index}
                        sparkline={sparkMap[kpi.id]}
                        display={resolveKpiDisplay(kpi.id, {
                            kpis,
                            netMarginPercentage,
                            formatters,
                        })}
                    />
                ))}
            </div>
        </section>
    );
}
