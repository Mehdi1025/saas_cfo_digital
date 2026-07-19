import AuthShell from '@/Pages/Auth/AuthShell';
import { Head, Link } from '@inertiajs/react';

export default function EmailVerified({ hasActiveSubscription, userName }) {
    const nextHref = hasActiveSubscription ? route('dashboard') : route('billing.checkout.start');
    const nextLabel = hasActiveSubscription ? 'Acceder a mon dashboard' : 'Activer mon abonnement';

    return (
        <AuthShell
            mode="login"
            title="E-mail confirme"
            subtitle={`Bienvenue ${userName ?? ''} — votre compte est pret.`}
        >
            <Head title="E-mail confirme" />

            <div className="space-y-5 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-3xl">
                    ✓
                </div>

                <p className="text-sm leading-7 text-slate-300">
                    Vous etes connecte. Il ne reste plus qu&apos;a continuer vers votre espace Copifi.
                </p>

                <Link
                    href={nextHref}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#18c98f] px-5 py-4 text-sm font-bold text-black shadow-[0_0_30px_rgba(24,201,143,0.25)] transition hover:bg-[#25e0a4]"
                >
                    {nextLabel}
                    <span aria-hidden>{'->'}</span>
                </Link>
            </div>
        </AuthShell>
    );
}
