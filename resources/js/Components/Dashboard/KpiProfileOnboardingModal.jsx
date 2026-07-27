import {
    DEFAULT_KPI_PROFILE,
    getDefaultEnabledSecondary,
    getProfileById,
    getProfileKpiBreakdown,
    KPI_PROFILES,
    PROFILE_SIGNALS,
} from '@/config/kpiProfiles';
import { router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Sparkles, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

function MatrixPreview({ profileId }) {
    const breakdown = getProfileKpiBreakdown(profileId);
    const dots = [
        ...breakdown.essential.map((kpi) => ({ id: kpi.id, tier: 'essential', alert: kpi.alert })),
        ...breakdown.secondary.map((kpi) => ({ id: kpi.id, tier: 'secondary' })),
    ].slice(0, 48);

    return (
        <div className="grid grid-cols-8 gap-1.5 rounded-2xl border border-white/8 bg-black/30 p-4">
            {dots.map((dot) => (
                <span
                    key={dot.id}
                    title={dot.id}
                    className={`aspect-square rounded-[5px] ${
                        dot.tier === 'essential'
                            ? dot.alert
                                ? 'bg-amber-400/90'
                                : 'bg-neonMint'
                            : 'border border-slate-500 bg-transparent'
                    }`}
                />
            ))}
        </div>
    );
}

export default function KpiProfileOnboardingModal({
    isOpen,
    onClose,
    initialProfile = null,
    initialPreferences = null,
    isFirstVisit = false,
}) {
    const [selectedProfile, setSelectedProfile] = useState(initialProfile ?? DEFAULT_KPI_PROFILE);
    const [enabledSecondary, setEnabledSecondary] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [bootstrapped, setBootstrapped] = useState(false);

    const profile = useMemo(() => getProfileById(selectedProfile), [selectedProfile]);
    const breakdown = useMemo(() => getProfileKpiBreakdown(selectedProfile), [selectedProfile]);
    const signals = PROFILE_SIGNALS[selectedProfile] ?? [];
    const selectedCount = breakdown.essential.length + enabledSecondary.length;

    useEffect(() => {
        if (!isOpen) {
            setBootstrapped(false);
            return;
        }

        if (bootstrapped) {
            return;
        }

        const profileId = initialProfile ?? DEFAULT_KPI_PROFILE;
        setSelectedProfile(profileId);
        setEnabledSecondary(
            initialPreferences?.enabled_secondary?.length
                ? initialPreferences.enabled_secondary
                : getDefaultEnabledSecondary(profileId),
        );
        setBootstrapped(true);
    }, [isOpen, initialProfile, initialPreferences, bootstrapped]);

    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    const selectProfile = (profileId) => {
        setSelectedProfile(profileId);
        setEnabledSecondary(getDefaultEnabledSecondary(profileId));
    };

    const toggleSecondary = (kpiId) => {
        setEnabledSecondary((current) =>
            current.includes(kpiId) ? current.filter((id) => id !== kpiId) : [...current, kpiId],
        );
    };

    const persistProfile = (profileId, secondaryIds) => {
        setProcessing(true);

        router.post(
            route('dashboard.kpi-profile'),
            {
                profile: profileId,
                preferences: { enabled_secondary: secondaryIds },
            },
            {
                preserveScroll: true,
                onSuccess: () => onClose?.(),
                onFinish: () => setProcessing(false),
            },
        );
    };

    const handleSubmit = () => persistProfile(selectedProfile, enabledSecondary);

    return (
        <div className="fixed inset-0 z-[120]" role="dialog" aria-modal="true" aria-labelledby="kpi-onboarding-title">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-[#020408]/92 backdrop-blur-2xl"
            />

            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute left-[10%] top-[-10%] h-[420px] w-[420px] rounded-full bg-neonMint/12 blur-[140px]" />
                <div className="absolute bottom-[-15%] right-[5%] h-[480px] w-[480px] rounded-full bg-neonBlue/10 blur-[160px]" />
                <div
                    className="absolute inset-0 opacity-[0.18]"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
                        backgroundSize: '48px 48px',
                    }}
                />
            </div>

            <div className="relative flex h-full flex-col overflow-hidden">
                <header className="border-b border-white/8 px-5 py-5 sm:px-8 lg:px-10">
                    <div className="mx-auto flex max-w-[1400px] flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-neonMint">
                                <Sparkles className="h-3.5 w-3.5" />
                                {isFirstVisit ? 'Configuration initiale Fio' : 'Personnalisation Fio'}
                            </p>
                            <h2
                                id="kpi-onboarding-title"
                                className="font-display mt-2 max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.65rem] lg:leading-[1.05]"
                            >
                                Composez la console qui parle{' '}
                                <span className="bg-gradient-to-r from-neonMint to-neonBlue bg-clip-text text-transparent">
                                    votre metier
                                </span>
                            </h2>
                            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
                                Selectionnez votre profil, activez vos KPI secondaires. Tout ce que vous validez
                                ici apparait immediatement sur votre dashboard — sans clic supplementaire.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 backdrop-blur-sm">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                KPI actifs apres validation
                            </p>
                            <p className="font-display mt-1 text-4xl font-bold text-white">{selectedCount}</p>
                        </div>
                    </div>
                </header>

                <div className="mx-auto grid min-h-0 w-full max-w-[1400px] flex-1 grid-cols-1 gap-0 overflow-hidden lg:grid-cols-[1.15fr_0.85fr]">
                    <section className="overflow-y-auto px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                            01 · Archétype metier
                        </p>
                        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {KPI_PROFILES.map((item, index) => {
                                const active = item.id === selectedProfile;

                                return (
                                    <motion.button
                                        key={item.id}
                                        type="button"
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        onClick={() => selectProfile(item.id)}
                                        className={`relative overflow-hidden rounded-[22px] border p-4 text-left transition duration-300 ${
                                            active
                                                ? 'border-neonMint/50 bg-[linear-gradient(160deg,rgba(0,255,157,0.12),rgba(0,240,255,0.04))] shadow-[0_0_50px_rgba(0,255,157,0.12)]'
                                                : 'border-white/8 bg-white/[0.02] hover:border-white/16 hover:bg-white/[0.04]'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="text-3xl leading-none">{item.icon}</span>
                                            {active ? (
                                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neonMint text-black">
                                                    <Check className="h-4 w-4" strokeWidth={3} />
                                                </span>
                                            ) : null}
                                        </div>
                                        <p className="font-display mt-4 text-sm font-semibold text-white">{item.name}</p>
                                        <p className="mt-1 text-xs text-slate-500">{item.sub}</p>
                                    </motion.button>
                                );
                            })}
                        </div>

                        <div className="mt-8 grid gap-4 lg:grid-cols-2">
                            <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-5">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                    Signaux d&apos;onboarding
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {signals.map((signal) => (
                                        <span
                                            key={signal}
                                            className="rounded-full border border-white/10 bg-[#0a1018] px-3 py-1 text-[11px] text-slate-300"
                                        >
                                            {signal}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-5">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                    Apercu matrice
                                </p>
                                <div className="mt-3">
                                    <MatrixPreview profileId={selectedProfile} />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="flex min-h-0 flex-col border-t border-white/8 bg-[#060a10]/70 lg:border-l lg:border-t-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selectedProfile}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.28 }}
                                className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-6 sm:px-8"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-4xl">{profile.icon}</span>
                                    <div>
                                        <p className="font-display text-xl font-bold text-white">{profile.name}</p>
                                        <p className="text-xs text-slate-500">
                                            {breakdown.essential.length} essentiels · {enabledSecondary.length} /
                                            {breakdown.secondary.length} secondaires actives
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-neonMint">
                                        <Zap className="h-3.5 w-3.5" />
                                        Essentiels — toujours visibles
                                    </p>
                                    <ul className="mt-3 space-y-2">
                                        {breakdown.essential.map((kpi) => (
                                            <li
                                                key={kpi.id}
                                                className="rounded-xl border border-neonMint/15 bg-neonMint/[0.04] px-3 py-2.5 text-sm text-slate-100"
                                            >
                                                {kpi.name}
                                                {kpi.alert ? (
                                                    <span className="ml-2 text-[10px] font-semibold uppercase text-amber-400">
                                                        Alerte
                                                    </span>
                                                ) : null}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {breakdown.secondary.length > 0 && (
                                    <div className="mt-6">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                            Secondaires — cochez pour les afficher
                                        </p>
                                        <ul className="mt-3 space-y-2">
                                            {breakdown.secondary.map((kpi) => {
                                                const checked = enabledSecondary.includes(kpi.id);

                                                return (
                                                    <li key={kpi.id}>
                                                        <label
                                                            className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition ${
                                                                checked
                                                                    ? 'border-neonBlue/30 bg-neonBlue/[0.05]'
                                                                    : 'border-white/8 bg-white/[0.02] hover:border-white/14'
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={() => toggleSecondary(kpi.id)}
                                                                className="mt-0.5 rounded border-slate-600 bg-transparent text-neonMint focus:ring-neonMint/40"
                                                            />
                                                            <span>
                                                                <span className="text-sm text-slate-200">{kpi.name}</span>
                                                                <span className="mt-0.5 block text-[11px] text-slate-500">
                                                                    {kpi.group}
                                                                </span>
                                                            </span>
                                                        </label>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        <footer className="border-t border-white/8 px-5 py-5 sm:px-8">
                            <button
                                type="button"
                                disabled={processing}
                                onClick={handleSubmit}
                                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#00FF9D_0%,#00F0FF_100%)] px-6 py-4 text-sm font-bold text-black shadow-[0_0_40px_rgba(0,255,157,0.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {processing
                                    ? 'Application sur le dashboard…'
                                    : `Afficher ${selectedCount} KPI sur mon dashboard`}
                                <ArrowRight className="h-4 w-4" />
                            </button>
                            <p className="mt-3 text-center text-[11px] text-slate-500">
                                Vos choix seront visibles immediatement sur le dashboard.
                            </p>
                        </footer>
                    </section>
                </div>
            </div>
        </div>
    );
}
