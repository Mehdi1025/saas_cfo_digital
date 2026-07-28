import { Check, TrendingDown, TrendingUp } from 'lucide-react';
import {
    motion,
    useMotionValue,
    useMotionValueEvent,
    useSpring,
    useTransform,
} from 'framer-motion';
import { useEffect, useRef } from 'react';

/** Horizon de projection en jours */
const HORIZON_DAYS = 30;

/** Seuil d'alerte trésorerie (€) */
const CRITICAL_THRESHOLD = 10_000;

/** Solde de départ (mock) */
const MOCK_INITIAL_BALANCE = 45_000;

/**
 * Événements de trésorerie mock — échéances relatives à aujourd'hui.
 * amount > 0 = encaissement, amount < 0 = décaissement
 */
const MOCK_CASHFLOW_EVENTS = [
    {
        id: 'evt-acme',
        label: 'Facture ACME Corp.',
        subtitle: 'Encaissement client',
        type: 'inflow',
        amount: 12_000,
        dueDay: 3,
    },
    {
        id: 'evt-salaires',
        label: 'Masse salariale',
        subtitle: 'Charges fixes',
        type: 'outflow',
        amount: -18_500,
        dueDay: 12,
    },
    {
        id: 'evt-beta',
        label: 'Client Beta SA',
        subtitle: 'Encaissement client',
        type: 'inflow',
        amount: 8_400,
        dueDay: 18,
    },
    {
        id: 'evt-loyer',
        label: 'Loyer & SaaS',
        subtitle: 'Charges récurrentes',
        type: 'outflow',
        amount: -6_200,
        dueDay: 25,
    },
    {
        id: 'evt-tva',
        label: 'TVA trimestrielle',
        subtitle: 'Obligation fiscale',
        type: 'outflow',
        amount: -9_800,
        dueDay: 28,
    },
];

const SLIDER_MARKERS = [
    { day: 0, label: 'Auj.' },
    { day: 15, label: '+15j' },
    { day: 30, label: '+30j' },
];

function computeBalanceAtDay(day, initialBalance, events) {
    return events.reduce(
        (acc, event) => (day >= event.dueDay ? acc + event.amount : acc),
        initialBalance,
    );
}

function formatEuro(value) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
    }).format(Math.round(value));
}

/** Affiche une MotionValue textuelle sans re-render React */
function MotionText({ value, className = '' }) {
    const ref = useRef(null);

    useMotionValueEvent(value, 'change', (latest) => {
        if (ref.current) {
            ref.current.textContent = latest;
        }
    });

    useEffect(() => {
        if (ref.current && typeof value.get === 'function') {
            ref.current.textContent = value.get();
        }
    }, [value]);

    return <span ref={ref} className={className} />;
}

/** Odomètre central — spring + couleur dynamique via useTransform */
function TreasuryOdometer({ balanceSpring, referenceBalance }) {
    const amountRef = useRef(null);

    const textColor = useTransform(balanceSpring, (value) => {
        const ratio = Math.min(
            Math.max((value - CRITICAL_THRESHOLD) / (Math.max(referenceBalance, CRITICAL_THRESHOLD * 2) - CRITICAL_THRESHOLD), 0),
            1,
        );
        const r = Math.round(239 + (0 - 239) * ratio);
        const g = Math.round(68 + (255 - 68) * ratio);
        const b = Math.round(68 + (157 - 68) * ratio);
        return `rgb(${r}, ${g}, ${b})`;
    });

    const glowShadow = useTransform(balanceSpring, (value) => {
        if (value < CRITICAL_THRESHOLD) {
            return '0 0 48px rgba(239, 68, 68, 0.55), 0 0 96px rgba(239, 68, 68, 0.25)';
        }
        return '0 0 40px rgba(0, 255, 157, 0.35), 0 0 80px rgba(0, 240, 255, 0.15)';
    });

    const auraBackground = useTransform(
        balanceSpring,
        [CRITICAL_THRESHOLD * 0.5, CRITICAL_THRESHOLD, Math.max(referenceBalance, CRITICAL_THRESHOLD * 2)],
        [
            'radial-gradient(circle, rgba(239,68,68,0.18) 0%, transparent 70%)',
            'radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 70%)',
            'radial-gradient(circle, rgba(0,255,157,0.14) 0%, transparent 70%)',
        ],
    );

    const statusLabel = useTransform(balanceSpring, (value) =>
        value < CRITICAL_THRESHOLD
            ? 'Seuil critique — surveillez vos sorties'
            : 'Projection saine sur 30 jours',
    );

    useMotionValueEvent(balanceSpring, 'change', (latest) => {
        if (amountRef.current) {
            amountRef.current.textContent = formatEuro(latest);
        }
    });

    useEffect(() => {
        if (amountRef.current) {
            amountRef.current.textContent = formatEuro(balanceSpring.get());
        }
    }, [balanceSpring]);

    return (
        <div className="relative flex flex-col items-center justify-center py-6 sm:py-10">
            <motion.div
                className="pointer-events-none absolute inset-0 mx-auto max-w-md rounded-full blur-3xl"
                style={{ background: auraBackground }}
                aria-hidden
            />
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-gray-500 dark:text-gray-400">
                Trésorerie prévisionnelle
            </p>
            <motion.p
                ref={amountRef}
                className="relative z-10 font-display text-5xl font-bold tabular-nums tracking-tighter sm:text-6xl md:text-7xl"
                style={{ color: textColor, textShadow: glowShadow }}
            />
            <MotionText
                value={statusLabel}
                className="relative z-10 mt-3 text-sm text-gray-400 dark:text-gray-500"
            />
        </div>
    );
}

