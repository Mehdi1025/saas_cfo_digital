import { Head, Link } from '@inertiajs/react';
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

const chartData = [
    { month: 'Jan', revenue: 30000, expenses: 25000 },
    { month: 'Feb', revenue: 35000, expenses: 28000 },
    { month: 'Mar', revenue: 42000, expenses: 32000 },
    { month: 'Apr', revenue: 38000, expenses: 30000 },
    { month: 'May', revenue: 55000, expenses: 40000 },
    { month: 'Jun', revenue: 68000, expenses: 45000 },
    { month: 'Jul', revenue: 85000, expenses: 50000 },
];

const gridBg =
    "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")";

function ScrollReveal({ children, className = '', delay = 0 }) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) {
            return undefined;
        }
        const obs = new IntersectionObserver(
            ([e]) => {
                if (e.isIntersecting) {
                    setVisible(true);
                }
            },
            { threshold: 0.08, rootMargin: '0px 0px -6% 0px' },
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={`transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${
                visible
                    ? 'translate-y-0 scale-100 opacity-100'
                    : 'translate-y-10 scale-[0.98] opacity-0'
            } ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}

function useMagnetic() {
    const rootRef = useRef(null);
    const innerRef = useRef(null);

    const onMove = useCallback((e) => {
        const root = rootRef.current;
        const inner = innerRef.current;
        if (!root || !inner) {
            return;
        }
        const r = root.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        const s = 0.12;
        inner.style.transform = `translate(${x * s}px, ${y * s}px)`;
    }, []);

    const onLeave = useCallback(() => {
        if (innerRef.current) {
            innerRef.current.style.transform = '';
        }
    }, []);

    return { rootRef, innerRef, onMove, onLeave };
}

function MagneticButton({ children, className = '', ...props }) {
    const { rootRef, innerRef, onMove, onLeave } = useMagnetic();

    return (
        <button
            ref={rootRef}
            type="button"
            onMouseMove={onMove}
            onMouseLeave={onLeave}
            className={className}
            {...props}
        >
            <span
                ref={innerRef}
                className="inline-flex items-center justify-center gap-2 transition-transform duration-150 ease-out"
            >
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
                <span
                    ref={innerRef}
                    className="inline-flex w-full items-center justify-center gap-2 transition-transform duration-150 ease-out"
                >
                    {children}
                </span>
            </Link>
        </div>
    );
}

function GlassCard({ children, className = '', glow = false }) {
    return (
        <div
            className={`group/card relative overflow-hidden rounded-[2rem] border border-white/[0.1] bg-gradient-to-br from-[#121a26] via-[#0f1520] to-[#0d1825] shadow-[0_20px_50px_rgba(0,0,0,0.55),inset_0_1px_0_0_rgba(255,255,255,0.08)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-emerald-400/30 hover:shadow-[0_28px_64px_rgba(0,0,0,0.45),0_0_0_1px_rgba(52,211,153,0.2),0_0_56px_-6px_rgba(16,185,129,0.25),0_0_40px_-4px_rgba(59,130,246,0.28)] ${className}`}
        >
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/[0.04] via-transparent to-blue-500/[0.07]"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute -left-28 -top-28 h-72 w-72 rounded-full bg-emerald-400/0 blur-3xl transition-all duration-700 ease-out group-hover/card:bg-emerald-400/[0.35] group-hover/card:blur-2xl"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute -bottom-32 -right-24 h-72 w-72 rounded-full bg-sky-400/0 blur-3xl transition-all duration-700 ease-out group-hover/card:bg-sky-500/[0.38] group-hover/card:blur-2xl"
            />
            {glow ? (
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
                    style={{
                        background:
                            'linear-gradient(118deg, rgba(16,185,129,0.2) 0%, transparent 40%, rgba(59,130,246,0.22) 72%, rgba(52,211,153,0.08) 100%)',
                    }}
                />
            ) : null}
            <div className="relative z-10 h-full min-h-0">{children}</div>
        </div>
    );
}

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

function IconPlay(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden className={props.className}>
            <circle cx="12" cy="12" r="9" />
            <path d="M10.5 8.5v7L16 12l-5.5-3.5z" fill="currentColor" stroke="none" />
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

function IconBell(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className={props.className}>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
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

function IconPie(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className={props.className}>
            <path d="M21.21 15.89A10 10 0 1 1 8 2.83" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22 12A10 10 0 0 0 12 2v10z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function IconWarning(props) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={props.className}>
            <path d="M12 2L1 21h22L12 2zm0 15a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm1-7.5v3h-2v-3h2z" />
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
                        tickFormatter={(v) => `$${v / 1000}k`}
                    />
                    <Tooltip
                        contentStyle={{
                            background: 'rgba(10,10,10,0.9)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                        }}
                        labelStyle={{ color: '#e5e7eb' }}
                        formatter={(value) => [`$${Number(value).toLocaleString()}`, '']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fill="url(#revFill)" />
                    <Line type="monotone" dataKey="expenses" stroke="#3b82f6" strokeWidth={2} dot={false} strokeDasharray="4 6" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

export default function TestLanding() {
    const year = new Date().getFullYear();

    return (
        <>
            <Head title="Mini CFO Digital | La clarté financière, enfin accessible" />

            <div className="relative min-h-screen overflow-x-clip bg-[#050505] text-white selection:bg-emerald-500 selection:text-black">
                <div className="fixed inset-0 bg-[#050505] -z-50 pointer-events-none" />
                <div
                    className="pointer-events-none fixed inset-0 z-0"
                    style={{
                        background:
                            'radial-gradient(circle at 50% 0%, rgba(16,185,129,0.15), transparent 50%), radial-gradient(circle at 80% 50%, rgba(59,130,246,0.1), transparent 50%)',
                    }}
                />
                <div
                    className="pointer-events-none fixed inset-0 z-0 opacity-90"
                    style={{ backgroundImage: gridBg }}
                />
                <div className="pointer-events-none fixed -left-1/4 top-1/3 z-0 h-[420px] w-[420px] rounded-full bg-emerald-500/20 blur-[120px]" />
                <div className="pointer-events-none fixed -right-1/4 bottom-1/4 z-0 h-[380px] w-[380px] rounded-full bg-blue-500/15 blur-[120px]" />

                <nav className="fixed left-1/2 top-6 z-50 flex w-[90%] max-w-5xl -translate-x-1/2 items-center justify-between rounded-full border border-white/10 bg-[rgba(255,255,255,0.08)] px-4 py-3 shadow-lg sm:px-6">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-blue-500">
                            <IconChartLine className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-lg font-bold tracking-tight">Mini CFO Digital</span>
                    </Link>
                    <div className="hidden items-center gap-8 text-sm font-medium text-zinc-300 md:flex">
                        <a href="#features" className="transition-colors hover:text-white">
                            Fonctionnalités
                        </a>
                        <a href="#pricing" className="transition-colors hover:text-white">
                            Tarifs
                        </a>
                    </div>
                    <MagneticLink
                        href={route('login')}
                        className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 sm:px-5"
                    >
                        Se connecter
                    </MagneticLink>
                </nav>

                <main className="relative z-10 flex flex-col items-center pb-24 pt-32">
                    <section id="hero" className="mx-auto flex w-full max-w-7xl flex-col items-center px-6 pb-24 pt-16 text-center sm:pb-28 sm:pt-20">
                        <ScrollReveal>
                            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-400">
                                <IconSparkles className="h-3.5 w-3.5" />
                                <span>Nouveau : Intégration IA disponible</span>
                            </div>
                        </ScrollReveal>

                        <ScrollReveal delay={80} className="max-w-4xl">
                            <h1 className="bg-gradient-to-b from-white via-white to-zinc-500 bg-clip-text font-sans text-5xl font-bold leading-[1.08] tracking-tighter text-transparent md:text-7xl lg:text-8xl">
                                La clarté financière,
                                <br />
                                enfin accessible.
                            </h1>
                        </ScrollReveal>

                        <ScrollReveal delay={140} className="mt-6 max-w-2xl">
                            <p className="text-lg font-light leading-relaxed text-zinc-400 md:text-xl">
                                Arrêtez de naviguer à vue. Suivez votre Chiffre d&apos;Affaires, votre CAC et votre LTV en
                                temps réel, sans jamais ouvrir Excel.
                            </p>
                        </ScrollReveal>

                        <ScrollReveal delay={200} className="mb-20 mt-10 flex w-full flex-col items-stretch justify-center gap-4 sm:mb-24 sm:w-auto sm:flex-row sm:items-center">
                            <MagneticLink
                                href={route('register')}
                                className="rounded-full bg-[#CCFF00] px-8 py-4 text-lg font-semibold text-black shadow-[0_0_28px_rgba(204,255,0,0.35)] transition hover:-translate-y-0.5 hover:bg-[#b8e600] hover:shadow-[0_0_40px_rgba(204,255,0,0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CCFF00]/70"
                            >
                                Démarrer l&apos;essai gratuit
                                <IconArrowRight className="h-5 w-5" />
                            </MagneticLink>
                            <MagneticButton
                                type="button"
                                className="rounded-full border border-white/10 bg-[rgba(255,255,255,0.07)] px-8 py-4 text-lg font-medium text-white shadow-inner transition hover:border-white/20 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                            >
                                <IconPlay className="h-5 w-5" />
                                Voir la démo
                            </MagneticButton>
                        </ScrollReveal>

                        <ScrollReveal delay={260} className="relative isolate w-full max-w-5xl">
                            <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/20 blur-[120px]" />
                            <div
                                className="relative z-10 rounded-[2rem] border border-white/10 bg-[rgba(255,255,255,0.08)] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-transform duration-500 [transform:perspective(1000px)_rotateX(10deg)_rotateY(-12deg)_rotateZ(4deg)] [transform-style:preserve-3d] [backface-visibility:hidden] hover:[transform:perspective(1000px)_rotateX(6deg)_rotateY(-6deg)_rotateZ(2deg)] md:p-8"
                            >
                                <div className="mb-6 flex items-start justify-between gap-4">
                                    <div className="text-left">
                                        <h3 className="text-sm font-medium text-zinc-400">Revenue vs Expenses (30 Days)</h3>
                                        <div className="mt-1 text-2xl font-bold md:text-3xl">
                                            $124,500.00{' '}
                                            <span className="ml-2 inline rounded-md bg-emerald-500/15 px-2 py-1 text-sm font-semibold text-emerald-400">
                                                +14.5%
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

                            <div className="absolute -left-4 top-1/4 hidden max-w-[200px] animate-[bounce_4s_ease-in-out_infinite] rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.08)] p-4 shadow-xl lg:flex lg:items-center lg:gap-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#635BFF]">
                                    <IconStripeS className="h-5 w-5 text-white" />
                                </div>
                                <div className="text-left">
                                    <div className="text-sm font-bold">Stripe Sync</div>
                                    <div className="text-xs text-emerald-400">Active now</div>
                                </div>
                            </div>
                            <div className="absolute -right-2 bottom-1/4 hidden max-w-[200px] animate-[bounce_5s_ease-in-out_infinite] rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.08)] p-4 shadow-xl [animation-delay:1s] lg:flex lg:items-center lg:gap-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/20">
                                    <IconBell className="h-5 w-5 text-red-400" />
                                </div>
                                <div className="text-left">
                                    <div className="text-sm font-bold">Alert</div>
                                    <div className="text-xs text-zinc-400">Burn rate high</div>
                                </div>
                            </div>
                        </ScrollReveal>
                    </section>

                    <section
                        id="social-proof"
                        className="mx-auto mt-4 w-full max-w-6xl border-y border-white/5 bg-white/[0.02] px-6 py-12 sm:mt-6"
                    >
                        <ScrollReveal>
                            <p className="mb-8 text-center text-xs font-medium uppercase tracking-widest text-zinc-500">
                                Ils pilotent leur croissance avec nous
                            </p>
                        </ScrollReveal>
                        <div className="flex flex-wrap items-center justify-center gap-10 opacity-60 grayscale transition-all duration-500 hover:grayscale-0 md:gap-20">
                            <span className="text-2xl font-bold text-zinc-300 transition hover:text-[#FF9900]">AWS</span>
                            <span className="text-2xl font-bold text-zinc-300 transition hover:text-[#4285F4]">Google</span>
                            <span className="text-2xl font-bold text-zinc-300 transition hover:text-[#E01E5A]">Slack</span>
                            <span className="text-2xl font-bold text-zinc-300 transition hover:text-[#F24E1E]">Figma</span>
                            <span className="text-2xl font-bold text-zinc-300 transition hover:text-[#FF7A59]">HubSpot</span>
                        </div>
                    </section>

                    <section id="features" className="mx-auto w-full max-w-7xl px-6 py-24 md:py-32">
                        <ScrollReveal className="mb-16 text-center">
                            <h2 className="bg-gradient-to-r from-white via-emerald-100 to-sky-200 bg-clip-text font-sans text-3xl font-bold tracking-tight text-transparent md:text-5xl">
                                Une vue d&apos;ensemble parfaite
                            </h2>
                            <p className="mx-auto mt-4 max-w-2xl text-zinc-400">
                                Tout ce dont vous avez besoin pour prendre des décisions financières éclairées, réuni dans une
                                interface élégante.
                            </p>
                        </ScrollReveal>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:items-stretch">
                            <ScrollReveal delay={60} className="h-full md:col-span-2">
                                <GlassCard glow className="flex h-full flex-col p-8">
                                    <div className="flex h-full flex-col justify-between">
                                        <div>
                                            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#635BFF]/25 ring-1 ring-[#635BFF]/40 transition-all duration-500 group-hover/card:shadow-[0_0_24px_rgba(99,91,255,0.45)] group-hover/card:ring-emerald-400/30">
                                                <IconStripeS className="h-7 w-7 text-[#a5b4fc]" />
                                            </div>
                                            <h3 className="text-2xl font-bold">Synchronisation Stripe</h3>
                                            <p className="mt-2 text-zinc-400">
                                                Connectez votre compte Stripe en un clic. Vos revenus, MRR et churn sont calculés
                                                et mis à jour en temps réel.
                                            </p>
                                        </div>
                                        <div className="relative mt-10 h-44 w-full">
                                            <div className="absolute left-[12%] top-1/2 z-10 flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-xl bg-[#635BFF] shadow-[0_0_30px_rgba(99,91,255,0.45)]">
                                                <IconStripeS className="h-8 w-8 text-white" />
                                            </div>
                                            <div className="absolute left-[20%] right-[20%] top-1/2 z-0 h-[2px] -translate-y-1/2 bg-gradient-to-r from-[#635BFF] to-emerald-500 opacity-60" />
                                            <div className="absolute right-[12%] top-1/2 z-10 flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-xl bg-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.45)]">
                                                <IconPie className="h-7 w-7 text-white" />
                                            </div>
                                        </div>
                                    </div>
                                </GlassCard>
                            </ScrollReveal>

                            <ScrollReveal delay={120} className="h-full">
                                <GlassCard glow className="flex h-full flex-col justify-between p-8">
                                    <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-emerald-500/20 blur-[50px]" />
                                    <div>
                                        <h3 className="text-xl font-bold">Score de Santé</h3>
                                        <p className="mt-2 text-sm text-zinc-400">
                                            Évaluation automatique de votre santé financière.
                                        </p>
                                    </div>
                                    <div className="mt-8 flex justify-center">
                                        <div className="relative h-36 w-36">
                                            <svg className="-rotate-90 transform" viewBox="0 0 100 100">
                                                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
                                                <circle
                                                    cx="50"
                                                    cy="50"
                                                    r="45"
                                                    fill="none"
                                                    stroke="#10B981"
                                                    strokeWidth="10"
                                                    strokeDasharray="283"
                                                    strokeDashoffset="22"
                                                    className="drop-shadow-[0_0_10px_rgba(16,185,129,0.65)]"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-3xl font-bold">92</span>
                                                <span className="text-xs text-zinc-400">/100</span>
                                            </div>
                                        </div>
                                    </div>
                                </GlassCard>
                            </ScrollReveal>

                            <ScrollReveal delay={80} className="h-full">
                                <GlassCard glow className="flex h-full flex-col justify-between p-8">
                                    <div className="absolute -right-6 top-0 h-32 w-32 rounded-full bg-red-500/20 blur-[50px]" />
                                    <div>
                                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20">
                                            <IconWarning className="h-5 w-5 text-red-400" />
                                        </div>
                                        <h3 className="text-xl font-bold">Alertes Intelligentes</h3>
                                        <p className="mt-2 text-sm italic text-zinc-400">
                                            &quot;Soyez prévenu avant que vos charges ne dépassent 70% de votre CA.&quot;
                                        </p>
                                    </div>
                                    <div className="mt-6 rounded-xl border border-white/5 bg-black/40 p-4">
                                        <div className="flex items-center gap-3">
                                            <span className="relative flex h-2 w-2">
                                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
                                                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                                            </span>
                                            <span className="text-sm font-medium text-zinc-300">Dépenses Marketing &gt; 30%</span>
                                        </div>
                                    </div>
                                </GlassCard>
                            </ScrollReveal>

                            <ScrollReveal delay={140} className="h-full md:col-span-2">
                                <GlassCard glow className="flex h-full min-h-0 flex-col p-8">
                                    <div className="mb-6 flex shrink-0 items-center justify-between gap-4">
                                        <h3 className="text-xl font-bold">Métriques Clés</h3>
                                        <button type="button" className="text-zinc-400 transition hover:text-white" aria-label="Plus d'options">
                                            ···
                                        </button>
                                    </div>
                                    <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 sm:auto-rows-fr sm:grid-cols-3 sm:items-stretch sm:gap-4">
                                        {[
                                            { label: 'CAC', value: '$124', delta: '-5%' },
                                            { label: 'LTV', value: '$4,500', delta: '+12%' },
                                            { label: 'Runway', value: '18 mo', delta: null },
                                        ].map((m) => (
                                            <div
                                                key={m.label}
                                                className="flex min-h-[5.5rem] flex-col justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-emerald-400/35 hover:bg-emerald-500/[0.06] hover:shadow-[0_0_28px_rgba(16,185,129,0.18),0_0_20px_rgba(59,130,246,0.12)] sm:min-h-0 sm:h-full"
                                            >
                                                <div className="text-xs text-zinc-400">{m.label}</div>
                                                <div className="mt-1 text-xl font-bold">
                                                    {m.value}{' '}
                                                    {m.delta && (
                                                        <span className="ml-1 text-xs font-semibold text-emerald-400">{m.delta}</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </GlassCard>
                            </ScrollReveal>
                        </div>
                    </section>

                    <section id="pricing" className="mx-auto flex w-full max-w-7xl flex-col items-center px-6 pt-20 pb-16 md:pt-28 md:pb-24">
                        <ScrollReveal delay={80} className="mb-14 text-center">
                            <h2 className="font-sans text-3xl font-bold tracking-tight md:text-5xl">Un investissement, pas une charge.</h2>
                            <p className="mx-auto mt-4 max-w-2xl text-zinc-400">
                                Tarification simple et transparente. Sans engagement.
                            </p>
                        </ScrollReveal>

                        <ScrollReveal delay={140} className="relative w-full max-w-md">
                            <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-r from-emerald-500 to-blue-500 opacity-30 blur-md" />
                            <div className="relative rounded-[2rem] border border-white/20 bg-[rgba(5,5,5,0.94)] p-10 shadow-2xl">
                                <div className="absolute -top-3 right-8">
                                    <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-black">
                                        Populaire
                                    </span>
                                </div>
                                <h3 className="text-2xl font-bold">Pro</h3>
                                <p className="mt-2 text-sm text-zinc-400">Pour les startups en croissance.</p>
                                <div className="mb-8 mt-6 flex items-baseline gap-2 border-b border-white/10 pb-8">
                                    <span className="text-5xl font-bold">49€</span>
                                    <span className="text-zinc-400">/ mois</span>
                                </div>
                                <ul className="mb-10 space-y-4">
                                    {[
                                        'Tableaux de bord illimités',
                                        'Synchronisation Stripe & Banques',
                                        'Alertes intelligentes & IA',
                                        'Support prioritaire 24/7',
                                    ].map((t) => (
                                        <li key={t} className="flex items-center gap-3 text-sm text-zinc-300">
                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20">
                                                <IconCheck className="h-3 w-3 text-emerald-400" />
                                            </span>
                                            {t}
                                        </li>
                                    ))}
                                </ul>
                                <MagneticLink
                                    href={route('register')}
                                    wrapperClassName="block w-full"
                                    className="block w-full rounded-xl bg-white py-4 text-center text-lg font-bold text-black shadow-[0_0_18px_rgba(255,255,255,0.25)] transition hover:bg-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                                >
                                    S&apos;abonner maintenant
                                </MagneticLink>
                            </div>
                        </ScrollReveal>
                    </section>
                </main>

                <footer className="relative z-10 border-t border-white/10 bg-[rgba(0,0,0,0.65)] py-8">
                    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
                        <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-emerald-400 to-blue-500">
                                <IconChartLine className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-sm font-bold">Mini CFO Digital</span>
                        </div>
                        <p className="text-center text-sm text-zinc-500">
                            © {year} Mini CFO Digital. Tous droits réservés.
                        </p>
                        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-zinc-500">
                            <a href="/mentions-legales" className="transition hover:text-white">Mentions légales</a>
                            <a href="/conditions-generales" className="transition hover:text-white">CGV</a>
                            <a href="/confidentialite" className="transition hover:text-white">Confidentialité</a>
                        </nav>
                    </div>
                </footer>

                <button
                    type="button"
                    className="fixed bottom-5 right-5 z-[60] flex h-11 w-11 items-center justify-center rounded-full bg-violet-600 text-lg font-bold text-white shadow-lg shadow-violet-900/40 ring-1 ring-white/10 transition hover:scale-105 hover:bg-violet-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                    aria-label="Aide"
                >
                    ?
                </button>
            </div>
        </>
    );
}
