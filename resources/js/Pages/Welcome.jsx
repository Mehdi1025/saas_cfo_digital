import { Head, Link, router, usePage } from '@inertiajs/react';
import LandingChatWidget from '@/Components/Landing/LandingChatWidget';
import CopifiLogo from '@/Components/FinFlow/CopifiLogo';
import {
    buildSubscribeAuthUrl,
    clearSubscribeIntent,
    hasSubscribeIntent,
} from '@/utils/subscribeFlow';
import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

/* ============================================================
   DONNÉES
   ============================================================ */

const chartData = [
    { month: 'Jan', revenue: 8200, expenses: 5600 },
    { month: 'Fév', revenue: 9400, expenses: 6100 },
    { month: 'Mar', revenue: 11800, expenses: 6900 },
    { month: 'Avr', revenue: 10600, expenses: 7200 },
    { month: 'Mai', revenue: 14200, expenses: 8100 },
    { month: 'Juin', revenue: 16900, expenses: 8800 },
    { month: 'Juil', revenue: 19400, expenses: 9300 },
];

// Réassurance : on alterne conformité (facturation) et pilotage (gestion)
const TRUST_ITEMS = [
    'Format Factur-X',
    'Trésorerie en temps réel',
    'Plateforme Agréée DGFiP',
    'Marge & rentabilité',
    'Hébergé en France',
    'Alertes automatiques',
    'RGPD',
    'CAC · LTV · DSO',
    'Archivage légal 10 ans',
    'Analyse IA mensuelle',
    'Numérotation légale',
    'Un seul tableau de bord',
];

const REFORM_DEADLINE = new Date('2026-09-01T00:00:00+02:00');

const gridBg =
    "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")";

/* ============================================================
   PRIMITIVES
   ============================================================ */

function ScrollReveal({ children, className = '' }) {
    return <div className={className}>{children}</div>;
}

function useMagnetic() {
    const rootRef = useRef(null);
    const innerRef = useRef(null);

    const onMove = useCallback((e) => {
        const root = rootRef.current;
        const inner = innerRef.current;
        if (!root || !inner) return;
        const r = root.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        inner.style.transform = `translate(${x * 0.12}px, ${y * 0.12}px)`;
    }, []);

    const onLeave = useCallback(() => {
        if (innerRef.current) innerRef.current.style.transform = '';
    }, []);

    return { rootRef, innerRef, onMove, onLeave };
}

function MagneticButton({ children, className = '', ...props }) {
    const { rootRef, innerRef, onMove, onLeave } = useMagnetic();
    return (
        <button ref={rootRef} type="button" onMouseMove={onMove} onMouseLeave={onLeave} className={className} {...props}>
            <span ref={innerRef} className="inline-flex items-center justify-center gap-2 transition-transform duration-150 ease-out">
                {children}
            </span>
        </button>
    );
}

function MagneticLink({ href, children, className = '', wrapperClassName = 'inline-flex' }) {
    const { rootRef, innerRef, onMove, onLeave } = useMagnetic();
    return (
        <div ref={rootRef} onMouseMove={onMove} onMouseLeave={onLeave} className={wrapperClassName}>
            <Link href={href} className={className}>
                <span ref={innerRef} className="inline-flex w-full items-center justify-center gap-2 transition-transform duration-150 ease-out">
                    {children}
                </span>
            </Link>
        </div>
    );
}

function GlassCard({ children, className = '', glow = false, accent = 'emerald' }) {
    // accent contrôle la couleur du halo au survol : 'emerald' (facturation) ou 'sky' (pilotage)
    const hover =
        accent === 'sky'
            ? 'hover:border-sky-400/30 hover:shadow-[0_28px_64px_rgba(0,0,0,0.45),0_0_0_1px_rgba(56,189,248,0.2),0_0_56px_-6px_rgba(14,165,233,0.25)]'
            : 'hover:border-emerald-400/30 hover:shadow-[0_28px_64px_rgba(0,0,0,0.45),0_0_0_1px_rgba(52,211,153,0.2),0_0_56px_-6px_rgba(16,185,129,0.25)]';
    const wash =
        accent === 'sky'
            ? 'bg-gradient-to-br from-sky-500/[0.05] via-transparent to-blue-500/[0.06]'
            : 'bg-gradient-to-br from-emerald-500/[0.04] via-transparent to-blue-500/[0.07]';
    const glowBg =
        accent === 'sky'
            ? 'linear-gradient(118deg, rgba(56,189,248,0.2) 0%, transparent 40%, rgba(59,130,246,0.22) 72%, rgba(125,211,252,0.08) 100%)'
            : 'linear-gradient(118deg, rgba(16,185,129,0.2) 0%, transparent 40%, rgba(59,130,246,0.22) 72%, rgba(52,211,153,0.08) 100%)';

    return (
        <div
            className={`group/card relative overflow-hidden rounded-[2rem] border border-white/[0.1] bg-gradient-to-br from-[#121a26] via-[#0f1520] to-[#0d1825] shadow-[0_20px_50px_rgba(0,0,0,0.55),inset_0_1px_0_0_rgba(255,255,255,0.08)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 ${hover} ${className}`}
        >
            <div aria-hidden className={`pointer-events-none absolute inset-0 ${wash}`} />
            {glow ? (
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
                    style={{ background: glowBg }}
                />
            ) : null}
            <div className="relative z-10 h-full min-h-0">{children}</div>
        </div>
    );
}

/* ============================================================
   HOOKS — compte à rebours & compteurs animés
   ============================================================ */

function useCountdown(target) {
    const compute = () => {
        const diff = Math.max(0, target.getTime() - Date.now());
        return {
            d: Math.floor(diff / 86400000),
            h: Math.floor((diff % 86400000) / 3600000),
            m: Math.floor((diff % 3600000) / 60000),
            s: Math.floor((diff % 60000) / 1000),
        };
    };
    const [time, setTime] = useState(compute);
    useEffect(() => {
        const id = setInterval(() => setTime(compute()), 1000);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return time;
}

function useCountUp(target, active, duration = 1200) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (!active) return undefined;
        const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
        if (reduced) {
            setValue(target);
            return undefined;
        }
        let raf;
        const start = performance.now();
        const tick = (now) => {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setValue(Math.round(target * eased));
            if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [active, target, duration]);
    return value;
}

/* ============================================================
   ICÔNES
   ============================================================ */

function IconSparkles(props) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={props.className}>
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
        </svg>
    );
}

function IconArrowRight(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className={props.className}>
            <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function IconChartLine(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className={props.className}>
            <path d="M3 17l6-6 4 4 7-7" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 7h7v7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function IconStripeS(props) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={props.className}>
            <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
        </svg>
    );
}