/** Carte facture/charge — états visuels pilotés par MotionValue (pas de useState) */
function CashflowEventCard({ event, dayProgress }) {
    const isSettled = useTransform(dayProgress, (day) => day >= event.dueDay);
    const cardOpacity = useTransform(dayProgress, (day) => (day >= event.dueDay ? 1 : 0.5));
    const pendingOpacity = useTransform(dayProgress, (day) => (day >= event.dueDay ? 0 : 1));
    const settledOpacity = useTransform(dayProgress, (day) => (day >= event.dueDay ? 1 : 0));
    const scale = useTransform(dayProgress, (day) => (day >= event.dueDay ? 1 : 0.97));
    const borderColor = useTransform(dayProgress, (day) =>
        day >= event.dueDay
            ? event.type === 'inflow'
                ? 'rgba(0, 255, 157, 0.45)'
                : 'rgba(239, 68, 68, 0.35)'
            : 'rgba(255, 255, 255, 0.08)',
    );

    const isInflow = event.type === 'inflow';
    const Icon = isInflow ? TrendingUp : TrendingDown;

    return (
        <motion.article
            layout
            layoutId={event.id}
            style={{
                opacity: cardOpacity,
                scale,
                borderColor,
            }}
            className="relative w-[min(100%,260px)] shrink-0 rounded-2xl border bg-[linear-gradient(145deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.02)_100%)] p-4 pb-12 backdrop-blur-md dark:bg-[linear-gradient(145deg,rgba(11,16,24,0.92)_0%,rgba(8,12,18,0.88)_100%)]"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{event.label}</p>
                    <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{event.subtitle}</p>
                </div>
                <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        isInflow ? 'bg-neonMint/10 text-neonMint' : 'bg-rose-500/10 text-rose-300'
                    }`}
                >
                    <Icon className="h-4 w-4" aria-hidden />
                </div>
            </div>

            <div className="mt-4 flex items-end justify-between gap-2">
                <p
                    className={`text-lg font-bold tabular-nums ${
                        isInflow ? 'text-neonMint' : 'text-rose-300'
                    }`}
                >
                    {isInflow ? '+' : ''}
                    {formatEuro(event.amount)}
                </p>
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
                    J+
                    {event.dueDay}
                </p>
            </div>

            {/* Badge « En attente » — disparaît quand l'échéance est passée */}
            <motion.div
                layout
                style={{ opacity: pendingOpacity }}
                className="pointer-events-none absolute inset-x-4 bottom-4 flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400"
            >
                En attente
            </motion.div>

            {/* Badge « Réglé » — apparaît avec halo vert/rouge */}
            <motion.div
                layout
                style={{ opacity: settledOpacity }}
                className={`pointer-events-none absolute inset-x-4 bottom-4 flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                    isInflow
                        ? 'border-neonMint/30 bg-neonMint/10 text-neonMint shadow-[0_0_16px_rgba(0,255,157,0.25)]'
                        : 'border-rose-500/30 bg-rose-500/10 text-rose-300 shadow-[0_0_16px_rgba(239,68,68,0.2)]'
                }`}
            >
                <Check className="h-3 w-3" aria-hidden />
                {isInflow ? 'Encaissé' : 'Payé'}
            </motion.div>
        </motion.article>
    );
}

/** Slider glassmorphism — position liée à useMotionValue (0 re-render au drag) */
function TimeMachineSlider({ dayProgress }) {
    const fillWidth = useTransform(dayProgress, (day) => `${(day / HORIZON_DAYS) * 100}%`);
    const thumbLeft = useTransform(dayProgress, (day) => `${(day / HORIZON_DAYS) * 100}%`);
    const dayLabel = useTransform(dayProgress, (day) => {
        if (day < 0.5) {
            return "Aujourd'hui";
        }
        return `+${Math.round(day)} jour${Math.round(day) > 1 ? 's' : ''}`;
    });

    const handleInput = (event) => {
        dayProgress.set(Number(event.target.value));
    };

    return (
        <div className="mt-2 space-y-4">
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neonBlue">
                    Time Machine
                </p>
                <MotionText
                    value={dayLabel}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white dark:border-white/10 dark:bg-white/5"
                />
            </div>

            <div className="relative px-1 pt-2 pb-6">
                {/* Piste glass */}
                <div className="relative h-3 overflow-hidden rounded-full border border-white/10 bg-white/10 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.06]">
                    <motion.div
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-neonBlue/80 to-neonMint/80 shadow-[0_0_20px_rgba(0,240,255,0.45)]"
                        style={{ width: fillWidth }}
                    />
                </div>

                {/* Thumb lumineux */}
                <motion.div
                    className="pointer-events-none absolute top-0 h-7 w-7 -translate-x-1/2 rounded-full border border-white/30 bg-gradient-to-br from-neonBlue to-neonMint shadow-[0_0_24px_rgba(0,240,255,0.65),0_4px_12px_rgba(0,0,0,0.35)]"
                    style={{ left: thumbLeft }}
                    aria-hidden
                />

                {/* Input natif invisible — alimente dayProgress sans useState */}
                <input
                    type="range"
                    min={0}
                    max={HORIZON_DAYS}
                    step={0.05}
                    defaultValue={0}
                    onInput={handleInput}
                    aria-label="Curseur temporel trésorerie"
                    className="absolute inset-x-0 top-0 z-10 h-7 w-full cursor-grab appearance-none bg-transparent opacity-0 active:cursor-grabbing [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:appearance-none"
                />

                {/* Marqueurs temporels */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-500">
                    {SLIDER_MARKERS.map((marker) => (
                        <span key={marker.day}>{marker.label}</span>
                    ))}
                </div>
            </div>
        </div>
    );
}

/**
 * CashflowTimeMachine — simulateur temporel de trésorerie.
 */
export default function CashflowTimeMachine({ treasury = null, className = '' }) {
    const hasLiveTreasury = treasury?.has_live_data === true;
    const initialBalance = hasLiveTreasury ? Number(treasury.checking_balance) : MOCK_INITIAL_BALANCE;
    const events =
        hasLiveTreasury && treasury.cashflow_events?.length
            ? treasury.cashflow_events
            : MOCK_CASHFLOW_EVENTS;

    /** Jours écoulés (0 → 30) — source de vérité réactive sans useState */
    const dayProgress = useMotionValue(0);

    /** Solde brut dérivé du curseur */
    const projectedBalance = useTransform(dayProgress, (day) =>
        computeBalanceAtDay(day, initialBalance, events),
    );

    /** Spring « compteur sport » sur le solde */
    const balanceSpring = useSpring(projectedBalance, {
        stiffness: 140,
        damping: 22,
        mass: 0.65,
    });

    /** Variation vs solde initial pour micro-feedback */
    const deltaLabel = useTransform(balanceSpring, (value) => {
        const delta = value - initialBalance;
        const sign = delta >= 0 ? '+' : '';
        return `${sign}${formatEuro(delta)} vs aujourd'hui`;
    });

    return (
        <section
            className={`overflow-hidden rounded-3xl border border-glassBorder bg-[linear-gradient(160deg,rgba(11,16,24,0.96)_0%,rgba(8,12,18,0.92)_50%,rgba(0,240,255,0.04)_100%)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_16px_48px_rgba(0,0,0,0.45)] dark:border-glassBorder ${className}`}
        >
            <div className="border-b border-white/5 px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neonMint">
                            Copifi · Trésorerie
                        </p>
                        <h2 className="mt-1 font-display text-lg font-bold text-white sm:text-xl">
                            Cashflow Time Machine
                        </h2>
                        {hasLiveTreasury ? (
                            <p className="mt-1 text-xs text-cyan-300/90">
                                Solde Bridge · flux 30j{' '}
                                {formatEuro(Number(treasury.net_flow_30d ?? 0))}
                            </p>
                        ) : null}
                    </div>
                    <MotionText
                        value={deltaLabel}
                        className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-gray-300 dark:text-gray-400"
                    />
                </div>
            </div>

            <div className="px-5 sm:px-6">
                <TreasuryOdometer balanceSpring={balanceSpring} referenceBalance={initialBalance} />

                <TimeMachineSlider dayProgress={dayProgress} />
            </div>

            {/* Pile horizontale des échéances — scroll mobile */}
            <div className="mt-6 border-t border-white/5 px-5 py-5 sm:px-6">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">
                    {hasLiveTreasury ? 'Flux projete sur 30 jours' : 'Echeances sur la periode'}
                </p>
                <motion.div layout className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {events.map((event) => (
                        <CashflowEventCard key={event.id} event={event} dayProgress={dayProgress} />
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
