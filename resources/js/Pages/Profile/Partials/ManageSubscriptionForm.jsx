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
    const { flash, pricing } = usePage().props;
    const formattedAmount = formatAmount(subscription.amount, subscription.currency);
    const displayPrice = formattedAmount ?? pricing.amount_label;

    return (
        <section id="subscription" className={className}>
            <header>
                <h2 className="font-display text-lg font-semibold tracking-wide text-white">
                    Abonnement
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                    L&apos;offre unique Copifi — facturation conforme et pilotage complet.
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

                <div className="relative overflow-hidden rounded-2xl border border-[#C9A962]/20 bg-gradient-to-br from-[#12100c]/80 via-[#0a0d12]/90 to-[#06080b]/90 p-6">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#E8D5A8]/60 to-transparent"
                    />

                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#C9A962]/80">
                                {subscription.is_active ? 'Votre plan' : 'Offre disponible'}
                            </p>
                            <p className="mt-2 font-display text-2xl font-bold text-white">
                                {subscription.plan_name}
                            </p>
                            <p className="mt-1 text-sm text-zinc-400">
                                {subscription.is_active
                                    ? subscription.plan_label
                                    : 'Accès complet à toute la plateforme'}
                            </p>
                            <p className="mt-3 font-display text-xl text-[#E8D5A8]">
                                {subscription.is_active ? `${displayPrice} / mois` : `${pricing.amount_label} / mois HT`}
                            </p>
                        </div>

                        <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                                subscription.is_active
                                    ? 'border-[#C9A962]/30 bg-[#C9A962]/10 text-[#E8D5A8]'
                                    : 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300'
                            }`}
                        >
                            {subscription.is_active ? 'Actif' : 'Inactif'}
                        </span>
                    </div>

                    {!subscription.is_active && (
                        <p className="mt-4 text-sm leading-6 text-zinc-400">
                            Un seul abonnement, tout inclus : facturation conforme 2026, copilote IA,
                            tableau de bord et outils de pilotage financier.
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
                            className="inline-flex items-center justify-center rounded-xl border border-[#C9A962]/40 bg-gradient-to-r from-[#C9A962] to-[#E8D5A8] px-5 py-3 text-sm font-bold text-[#1a1510] shadow-[0_0_24px_rgba(201,169,98,0.2)] transition hover:shadow-[0_0_36px_rgba(201,169,98,0.35)]"
                        >
                            S&apos;abonner — {pricing.amount_label}/mois
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
                            Accéder au dashboard
                        </Link>
                    )}
                </div>
            </div>
        </section>
    );
}