function IconCheck(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden className={props.className}>
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function IconShield(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden className={props.className}>
            <path d="M12 2l8 4v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V6l8-4z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function IconFileDoc(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden className={props.className}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 2v6h6M16 13H8M16 17H8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function IconArchive(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden className={props.className}>
            <rect x="2" y="3" width="20" height="5" rx="1" />
            <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function IconSend(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden className={props.className}>
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function IconPlus(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className={props.className}>
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
    );
}

/* --- nouvelles icônes, côté pilotage / gestion --- */

function IconGauge(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden className={props.className}>
            <path d="M12 14l4-4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3.5 18a9 9 0 1 1 17 0" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="14" r="1.4" fill="currentColor" stroke="none" />
        </svg>
    );
}

function IconBell(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden className={props.className}>
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function IconBrain(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden className={props.className}>
            <path d="M9.5 3A2.5 2.5 0 0 0 7 5.5 2.5 2.5 0 0 0 5 8a2.5 2.5 0 0 0 .5 4.9V19a2 2 0 0 0 4 0V3.5A.5.5 0 0 0 9.5 3z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14.5 3A2.5 2.5 0 0 1 17 5.5 2.5 2.5 0 0 1 19 8a2.5 2.5 0 0 1-.5 4.9V19a2 2 0 0 1-4 0V3.5A.5.5 0 0 1 14.5 3z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function IconWallet(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden className={props.className}>
            <path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="3" y="7" width="18" height="12" rx="2" />
            <path d="M16 12.5h2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

/* ============================================================
   COMPTE À REBOURS RÉFORME — l'urgence qui vend
   ============================================================ */

function CountdownUnit({ value, label }) {
    return (
        <div className="flex flex-col items-center">
            <span className="ff-mono min-w-[2.6ch] text-center text-2xl font-bold tabular-nums text-white sm:text-3xl">
                {String(value).padStart(2, '0')}
            </span>
            <span className="ff-mono mt-1 text-[9px] uppercase tracking-[0.2em] text-zinc-500">{label}</span>
        </div>
    );
}

function ReformCountdown({ compact = false }) {
    const { d, h, m, s } = useCountdown(REFORM_DEADLINE);

    if (compact) {
        return (
            <span className="ff-mono tabular-nums">
                {`J\u2011${d}`}
            </span>
        );
    }

    return (
        <div className="inline-flex items-center gap-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] px-6 py-4 sm:gap-6 sm:px-8">
            <CountdownUnit value={d} label="jours" />
            <span className="text-xl text-emerald-500/50">:</span>
            <CountdownUnit value={h} label="heures" />
            <span className="text-xl text-emerald-500/50">:</span>
            <CountdownUnit value={m} label="min" />
            <span className="text-xl text-emerald-500/50">:</span>
            <CountdownUnit value={s} label="sec" />
        </div>
    );
}

/* ============================================================
   BANDEAU DÉFILANT (marquee) — réassurance vivante
   ============================================================ */

function TrustMarquee() {
    const items = [...TRUST_ITEMS, ...TRUST_ITEMS];
    return (
        <section aria-label="Garanties de conformité et de pilotage" className="ff-marquee w-full overflow-hidden border-y border-white/5 bg-white/[0.02] py-6">
            <div className="ff-marquee-track flex w-max items-center gap-10">
                {items.map((item, i) => (
                    <span key={`${item}-${i}`} className="flex items-center gap-10">
                        <span className="ff-mono whitespace-nowrap text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                            {item}
                        </span>
                        <span aria-hidden className="h-1 w-1 rounded-full bg-emerald-400/40" />
                    </span>
                ))}
            </div>
        </section>
    );
}

/* ============================================================
   SECTION DIFFÉRENCE — les deux piliers, à parts égales
   Le moment de positionnement : facturation ≠ pilotage,
   Copifi fait les deux.
   ============================================================ */

function PillarCard({ pillar }) {
    const sky = pillar.accent === 'sky';
    const c = sky
        ? {
              chip: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
              iconBox: 'bg-sky-500/20 ring-sky-400/35',
              iconText: 'text-sky-300',
              kicker: 'text-sky-400/80',
              check: 'bg-sky-500/20',
              checkIcon: 'text-sky-400',
              hoverBorder: 'hover:border-sky-400/30',
              wash: 'from-sky-500/[0.06] to-blue-500/[0.02]',
          }
        : {
              chip: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
              iconBox: 'bg-emerald-500/20 ring-emerald-400/35',
              iconText: 'text-emerald-300',
              kicker: 'text-emerald-400/80',
              check: 'bg-emerald-500/20',
              checkIcon: 'text-emerald-400',
              hoverBorder: 'hover:border-emerald-400/30',
              wash: 'from-emerald-500/[0.06] to-blue-500/[0.02]',
          };
    const Icon = pillar.icon;

    return (
        <div
            className={`group/pillar relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/[0.1] bg-gradient-to-br from-[#121a26] via-[#0f1520] to-[#0d1825] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.55),inset_0_1px_0_0_rgba(255,255,255,0.08)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 md:p-10 ${c.hoverBorder}`}
        >
            <div aria-hidden className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${c.wash} opacity-0 transition-opacity duration-500 group-hover/pillar:opacity-100`} />

            <div className="relative z-10 flex h-full flex-col">
                <div className="mb-6 flex items-center gap-3">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${c.iconBox}`}>
                        <Icon className={`h-5 w-5 ${c.iconText}`} />
                    </span>
                    <span className={`ff-mono rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${c.chip}`}>
                        {pillar.kicker}
                    </span>
                </div>

                <h3 className="text-2xl font-bold text-white md:text-3xl">{pillar.title}</h3>
                <p className="mt-3 max-w-md leading-relaxed text-zinc-400">{pillar.desc}</p>

                <ul className="mt-7 space-y-3.5">
                    {pillar.items.map((it) => (
                        <li key={it} className="flex items-start gap-3 text-sm text-zinc-200">
                            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${c.check}`}>
                                <IconCheck className={`h-3 w-3 ${c.checkIcon}`} />
                            </span>
                            {it}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

function DifferenceSection() {
    const pillars = [
        {
            accent: 'emerald',
            kicker: 'Pilier 1 · Facturation',
            icon: IconFileDoc,
            title: 'Facturer, sans faute',
            desc: 'Devis, factures et paiements — 100 % conformes à la réforme 2026, sans rien changer à vos habitudes.',
            items: [
                'Du devis à l\u2019encaissement en un seul flux',
                'Format Factur-X généré automatiquement',
                'Transmission via Plateforme Agréée DGFiP',
                'Archivage légal à valeur probante (10 ans)',
            ],
        },
        {
            accent: 'sky',
            kicker: 'Pilier 2 · Pilotage',
            icon: IconGauge,
            title: 'Piloter, sans tableur',
            desc: 'Vos chiffres transformés en décisions : trésorerie, marge, rentabilité, alertes et analyses IA.',
            items: [
                'Trésorerie, CA et marge en temps réel',
                'CAC, LTV et DSO calculés tout seuls',
                'Alertes avant que la marge ne dérape',
                'Analyse IA de votre activité chaque mois',
            ],
        },
    ];

    return (
        <section id="difference" className="relative mx-auto w-full max-w-7xl px-6 py-24 md:py-32">
            <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[min(100%,820px)] -translate-x-1/2 rounded-full bg-gradient-to-b from-emerald-500/[0.08] via-sky-500/[0.06] to-transparent blur-3xl"
            />

            <ScrollReveal className="relative mb-4 flex justify-center">
                <p className="ff-mono text-[11px] uppercase tracking-[0.28em] text-emerald-400/80">
                    Ce qui nous différencie
                </p>
            </ScrollReveal>

            <ScrollReveal delay={60} className="relative mb-6 text-center">
                <h2 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight text-white md:text-5xl md:leading-[1.12]">
                    Les logiciels de facturation s&apos;arrêtent à la facture.
                    {' '}
                    <span className="ff-serif italic text-transparent bg-gradient-to-r from-emerald-200 to-sky-300 bg-clip-text">
                        Nous, on va jusqu&apos;à la décision.
                    </span>
                </h2>
            </ScrollReveal>

            <ScrollReveal delay={90} className="relative mb-14 text-center">
                <p className="mx-auto max-w-2xl text-lg font-light leading-relaxed text-zinc-400">
                    Copifi réunit deux outils dans une seule application : de quoi facturer
                    sans erreur — et de quoi piloter votre entreprise comme un dirigeant
                    équipé d&apos;un directeur financier.
                </p>
            </ScrollReveal>

            <div className="relative grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 md:gap-8">
                <ScrollReveal className="h-full">
                    <PillarCard pillar={pillars[0]} />
                </ScrollReveal>
                <ScrollReveal delay={100} className="h-full">
                    <PillarCard pillar={pillars[1]} />
                </ScrollReveal>

                {/* connecteur central « + » sur desktop */}
                <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 z-20 hidden -translate-x-1/2 -translate-y-1/2 md:block">
                    <span className="ff-mono flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-[#0a0f16] text-lg font-bold text-white shadow-[0_0_30px_rgba(0,0,0,0.6)]">
                        +
                    </span>
                </div>
            </div>

            <ScrollReveal delay={160} className="mt-8 flex justify-center">
                <span className="ff-mono inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-2 text-[11px] uppercase tracking-[0.2em] text-zinc-400">
                    = une seule application · un seul abonnement
                </span>
            </ScrollReveal>
        </section>
    );
}

/* ============================================================
   CHIFFRES QUI VENDENT — stats produit animées (rééquilibrées)
   ============================================================ */

function StatBlock({ end, suffix, prefix = '', label, delay, tag, tagColor = 'text-emerald-400/80' }) {
    const ref = useRef(null);
    const [active, setActive] = useState(false);
    const value = useCountUp(end, active);

    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const obs = new IntersectionObserver(
            ([e]) => e.isIntersecting && setActive(true),
            { threshold: 0.4 },
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    return (
        <ScrollReveal delay={delay} className="h-full">
            <div ref={ref} className="flex h-full flex-col items-center rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8 text-center transition-colors duration-300 hover:border-white/20">
                {tag ? (
                    <p className={`ff-mono mb-3 text-[10px] uppercase tracking-[0.22em] ${tagColor}`}>{tag}</p>
                ) : null}
                <p className="ff-mono text-4xl font-bold tabular-nums text-white sm:text-5xl">
                    {prefix}{value}{suffix}
                </p>
                <p className="mt-3 text-sm leading-snug text-zinc-400">{label}</p>
            </div>
        </ScrollReveal>
    );
}

function StatsSection() {
    return (
        <section className="mx-auto w-full max-w-7xl px-6 py-20 md:py-24">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
                <StatBlock end={2} suffix=" min" tag="Facturation" tagColor="text-emerald-400/80" label="du devis à la facture envoyée, conforme réforme" delay={0} />
                <StatBlock end={100} suffix=" %" tag="Conformité" tagColor="text-emerald-400/80" label={'de vos factures au format Factur-X conforme'} delay={60} />
                <StatBlock end={6} suffix="" tag="Pilotage" tagColor="text-sky-400/80" label="indicateurs clés recalculés en temps réel" delay={120} />
                <StatBlock end={0} suffix="" tag="Gestion" tagColor="text-sky-400/80" label={'tableur Excel à maintenir — tout est automatique'} delay={180} />
            </div>
        </section>
    );
}

/* ============================================================
   SECTION FACTURATION — le cycle complet
   ============================================================ */

function InvoicingSection() {
    const steps = [
        { label: 'Devis', desc: 'Créé et envoyé en deux minutes, suivi d\u2019ouverture inclus.' },
        { label: 'Facture', desc: 'Le devis accepté devient facture en un clic. Numérotation légale automatique.' },
        { label: 'Paiement', desc: 'Encaissements suivis, relances sur les retards, escompte calculé.' },
    ];

    return (
        <section id="facturation" className="relative mx-auto w-full max-w-7xl px-6 py-24 md:py-32">
            <ScrollReveal className="mb-16 max-w-2xl">
                <p className="ff-mono mb-4 text-[11px] uppercase tracking-[0.28em] text-emerald-400/80">
                    Pilier 1 — Facturation
                </p>
                <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl md:leading-[1.12]">
                    Du devis à l&apos;encaissement,
                    {' '}
                    <span className="ff-serif italic text-emerald-200">sans friction.</span>
                </h2>
            </ScrollReveal>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {steps.map((s, i) => (
                    <ScrollReveal key={s.label} delay={80 + i * 60} className="h-full">
                        <GlassCard glow className="flex h-full flex-col p-8">
                            <p className="ff-mono text-xs tracking-[0.2em] text-zinc-500">{String(i + 1).padStart(2, '0')}</p>
                            <h3 className="mt-3 text-2xl font-bold text-white">{s.label}</h3>
                            <p className="mt-3 text-sm leading-relaxed text-zinc-400">{s.desc}</p>
                            {i < steps.length - 1 && (
                                <IconArrowRight aria-hidden className="mt-auto hidden h-5 w-5 self-end text-emerald-400/50 lg:block" />
                            )}
                            {i === steps.length - 1 && (
                                <span className="ff-mono mt-auto hidden self-end text-[10px] uppercase tracking-widest text-emerald-400/70 lg:block">
                                    Encaissé ✓
                                </span>
                            )}
                        </GlassCard>
                    </ScrollReveal>
                ))}
            </div>

            <ScrollReveal delay={220} className="mt-6">
                <GlassCard glow className="p-8">
                    <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                        <div className="max-w-sm">
                            <h3 className="text-xl font-bold text-white">Vos encaissements, en temps réel</h3>
                            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                                Ce que vous avez encaissé, ce qui reste dû, votre taux de recouvrement —
                                visibles d&apos;un coup d&apos;œil, jamais dans un tableur.
                            </p>
                        </div>
                        <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
                            {[
                                { label: 'Encaissé (30 j)', value: '18 420 €', delta: '+22 %', accent: 'text-emerald-400' },
                                { label: 'En attente', value: '4 850 €', delta: '3 factures', accent: 'text-amber-400' },
                                { label: 'Recouvrement', value: '94 %', delta: '+6 pts', accent: 'text-sky-400' },
                            ].map((stat) => (
                                <div
                                    key={stat.label}
                                    className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-400/35 hover:bg-emerald-500/[0.06]"
                                >
                                    <p className="text-xs text-zinc-500">{stat.label}</p>
                                    <p className="ff-mono mt-1 text-xl font-bold tabular-nums text-white">{stat.value}</p>
                                    <p className={`mt-1 text-xs font-semibold ${stat.accent}`}>{stat.delta}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </GlassCard>
            </ScrollReveal>
        </section>
    );
}

/* ============================================================
   SECTION CONFORMITÉ — réforme (rattachée au pilier facturation)
   ============================================================ */

function ComplianceSection() {
    return (
        <section id="conformite" className="relative mx-auto w-full max-w-7xl px-6 py-24 md:py-32">
            <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[min(100%,700px)] -translate-x-1/2 rounded-full bg-gradient-to-b from-emerald-500/[0.12] to-transparent blur-3xl"
            />

            <ScrollReveal className="relative mb-4 flex justify-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5">
                    <IconShield className="h-3.5 w-3.5 text-emerald-300" />
                    <span className="ff-mono text-[11px] uppercase tracking-[0.2em] text-emerald-300">
                        Réforme de la facturation électronique
                    </span>
                </div>
            </ScrollReveal>

            <ScrollReveal delay={60} className="relative mb-10 text-center">
                <h2 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight text-white md:text-5xl md:leading-[1.12]">
                    La loi change.
                    {' '}
                    <span className="ff-serif italic text-emerald-200">Pas vos habitudes.</span>
                </h2>
                <p className="mx-auto mt-5 max-w-2xl text-lg font-light leading-relaxed text-zinc-400">
                    Dès septembre 2026, chaque facture entre professionnels devra transiter
                    par une plateforme agréée par l&apos;État, dans un format structuré.
                    Copifi s&apos;en occupe — vous continuez simplement à facturer.
                </p>
            </ScrollReveal>

            <ScrollReveal delay={90} className="relative mb-16 flex flex-col items-center gap-3">
                <ReformCountdown />
                <p className="ff-mono text-[10px] uppercase tracking-[0.22em] text-zinc-600">
                    avant l&apos;obligation de réception — 1er septembre 2026
                </p>
            </ScrollReveal>

            <ScrollReveal delay={110} className="relative mb-14">
                <div className="group/timeline mx-auto grid max-w-5xl grid-cols-1 items-stretch gap-6 md:grid-cols-2">
                    {[
                        {
                            year: '2026',
                            badge: '1er SEPT. 2026',
                            title: 'Réception obligatoire',
                            desc: 'Toutes les entreprises doivent pouvoir recevoir des factures électroniques. Les grandes entreprises et ETI doivent aussi émettre.',
                            glow: 'radial-gradient(ellipse 80% 60% at 20% 80%, rgba(59,130,246,0.12), transparent 70%)',
                        },
                        {
                            year: '2027',
                            badge: '1er SEPT. 2027',
                            title: 'Émission obligatoire',
                            desc: 'TPE, PME et micro-entreprises devront émettre leurs factures via une plateforme agréée. Votre échéance.',
                            glow: 'radial-gradient(ellipse 80% 60% at 80% 80%, rgba(16,185,129,0.14), transparent 70%)',
                        },
                    ].map((m) => (
                        <article
                            key={m.year}
                            className="relative flex h-full min-h-[280px] overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.02] p-8 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/timeline:opacity-40 group-hover/timeline:blur-[2px] hover:!opacity-100 hover:!blur-none hover:-translate-y-2 hover:border-emerald-400/30 hover:bg-emerald-500/[0.05] md:min-h-[300px] md:p-12"
                        >
                            <div
                                aria-hidden
                                className="pointer-events-none absolute inset-0 z-0"
                                style={{ background: m.glow }}
                            />
                            <span
                                aria-hidden
                                className="ff-serif pointer-events-none absolute -bottom-12 -right-10 z-0 select-none text-[10rem] leading-none text-white/[0.03] md:text-[14rem]"
                            >
                                {m.year}
                            </span>
                            <div className="relative z-10 flex h-full flex-col">
                                <p className="ff-mono text-xs uppercase tracking-widest text-emerald-400">
                                    {m.badge}
                                </p>
                                <h3 className="mt-4 text-2xl font-bold text-white md:text-3xl">
                                    {m.title}
                                </h3>
                                <p className="mt-4 max-w-sm flex-1 leading-relaxed text-zinc-400">
                                    {m.desc}
                                </p>
                            </div>
                        </article>
                    ))}
                </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {[
                    {
                        icon: IconFileDoc,
                        title: 'Format Factur-X',
                        desc: 'Chaque facture est un PDF lisible doublé d\u2019une couche de données XML — le format hybride retenu pour la France.',
                        delay: 80,
                    },
                    {
                        icon: IconSend,
                        title: 'Transmission agréée',
                        desc: 'Vos factures transitent par une Plateforme Agréée immatriculée par la DGFiP. Le circuit officiel, intégré, invisible.',
                        delay: 140,
                    },
                    {
                        icon: IconArchive,
                        title: 'Archivage 10 ans',
                        desc: 'Conservation légale à valeur probante, piste d\u2019audit inaltérable, documents verrouillés après envoi.',
                        delay: 200,
                    },
                ].map((p) => {
                    const Icon = p.icon;
                    return (
                        <ScrollReveal key={p.title} delay={p.delay} className="h-full">
                            <GlassCard glow className="flex h-full flex-col p-8">
                                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/20 ring-1 ring-emerald-400/35">
                                    <Icon className="h-5 w-5 text-emerald-300" />
                                </div>
                                <h3 className="text-lg font-bold text-white">{p.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{p.desc}</p>
                            </GlassCard>
                        </ScrollReveal>
                    );
                })}
            </div>
        </section>
    );
}

/* ============================================================
   SECTION PILOTAGE & GESTION — le second pilier, à égalité
   (accent sky pour distinguer visuellement de la facturation)
   ============================================================ */

function PilotageSection() {
    return (
        <section id="pilotage" className="relative mx-auto w-full max-w-7xl px-6 py-24 md:py-32">
            <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[min(100%,760px)] -translate-x-1/2 rounded-full bg-gradient-to-b from-sky-500/[0.12] to-transparent blur-3xl"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute right-0 top-1/2 h-[380px] w-[380px] rounded-full bg-blue-500/[0.08] blur-[120px]"
            />

            <ScrollReveal className="relative mb-4 flex justify-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5">
                    <IconGauge className="h-3.5 w-3.5 text-sky-300" />
                    <span className="ff-mono text-[11px] uppercase tracking-[0.2em] text-sky-300">
                        Pilier 2 — Pilotage &amp; gestion d&apos;entreprise
                    </span>
                </div>
            </ScrollReveal>

            <ScrollReveal delay={60} className="relative mb-10 text-center">
                <h2 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight text-white md:text-5xl md:leading-[1.12]">
                    Vos chiffres ne dorment plus
                    {' '}
                    <span className="ff-serif italic text-sky-200">dans un tableur.</span>
                </h2>
                <p className="mx-auto mt-5 max-w-2xl text-lg font-light leading-relaxed text-zinc-400">
                    Chaque facture nourrit un vrai tableau de bord de dirigeant : trésorerie,
                    marge, CAC, LTV. Des alertes avant que ça dérape, une analyse IA chaque
                    mois. Comme un directeur financier, sans le recruter.
                </p>
            </ScrollReveal>

            {/* Split : checklist à gauche, graphique à droite */}
            <div className="relative grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
                <ScrollReveal>
                    <ul className="space-y-4">
                        {[
                            'Trésorerie prévisionnelle sur 90 jours',
                            'Alertes automatiques : marge négative, charges > 70 % du CA',
                            'Analyse mensuelle générée par IA, en français clair',
                            'Copilote financier qui connaît vos chiffres par cœur',
                        ].map((item) => (
                            <li key={item} className="flex items-start gap-3 text-sm text-zinc-300">
                                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500/20">
                                    <IconCheck className="h-3 w-3 text-sky-400" />
                                </span>
                                {item}
                            </li>
                        ))}
                    </ul>

                    {/* Mini-KPIs pilotage, distincts des KPIs d'encaissement */}
                    <div className="mt-8 grid grid-cols-3 gap-3">
                        {[
                            { label: 'Marge nette', value: '32 %', delta: '+3 pts', accent: 'text-sky-400' },
                            { label: 'Trésorerie 90 j', value: '+18 %', delta: 'saine', accent: 'text-emerald-400' },
                            { label: 'DSO', value: '12 j', delta: '-4 j', accent: 'text-sky-400' },
                        ].map((k) => (
                            <div key={k.label} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-400/35 hover:bg-sky-500/[0.06]">
                                <p className="text-[11px] text-zinc-500">{k.label}</p>
                                <p className="ff-mono mt-1 text-lg font-bold tabular-nums text-white">{k.value}</p>
                                <p className={`mt-0.5 text-[11px] font-semibold ${k.accent}`}>{k.delta}</p>
                            </div>
                        ))}
                    </div>
                </ScrollReveal>

                <ScrollReveal delay={120}>
                    <GlassCard glow accent="sky" className="p-6 md:p-8">
                        <div className="mb-5 flex items-start justify-between">
                            <div>
                                <p className="text-xs text-zinc-500">CA vs charges — 7 mois</p>
                                <p className="ff-mono mt-1 text-2xl font-bold tabular-nums text-white">
                                    19 400 €
                                    <span className="ml-2 rounded-md bg-sky-500/15 px-2 py-0.5 text-sm font-semibold text-sky-300">
                                        +14,7 %
                                    </span>
                                </p>
                            </div>
                            <IconChartLine className="h-5 w-5 text-zinc-500" />
                        </div>
                        <div className="h-[240px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="caFillPilotage" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.35} />
                                            <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                                    <XAxis dataKey="month" stroke="#71717a" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis
                                        stroke="#71717a"
                                        tick={{ fill: '#71717a', fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(v) => `${v / 1000} k€`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'rgba(10,10,10,0.92)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px',
                                        }}
                                        labelStyle={{ color: '#e5e7eb' }}
                                        formatter={(value, name) => [
                                            `${Number(value).toLocaleString('fr-FR')} €`,
                                            name === 'revenue' ? 'CA' : 'Charges',
                                        ]}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#38bdf8" strokeWidth={2.5} fill="url(#caFillPilotage)" />
                                    <Line type="monotone" dataKey="expenses" stroke="#3b82f6" strokeWidth={1.5} dot={false} strokeDasharray="4 6" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </GlassCard>
                </ScrollReveal>
            </div>

            {/* 3 cartes fonctionnalités — symétriques à la conformité */}
            <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
                {[
                    {
                        icon: IconGauge,
                        title: 'Indicateurs en temps réel',
                        desc: 'CA, marge, CAC, LTV, DSO, trésorerie : vos KPIs se recalculent à chaque facture, sans aucune saisie manuelle.',
                        delay: 80,
                    },
                    {
                        icon: IconBell,
                        title: 'Alertes intelligentes',
                        desc: 'Marge qui s\u2019érode, charges au-delà de 70 % du CA, retard d\u2019encaissement : Copifi vous prévient avant que ça coûte cher.',
                        delay: 140,
                    },
                    {
                        icon: IconBrain,
                        title: 'Copilote IA',
                        desc: 'Une analyse claire de votre mois, en français, et un assistant qui répond à « ma trésorerie tient combien de temps ? ».',
                        delay: 200,
                    },
                ].map((p) => {
                    const Icon = p.icon;
                    return (
                        <ScrollReveal key={p.title} delay={p.delay} className="h-full">
                            <GlassCard glow accent="sky" className="flex h-full flex-col p-8">
                                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/20 ring-1 ring-sky-400/35">
                                    <Icon className="h-5 w-5 text-sky-300" />
                                </div>
                                <h3 className="text-lg font-bold text-white">{p.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{p.desc}</p>
                            </GlassCard>
                        </ScrollReveal>
                    );
                })}
            </div>
        </section>
    );
}

/* ============================================================
   SECTION ASSISTANT IA
   ============================================================ */

function LandingChatSection({ auth, canAccessDashboard, isSuspended, onSubscribe, subscribeLabel }) {
    return (
        <section id="assistant" className="relative mx-auto w-full max-w-7xl px-6 py-24 md:py-32">
            <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[min(100%,800px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-emerald-500/[0.1] via-transparent to-blue-500/[0.1] blur-3xl"
            />

            <div className="relative grid grid-cols-1 items-stretch gap-10 lg:grid-cols-2 lg:gap-14">
                <div className="flex flex-col justify-center">
                    <ScrollReveal>
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5">
                            <IconSparkles className="h-3.5 w-3.5 text-emerald-300" />
                            <span className="ff-mono text-[11px] uppercase tracking-[0.2em] text-emerald-300">Assistant IA</span>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal delay={60}>
                        <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl md:leading-[1.12]">
                            Facturation ou pilotage,
                            <br />
                            <span className="ff-serif italic text-emerald-200">une question ? Posez-la ici.</span>
                        </h2>
                    </ScrollReveal>

                    <ScrollReveal delay={120}>
                        <p className="mt-5 max-w-lg text-lg font-light leading-relaxed text-zinc-400">
                            Réforme, échéances, tarifs, indicateurs, cas d&apos;usage —
                            l&apos;assistant répond en français, tout de suite.
                        </p>
                    </ScrollReveal>

                    <ScrollReveal delay={200} className="mt-10">
                        <PrimarySubscribeAction
                            auth={auth}
                            canAccessDashboard={canAccessDashboard}
                            isSuspended={isSuspended}
                            onSubscribe={onSubscribe}
                            className="inline-flex items-center gap-2 rounded-full border border-[#C9A962]/35 bg-gradient-to-r from-[#C9A962]/90 to-[#E8D5A8]/90 px-6 py-3 text-base font-semibold text-[#1a1510] shadow-[0_0_28px_rgba(201,169,98,0.2)] transition hover:shadow-[0_0_40px_rgba(201,169,98,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8D5A8]/60"
                        >
                            {subscribeLabel}
                            <IconArrowRight className="h-4 w-4" />
                        </PrimarySubscribeAction>
                    </ScrollReveal>
                </div>

                <ScrollReveal delay={100} className="h-full min-h-[520px]">
                    <LandingChatWidget />
                </ScrollReveal>
            </div>
        </section>
    );
}

/* ============================================================
   TARIFS — offre unique premium
   ============================================================ */

const OFFER_FEATURES = [
    { t: 'Facturation conforme 2026 — Factur-X & Plateforme Agréée', accent: 'gold' },
    { t: 'Devis et factures illimités · archivage légal 10 ans', accent: 'gold' },
    { t: 'Tableau de bord : trésorerie, marge et CA en temps réel', accent: 'emerald' },
    { t: 'Pilotage avancé : CAC, LTV, DSO et prévisionnel', accent: 'emerald' },
    { t: 'Copilote IA, alertes intelligentes et analyses mensuelles', accent: 'emerald' },
    { t: 'Hébergement France · RGPD · support prioritaire', accent: 'gold' },
];

function PricingSection({ auth, canAccessDashboard, isSuspended, onSubscribe, pricing, subscribeLabel }) {
    return (
        <section id="tarifs" className="relative mx-auto w-full max-w-7xl px-6 pb-28 pt-24 md:pb-36 md:pt-32">
            <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[min(100%,720px)] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(201,169,98,0.14)_0%,transparent_68%)]"
            />

            <ScrollReveal className="relative mb-16 text-center">
                <p className="ff-mono mb-5 text-[11px] uppercase tracking-[0.32em] text-[#C9A962]/90">
                    L&apos;offre unique
                </p>
                <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
                    Tout Copifi.
                    {' '}
                    <span className="ff-serif italic text-[#E8D5A8]">Une seule formule.</span>
                </h2>
                <p className="mx-auto mt-5 max-w-lg text-base font-light leading-relaxed text-zinc-400 md:text-lg">
                    Facturation conforme et pilotage d&apos;entreprise — réunis dans un abonnement
                    unique, sans compromis.
                </p>
            </ScrollReveal>

            <ScrollReveal delay={80} className="relative mx-auto max-w-xl">
                <div className="relative overflow-hidden rounded-[2rem] border border-[#C9A962]/25 bg-gradient-to-b from-[#12100c] via-[#0a0d12] to-[#06080b] p-[1px] shadow-[0_40px_100px_rgba(0,0,0,0.55),0_0_80px_-20px_rgba(201,169,98,0.35)]">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#E8D5A8] to-transparent"
                    />
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#C9A962]/10 blur-3xl"
                    />
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-emerald-500/[0.07] blur-3xl"
                    />

                    <div className="relative px-8 py-10 sm:px-10 sm:py-12">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="ff-mono text-[10px] uppercase tracking-[0.28em] text-[#C9A962]/80">
                                    Accès complet
                                </p>
                                <h3 className="ff-serif mt-3 text-3xl text-white md:text-4xl">
                                    {pricing.name}
                                </h3>
                                <p className="mt-2 text-sm font-light text-zinc-400">
                                    L&apos;intégralité de la plateforme, sans limite.
                                </p>
                            </div>
                            <span className="ff-mono shrink-0 rounded-full border border-[#C9A962]/30 bg-[#C9A962]/10 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-[#E8D5A8]">
                                Tout inclus
                            </span>
                        </div>

                        <div className="my-10 border-y border-white/[0.06] py-10 text-center">
                            <div className="flex items-end justify-center gap-1">
                                <span className="ff-serif text-6xl font-normal leading-none tracking-tight text-white md:text-7xl">
                                    {pricing.amount_display}
                                </span>
                                <span className="mb-2 text-2xl font-light text-[#E8D5A8] md:text-3xl">€</span>
                            </div>
                            <p className="ff-mono mt-3 text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                                par mois · HT · sans engagement
                            </p>
                        </div>

                        <ul className="space-y-4">
                            {OFFER_FEATURES.map((feature) => (
                                <li
                                    key={feature.t}
                                    className="flex items-start gap-3.5 text-sm font-light leading-relaxed text-zinc-300"
                                >
                                    <span
                                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                                            feature.accent === 'gold'
                                                ? 'bg-[#C9A962]/15 ring-1 ring-[#C9A962]/25'
                                                : 'bg-emerald-500/15 ring-1 ring-emerald-400/20'
                                        }`}
                                    >
                                        <IconCheck
                                            className={`h-3 w-3 ${
                                                feature.accent === 'gold'
                                                    ? 'text-[#E8D5A8]'
                                                    : 'text-emerald-400'
                                            }`}
                                        />
                                    </span>
                                    {feature.t}
                                </li>
                            ))}
                        </ul>

                        <div className="mt-10">
                            <PrimarySubscribeAction
                                auth={auth}
                                canAccessDashboard={canAccessDashboard}
                                isSuspended={isSuspended}
                                onSubscribe={onSubscribe}
                                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-[#C9A962]/40 bg-gradient-to-r from-[#C9A962] via-[#E8D5A8] to-[#C9A962] px-6 py-4 text-base font-semibold text-[#1a1510] shadow-[0_0_40px_rgba(201,169,98,0.25)] transition hover:shadow-[0_0_56px_rgba(201,169,98,0.4)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8D5A8]/60"
                            >
                                {subscribeLabel}
                                <IconArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
                            </PrimarySubscribeAction>
                        </div>
                    </div>
                </div>
            </ScrollReveal>

            <ScrollReveal delay={180} className="relative mt-10">
                <p className="ff-mono text-center text-[11px] uppercase tracking-[0.22em] text-zinc-600">
                    Paiement sécurisé · Résiliable à tout moment · Données hébergées en France
                </p>
            </ScrollReveal>
        </section>
    );
}

/* ============================================================
   FAQ — lever les objections avant l'achat
   ============================================================ */

const FAQ_ITEMS = [
    {
        q: 'Copifi, c\u2019est juste un logiciel de facturation ?',
        a: 'Non, et c\u2019est tout l\u2019intérêt. Copifi réunit deux outils : une facturation 100 % conforme à la réforme 2026, et un vrai pilotage d\u2019entreprise (trésorerie, marge, CAC, LTV, alertes, analyses IA). Là où les autres s\u2019arrêtent à la facture, Copifi vous aide à décider.',
    },
    {
        q: 'Le pilotage financier, comment ça marche sans comptable ?',
        a: 'Chaque facture et chaque encaissement alimentent automatiquement vos indicateurs. Pas de saisie, pas de tableur : vous voyez votre CA, votre marge et votre trésorerie en temps réel, vous recevez des alertes quand quelque chose dérape, et une analyse IA vous résume votre mois en français clair.',
    },
    {
        q: 'Suis-je concerné par la réforme de la facturation électronique ?',
        a: 'Oui, si vous êtes assujetti à la TVA en France — y compris en franchise en base (auto-entrepreneurs). Dès septembre 2026, vous devrez pouvoir recevoir des factures électroniques. À partir de septembre 2027, vous devrez aussi les émettre via une plateforme agréée.',
    },
    {
        q: 'Dois-je changer ma façon de facturer ?',
        a: 'Non — c\u2019est le principe même de Copifi. Vous créez vos devis et factures comme d\u2019habitude ; la conversion au format Factur-X, la transmission via la plateforme agréée et l\u2019archivage légal se font automatiquement, en arrière-plan.',
    },
    {
        q: 'Mes données sont-elles en sécurité ?',
        a: 'Vos données sont hébergées en France, isolées par compte, et vos documents deviennent inaltérables après envoi. Chaque action est tracée dans une piste d\u2019audit conforme, et l\u2019archivage à valeur probante couvre la durée légale de 10 ans.',
    },
    {
        q: 'Puis-je annuler mon abonnement quand je veux ?',
        a: 'Oui. Sans engagement, résiliation en deux clics depuis votre espace, et vous conservez l\u2019accès en lecture à vos documents archivés conformément à vos obligations légales.',
    },
];

function FaqItem({ item, open, onToggle }) {
    return (
        <div className="border-b border-white/[0.07]">
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-6 py-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
            >
                <span className="text-base font-semibold text-white sm:text-lg">{item.q}</span>
                <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] transition-transform duration-300 ${
                        open ? 'rotate-45 border-emerald-400/40 text-emerald-300' : 'text-zinc-400'
                    }`}
                >
                    <IconPlus className="h-4 w-4" />
                </span>
            </button>
            <div
                className={`grid transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
            >
                <div className="overflow-hidden">
                    <p className="max-w-3xl pb-6 text-sm leading-relaxed text-zinc-400">{item.a}</p>
                </div>
            </div>
        </div>
    );
}

function FaqSection() {
    const [openIndex, setOpenIndex] = useState(0);

    return (
        <section id="faq" className="mx-auto w-full max-w-4xl px-6 py-24 md:py-28">
            <ScrollReveal className="mb-12 text-center">
                <p className="ff-mono mb-4 text-[11px] uppercase tracking-[0.28em] text-emerald-400/80">FAQ</p>
                <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
                    Les questions
                    {' '}
                    <span className="ff-serif italic text-emerald-200">qu&apos;on nous pose.</span>
                </h2>
            </ScrollReveal>

            <ScrollReveal delay={80}>
                <div className="rounded-[2rem] border border-white/[0.07] bg-white/[0.02] px-6 sm:px-10">
                    {FAQ_ITEMS.map((item, i) => (
                        <FaqItem
                            key={item.q}
                            item={item}
                            open={openIndex === i}
                            onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
                        />
                    ))}
                </div>
            </ScrollReveal>
        </section>
    );
}

/* ============================================================
   CTA FINAL — fermer la vente
   ============================================================ */

function FinalCtaSection({ auth, canAccessDashboard, isSuspended, onSubscribe, subscribeLabel, pricing }) {
    const { d } = useCountdown(REFORM_DEADLINE);

    return (
        <section className="relative mx-auto w-full max-w-7xl px-6 pb-28 pt-8 md:pb-36">
            <ScrollReveal>
                <div className="relative overflow-hidden rounded-[2.5rem] border border-emerald-400/20 bg-gradient-to-br from-[#0c1a16] via-[#0a1220] to-[#0d1825] px-8 py-16 text-center shadow-[0_30px_80px_rgba(0,0,0,0.5)] sm:px-16 md:py-20">
                    <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/[0.15] blur-[100px]" />
                    <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-sky-500/[0.14] blur-[100px]" />

                    <p className="ff-mono relative text-[11px] uppercase tracking-[0.24em] text-emerald-300">
                        J&#8209;{d} avant l&apos;échéance de septembre 2026
                    </p>

                    <h2 className="relative mx-auto mt-6 max-w-3xl text-3xl font-bold leading-[1.12] tracking-tight text-white md:text-5xl">
                        La conformité qui rassure.
                        <br />
                        <span className="ff-serif italic text-transparent bg-gradient-to-r from-emerald-200 to-sky-300 bg-clip-text">
                            Le pilotage qui fait grandir.
                        </span>
                    </h2>

                    <p className="relative mx-auto mt-5 max-w-xl text-lg font-light text-zinc-400">
                        Créez votre compte aujourd&apos;hui — vous facturez conforme dès demain,
                        et vous pilotez votre entreprise dans la foulée.
                    </p>

                    <div className="relative mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <PrimarySubscribeAction
                            auth={auth}
                            canAccessDashboard={canAccessDashboard}
                            isSuspended={isSuspended}
                            onSubscribe={onSubscribe}
                            className="inline-flex items-center gap-2 rounded-full border border-[#C9A962]/40 bg-gradient-to-r from-[#C9A962] via-[#E8D5A8] to-[#C9A962] px-9 py-4 text-lg font-semibold text-[#1a1510] shadow-[0_0_36px_rgba(201,169,98,0.3)] transition hover:shadow-[0_0_52px_rgba(201,169,98,0.45)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8D5A8]/60"
                        >
                            {subscribeLabel}
                            <IconArrowRight className="h-5 w-5" />
                        </PrimarySubscribeAction>
                        <a
                            href="#tarifs"
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-9 py-4 text-lg font-medium text-white transition hover:border-[#C9A962]/30 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                        >
                            Voir l&apos;offre
                        </a>
                    </div>

                    <p className="ff-mono relative mt-8 text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                        {pricing.amount_label}/mois HT · sans engagement · paiement sécurisé
                    </p>
                </div>
            </ScrollReveal>
        </section>
    );
}

/* ============================================================
   HERO — dashboard flottant 3D (conservé)
   ============================================================ */

function HeroChart() {
    return (
        <div className="relative isolate h-[280px] w-full min-h-0 sm:h-[340px] md:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="month" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis
                        stroke="#9ca3af"
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${v / 1000} k€`}
                    />
                    <Tooltip
                        contentStyle={{
                            background: 'rgba(10,10,10,0.9)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                        }}
                        labelStyle={{ color: '#e5e7eb' }}
                        formatter={(value, name) => [
                            `${Number(value).toLocaleString('fr-FR')} €`,
                            name === 'revenue' ? 'CA' : 'Charges',
                        ]}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fill="url(#revFill)" />
                    <Line type="monotone" dataKey="expenses" stroke="#3b82f6" strokeWidth={2} dot={false} strokeDasharray="4 6" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

/* ============================================================
   ACTIONS AUTH / ABONNEMENT
   ============================================================ */

function TopActions({ auth, canAccessDashboard, isSuspended, onSubscribe }) {
    if (auth?.user) {
        return (
            <div className="flex items-center gap-2">
                {isSuspended ? (
                    <span className="rounded-full border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm font-medium text-rose-100">
                        Compte suspendu
                    </span>
                ) : canAccessDashboard ? (
                    <MagneticLink
                        href={route('dashboard')}
                        className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 sm:px-5"
                    >
                        Tableau de bord
                    </MagneticLink>
                ) : (
                    <MagneticButton
                        onClick={onSubscribe}
                        className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 sm:px-5"
                    >
                        S&apos;abonner
                    </MagneticButton>
                )}
                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:px-5"
                >
                    Se déconnecter
                </Link>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 sm:gap-3">
            <MagneticLink
                href={route('login')}
                className="px-3 py-2 text-sm font-medium text-white transition hover:text-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 sm:px-4"
            >
                Se connecter
            </MagneticLink>
            <MagneticLink
                href={route('register')}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:px-5"
            >
                S&apos;inscrire
            </MagneticLink>
        </div>
    );
}

function PrimarySubscribeAction({ auth, canAccessDashboard, isSuspended, onSubscribe, children, className }) {
    if (!auth?.user) {
        return (
            <MagneticLink href={buildSubscribeAuthUrl('register')} className={className}>
                {children}
            </MagneticLink>
        );
    }
    if (isSuspended) {
        return <span className={`${className} cursor-not-allowed opacity-70`}>Compte suspendu</span>;
    }
    if (canAccessDashboard) {
        return (
            <MagneticLink href={route('dashboard')} className={className}>
                Tableau de bord
                <IconArrowRight className="h-5 w-5" />
            </MagneticLink>
        );
    }
    return (
        <MagneticButton onClick={onSubscribe} className={className}>
            {children}
        </MagneticButton>
    );
}

/* ============================================================
   PAGE
   ============================================================ */

const FLASH_AUTO_DISMISS_MS = 6000;

function WelcomeFlashBanner() {
    const { flash } = usePage().props;
    const [banner, setBanner] = useState(null);
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        if (flash?.success) {
            setBanner({ type: 'success', message: flash.success });
        } else if (flash?.error) {
            setBanner({ type: 'error', message: flash.error });
        } else {
            setBanner(null);
        }

        setIsLeaving(false);
    }, [flash?.success, flash?.error]);

    useEffect(() => {
        if (!banner) {
            return undefined;
        }

        const fadeTimer = window.setTimeout(() => setIsLeaving(true), FLASH_AUTO_DISMISS_MS - 500);
        const hideTimer = window.setTimeout(() => setBanner(null), FLASH_AUTO_DISMISS_MS);

        return () => {
            window.clearTimeout(fadeTimer);
            window.clearTimeout(hideTimer);
        };
    }, [banner]);

    if (!banner) {
        return null;
    }

    const dismiss = () => {
        setIsLeaving(true);
        window.setTimeout(() => setBanner(null), 300);
    };

    const toneClass =
        banner.type === 'success'
            ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-50'
            : 'border-rose-400/40 bg-rose-500/15 text-rose-50';

    return (
        <div
            role="alert"
            className={`fixed left-1/2 top-24 z-[60] w-[min(92vw,36rem)] -translate-x-1/2 px-2 transition-all duration-500 ${
                isLeaving ? 'translate-y-[-8px] opacity-0' : 'translate-y-0 opacity-100'
            }`}
        >
            <div
                className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-lg backdrop-blur-sm ${toneClass}`}
            >
                <p className="flex-1 leading-relaxed">{banner.message}</p>
                <button
                    type="button"
                    onClick={dismiss}
                    className="shrink-0 rounded p-0.5 text-base leading-none opacity-70 transition hover:opacity-100"
                    aria-label="Fermer le message"
                >
                    ×
                </button>
            </div>
        </div>
    );
}

export default function Welcome({ auth }) {
    const { pricing } = usePage().props;
    const year = new Date().getFullYear();
    const canAccessDashboard = Boolean(auth?.user?.can_access_app);
    const isSuspended = Boolean(auth?.user?.is_suspended);
    const subscribeCheckoutTriggered = useRef(false);
    const subscribeLabel = `S'abonner — ${pricing.amount_label}/mois`;

    const startCheckout = useCallback(() => {
        router.post(route('billing.checkout'));
    }, []);

    const handleSubscribe = useCallback(() => {
        if (isSuspended) {
            return;
        }

        if (canAccessDashboard) {
            router.visit(route('dashboard'));
            return;
        }

        if (!auth?.user) {
            router.visit(buildSubscribeAuthUrl('register'));
            return;
        }

        startCheckout();
    }, [auth, canAccessDashboard, isSuspended, startCheckout]);

    useEffect(() => {
        if (subscribeCheckoutTriggered.current) {
            return;
        }

        if (!auth?.user || isSuspended || canAccessDashboard) {
            return;
        }

        if (!hasSubscribeIntent()) {
            return;
        }

        subscribeCheckoutTriggered.current = true;
        clearSubscribeIntent();
        startCheckout();
    }, [auth, canAccessDashboard, isSuspended, startCheckout]);

    return (
        <>
            <Head>
                <title>Copifi — Facturation conforme 2026 + pilotage d&apos;entreprise pour TPE et indépendants</title>
                <meta
                    name="description"
                    content="Bien plus qu'un logiciel de facturation : Copifi réunit la facturation conforme à la réforme 2026 (Factur-X, Plateforme Agréée, archivage 10 ans) et le pilotage complet de votre entreprise — trésorerie, marge, CAC, LTV, alertes et analyses IA."
                />
                <meta property="og:title" content="Copifi — Pilotez, facturez, décidez" />
                <meta
                    property="og:description"
                    content="La facturation conforme 2026 ET le pilotage d'entreprise, dans une seule application. Ce qui nous différencie des logiciels de facturation classiques."
                />
                <meta property="og:type" content="website" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <style>{`
                #ff-landing .ff-serif { font-family: 'Instrument Serif', Georgia, serif; font-weight: 400; letter-spacing: -0.01em; }
                #ff-landing .ff-mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; }
                @keyframes ff-marquee {
                    from { transform: translateX(0); }
                    to { transform: translateX(-50%); }
                }
                #ff-landing .ff-marquee-track { animation: ff-marquee 32s linear infinite; }
                #ff-landing .ff-marquee:hover .ff-marquee-track { animation-play-state: paused; }
                @media (prefers-reduced-motion: reduce) {
                    #ff-landing .ff-marquee-track { animation: none; flex-wrap: wrap; width: 100%; justify-content: center; }
                    #ff-landing * { transition-duration: 0.01ms !important; }
                }
            `}</style>

            <div id="ff-landing" className="relative min-h-screen overflow-x-clip bg-[#050505] text-white selection:bg-emerald-500 selection:text-black">
                <div className="pointer-events-none fixed inset-0 -z-50 bg-[#050505]" />
                <div
                    className="pointer-events-none fixed inset-0 z-0"
                    style={{
                        background:
                            'radial-gradient(circle at 50% 0%, rgba(16,185,129,0.15), transparent 50%), radial-gradient(circle at 80% 50%, rgba(56,189,248,0.1), transparent 50%)',
                    }}
                />
                <div className="pointer-events-none fixed inset-0 z-0 opacity-90" style={{ backgroundImage: gridBg }} />
                <div className="pointer-events-none fixed -left-1/4 top-1/3 z-0 h-[420px] w-[420px] rounded-full bg-emerald-500/20 blur-[120px]" />
                <div className="pointer-events-none fixed -right-1/4 bottom-1/4 z-0 h-[380px] w-[380px] rounded-full bg-sky-500/15 blur-[120px]" />

                <WelcomeFlashBanner />

                <nav className="fixed left-1/2 top-6 z-50 flex w-[90%] max-w-5xl -translate-x-1/2 items-center gap-3 rounded-full border border-white/10 bg-[rgba(10,14,20,0.75)] px-4 py-3 shadow-lg backdrop-blur-md sm:gap-4 sm:px-6">
                    <MagneticLink
                        href="/"
                        wrapperClassName="inline-flex shrink-0 items-center"
                        className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
                    >
                        <CopifiLogo size="nav" priority />
                    </MagneticLink>

                    <div className="hidden min-w-0 flex-1 items-center justify-center gap-6 text-sm font-medium text-zinc-300 md:flex">
                        <a href="#difference" className="whitespace-nowrap transition-colors hover:text-white">La différence</a>
                        <a href="#facturation" className="whitespace-nowrap transition-colors hover:text-white">Facturation</a>
                        <a href="#pilotage" className="whitespace-nowrap transition-colors hover:text-white">Pilotage</a>
                        <a href="#conformite" className="whitespace-nowrap transition-colors hover:text-white">Conformité</a>
                        <a href="#tarifs" className="whitespace-nowrap transition-colors hover:text-white">Tarifs</a>
                    </div>

                    <div className="ml-auto shrink-0 md:ml-0">
                        <TopActions
                            auth={auth}
                            canAccessDashboard={canAccessDashboard}
                            isSuspended={isSuspended}
                            onSubscribe={handleSubscribe}
                        />
                    </div>
                </nav>

                <main className="relative z-10 flex flex-col items-center pb-24 pt-32">
                    {/* ============ HERO — dashboard flottant conservé ============ */}
                    <section id="hero" className="mx-auto flex w-full max-w-7xl flex-col items-center px-6 pb-16 pt-16 text-center sm:pb-20 sm:pt-20">
                        <ScrollReveal immediate>
                            <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                </span>
                                <span className="ff-mono text-[11px] uppercase tracking-[0.18em] text-emerald-300">
                                    Facturation + pilotage · prêt pour la réforme 2026
                                </span>
                            </div>
                        </ScrollReveal>

                        <ScrollReveal delay={80} immediate className="max-w-4xl">
                            <h1 className="text-5xl font-bold leading-[1.06] tracking-tighter text-white md:text-7xl">
                                Pilotez, facturez,
                                <br />
                                <span className="ff-serif italic bg-gradient-to-r from-emerald-200 to-sky-300 bg-clip-text text-transparent">
                                    décidez.
                                </span>
                            </h1>
                        </ScrollReveal>

                        <ScrollReveal delay={140} immediate className="mt-6 max-w-2xl">
                            <p className="text-lg font-light leading-relaxed text-zinc-400 md:text-xl">
                                Bien plus qu&apos;un logiciel de facturation. Copifi réunit vos
                                devis, factures et paiements conformes à la réforme 2026 —
                                <span className="text-zinc-200"> et </span>
                                le pilotage complet de votre entreprise : trésorerie, marge,
                                CAC, LTV, alertes et analyses IA.
                            </p>
                        </ScrollReveal>

                        <ScrollReveal delay={200} immediate className="mb-20 mt-10 flex w-full flex-col items-stretch justify-center gap-4 sm:mb-24 sm:w-auto sm:flex-row sm:items-center">
                            <PrimarySubscribeAction
                                auth={auth}
                                canAccessDashboard={canAccessDashboard}
                                isSuspended={isSuspended}
                                onSubscribe={handleSubscribe}
                                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#C9A962]/40 bg-gradient-to-r from-[#C9A962] via-[#E8D5A8] to-[#C9A962] px-8 py-4 text-lg font-semibold text-[#1a1510] shadow-[0_0_32px_rgba(201,169,98,0.28)] transition hover:shadow-[0_0_48px_rgba(201,169,98,0.42)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8D5A8]/60"
                            >
                                {subscribeLabel}
                            <IconArrowRight className="h-5 w-5" />
                        </PrimarySubscribeAction>
                        <a
                            href="#difference"
                                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-[rgba(255,255,255,0.07)] px-8 py-4 text-lg font-medium text-white transition hover:border-white/20 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                            >
                                <IconGauge className="h-5 w-5 text-sky-400" />
                                Ce qui nous différencie
                            </a>
                        </ScrollReveal>

                        <ScrollReveal delay={260} immediate className="relative isolate w-full max-w-5xl">
                            <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/20 blur-[120px]" />
                            <div className="relative z-10 rounded-[2rem] border border-white/10 bg-[rgba(255,255,255,0.08)] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-transform duration-500 [transform:perspective(1000px)_rotateX(10deg)_rotateY(-12deg)_rotateZ(4deg)] [transform-style:preserve-3d] [backface-visibility:hidden] hover:[transform:perspective(1000px)_rotateX(6deg)_rotateY(-6deg)_rotateZ(2deg)] md:p-8">
                                <div className="mb-6 flex items-start justify-between gap-4">
                                    <div className="text-left">
                                        <h3 className="text-sm font-medium text-zinc-400">CA vs charges — 7 mois</h3>
                                        <div className="ff-mono mt-1 text-2xl font-bold tabular-nums md:text-3xl">
                                            19 400 €{' '}
                                            <span className="ml-2 inline rounded-md bg-emerald-500/15 px-2 py-1 text-sm font-semibold text-emerald-400">
                                                +14,7 %
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 gap-2">
                                        <span className="h-3 w-3 rounded-full bg-red-500/80" />
                                        <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                                        <span className="h-3 w-3 rounded-full bg-green-500/80" />
                                    </div>
                                </div>
                                <HeroChart />
                            </div>

                            {/* Carte flottante gauche — pilier FACTURATION (emerald) */}
                            <div className="absolute -left-4 top-1/4 hidden max-w-[210px] animate-[bounce_4s_ease-in-out_infinite] rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.08)] p-4 shadow-xl backdrop-blur-sm lg:flex lg:items-center lg:gap-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-400/35">
                                    <IconFileDoc className="h-5 w-5 text-emerald-300" />
                                </div>
                                <div className="text-left">
                                    <div className="text-sm font-bold">Facture envoyée</div>
                                    <div className="text-xs text-emerald-400">Factur-X · conforme PA</div>
                                </div>
                            </div>

                            {/* Carte flottante droite — pilier PILOTAGE (sky) */}
                            <div className="absolute -right-2 bottom-1/4 hidden max-w-[220px] animate-[bounce_5s_ease-in-out_infinite] rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.08)] p-4 shadow-xl backdrop-blur-sm [animation-delay:1s] lg:flex lg:items-center lg:gap-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-500/20 ring-1 ring-sky-400/35">
                                    <IconGauge className="h-5 w-5 text-sky-300" />
                                </div>
                                <div className="text-left">
                                    <div className="text-sm font-bold">Marge nette 32 %</div>
                                    <div className="text-xs text-sky-400">Pilotage · live</div>
                                </div>
                            </div>
                        </ScrollReveal>

                        <ScrollReveal delay={320} immediate className="mt-8">
                            <p className="ff-mono text-[11px] uppercase tracking-[0.18em] text-zinc-600">
                                {pricing.amount_label}/mois HT · sans engagement · paiement sécurisé
                            </p>
                        </ScrollReveal>
                    </section>

                    <TrustMarquee />
                    <DifferenceSection />
                    <StatsSection />
                    <InvoicingSection />
                    <ComplianceSection />
                    <PilotageSection />
                    <LandingChatSection
                        auth={auth}
                        canAccessDashboard={canAccessDashboard}
                        isSuspended={isSuspended}
                        onSubscribe={handleSubscribe}
                        subscribeLabel={subscribeLabel}
                    />
                    <PricingSection
                        auth={auth}
                        canAccessDashboard={canAccessDashboard}
                        isSuspended={isSuspended}
                        onSubscribe={handleSubscribe}
                        pricing={pricing}
                        subscribeLabel={subscribeLabel}
                    />
                    <FaqSection />
                    <FinalCtaSection
                        auth={auth}
                        canAccessDashboard={canAccessDashboard}
                        isSuspended={isSuspended}
                        onSubscribe={handleSubscribe}
                        subscribeLabel={subscribeLabel}
                        pricing={pricing}
                    />
                </main>

                <footer className="relative z-10 border-t border-white/10 bg-[rgba(0,0,0,0.65)] py-10">
                    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
                        <CopifiLogo size="sm" />
                        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-zinc-500">
                            <a href="/mentions-legales" className="transition hover:text-white">Mentions légales</a>
                            <a href="/conditions-generales" className="transition hover:text-white">CGV</a>
                            <a href="/confidentialite" className="transition hover:text-white">Confidentialité</a>
                        </nav>
                        <p className="text-center text-sm text-zinc-500">
                            © {year} Mini CFO Digital. Tous droits réservés.
                        </p>
                    </div>
                </footer>

                <a
                    href="#assistant"
                    className="fixed bottom-5 right-5 z-[60] flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-black shadow-lg shadow-emerald-900/40 ring-1 ring-white/10 transition hover:scale-105 hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                    aria-label="Ouvrir l'assistant IA"
                >
                    <IconSparkles className="h-5 w-5" />
                </a>
            </div>
        </>
    );
}
