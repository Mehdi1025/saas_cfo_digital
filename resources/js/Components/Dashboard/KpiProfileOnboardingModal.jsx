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
import { ArrowRight, Check, Sparkles, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

function KpiTierDot({ tier, alert = false }) {
    if (tier === 'essential') {
        return (
            <span
                className={`inline-block h-2.5 w-2.5 rounded-[4px] ${alert ? 'bg-amber-400' : 'bg-neonMint'}`}
            />
        );
    }

    if (tier === 'secondary') {
        return <span className="inline-block h-2.5 w-2.5 rounded-[4px] border-[1.5px] border-slate-500" />;
    }

    return <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-600 opacity-60" />;
}

export default function KpiProfileOnboardingModal({ isOpen, onClose, initialProfile = null }) {
    const [selectedProfile, setSelectedProfile] = useState(initialProfile ?? DEFAULT_KPI_PROFILE);
    const [enabledSecondary, setEnabledSecondary] = useState([]);
    const [processing, setProcessing] = useState(false);

    const profile = useMemo(() => getProfileById(selectedProfile), [selectedProfile]);
    const breakdown = useMemo(() => getProfileKpiBreakdown(selectedProfile), [selectedProfile]);
    const signals = PROFILE_SIGNALS[selectedProfile] ?? [];

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const defaults = getDefaultEnabledSecondary(selectedProfile);
        setEnabledSecondary(defaults);
    }, [isOpen, selectedProfile]);

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

    const toggleSecondary = (kpiId) => {
        setEnabledSecondary((current) =>
            current.includes(kpiId) ? current.filter((id) => id !== kpiId) : [...current, kpiId],
        );
    };

    const handleSubmit = () => {
        setProcessing(true);

        router.post(
            route('dashboard.kpi-profile'),
            {
                profile: selectedProfile,
                preferences: { enabled_secondary: enabledSecondary },
            },
            {
                preserveScroll: true,
                onSuccess: () => onClose?.(),
                onFinish: () => setProcessing(false),
            },
        );
    };

    const handleSkipWithDefault = () => {
        setProcessing(true);

        router.post(
            route('dashboard.kpi-profile'),
            {
                profile: DEFAULT_KPI_PROFILE,
                preferences: { enabled_secondary: getDefaultEnabledSecondary(DEFAULT_KPI_PROFILE) },
            },
            {
                preserveScroll: true,
                onSuccess: () => onClose?.(),
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <div
            className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="kpi-onboarding-title"
        >
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#030508]/85 backdrop-blur-xl"
            />

            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-neonMint/10 blur-[120px]" />
                <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-neonBlue/10 blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(160deg,rgba(12,18,26,0.98)_0%,rgba(6,10,16,0.99)_100%)] shadow-[0_40px_120px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.06)]"
            >
                <header className="relative border-b border-white/8 px-6 py-5 sm:px-8">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-neonMint">
                                <Sparkles className="h-3.5 w-3.5" />
                                Premiere connexion
                            </p>
                            <h2
                                id="kpi-onboarding-title"
                                className="font-display mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl"
                            >
                                Quels KPI Fio doit mettre en avant pour vous ?
                            </h2>
                            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
                                Choisissez votre profil metier. Fio adapte instantanement votre tableau de bord :
                                indicateurs essentiels, secondaires et masques — comme dans la matrice Copifi.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleSkipWithDefault}
                            disabled={processing}
                            className="shrink-0 rounded-xl p-2 text-slate-500 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
                            aria-label="Fermer"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </header>

                <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                    <section className="overflow-y-auto border-b border-white/8 p-6 sm:p-8 lg:border-b-0 lg:border-r">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            01 · Votre profil
                        </p>
                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {KPI_PROFILES.map((item) => {
                                const active = item.id === selectedProfile;

                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setSelectedProfile(item.id)}
                                        className={`group relative overflow-hidden rounded-2xl border px-4 py-4 text-left transition duration-300 ${
                                            active
                                                ? 'border-neonMint/50 bg-neonMint/10 shadow-[0_0_40px_rgba(0,255,157,0.12)]'
                                                : 'border-white/8 bg-white/[0.02] hover:border-white/16 hover:bg-white/[0.04]'
                                        }`}
                                    >
                                        {active && (
                                            <motion.span
                                                layoutId="profile-glow"
                                                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,255,157,0.14),transparent_55%)]"
                                            />
                                        )}
                                        <div className="relative flex items-start gap-3">
                                            <span className="text-2xl leading-none">{item.icon}</span>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-display text-sm font-semibold text-white">
                                                    {item.name}
                                                </p>
                                                <p className="mt-0.5 text-xs text-slate-500">{item.sub}</p>
                                            </div>
                                            {active && (
                                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neonMint text-black">
                                                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-6 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                Signaux detectes pour ce profil
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {signals.map((signal) => (
                                    <span
                                        key={signal}
                                        className="rounded-lg border border-white/10 bg-[#0b1118] px-2.5 py-1 text-[11px] text-slate-300"
                                    >
                                        {signal}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="flex min-h-0 flex-col overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selectedProfile}
                                initial={{ opacity: 0, x: 12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -12 }}
                                transition={{ duration: 0.25 }}
                                className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6 sm:p-8"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{profile.icon}</span>
                                    <div>
                                        <p className="font-display text-lg font-semibold text-white">{profile.name}</p>
                                        <p className="text-xs text-slate-500">
                                            {breakdown.essential.length} essentiels · {breakdown.secondary.length}{' '}
                                            secondaires · {breakdown.hidden.length} masques
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-5 flex flex-wrap gap-4 text-[11px] text-slate-400">
                                    <span className="flex items-center gap-2">
                                        <KpiTierDot tier="essential" /> Essentiel
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <KpiTierDot tier="secondary" /> Secondaire
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <KpiTierDot tier="essential" alert /> Alerte / provision
                                    </span>
                                </div>

                                <div className="mt-6 space-y-5">
                                    <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neonMint">
                                            Mis en avant par Fio
                                        </p>
                                        <ul className="mt-3 space-y-2">
                                            {breakdown.essential.map((kpi) => (
                                                <li
                                                    key={kpi.id}
                                                    className="flex items-start gap-2.5 rounded-xl border border-white/6 bg-white/[0.02] px-3 py-2.5 text-sm text-slate-200"
                                                >
                                                    <KpiTierDot tier="essential" alert={kpi.alert} />
                                                    <span>
                                                        {kpi.name}
                                                        {kpi.sub ? (
                                                            <span className="mt-0.5 block text-[11px] text-slate-500">
                                                                {kpi.sub}
                                                            </span>
                                                        ) : null}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {breakdown.secondary.length > 0 && (
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                                Secondaires — activez ceux a afficher
                                            </p>
                                            <ul className="mt-3 space-y-2">
                                                {breakdown.secondary.map((kpi) => {
                                                    const checked = enabledSecondary.includes(kpi.id);

                                                    return (
                                                        <li key={kpi.id}>
                                                            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/6 bg-white/[0.02] px-3 py-2.5 transition hover:border-white/12">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={checked}
                                                                    onChange={() => toggleSecondary(kpi.id)}
                                                                    className="mt-1 rounded border-slate-600 bg-transparent text-neonMint focus:ring-neonMint/40"
                                                                />
                                                                <span className="text-sm text-slate-300">
                                                                    {kpi.name}
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
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        <footer className="border-t border-white/8 bg-[#070b10]/80 px-6 py-4 sm:px-8">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-xs text-slate-500">
                                    Vous pourrez ajuster vos KPI plus tard depuis votre profil.
                                </p>
                                <button
                                    type="button"
                                    disabled={processing}
                                    onClick={handleSubmit}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-neonMint px-5 py-3 text-sm font-bold text-black transition hover:bg-[#5dffb8] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {processing ? 'Configuration…' : 'Activer mon dashboard Fio'}
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>
                        </footer>
                    </section>
                </div>
            </motion.div>
        </div>
    );
}
