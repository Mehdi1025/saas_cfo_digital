import CfoPageBackground from '@/Components/CfoPageBackground';

/**
 * Enveloppe de contenu CFO / Facturation — padding et typo alignés sur le tableau de bord.
 */
export default function CfoPageShell({ children, className = '', simulationMode = false }) {
    return (
        <div
            className={`selection:bg-neonBlue selection:text-obsidian relative -m-4 min-h-full overflow-hidden bg-obsidian px-4 pb-6 pt-6 font-display sm:-m-6 sm:px-6 lg:-m-8 lg:px-8 lg:pb-8 lg:pt-8 ${className}`}
        >
            <CfoPageBackground simulationMode={simulationMode} />
            <div className="relative z-0">{children}</div>
        </div>
    );
}
