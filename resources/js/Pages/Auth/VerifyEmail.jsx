import AuthShell from '@/Pages/Auth/AuthShell';
import { Head, Link, useForm } from '@inertiajs/react';

export default function VerifyEmail({ status }) {
    const resendForm = useForm({});

    const resendEmail = (event) => {
        event.preventDefault();
        resendForm.post(route('verification.send'));
    };

    return (
        <AuthShell
            mode="register"
            title="Confirmez votre e-mail"
            subtitle="Ouvrez le lien recu sur votre telephone ou ordinateur, puis continuez ici."
        >
            <Head title="Verification de l'e-mail" />

            <div className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-slate-300">
                    <p className="font-semibold text-white">Etapes simples</p>
                    <ol className="mt-2 list-decimal space-y-1 pl-5 text-slate-400">
                        <li>Ouvrez l&apos;e-mail de confirmation (verifiez les spams).</li>
                        <li>Appuyez sur le lien de validation.</li>
                        <li>Revenez ici et appuyez sur « J&apos;ai confirme mon e-mail ».</li>
                    </ol>
                </div>

                {status === 'verification-link-sent' && (
                    <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-300">
                        Un nouveau lien vient d&apos;etre envoye.
                    </div>
                )}

                {status === 'not-verified-yet' && (
                    <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm font-medium text-amber-200">
                        Votre e-mail n&apos;est pas encore confirme. Cliquez d&apos;abord sur le lien
                        recu par e-mail.
                    </div>
                )}

                <a
                    href={route('verification.check')}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#18c98f] px-5 py-4 text-sm font-bold text-black shadow-[0_0_30px_rgba(24,201,143,0.25)] transition hover:bg-[#25e0a4]"
                >
                    J&apos;ai confirme mon e-mail
                    <span aria-hidden>{'->'}</span>
                </a>

                <form onSubmit={resendEmail}>
                    <button
                        type="submit"
                        disabled={resendForm.processing}
                        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08] disabled:opacity-60"
                    >
                        {resendForm.processing ? 'Envoi...' : "Renvoyer l'e-mail de confirmation"}
                    </button>
                </form>

                <div className="flex justify-center pt-2">
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="text-sm text-slate-500 underline transition hover:text-slate-300"
                    >
                        Se deconnecter
                    </Link>
                </div>
            </div>
        </AuthShell>
    );
}
