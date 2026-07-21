import { Building2, ShieldCheck, Sparkles } from 'lucide-react';

/**
 * Bouton premium — lance le flux OAuth Powens (Webview).
 * Utilise un lien natif pour autoriser la redirection externe hors Inertia SPA.
 */
export default function ConnectBankButton({
    href = route('powens.connect'),
    label = 'Connecter ma banque',
    helper = 'Open Banking sécurisé · DSP2 · Powens',
    className = '',
}) {
    return (
        <a
            href={href}
            className={`group relative inline-flex w-full max-w-md items-center gap-4 overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_100%)] px-5 py-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-md transition duration-300 hover:border-neonBlue/35 hover:bg-[linear-gradient(145deg,rgba(0,240,255,0.12)_0%,rgba(255,255,255,0.03)_100%)] hover:shadow-[0_0_32px_rgba(0,240,255,0.18),0_16px_48px_rgba(0,0,0,0.45)] focus:outline-none focus-visible:ring-2 focus-visible:ring-neonBlue/50 dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(11,16,24,0.92)_0%,rgba(8,12,18,0.88)_100%)] ${className}`}
        >
            <span
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                aria-hidden
                style={{
                    background:
                        'radial-gradient(circle at 20% 20%, rgba(0,240,255,0.12), transparent 55%), radial-gradient(circle at 80% 80%, rgba(0,255,157,0.08), transparent 50%)',
                }}
            />

            <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-neonBlue/20 bg-neonBlue/10 text-neonBlue shadow-[0_0_20px_rgba(0,240,255,0.15)] transition group-hover:scale-[1.03] group-hover:border-neonBlue/40 group-hover:shadow-[0_0_28px_rgba(0,240,255,0.28)]">
                <Building2 className="h-5 w-5" aria-hidden />
            </span>

            <span className="relative min-w-0 flex-1 text-left">
                <span className="flex items-center gap-2">
                    <span className="truncate font-display text-base font-bold text-white">{label}</span>
                    <Sparkles className="h-4 w-4 shrink-0 text-neonMint opacity-80 transition group-hover:opacity-100" aria-hidden />
                </span>
                <span className="mt-1 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-neonMint/80" aria-hidden />
                    <span className="truncate">{helper}</span>
                </span>
            </span>

            <span className="relative hidden shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-300 transition group-hover:border-neonBlue/30 group-hover:text-white sm:inline-flex">
                Powens
            </span>
        </a>
    );
}
