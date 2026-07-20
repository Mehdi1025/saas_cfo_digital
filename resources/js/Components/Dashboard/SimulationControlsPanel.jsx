import { AnimatePresence, motion } from 'framer-motion';

const SLIDER_CONFIG = [
    {
        key: 'marketingBudgetDelta',
        label: 'Budget Marketing',
        hint: 'Impact sur le CAC et les charges variables',
        min: -50,
        max: 100,
        step: 5,
        suffix: '%',
    },
    {
        key: 'newClientsPerMonth',
        label: 'Acquisition clients / mois',
        hint: 'Hypothese de nouveaux clients acquis chaque mois',
        min: 0,
        max: 10,
        step: 1,
        suffix: '',
    },
    {
        key: 'fixedChargesDelta',
        label: 'Charges fixes',
        hint: 'Loyer, outils, salaires hors marketing',
        min: -30,
        max: 50,
        step: 5,
        suffix: '%',
    },
];

function formatSliderValue(key, value, suffix) {
    if (key === 'newClientsPerMonth') {
        return `${value} client${value > 1 ? 's' : ''}`;
    }

    return `${value > 0 ? '+' : ''}${value}${suffix}`;
}

export default function SimulationControlsPanel({ sliders, onChange, onReset }) {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className="mt-6 rounded-2xl border border-neonBlue/20 bg-[linear-gradient(145deg,rgba(0,240,255,0.08)_0%,rgba(255,255,255,0.02)_100%)] p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_12px_40px_rgba(0,0,0,0.35)]">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neonBlue">
                                Parametres What-If
                            </p>
                            <p className="mt-1 text-sm text-gray-400">
                                Ajustez les curseurs — projection sur 6 mois en pointille.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onReset}
                            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-300 transition hover:border-neonBlue/30 hover:text-white"
                        >
                            Reinitialiser
                        </button>
                    </div>

                    <div className="grid gap-5 md:grid-cols-3">
                        {SLIDER_CONFIG.map((config) => (
                            <label key={config.key} className="block">
                                <div className="mb-2 flex items-end justify-between gap-2">
                                    <div>
                                        <span className="text-sm font-medium text-white">{config.label}</span>
                                        <p className="mt-0.5 text-xs text-gray-500">{config.hint}</p>
                                    </div>
                                    <span className="shrink-0 rounded-md border border-neonBlue/20 bg-neonBlue/10 px-2 py-1 text-xs font-semibold text-neonBlue">
                                        {formatSliderValue(
                                            config.key,
                                            sliders[config.key],
                                            config.suffix,
                                        )}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min={config.min}
                                    max={config.max}
                                    step={config.step}
                                    value={sliders[config.key]}
                                    onChange={(event) =>
                                        onChange(config.key, Number(event.target.value))
                                    }
                                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-neonBlue [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-neonBlue [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(0,240,255,0.8)]"
                                />
                            </label>
                        ))}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
