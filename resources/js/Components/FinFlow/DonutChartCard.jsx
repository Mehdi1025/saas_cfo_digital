import { MoreHorizontal } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

/** Données maquette : parts du donut + légende (65% / 25% / 10%) */
export const DEFAULT_INVOICE_DISTRIBUTION = [
    { name: 'Payées', value: 65, color: '#10b981' },
    { name: 'En attente', value: 25, color: '#f59e0b' },
    { name: 'En retard', value: 10, color: '#ef4444' },
];

const CARD_BG = '#111827';

/**
 * Carte « Répartition des Factures » — même style que la carte CA (#111827, bordure #1e293b).
 * Anneau type référence : épaisseur modérée (~72 % inner / 100 % outer).
 */
export default function DonutChartCard({
    data = DEFAULT_INVOICE_DISTRIBUTION,
    centerValue = '124',
    centerSubtext = 'Factures',
    title = 'Répartition des Factures',
    className = '',
}) {
    return (
        <div
            className={`flex h-full min-h-0 flex-col rounded-xl border border-[#1e293b] bg-[#111827] p-6 shadow-sm ${className}`.trim()}
        >
            <header className="mb-6 flex shrink-0 items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-white">{title}</h2>
                <button
                    type="button"
                    className="shrink-0 rounded-lg p-1.5 text-[#94a3b8] transition hover:bg-white/5 hover:text-slate-200"
                    aria-label="Plus d’options"
                >
                    <MoreHorizontal className="h-5 w-5" strokeWidth={2} />
                </button>
            </header>

            <div className="relative mx-auto h-[280px] w-full sm:h-[300px] md:h-[320px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius="72%"
                            outerRadius="100%"
                            paddingAngle={2}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                            stroke={CARD_BG}
                            strokeWidth={2.5}
                        >
                            {data.map((entry) => (
                                <Cell key={entry.name} fill={entry.color} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-3xl font-bold text-white">
                            {centerValue}
                        </p>
                        <p className="mt-0.5 text-sm text-[#94a3b8]">
                            {centerSubtext}
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-8 shrink-0 border-t border-[#1e293b] pt-6">
                <ul className="flex flex-col gap-3">
                    {data.map((row) => (
                        <li
                            key={row.name}
                            className="flex items-center gap-2 text-sm"
                        >
                            <span
                                className="h-2 w-2 shrink-0 rounded-full"
                                style={{ backgroundColor: row.color }}
                                aria-hidden
                            />
                            <span className="text-[#94a3b8]">{row.name}</span>
                            <span className="ml-auto font-bold text-white">
                                {row.value}%
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
