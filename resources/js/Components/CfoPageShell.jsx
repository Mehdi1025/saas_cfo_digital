import CfoPageBackground from '@/Components/CfoPageBackground';

/**
 * Enveloppe de contenu CFO / Facturation — padding et typo alignés sur le tableau de bord.
 */
export default function CfoPageShell({ children, className = '', simulationMode = false }) {
    return (
        <div
            className={`selection:bg-neonBlue selection:text-obsidian relative -m-8 min-h-full overflow-hidden bg-obsidian px-8 pb-8 pt-8 font-display ${className}`}
        >
            <CfoPageBackground simulationMode={simulationMode} />
            <div className="relative z-0">{children}</div>
        </div>
    );
}
