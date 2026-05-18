import TestDashboardLayout from '@/Layouts/TestDashboardLayout';
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
    'border border-glassBorder bg-[linear-gradient(145deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.01)_100%)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-[20px]';

const NEON_BLUE = '#00F0FF';
const NEON_MINT = '#00FF9D';
const ORANGE = '#FF8A00';

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const MAIN_SERIES = [
    45, 52, 48, 60, 58, 65, 70, 68, 75, 82, 85, 90,
];
const CHARGES_SERIES = [30, 35, 32, 40, 45, 42, 50, 48, 55, 58, 60, 65];

const mainChartData = MONTHS.map((month, i) => ({
    month,
    revenus: MAIN_SERIES[i],
    charges: CHARGES_SERIES[i],
}));

const spark1 = [10, 15, 13, 17, 22, 18, 25].map((v, i) => ({ i, v }));
const spark2 = [20, 21, 23, 22, 24, 25, 24.8].map((v, i) => ({ i, v }));
const spark4 = [3800, 3900, 3850, 4000, 4100, 4200, 4250].map((v, i) => ({ i, v }));

const healthPie = [
    { name: 'Sain', value: 85 },
    { name: 'À améliorer', value: 15 },
];

function SparklineArea({ data, stroke, fillId }) {
    const fill = `url(#${fillId})`;
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
                <Area type="monotone" dataKey="v" stroke={stroke} strokeWidth={2} fill={fill} isAnimationActive />
            </AreaChart>
        </ResponsiveContainer>
    );
}

function MainChartTooltip({ active, payload, label }) {
    if (!active || !payload?.length) {
        return null;
    }
    return (
        <div className="rounded-lg border border-white/10 bg-obsidian/95 px-3 py-2 text-xs shadow-xl backdrop-blur-md">
            <p className="mb-1 font-medium text-white">{label}</p>
            {payload.map((p) => (
                <p key={p.dataKey} className="text-gray-300">
                    <span className="font-semibold" style={{ color: p.color }}>
                        {p.name}
                    </span>
                    : k€ {p.value}
                </p>
            ))}
        </div>
    );
}

