import KPICard from '@/Components/FinFlow/KPICard';
import {
    KpiChiffreAffaires,
    KpiTauxConversion,
} from '@/Components/FinFlow/DashboardKpiCards';
import FacturationLayout from '@/Layouts/FacturationLayout';
import { Head, Link, router } from '@inertiajs/react';
import {
    CheckCircle2,
    Clock,
    Download,
    Eye,
    FileEdit,
    Filter,
    Pencil,
    Plus,
    Trash2,
    Receipt,
    Send,
    Wand2,
    X,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { formatMoney } from '@/utils/currency';

const cardClass = 'rounded-xl border border-[#1e293b] bg-[#111827] shadow-sm';
const tableHeaderClass =
    'border-b border-slate-800/80 bg-[#151d2c] px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500';

const STATUS_BADGE = {
    draft: 'bg-orange-500/15 text-orange-300',
    sent: 'bg-violet-500/15 text-violet-300',
    accepted: 'bg-emerald-500/15 text-emerald-300',
    rejected: 'bg-slate-700/80 text-red-300',
    refused: 'bg-slate-700/80 text-red-300',
    expired: 'bg-amber-500/15 text-amber-400',
};

const EXPIRATION_CLASS = {
    neutral: 'text-slate-400',
    warning: 'text-amber-400 font-medium',
    danger: 'text-red-400 font-medium',
};

const PIPELINE_ICON = {
    draft: FileEdit,
    sent: Send,
    accepted: CheckCircle2,
    rejected: XCircle,
    refused: XCircle,
    expired: Clock,
};

const PIPELINE_STYLE = {
    slate: {
        wrap: 'bg-slate-500/15 text-slate-400',
        badge: 'bg-slate-600 text-white',
        line: 'bg-slate-600',
    },
    blue: {
        wrap: 'bg-blue-500/15 text-blue-400',
        badge: 'bg-blue-500 text-white',
        line: 'bg-blue-500',
    },
    emerald: {
        wrap: 'bg-emerald-500/15 text-emerald-400',
        badge: 'bg-emerald-500 text-white',
        line: 'bg-emerald-500',
    },
    red: {
        wrap: 'bg-red-500/15 text-red-400',
        badge: 'bg-red-500 text-white',
        line: 'bg-red-500',
    },
    amber: {
        wrap: 'bg-amber-500/15 text-amber-400',
        badge: 'bg-amber-500 text-white',
        line: 'bg-amber-500',
    },
};

function DevisPipeline({ pipeline }) {
    return (
        <div className={`${cardClass} p-5 sm:p-6`}>
            <h2 className="mb-5 text-base font-semibold text-white">
                Pipeline des devis
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {pipeline.map((step, index) => {
                    const Icon = PIPELINE_ICON[step.status] ?? FileEdit;
                    const style = PIPELINE_STYLE[step.color] ?? PIPELINE_STYLE.slate;

                    return (
                        <div key={step.status} className="relative flex flex-col items-center text-center">
                            {index < pipeline.length - 1 ? (
                                <div
                                    className={`absolute left-[calc(50%+2rem)] top-7 hidden h-px w-[calc(100%-4rem)] ${style.line} opacity-30 lg:block`}
                                    aria-hidden
                                />
                            ) : null}
                            <div className="relative">
                                <div
                                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${style.wrap}`}
                                >
                                    <Icon className="h-6 w-6" strokeWidth={2} />
                                </div>
                                <span
                                    className={`absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold ${style.badge}`}
                                >
                                    {step.count}
                                </span>
                            </div>
                            <p className="mt-3 text-sm font-semibold text-white">{step.label}</p>
                            <p className="mt-0.5 text-xs text-slate-500">{step.amount_label}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const KPI_LIST_HEIGHT = 'h-[132px] overflow-hidden';

export default function Index({ kpis, pipeline, expiringSoon, devis, filters }) {
    const [localFilters, setLocalFilters] = useState(filters);

    function applyFilters(next = localFilters) {
        router.get(route('devis.index'), next, {
            preserveState: true,
            replace: true,
        });
    }

    function updateFilter(key, value) {
        const next = { ...localFilters, [key]: value };
        setLocalFilters(next);
        applyFilters(next);
    }

    function acceptDevis(item) {
        if (
            !window.confirm(
                `Marquer le devis ${item.reference} comme accepté par le client ?`,
            )
        ) {
            return;
        }

        router.patch(route('devis.mark-as-accepted', item.id), {}, { preserveScroll: true });
    }

    function rejectDevis(item) {
        if (
            !window.confirm(
                `Marquer le devis ${item.reference} comme refusé par le client ?`,
            )
        ) {
            return;
        }

        router.patch(route('devis.mark-as-rejected', item.id), {}, { preserveScroll: true });
    }

    function convertToFacture(item) {
        if (
            !window.confirm(
                `Générer une facture brouillon à partir du devis ${item.reference} ?`,
            )
        ) {
            return;
        }

        router.post(route('devis.convert', item.id));
    }

    function sendDevis(item) {
        if (
            !window.confirm(
                `Envoyer le devis ${item.reference} par email au client ?`,
            )
        ) {
            return;
        }

        router.post(route('devis.send', item.id), {}, { preserveScroll: true });
    }

    function deleteDevis(item) {
        if (
            !window.confirm(
                `Supprimer le devis ${item.reference} ? Cette action est irréversible.`,
            )
        ) {
            return;
        }

        router.delete(route('devis.destroy', item.id), {
            preserveScroll: true,
        });
    }

    return (
        <>
            <Head title="Liste des devis — Copifi" />
            <FacturationLayout
                title="Liste des devis"
                description="Suivez votre pipeline commercial et l'état de vos propositions."
                headerActions={
                    <Link
                        href={route('devis.create')}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#3b82f6] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(59,130,246,0.2)] transition hover:bg-blue-600"
                    >
                        <Plus className="h-4 w-4" />
                        Nouveau devis
                    </Link>
                }
            >
                <div className="space-y-6">
                    {/* KPIs */}
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <KpiChiffreAffaires
                            label="Total des devis (Ce mois)"
                            value={formatMoney(kpis.month_total)}
                            trendPercent={kpis.month_trend}
                            className={KPI_LIST_HEIGHT}
                        />
                        <KpiTauxConversion
                            value={`${kpis.conversion_rate}%`}
                            trendPercent={kpis.conversion_trend}
                            className={KPI_LIST_HEIGHT}
                        />
                        <KPICard
                            className={KPI_LIST_HEIGHT}
                            label="Devis expirant bientôt"
                            value={String(kpis.expiring_count)}
                            valueClassName={
                                kpis.expiring_count > 0 ? 'text-amber-400' : 'text-white'
                            }
                            IconComponent={Clock}
                            iconWrapClass="bg-amber-950/70 text-amber-400"
                            meta={
                                expiringSoon.length > 0 ? (
                                    <div className="w-full space-y-0.5">
                                        {expiringSoon.slice(0, 2).map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center justify-between gap-2 text-xs"
                                            >
                                                <div className="flex min-w-0 items-center gap-1.5">
                                                    <span
                                                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                                            item.urgency === 'danger'
                                                                ? 'bg-red-500'
                                                                : item.urgency === 'warning'
                                                                  ? 'bg-amber-500'
                                                                  : 'bg-slate-500'
                                                        }`}
                                                    />
                                                    <span className="truncate text-slate-300">
                                                        {item.client_name}
                                                    </span>
                                                </div>
                                                <span
                                                    className={`shrink-0 ${
                                                        item.urgency === 'danger'
                                                            ? 'text-red-400'
                                                            : item.urgency === 'warning'
                                                              ? 'text-amber-400'
                                                              : 'text-slate-500'
                                                    }`}
                                                >
                                                    {item.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-xs text-slate-500">
                                        Aucun devis urgent cette semaine.
                                    </span>
                                )
                            }
                        />
                    </div>

                    {/* Pipeline */}
                    <DevisPipeline pipeline={pipeline} />

                    {/* Tableau */}
                    <div className={`${cardClass} overflow-hidden`}>
                        <div className="flex flex-col gap-4 border-b border-slate-800/80 p-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-wrap gap-2">
                                <select
                                    value={localFilters.status}
                                    onChange={(e) => updateFilter('status', e.target.value)}
                                    className="rounded-lg border border-slate-700 bg-[#151d2c] px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50"
                                >
                                    <option value="">Tous les statuts</option>
                                    <option value="draft">Brouillon</option>
                                    <option value="sent">Envoyé</option>
                                    <option value="accepted">Accepté</option>
                                    <option value="rejected">Refusé</option>
                                    <option value="expired">Expiré</option>
                                </select>
                                <select
                                    value={localFilters.date_range}
                                    onChange={(e) => updateFilter('date_range', e.target.value)}
                                    className="rounded-lg border border-slate-700 bg-[#151d2c] px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50"
                                >
                                    <option value="">Toutes les dates</option>
                                    <option value="this_month">Ce mois</option>
                                    <option value="last_month">Mois dernier</option>
                                    <option value="last_90_days">90 derniers jours</option>
                                </select>
                                <select
                                    value={localFilters.amount_range}
                                    onChange={(e) => updateFilter('amount_range', e.target.value)}
                                    className="rounded-lg border border-slate-700 bg-[#151d2c] px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50"
                                >
                                    <option value="">Montant : Tous</option>
                                    <option value="under_5000">Moins de 5 000 €</option>
                                    <option value="5000_15000">5 000 € – 15 000 €</option>
                                    <option value="over_15000">Plus de 15 000 €</option>
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-[#151d2c] text-slate-400 transition hover:text-white"
                                    aria-label="Filtrer"
                                >
                                    <Filter className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-[#151d2c] text-slate-400 transition hover:text-white"
                                    aria-label="Exporter"
                                >
                                    <Download className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[960px] text-left text-sm">
                                <thead>
                                    <tr>
                                        <th className={tableHeaderClass}>N° Devis</th>
                                        <th className={tableHeaderClass}>Client</th>
                                        <th className={`${tableHeaderClass} text-right`}>Montant</th>
                                        <th className={tableHeaderClass}>Date d&apos;émission</th>
                                        <th className={tableHeaderClass}>Expiration</th>
                                        <th className={tableHeaderClass}>Statut</th>
                                        <th className={`${tableHeaderClass} text-right`}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {devis.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-4 py-16 text-center text-slate-500"
                                            >
                                                Aucun devis trouvé.
                                            </td>
                                        </tr>
                                    ) : (
                                        devis.data.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="border-b border-slate-800/60 transition hover:bg-white/[0.02]"
                                            >
                                                <td className="px-4 py-4 font-medium text-blue-400">
                                                    {item.reference}
                                                </td>
                                                <td className="px-4 py-4">
                                                    {item.client ? (
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${item.client.avatar_class}`}
                                                            >
                                                                {item.client.initials}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="truncate font-medium text-white">
                                                                    {item.client.name}
                                                                </p>
                                                                {item.client.email ? (
                                                                    <p className="truncate text-xs text-slate-500">
                                                                        {item.client.email}
                                                                    </p>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-right font-medium tabular-nums text-white">
                                                    {formatMoney(item.total_ttc, item.currency_code)}
                                                </td>
                                                <td className="px-4 py-4 text-slate-400">
                                                    {item.issue_date_label}
                                                </td>
                                                <td
                                                    className={`px-4 py-4 ${EXPIRATION_CLASS[item.expiration.variant]}`}
                                                >
                                                    {item.expiration.label}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE[item.status] ?? STATUS_BADGE.draft}`}
                                                    >
                                                        {item.status_label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex flex-wrap items-center justify-end gap-1">
                                                        {item.can_convert_to_facture ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => convertToFacture(item)}
                                                                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_16px_rgba(59,130,246,0.35)] transition hover:from-blue-500 hover:to-indigo-500"
                                                                title="Générer la facture"
                                                            >
                                                                <Wand2 className="h-4 w-4" />
                                                                Générer la facture
                                                            </button>
                                                        ) : item.converted_facture_id ? (
                                                            <Link
                                                                href={route(
                                                                    'factures.edit',
                                                                    item.converted_facture_id,
                                                                )}
                                                                className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-white"
                                                                title="Voir la facture liée"
                                                                aria-label="Voir la facture liée"
                                                            >
                                                                <Receipt className="h-4 w-4" />
                                                            </Link>
                                                        ) : null}
                                                        {item.can_accept ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => acceptDevis(item)}
                                                                className="rounded-lg p-2 text-emerald-400 transition hover:bg-emerald-500/10 hover:text-emerald-300"
                                                                title="Accepter le devis"
                                                                aria-label="Accepter le devis"
                                                            >
                                                                <CheckCircle2 className="h-4 w-4" />
                                                            </button>
                                                        ) : null}
                                                        {item.can_reject ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => rejectDevis(item)}
                                                                className="rounded-lg p-2 text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                                                                title="Refuser le devis"
                                                                aria-label="Refuser le devis"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        ) : null}
                                                        {item.can_send ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => sendDevis(item)}
                                                                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-violet-400 transition hover:bg-violet-500/10 hover:text-violet-300"
                                                                title="Envoyer par email au client"
                                                            >
                                                                <Send className="h-4 w-4" />
                                                                Envoyer
                                                            </button>
                                                        ) : null}
                                                        <a
                                                            href={route('devis.pdf', item.id)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-sky-400"
                                                            title="Télécharger le PDF"
                                                            aria-label="Télécharger le PDF"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </a>
                                                        <Link
                                                            href={route('devis.edit', item.id)}
                                                            className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-white"
                                                            aria-label={
                                                                item.can_be_edited
                                                                    ? 'Modifier'
                                                                    : 'Voir'
                                                            }
                                                        >
                                                            {item.can_be_edited ? (
                                                                <Pencil className="h-4 w-4" />
                                                            ) : (
                                                                <Eye className="h-4 w-4" />
                                                            )}
                                                        </Link>
                                                        {item.can_delete ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => deleteDevis(item)}
                                                                className="rounded-lg p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                                                                title="Supprimer le brouillon"
                                                                aria-label="Supprimer le brouillon"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {devis.meta.last_page > 1 ? (
                            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-800/80 px-5 py-4 sm:flex-row">
                                <p className="text-sm text-slate-500">
                                    {devis.meta.from}–{devis.meta.to} sur {devis.meta.total} devis
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {devis.links.map((link, index) => (
                                        <Link
                                            key={`${link.label}-${index}`}
                                            href={link.url ?? '#'}
                                            preserveState
                                            className={`rounded-lg px-3 py-1.5 text-sm transition ${
                                                link.active
                                                    ? 'bg-blue-500 text-white'
                                                    : link.url
                                                      ? 'text-slate-400 hover:bg-white/5 hover:text-white'
                                                      : 'cursor-not-allowed text-slate-600'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </FacturationLayout>
        </>
    );
}
