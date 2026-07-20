import { motion } from 'framer-motion';

function AiThinkingLoader() {
    return (
        <div className="flex items-center gap-3 text-sm text-neonBlue">
            <div className="flex gap-1">
                {[0, 1, 2].map((dot) => (
                    <span
                        key={dot}
                        className="h-2 w-2 animate-pulse rounded-full bg-neonBlue"
                        style={{ animationDelay: `${dot * 150}ms` }}
                    />
                ))}
            </div>
            <span className="font-medium tracking-wide">Copifi analyse votre scenario...</span>
        </div>
    );
}

export default function SimulationAiInsightBlock({
    enabled,
    insight,
    isLoading,
    error,
    fallbackContent,
}) {
    if (!enabled) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-5 rounded-2xl border border-neonBlue/20 bg-[linear-gradient(145deg,rgba(0,240,255,0.06)_0%,rgba(255,255,255,0.02)_100%)] p-5"
        >
            <div className="mb-3 flex items-center gap-2">
                <span className="rounded-md border border-neonBlue/30 bg-neonBlue/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-neonBlue">
                    Simulation IA
                </span>
                <span className="text-xs text-gray-500">Projection strategique a 6 mois</span>
            </div>

            {isLoading ? (
                <AiThinkingLoader />
            ) : error ? (
                <p className="text-sm leading-7 text-rose-300">{error}</p>
            ) : insight ? (
                <p className="min-h-[3.5rem] text-sm leading-7 text-gray-200">{insight}</p>
            ) : (
                <p className="text-sm leading-7 text-gray-400">
                    {fallbackContent ??
                        'Deplacez les curseurs pour declencher une analyse What-If personnalisee.'}
                </p>
            )}
        </motion.div>
    );
}