export default function TestDashboard() {
    return (
        <TestDashboardLayout title="Tableau de bord mensuel">
            {/* Plein écran design : fond obsidian + halos (équivalent body HTML) */}
            <div className="selection:bg-neonBlue selection:text-obsidian relative -m-8 min-h-full bg-obsidian bg-neon-gradient px-8 pb-8 pt-8 font-display">
                <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                    <div className="absolute left-[-10%] top-[-20%] h-[50%] w-[50%] rounded-full bg-neonBlue/20 blur-[150px]" />
                    <div className="absolute bottom-[-20%] right-[-10%] h-[40%] w-[40%] rounded-full bg-neonMint/10 blur-[120px]" />
                </div>

                <div className="relative z-0 mx-auto max-w-[1600px] space-y-8">
                    {/* KPI */}
                    <section id="kpi-grid" className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                        <div
                            className={`${GLASS_PANEL} group relative overflow-hidden rounded-2xl p-6 transition-colors duration-500 hover:border-neonBlue/30`}
                        >
                            <div className="absolute right-0 top-0 p-4 opacity-20 transition-opacity group-hover:opacity-40">
                                <svg className="h-10 w-10 text-neonBlue" viewBox="0 0 24 24" fill="none" aria-hidden>
                                    <path
                                        d="M4 16l4-4 4 4 8-8"
                                        stroke="currentColor"
                                        strokeWidth="1.75"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <path d="M16 8h4v4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="relative z-10 flex h-full flex-col justify-between">
                                <div>
                                    <h3 className="mb-1 text-sm font-medium uppercase tracking-wider text-gray-400">
                                        Chiffre d&apos;affaires
                                    </h3>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold tracking-tighter text-white">124.5k €</span>
                                        <span className="rounded-md border border-neonBlue/20 bg-neonBlue/10 px-2 py-0.5 text-sm font-medium text-neonBlue">
                                            +12.5%
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-6 h-12 w-full">
                                    <SparklineArea data={spark1} stroke={NEON_BLUE} fillId="sp1" />
                                </div>
                            </div>
                        </div>

                        <div
                            className={`${GLASS_PANEL} group relative overflow-hidden rounded-2xl p-6 transition-colors duration-500 hover:border-neonMint/30`}
                        >
                            <div className="absolute right-0 top-0 p-4 opacity-20 transition-opacity group-hover:opacity-40">
                                <svg className="h-10 w-10 text-neonMint" viewBox="0 0 24 24" fill="none" aria-hidden>
                                    <path d="M8 8.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" stroke="currentColor" strokeWidth="1.5" />
                                    <path d="M16 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" stroke="currentColor" strokeWidth="1.5" />
                                    <path d="M16 8L8 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                            </div>
                            <div className="relative z-10 flex h-full flex-col justify-between">
                                <div>
                                    <h3 className="mb-1 text-sm font-medium uppercase tracking-wider text-gray-400">Marge nette</h3>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold tracking-tighter text-white">24.8%</span>
                                        <span className="rounded-md border border-neonMint/20 bg-neonMint/10 px-2 py-0.5 text-sm font-medium text-neonMint">
                                            +2.1%
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-6 h-12 w-full">
                                    <SparklineArea data={spark2} stroke={NEON_MINT} fillId="sp2" />
                                </div>
                            </div>
                        </div>

                        <div
                            className={`${GLASS_PANEL} group relative overflow-hidden rounded-2xl p-6 transition-colors duration-500 hover:border-white/20`}
                        >
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
                                        <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-medium text-gray-500">
                                            Pas de données
                                        </span>
                                    </div>
                                    <div className="mt-2 flex items-baseline gap-2">
                                        <span className="text-3xl font-light italic tracking-tighter text-gray-600">N/A</span>
                                    </div>
                                </div>
                                <div className="mt-6 flex items-center gap-2 text-xs text-gray-500">
                                    <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                                    </svg>
                                    <span>Nécessite connexion CRM</span>
                                </div>
                            </div>
                        </div>

                        <div
                            className={`${GLASS_PANEL} group relative overflow-hidden rounded-2xl p-6 transition-colors duration-500 hover:border-neonBlue/30`}
                        >
                            <div className="absolute right-0 top-0 p-4 opacity-20 transition-opacity group-hover:opacity-40">
                                <svg className="h-10 w-10 text-neonBlue" viewBox="0 0 24 24" fill="none" aria-hidden>
                                    <path d="M12 3 4 10l8 11 8-11-8-7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="relative z-10 flex h-full flex-col justify-between">
                                <div>
                                    <h3 className="mb-1 text-sm font-medium uppercase tracking-wider text-gray-400">LTV</h3>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold tracking-tighter text-white">4,250 €</span>
                                        <span className="rounded-md border border-neonBlue/20 bg-neonBlue/10 px-2 py-0.5 text-sm font-medium text-neonBlue">
                                            +5.4%
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-6 h-12 w-full">
                                    <SparklineArea data={spark4} stroke={NEON_BLUE} fillId="sp4" />
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        <div className="space-y-8 lg:col-span-2">
                            <section id="main-chart-section" className={`${GLASS_PANEL} relative overflow-hidden rounded-3xl p-1`}>
                                <div className="h-full rounded-[23px] bg-obsidian/40 p-6 backdrop-blur-md">
                                    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                                        <div>
                                            <h2 className="text-lg font-semibold tracking-wide text-white">Revenus vs Charges Totales</h2>
                                            <p className="mt-1 text-sm text-gray-400">Évolution sur les 12 derniers mois</p>
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

                                    <div className="h-[400px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={mainChartData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                                                <defs>
                                                    <linearGradient id="fillRev" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor={NEON_BLUE} stopOpacity={0.22} />
                                                        <stop offset="100%" stopColor={NEON_BLUE} stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="fillChg" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor={ORANGE} stopOpacity={0.12} />
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
                                                    tickFormatter={(v) => `k€ ${v}`}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    width={48}
                                                />
                                                <Tooltip content={<MainChartTooltip />} />
                                                <Area
                                                    type="monotone"
                                                    dataKey="charges"
                                                    name="Charges Totales"
                                                    stroke={ORANGE}
                                                    strokeWidth={2}
                                                    fill="url(#fillChg)"
                                                    isAnimationActive
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="revenus"
                                                    name="Revenus"
                                                    stroke={NEON_BLUE}
                                                    strokeWidth={3}
                                                    fill="url(#fillRev)"
                                                    isAnimationActive
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="mt-4 flex flex-wrap justify-center gap-6 border-t border-glassBorder pt-4">
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full bg-neonBlue shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
                                            <span className="text-sm text-gray-300">Revenus</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="h-3 w-3 rounded-full shadow-[0_0_8px_rgba(255,138,0,0.5)]"
                                                style={{ backgroundColor: ORANGE }}
                                            />
                                            <span className="text-sm text-gray-300">Charges Totales</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section id="recent-transactions" className={`${GLASS_PANEL} rounded-3xl p-6`}>
                                <div className="mb-6 flex items-center justify-between">
                                    <h2 className="text-lg font-semibold tracking-wide text-white">Flux Récents</h2>
                                    <button
                                        type="button"
                                        className="flex items-center text-sm text-neonBlue transition-colors hover:text-white"
                                    >
                                        Voir tout
                                        <svg className="ml-1 h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-left">
                                        <thead>
                                            <tr className="border-b border-glassBorder">
                                                <th className="pb-3 text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                                                <th className="pb-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    Description
                                                </th>
                                                <th className="pb-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    Catégorie
                                                </th>
                                                <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    Montant
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-glassBorder text-sm">
                                            <tr className="transition-colors hover:bg-white/5">
                                                <td className="py-4 text-gray-400">12 Oct 2023</td>
                                                <td className="py-4 font-medium text-white">Abonnements SaaS Annuels</td>
                                                <td className="py-4">
                                                    <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-gray-300">
                                                        Logiciels
                                                    </span>
                                                </td>
                                                <td className="py-4 text-right font-medium text-white">-4,500 €</td>
                                            </tr>
                                            <tr className="transition-colors hover:bg-white/5">
                                                <td className="py-4 text-gray-400">10 Oct 2023</td>
                                                <td className="py-4 font-medium text-white">Facture Client #4092</td>
                                                <td className="py-4">
                                                    <span className="rounded-md border border-neonBlue/20 bg-neonBlue/10 px-2.5 py-1 text-xs text-neonBlue">
                                                        Revenu
                                                    </span>
                                                </td>
                                                <td className="py-4 text-right font-medium text-neonBlue">+12,450 €</td>
                                            </tr>
                                            <tr className="transition-colors hover:bg-white/5">
                                                <td className="py-4 text-gray-400">08 Oct 2023</td>
                                                <td className="py-4 font-medium text-white">Campagne Marketing Q4</td>
                                                <td className="py-4">
                                                    <span
                                                        className="rounded-md border px-2.5 py-1 text-xs"
                                                        style={{
                                                            borderColor: `${ORANGE}33`,
                                                            backgroundColor: `${ORANGE}1a`,
                                                            color: ORANGE,
                                                        }}
                                                    >
                                                        Marketing
                                                    </span>
                                                </td>
                                                <td className="py-4 text-right font-medium text-white">-8,200 €</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </div>

                        <div className="space-y-8">
                            <section
                                id="health-score"
                                className={`${GLASS_PANEL} relative flex min-h-[320px] flex-col items-center justify-center rounded-3xl p-6`}
                            >
                                <h2 className="absolute left-6 top-6 text-lg font-semibold tracking-wide text-white">Score de santé</h2>
                                <button
                                    type="button"
                                    className="absolute right-6 top-6 text-gray-400 hover:text-white"
                                    aria-label="Plus d&apos;options"
                                >
                                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                                    </svg>
                                </button>

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
                                            >
                                                <Cell fill={NEON_MINT} />
                                                <Cell fill="rgba(255,255,255,0.05)" />
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                        <span
                                            className="text-5xl font-bold text-white"
                                            style={{ textShadow: '0 0 10px rgba(0, 255, 157, 0.5)' }}
                                        >
                                            85
                                        </span>
                                        <span className="mt-1 text-sm font-medium uppercase tracking-widest text-gray-400">/100</span>
                                    </div>
                                </div>
                                <p className="mt-6 max-w-[80%] text-center text-sm text-gray-400">
                                    Excellente santé financière globale ce mois-ci.
                                </p>
                            </section>

                            <section id="alerts-panel" className={`${GLASS_PANEL} rounded-3xl p-6`}>
                                <div className="mb-6 flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/10">
                                        <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                            <path d="M7 2v11h3v9l7-12h-4l4-8H7z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-lg font-semibold tracking-wide text-white">Alertes</h2>
                                </div>

                                <div className="space-y-4">
                                    <div className="relative overflow-hidden rounded-xl border border-neonMint/20 bg-neonMint/5 p-4">
                                        <div className="absolute bottom-0 left-0 top-0 w-1 bg-neonMint shadow-[0_0_10px_#00FF9D]" />
                                        <div className="flex gap-3 pl-2">
                                            <svg className="mt-0.5 h-5 w-5 shrink-0 text-neonMint" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                            </svg>
                                            <div>
                                                <h4 className="mb-1 text-sm font-semibold text-neonMint">
                                                    Sain : LTV/CAC &gt; 3 et marge positive
                                                </h4>
                                                <p className="text-xs leading-relaxed text-gray-400">
                                                    Vos ratios d&apos;acquisition sont optimaux. Poursuivez vos investissements marketing.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative overflow-hidden rounded-xl border border-[#FF8A00]/20 bg-[#FF8A00]/5 p-4">
                                        <div className="absolute bottom-0 left-0 top-0 w-1 bg-[#FF8A00] shadow-[0_0_10px_#FF8A00]" />
                                        <div className="flex gap-3 pl-2">
                                            <svg className="mt-0.5 h-5 w-5 shrink-0 text-[#FF8A00]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                                            </svg>
                                            <div>
                                                <h4 className="mb-1 text-sm font-semibold text-[#FF8A00]">Attention : Charges &gt; 70% CA</h4>
                                                <p className="text-xs leading-relaxed text-gray-400">
                                                    Les dépenses opérationnelles ont augmenté ce trimestre. À surveiller de près.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4">
                                        <div className="absolute bottom-0 left-0 top-0 w-1 bg-gray-500" />
                                        <div className="flex gap-3 pl-2">
                                            <svg className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                                            </svg>
                                            <div>
                                                <h4 className="mb-1 text-sm font-semibold text-gray-300">Clôture mensuelle en approche</h4>
                                                <p className="text-xs leading-relaxed text-gray-400">
                                                    Pensez à valider les saisies du mois avant le 5.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section id="quick-actions" className={`${GLASS_PANEL} rounded-3xl p-6`}>
                                <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-gray-400">Actions Rapides</h2>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        className="group flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 px-4 text-sm font-medium text-white transition-all hover:border-neonBlue/50 hover:bg-white/10"
                                    >
                                        <svg
                                            className="h-5 w-5 text-gray-400 transition-colors group-hover:text-neonBlue"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                            aria-hidden
                                        >
                                            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                                        </svg>
                                        <span>Nouvelle Facture</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="group flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 px-4 text-sm font-medium text-white transition-all hover:border-neonMint/50 hover:bg-white/10"
                                    >
                                        <svg
                                            className="h-5 w-5 text-gray-400 transition-colors group-hover:text-neonMint"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                            aria-hidden
                                        >
                                            <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
                                        </svg>
                                        <span>Exporter PDF</span>
                                    </button>
                                </div>
                            </section>
                        </div>
                    </div>

                    <footer id="footer" className="mt-12 border-t border-glassBorder py-6 text-center text-xs text-gray-500">
                        <p>&copy; 2023 Mini CFO Digital. Interface Haute Fidélité.</p>
                    </footer>
                </div>
            </div>
        </TestDashboardLayout>
    );
}
