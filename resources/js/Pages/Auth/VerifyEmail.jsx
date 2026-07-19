import AuthShell from '@/Pages/Auth/AuthShell';
import { Head, Link } from '@inertiajs/react';
import { useEffect } from 'react';

export default function VerifyEmail({ status, userEmail }) {
    useEffect(() => {
        const pollVerification = async () => {
            try {
                const response = await fetch(route('verification.status'), {
                    credentials: 'same-origin',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (!response.ok) {
                    return;
                }

                const payload = await response.json();

                if (payload.verified) {
                    window.location.href = route('verification.check');
                }
            } catch {
                // Ignore polling errors — manual button remains available.
            }
        };

        pollVerification();
        const intervalId = window.setInterval(pollVerification, 4000);

        return () => window.clearInterval(intervalId);
    }, []);

    return (
        <AuthShell
            mode="register"
            title="Confirmez votre e-mail"
            subtitle="Validez depuis votre telephone, puis revenez ici : la page se mettra a jour automatiquement."
        >
            <Head title="Verification de l'e-mail" />

            <div className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-slate-300">
                    <p className="font-semibold text-white">Comment faire</p>
                    <ol className="mt-2 list-decimal space-y-1 pl-5 text-slate-400">
                        <li>
                            Ouvrez l&apos;e-mail envoye a{' '}
                            <span className="font-medium text-slate-200">{userEmail}</span>.
                        </li>
                        <li>Sur votre telephone, appuyez sur le lien de confirmation.</li>
                        <li>
                            Sur ce PC, cliquez « J&apos;ai confirme » ou attendez quelques secondes
                            (detection automatique).
                        </li>
                    </ol>
                </div>

                {status === 'verification-link-sent' && (
                    <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-300">
                        Un nouveau lien vient d&apos;etre envoye.
                    </div>
                )}

                {status === 'not-verified-yet' && (
                    <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm font-medium text-amber-200">
                        Pas encore confirme cote serveur. Cliquez d&apos;abord sur le lien recu par
                        e-mail sur votre telephone.
                    </div>
                )}

                <a
                    href={route('verification.check')}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#18c98f] px-5 py-4 text-sm font-bold text-black shadow-[0_0_30px_rgba(24,201,143,0.25)] transition hover:bg-[#25e0a4]"
                >
                    J&apos;ai confirme mon e-mail
                    <span aria-hidden>{'->'}</span>
                </a>

                <a
                    href={route('verification.send')}
                    className="flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
                >
                    Renvoyer l&apos;e-mail de confirmation
                </a>

                <div className="flex justify-center pt-2">
                    <Link
                        href={route('login')}
                        className="text-sm text-slate-500 underline transition hover:text-slate-300"
                    >
                        Utiliser un autre compte
                    </Link>
                </div>
            </div>
        </AuthShell>
    );
}
