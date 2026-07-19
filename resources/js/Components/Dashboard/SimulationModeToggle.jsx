import { motion } from 'framer-motion';

export default function SimulationModeToggle({ enabled, onChange, disabled = false }) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neonBlue/80">
                    Machine a voyager financiere
                </p>
                <h2 className="mt-1 text-lg font-semibold text-white">Mode Simulation What-If</h2>
                <p className="mt-1 max-w-xl text-sm text-gray-400">
                    Projetez vos revenus et charges sur 6 mois, ajustez vos hypotheses et
                    observez l impact en temps reel.
                </p>
            </div>

            <button
                type="button"
                role="switch"
                aria-checked={enabled}
                disabled={disabled}
                onClick={() => onChange(!enabled)}
                className={`group relative flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-500 ${
                    enabled
                        ? 'border-neonBlue/40 bg-neonBlue/10 shadow-[0_0_24px_rgba(0,240,255,0.15)]'
                        : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            >
                <span className="text-sm font-medium text-gray-200">Mode Simulation</span>
                <span
                    className={`relative h-7 w-12 rounded-full transition-colors duration-500 ${
                        enabled ? 'bg-neonBlue/30' : 'bg-white/10'
                    }`}
                >
                    <motion.span
                        layout
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className={`absolute top-0.5 h-6 w-6 rounded-full ${
                            enabled
                                ? 'left-[22px] bg-neonBlue shadow-[0_0_12px_rgba(0,240,255,0.8)]'
                                : 'left-0.5 bg-white/70'
                        }`}
                    />
                </span>
            </button>
        </div>
    );
}
