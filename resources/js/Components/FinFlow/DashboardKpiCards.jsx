import KPICard from '@/Components/FinFlow/KPICard';
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    TrendingUp,
    UserPlus,
} from 'lucide-react';

/** Courbes décoratives — fallback si aucune donnée backend */
export const KPI_SPARKLINE_CA = [46, 40, 43, 39, 44, 46.5, 48];
export const KPI_SPARKLINE_ENCOURS = [14, 15, 13, 12, 12.5, 12.4, 12.45];
export const KPI_SPARKLINE_IMPAYES = [2.8, 3.0, 2.9, 3.1, 3.2, 3.15, 3.2];
export const KPI_SPARKLINE_CONVERSION = [58, 60, 62, 64, 65, 67, 68.4];

export function KpiChiffreAffaires({
    label = "Chiffre d'Affaires (Mois)",
    value = '€45,231.00',
    trendPercent = 12.5,
    sparklineValues = KPI_SPARKLINE_CA,
    className = '',
}) {
    const positive = trendPercent >= 0;

    return (
        <KPICard
            className={className}
            label={label}
            value={value}
            meta={
                <>
                    <span
                        className={`font-semibold ${positive ? 'text-emerald-400' : 'text-red-400'}`}
                    >
                        {positive ? '+' : ''}
                        {trendPercent}%
                    </span>
                    <span className="text-slate-400">vs mois dernier</span>
                </>
            }
            IconComponent={TrendingUp}
            iconWrapClass="bg-emerald-950/70 text-emerald-400"
            sparklineValues={sparklineValues}
            sparkColor="#10b981"
            sparkStrokeColor="#059669"
        />
    );
}

export function KpiEncoursClient({
    value = '€12,450.50',
    invoiceCount = 8,
    sparklineValues = KPI_SPARKLINE_ENCOURS,
    className = '',
}) {
    return (
        <KPICard
            className={className}
            label="Encours Client"
            value={value}
            meta={
                <>
                    <span className="font-semibold text-blue-400">
                        {invoiceCount} facture{invoiceCount > 1 ? 's' : ''}
                    </span>{' '}
                    <span className="text-slate-400">en attente</span>
                </>
            }
            IconComponent={Clock}
            iconWrapClass="bg-blue-950/70 text-blue-400"
            sparklineValues={sparklineValues}
            sparkColor="#3b82f6"
            sparkStrokeColor="#2563eb"
        />
    );
}

export function KpiDevisEnAttente({
    value,
    count,
    sparklineValues = KPI_SPARKLINE_ENCOURS,
    className = '',
}) {
    return (
        <KPICard
            className={className}
            label="Devis en attente"
            value={value}
            meta={
                <>
                    <span className="font-semibold text-blue-400">
                        {count} devis
                    </span>{' '}
                    <span className="text-slate-400">envoyés</span>
                </>
            }
            IconComponent={Clock}
            iconWrapClass="bg-blue-950/70 text-blue-400"
            sparklineValues={sparklineValues}
            sparkColor="#3b82f6"
            sparkStrokeColor="#2563eb"
        />
    );
}

export function KpiFacturesEnRetard({
    count = 0,
    sparklineValues = KPI_SPARKLINE_IMPAYES,
    className = '',
}) {
    return (
        <KPICard
            className={className}
            label="Factures en retard"
            value={String(count)}
            valueClassName={count > 0 ? 'text-red-400' : 'text-white'}
            meta={
                <span className="text-slate-400">échéance dépassée</span>
            }
            IconComponent={AlertTriangle}
            iconWrapClass="bg-red-950/70 text-red-400"
            sparklineValues={sparklineValues}
            sparkColor="#ef4444"
            sparkStrokeColor="#dc2626"
        />
    );
}

export function KpiNouveauxClients({
    count = 0,
    trendPercent = 0,
    sparklineValues = KPI_SPARKLINE_CONVERSION,
    className = '',
}) {
    const positive = trendPercent >= 0;

    return (
        <KPICard
            className={className}
            label="Nouveaux Clients"
            value={String(count)}
            meta={
                <>
                    <span
                        className={`font-semibold ${positive ? 'text-emerald-400' : 'text-red-400'}`}
                    >
                        {positive ? '+' : ''}
                        {trendPercent}%
                    </span>
                    <span className="text-slate-400">vs mois dernier</span>
                </>
            }
            IconComponent={UserPlus}
            iconWrapClass="bg-violet-950/70 text-violet-400"
            sparklineValues={sparklineValues}
            sparkColor="#8b5cf6"
            sparkStrokeColor="#7c3aed"
        />
    );
}

export function KpiImpayes({
    value = '€3,200.00',
    trendPercent = 2.1,
    sparklineValues = KPI_SPARKLINE_IMPAYES,
}) {
    return (
        <KPICard
            label="Impayés (>30j)"
            value={value}
            valueClassName="text-red-400"
            meta={
                <>
                    <span className="font-semibold text-red-400">
                        +{trendPercent}%
                    </span>
                    <span className="text-slate-400">vs mois dernier</span>
                </>
            }
            IconComponent={AlertTriangle}
            iconWrapClass="bg-red-950/70 text-red-400"
            sparklineValues={sparklineValues}
            sparkColor="#ef4444"
            sparkStrokeColor="#dc2626"
        />
    );
}

export function KpiTauxConversion({
    value = '68.4%',
    trendPercent = 5.4,
    sparklineValues = KPI_SPARKLINE_CONVERSION,
    className = '',
}) {
    const positive = trendPercent >= 0;

    return (
        <KPICard
            className={className}
            label="Taux de Conversion"
            value={value}
            meta={
                <>
                    <span
                        className={`font-semibold ${positive ? 'text-emerald-400' : 'text-red-400'}`}
                    >
                        {positive ? '+' : ''}
                        {trendPercent}%
                    </span>
                    <span className="text-slate-400">vs mois dernier</span>
                </>
            }
            IconComponent={CheckCircle2}
            iconWrapClass="bg-emerald-950/70 text-emerald-400"
            sparklineValues={sparklineValues}
            sparkColor="#10b981"
            sparkStrokeColor="#059669"
        />
    );
}
