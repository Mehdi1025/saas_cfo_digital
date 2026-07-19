import { useId } from 'react';
import {
    Area,
    AreaChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
} from 'recharts';

export const kpiCardClass =
    'relative overflow-hidden rounded-xl border border-[#1e293b] bg-[#111827] px-4 py-4 shadow-sm';

function upsampleSparkline(values) {
    if (values.length < 2) {
        return values;
    }
    const out = [];
    for (let i = 0; i < values.length - 1; i++) {
        const a = values[i];
        const b = values[i + 1];
        out.push(a);
        out.push(a * 0.75 + b * 0.25);
        out.push(a * 0.5 + b * 0.5);
        out.push(a * 0.25 + b * 0.75);
    }
    out.push(values[values.length - 1]);
    return out;
}

export function KPIBackgroundSparkline({ values, color, strokeColor, className }) {
    const gradId = useId().replace(/:/g, '');
    const pts = upsampleSparkline(values);
    const data = pts.map((v, i) => ({ x: i, v }));
    const minV = Math.min(...pts);
    const maxV = Math.max(...pts);
    const span = maxV - minV || 1;
    const pad = span * 0.22;
    const stroke = strokeColor ?? color;

    return (
        <div
            className={`pointer-events-none absolute z-0 min-h-[48px] min-w-0 ${className}`}
            aria-hidden
        >
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart
                    data={data}
                    margin={{ top: 8, right: 0, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient
                            id={`kpi-spark-${gradId}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop offset="0%" stopColor={color} stopOpacity={0.02} />
                            <stop offset="35%" stopColor={color} stopOpacity={0.06} />
                            <stop offset="100%" stopColor={color} stopOpacity={0.14} />
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="x" hide />
                    <YAxis hide domain={[minV - pad, maxV + pad]} />
                    <Area
                        type="basis"
                        dataKey="v"
                        stroke={stroke}
                        strokeWidth={1.5}
                        strokeOpacity={0.35}
                        fill={`url(#kpi-spark-${gradId})`}
                        fillOpacity={1}
                        dot={false}
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

export default function KPICard({
    label,
    value,
    valueClassName = 'text-white',
    meta,
    metaClassName = 'text-slate-400',
    IconComponent,
    iconWrapClass,
    sparklineValues,
    sparkColor,
    sparkStrokeColor,
    footer,
    className = '',
}) {
    const isCompact = !footer;
    const hasSparkline = sparklineValues?.length > 0 && isCompact;

    return (
        <div
            className={`${kpiCardClass} relative flex flex-col ${isCompact ? 'min-h-[132px]' : ''} ${className}`}
        >
            {hasSparkline ? (
                <KPIBackgroundSparkline
                    values={sparklineValues}
                    color={sparkColor}
                    strokeColor={sparkStrokeColor}
                    className="inset-x-0 bottom-0 top-7"
                />
            ) : null}
            <div
                className={`relative z-10 flex flex-col ${isCompact ? '' : 'flex-1'}`}
            >
                <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium leading-tight text-slate-400">
                        {label}
                    </p>
                    <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconWrapClass}`}
                    >
                        <IconComponent className="h-4 w-4" strokeWidth={2} />
                    </div>
                </div>
                <p
                    className={`mt-1 text-3xl font-bold leading-none tracking-tight ${valueClassName}`}
                >
                    {value}
                </p>
                {meta ? (
                    <div
                        className={`relative z-10 mt-2 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 pb-0 text-sm leading-snug ${metaClassName}`}
                    >
                        {meta}
                    </div>
                ) : null}
                {footer ? (
                    <div className="relative z-10 mt-3 space-y-2 border-t border-slate-800/80 pt-3">
                        {footer}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
