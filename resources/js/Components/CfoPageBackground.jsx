import { motion } from 'framer-motion';

/**
 * Fond decoratif partage — Tableau de bord, Copilote, Saisie mensuelle, Facturation.
 */
export default function CfoPageBackground({ simulationMode = false }) {
    return (
        <>
            <motion.div
                className="pointer-events-none absolute inset-0 overflow-hidden"
                aria-hidden
                animate={{
                    opacity: simulationMode ? 0.55 : 1,
                }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                style={{
                    backgroundImage:
                        'radial-gradient(circle at 0% 0%, rgba(17, 83, 77, 0.22) 0%, transparent 38%), radial-gradient(ellipse 90% 70% at 0% 0%, rgba(17, 83, 77, 0.38) 0%, transparent 55%), radial-gradient(circle at top left, rgba(0, 240, 255, 0.15), transparent 40%), radial-gradient(circle at bottom right, rgba(0, 255, 157, 0.1), transparent 40%)',
                }}
            />
            <motion.div
                className="pointer-events-none absolute inset-0 overflow-hidden"
                aria-hidden
                animate={{ opacity: simulationMode ? 0.45 : 1 }}
                transition={{ duration: 0.4 }}
            >
                <div className="absolute left-[-10%] top-[-20%] h-[50%] w-[50%] rounded-full bg-neonBlue/15 blur-[80px]" />
                <div className="absolute bottom-[-20%] right-[-10%] h-[40%] w-[40%] rounded-full bg-neonMint/10 blur-[64px]" />
            </motion.div>

            <motion.div
                className="pointer-events-none absolute inset-0"
                aria-hidden
                initial={false}
                animate={{ opacity: simulationMode ? 1 : 0 }}
                transition={{ duration: 0.4 }}
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(0,240,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.04) 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                    maskImage: 'radial-gradient(circle at center, black 35%, transparent 100%)',
                }}
            />
        </>
    );
}
