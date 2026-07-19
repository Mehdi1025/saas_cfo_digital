/**
 * Fond décoratif partagé — Tableau de bord, Copilote, Saisie mensuelle, Facturation.
 * Une seule source de vérité pour éviter les écarts de rendu entre modules.
 */
export default function CfoPageBackground() {
    return (
        <>
            <div
                className="pointer-events-none absolute inset-0 overflow-hidden"
                aria-hidden
                style={{
                    backgroundImage:
                        'radial-gradient(circle at 0% 0%, rgba(17, 83, 77, 0.22) 0%, transparent 38%), radial-gradient(ellipse 90% 70% at 0% 0%, rgba(17, 83, 77, 0.38) 0%, transparent 55%), radial-gradient(circle at top left, rgba(0, 240, 255, 0.15), transparent 40%), radial-gradient(circle at bottom right, rgba(0, 255, 157, 0.1), transparent 40%)',
                }}
            />
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
                <div className="absolute left-[-10%] top-[-20%] h-[50%] w-[50%] rounded-full bg-neonBlue/20 blur-[150px]" />
                <div className="absolute bottom-[-20%] right-[-10%] h-[40%] w-[40%] rounded-full bg-neonMint/10 blur-[120px]" />
            </div>
        </>
    );
}
