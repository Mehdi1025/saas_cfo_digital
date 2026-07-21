import CfoPageShell from '@/Components/CfoPageShell';
import DashboardChatWidget from '@/Components/Dashboard/DashboardChatWidget';
import AppDashboardLayout from '@/Layouts/AppDashboardLayout';
import { Link, usePage } from '@inertiajs/react';
import { Sparkles } from 'lucide-react';

const GLASS_PANEL =
    'border border-glassBorder bg-[linear-gradient(145deg,rgba(11,16,24,0.94)_0%,rgba(8,12,18,0.9)_100%)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.4)]';

function formatCurrency(value) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
    }).format(Number(value ?? 0));
}

export default function Copilot() {
    const { summary, aiConfigured } = usePage().props;
    const facturation = summary.facturation ?? {};

    return (
        <AppDashboardLayout title="Copilote IA" badge="Assistant financier" viewportLocked>
            <CfoPageShell fillViewport>
                <div className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col">
                    <div className="mb-6 shrink-0">
                        <div className="inline-flex items-center gap-2 rounded-full border border-neonBlue/30 bg-neonBlue/10 px-4 py-1.5 text-sm font-medium text-neonBlue">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Accès à vos données pilotage + facturation</span>
                        </div>
                        <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-white md:text-3xl">
                            Votre copilote financier personnel
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-400 md:text-base">
                            Le copilote analyse vos KPIs mensuels, factures, devis, encaissements
                            et alertes pour vous répondre avec vos vrais chiffres.
                        </p>
                        {!aiConfigured ? (
                            <div className="mt-4 max-w-2xl rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                                <p className="font-semibold text-amber-50">Configuration IA requise</p>
                                <p className="mt-1 text-amber-100/90">
                                    Ajoutez votre clé Groq dans le fichier <code className="rounded bg-black/30 px-1.5 py-0.5 text-xs">.env</code>{' '}
                                    (<code className="rounded bg-black/30 px-1.5 py-0.5 text-xs">GROQ_API_KEY=gsk_…</code>), puis relancez{' '}
                                    <code className="rounded bg-black/30 px-1.5 py-0.5 text-xs">php artisan serve</code>.
                                    Clé gratuite sur{' '}
                                    <a
                                        href="https://console.groq.com/keys"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline decoration-amber-400/60 underline-offset-2 hover:text-white"
                                    >
                                        console.groq.com
                                    </a>
                                    .
                                </p>
                            </div>
                        ) : null}
                    </div>

                    <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:items-stretch">
                        <aside className="flex min-h-0 flex-col gap-4 lg:overflow-y-auto lg:overscroll-y-contain lg:pr-1">
                            <section className={`${GLASS_PANEL} shrink-0 rounded-3xl p-6`}>
                                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neonMint">
                                    Pilotage
                                </p>
                                {summary.has_financial_data ? (
                                    <div className="mt-4 space-y-4">
                                        {summary.month ? (
                                            <p className="text-sm text-gray-400">
                                                Dernier mois :
                                                {' '}
                                                <span className="font-semibold text-white">{summary.month}</span>
                                            </p>
                                        ) : null}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                                <p className="text-[10px] uppercase tracking-wide text-gray-500">CA</p>
                                                <p className="mt-1 text-lg font-bold text-white">
                                                    {formatCurrency(summary.revenue)}
                                                </p>
                                            </div>
                                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                                <p className="text-[10px] uppercase tracking-wide text-gray-500">Marge</p>
                                                <p className="mt-1 text-lg font-bold text-neonMint">
                                                    {formatCurrency(summary.net_margin)}
                                                </p>
                                            </div>
                                        </div>
                                        {summary.alert ? (
                                            <p className="rounded-xl border border-[#FF8A00]/20 bg-[#FF8A00]/5 px-4 py-3 text-xs leading-relaxed text-[#FF8A00]">
                                                {summary.alert}
                                            </p>
                                        ) : null}
                                    </div>
                                ) : (
                                    <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-xs text-gray-400">
                                        <p className="font-medium text-white">Saisie mensuelle vide</p>
                                        <Link
                                            href={route('financial-entry.index')}
                                            className="mt-3 inline-flex text-neonMint hover:underline"
                                        >
                                            Compléter la saisie →
                                        </Link>
                                    </div>
                                )}
                            </section>

                            <section className={`${GLASS_PANEL} shrink-0 rounded-3xl p-6`}>
                                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neonBlue">
                                    Facturation
                                </p>
                                {summary.has_facturation_data ? (
                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                            <p className="text-[10px] uppercase tracking-wide text-gray-500">Encaissé</p>
                                            <p className="mt-1 text-sm font-bold text-white">
                                                {formatCurrency(facturation.ca_encaisse_mois)}
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                            <p className="text-[10px] uppercase tracking-wide text-gray-500">Encours</p>
                                            <p className="mt-1 text-sm font-bold text-white">
                                                {formatCurrency(facturation.encours_factures_eur)}
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
                                            <p className="text-[10px] uppercase tracking-wide text-rose-300/80">Retards</p>
                                            <p className="mt-1 text-sm font-bold text-rose-300">
                                                {facturation.factures_en_retard}
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                            <p className="text-[10px] uppercase tracking-wide text-gray-500">Devis</p>
                                            <p className="mt-1 text-sm font-bold text-white">
                                                {facturation.devis_en_attente}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-xs text-gray-400">
                                        <p className="font-medium text-white">Aucune facture encore</p>
                                        <Link
                                            href={route('factures.create')}
                                            className="mt-3 inline-flex text-neonBlue hover:underline"
                                        >
                                            Créer une facture →
                                        </Link>
                                    </div>
                                )}
                            </section>

                            <section className={`${GLASS_PANEL} shrink-0 rounded-3xl p-6`}>
                                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
                                    Exemples
                                </p>
                                <ul className="mt-4 space-y-2 text-sm text-gray-400">
                                    <li>• Résume ma situation globale</li>
                                    <li>• Quelles factures sont en retard ?</li>
                                    <li>• Mon CA saisi vs encaissé</li>
                                    <li>• Comment améliorer ma marge ?</li>
                                </ul>
                            </section>
                        </aside>

                        <section className="flex min-h-[min(68vh,680px)] min-w-0 flex-col lg:min-h-0 lg:flex-1">
                            <DashboardChatWidget className="min-h-0 flex-1" />
                        </section>
                    </div>
                </div>
            </CfoPageShell>
        </AppDashboardLayout>
    );
}
