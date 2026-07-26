import { Link, usePage } from '@inertiajs/react';

function formatAmount(amount, currency) {
    if (amount == null) {
        return null;
    }

    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: (currency || 'EUR').toUpperCase(),
    }).format(Number(amount));
}

export default function ManageSubscriptionForm({ subscription, className = '' }) {
    const { flash } = usePage().props;
    const formattedAmount = formatAmount(subscription.amount, subscription.currency);

    return (
        <section id="subscription" className={className}>
            <header>
                <h2 className="font-display text-lg font-semibold tracking-wide text-white">
                    Abonnement
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                    Gerez votre plan et accedez aux fonctionnalites premium de Copifi.
                </p>
            </header>

            <div className="mt-6 space-y-4">
                {flash?.success && (
                    <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                        {flash.success}
                    </div>
                )}

                {flash?.error && (
                    <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100">
                        {flash.error}
                    </div>
                )}

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                                Plan actuel
                            </p>
                            <p className="mt-2 text-xl font-bold text-white">
                                {subscription.is_active
                                    ? subscription.plan_name
                                    : 'Plan gratuit'}
                            </p>
                            <p className="mt-1 text-sm text-zinc-400">
                                {subscription.plan_label}
                            </p>
                            {formattedAmount && subscription.is_active && (
                                <p className="mt-2 text-sm text-emerald-300">
                                    {formattedAmount} / mois
                                </p>
                            )}
                        </div>

                        <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                                subscription.is_active
                                    ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                                    : 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300'
                            }`}
                        >
                            {subscription.is_active ? 'Actif' : 'Inactif'}
                        </span>
                    </div>

                    {!subscription.is_active && (
                        <p className="mt-4 text-sm leading-6 text-zinc-400">
                            Passez a {subscription.plan_name} pour debloquer le copilote IA,
                            la facturation, la saisie mensuelle et l&apos;ensemble des outils
                            financiers.
                        </p>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {subscription.is_active ? (
                        <p className="text-sm text-zinc-400">
                            Votre abonnement est actif. Profitez de toutes les fonctionnalites
                            depuis le tableau de bord.
                        </p>
                    ) : subscription.stripe_configured ? (
                        <Link
                            href={route('billing.checkout.start')}
                            className="inline-flex items-center justify-center rounded-xl bg-[#18c98f] px-5 py-3 text-sm font-bold text-black shadow-[0_0_24px_rgba(24,201,143,0.2)] transition hover:bg-[#25e0a4]"
                        >
                            S&apos;abonner
                        </Link>
                    ) : (
                        <p className="text-sm text-amber-200">
                            Le paiement en ligne n&apos;est pas encore configure sur cet
                            environnement.
                        </p>
                    )}

                    {subscription.is_active && (
                        <Link
                            href={route('dashboard')}
                            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                        >
                            Ouvrir le tableau de bord
                        </Link>
                    )}
                </div>
            </div>
        </section>
    );
}
