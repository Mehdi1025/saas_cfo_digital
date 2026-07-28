import axios from 'axios';
import { router, usePage } from '@inertiajs/react';
import { Building2, Loader2, Plus, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { useState } from 'react';

const ACTION_BUTTON =
    'group relative inline-flex w-full items-center gap-4 overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_100%)] px-5 py-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-md transition duration-300 hover:border-neonBlue/35 hover:bg-[linear-gradient(145deg,rgba(0,240,255,0.12)_0%,rgba(255,255,255,0.03)_100%)] hover:shadow-[0_0_32px_rgba(0,240,255,0.18),0_16px_48px_rgba(0,0,0,0.45)] focus:outline-none focus-visible:ring-2 focus-visible:ring-neonBlue/50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(11,16,24,0.92)_0%,rgba(8,12,18,0.88)_100%)]';

function ActionGlow() {
    return (
        <span
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            aria-hidden
            style={{
                background:
                    'radial-gradient(circle at 20% 20%, rgba(0,240,255,0.12), transparent 55%), radial-gradient(circle at 80% 80%, rgba(0,255,157,0.08), transparent 50%)',
            }}
        />
    );
}

/**
 * Connexion bancaire via Bridge Connect (open banking France).
 */
export default function ConnectBankButton({
    label = 'Connecter ma banque',
    helper = 'Bridge · banques francaises (sandbox : Demo Bank, login success)',
    className = '',
    returnTo = 'dashboard',
    returnSection = 'open-banking',
}) {
    const { banking, flash } = usePage().props;
    const [isConnecting, setIsConnecting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [error, setError] = useState(null);

    const hasConnectedAccount = (banking?.accounts?.length ?? 0) > 0;
    const busy = isConnecting || isSyncing;
    const accountCount = banking?.accounts?.length ?? 0;

    const handleConnect = async () => {
        if (!banking?.bridge_configured) {
            setError('La connexion bancaire Bridge n est pas encore configuree.');
            return;
        }

        setIsConnecting(true);
        setError(null);

        try {
            const { data } = await axios.post(route('banking.bridge.connect'), {
                return_to: returnTo,
                return_section: returnSection,
            });

            if (!data?.url) {
                throw new Error('Bridge Connect n a pas renvoye d URL.');
            }

            window.location.assign(data.url);
        } catch (connectError) {
            const message =
                connectError.response?.data?.message ??
                connectError.message ??
                'Connexion bancaire impossible.';

            setError(message);
            setIsConnecting(false);
        }
    };

    const handleSync = async () => {
        if (!banking?.bridge_configured) {
            setError('La connexion bancaire Bridge n est pas encore configuree.');
            return;
        }

        setIsSyncing(true);
        setError(null);

        try {
            await axios.post(route('banking.bridge.sync'));
            router.reload({ preserveScroll: true });
        } catch (syncError) {
            const message =
                syncError.response?.data?.message ??
                syncError.message ??
                'Synchronisation bancaire impossible.';

            setError(message);
        } finally {
            setIsSyncing(false);
        }
    };

    if (hasConnectedAccount) {
        return (
            <div className={className}>
                <div className="flex w-full max-w-md flex-col gap-3">
                    <button
                        type="button"
                        onClick={handleConnect}
                        disabled={busy || !banking?.bridge_configured}
                        className={ACTION_BUTTON}
                    >
                        <ActionGlow />
                        <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-neonMint/20 bg-neonMint/10 text-neonMint shadow-[0_0_20px_rgba(0,255,157,0.15)] transition group-hover:border-neonMint/40">
                            {isConnecting ? (
                                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                            ) : (
                                <Plus className="h-5 w-5" aria-hidden />
                            )}
                        </span>
                        <span className="relative min-w-0 flex-1 text-left">
                            <span className="font-display text-base font-bold text-white">
                                {isConnecting ? 'Redirection Bridge...' : 'Ajouter un compte'}
                            </span>
                            <span className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
                                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-neonMint/80" aria-hidden />
                                <span className="truncate">Nouvelle banque ou nouvel etablissement</span>
                            </span>
                        </span>
                        <span className="relative hidden shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-300 sm:inline-flex">
                            Bridge
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={handleSync}
                        disabled={busy || !banking?.bridge_configured}
                        className={ACTION_BUTTON}
                    >
                        <ActionGlow />
                        <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-neonBlue/20 bg-neonBlue/10 text-neonBlue">
                            {isSyncing ? (
                                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                            ) : (
                                <RefreshCw className="h-5 w-5" aria-hidden />
                            )}
                        </span>
                        <span className="relative min-w-0 flex-1 text-left">
                            <span className="font-display text-base font-bold text-white">
                                {isSyncing ? 'Synchronisation...' : 'Resynchroniser'}
                            </span>
                            <span className="mt-1 text-xs text-gray-400">
                                {accountCount} compte{accountCount > 1 ? 's' : ''} · mettre a jour soldes et flux
                            </span>
                        </span>
                    </button>
                </div>

                {(error || flash?.error) && (
                    <p className="mt-3 text-sm text-rose-300">{error ?? flash?.error}</p>
                )}
            </div>
        );
    }

    return (
        <div className={className}>
            <button
                type="button"
                onClick={handleConnect}
                disabled={busy || !banking?.bridge_configured}
                className={`${ACTION_BUTTON} max-w-md`}
            >
                <ActionGlow />

                <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-neonBlue/20 bg-neonBlue/10 text-neonBlue shadow-[0_0_20px_rgba(0,240,255,0.15)] transition group-hover:scale-[1.03] group-hover:border-neonBlue/40 group-hover:shadow-[0_0_28px_rgba(0,240,255,0.28)]">
                    {isConnecting ? (
                        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                    ) : (
                        <Building2 className="h-5 w-5" aria-hidden />
                    )}
                </span>

                <span className="relative min-w-0 flex-1 text-left">
                    <span className="flex items-center gap-2">
                        <span className="truncate font-display text-base font-bold text-white">
                            {isConnecting ? 'Redirection Bridge...' : label}
                        </span>
                        {!isConnecting && (
                            <Sparkles className="h-4 w-4 shrink-0 text-neonMint opacity-80 transition group-hover:opacity-100" aria-hidden />
                        )}
                    </span>
                    <span className="mt-1 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-neonMint/80" aria-hidden />
                        <span className="truncate">{helper}</span>
                    </span>
                </span>

                <span className="relative hidden shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-300 transition group-hover:border-neonBlue/30 group-hover:text-white sm:inline-flex">
                    Bridge
                </span>
            </button>

            {(error || flash?.error) && (
                <p className="mt-3 text-sm text-rose-300">{error ?? flash?.error}</p>
            )}
        </div>
    );
}
