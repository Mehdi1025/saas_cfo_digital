import KPICard from '@/Components/FinFlow/KPICard';
import {
    KpiChiffreAffaires,
    KpiEncoursClient,
} from '@/Components/FinFlow/DashboardKpiCards';
import PaymentModal from '@/Components/FinFlow/PaymentModal';
import FacturationLayout from '@/Layouts/FacturationLayout';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Ban,
    Banknote,
    CheckCircle2,
    ChevronDown,
    Download,
    Eye,
    FileEdit,
    Filter,
    Pencil,
    Plus,
    Receipt,
    Send,
    ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import { formatMoney } from '@/utils/currency';

const cardClass = 'rounded-xl border border-[#1e293b] bg-[#111827] shadow-sm';
const tableHeaderClass =
    'border-b border-slate-800/80 bg-[#151d2c] px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500';

const STATUS_CONFIG = {
    draft: {
        badge: 'bg-slate-500/15 text-slate-400',
        icon: FileEdit,
    },
    sent: {
        badge: 'bg-blue-500/15 text-blue-400',
        icon: Send,
    },
    paid: {
        badge: 'bg-emerald-500/15 text-emerald-400',
        icon: CheckCircle2,
    },
    cancelled: {
        badge: 'bg-red-500/15 text-red-400',
        icon: Ban,
    },
};

const DUE_DATE_CLASS = {
    neutral: 'text-slate-400',
    warning: 'text-amber-400 font-medium',
    danger: 'text-red-400 font-medium',
};

const PIPELINE_ICON = {
    draft: FileEdit,
    sent: Send,
    paid: CheckCircle2,
    cancelled: Ban,
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
};

function TypeFilterButtons({ value, onChange }) {
    const options = [
        { value: '', label: 'Tous' },
        { value: 'facture', label: 'Factures' },
        { value: 'avoir', label: 'Avoirs' },
    ];

    return (
        <div className="flex flex-wrap gap-2">
            {options.map((option) => (
                <button
                    key={option.value || 'all'}
                    type="button"
                    onClick={() => onChange(option.value)}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                        value === option.value
                            ? 'bg-blue-500 text-white'
                            : 'border border-slate-700 bg-[#151d2c] text-slate-400 hover:text-white'
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}

function DocumentTypeBadge({ type }) {
    if (type !== 'avoir') {
        return null;
    }

    return (
        <span className="inline-flex items-center rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-400">
            Avoir
        </span>
    );
}

function FilterSelect({ value, onChange, children }) {
    return (
        <div className="relative min-w-[160px]">
            <select
                value={value}
                onChange={onChange}
                className="w-full appearance-none rounded-lg border border-slate-700 bg-[#151d2c] py-2 pl-3 pr-9 text-sm text-white outline-none focus:border-blue-500/50"
            >
                {children}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        </div>
    );
}

function StatusBadge({ status, label }) {
    const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
    const Icon = config.icon;

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${config.badge}`}
        >
            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
            {label}
        </span>
    );
}

const CDAR_STATUS_CONFIG = {
    déposée: {
        badge: 'bg-violet-500/15 text-violet-300',
        icon: Send,
    },
    approuvée: {
        badge: 'bg-emerald-500/15 text-emerald-400',
        icon: ShieldCheck,
    },
    rejetée: {
        badge: 'bg-red-500/15 text-red-400',
        icon: Ban,
    },
    refusée: {
        badge: 'bg-orange-500/15 text-orange-400',
        icon: Ban,
    },
    suspendue: {
        badge: 'bg-amber-500/15 text-amber-400',
        icon: AlertTriangle,
    },
    encaissée: {
        badge: 'bg-teal-500/15 text-teal-400',
        icon: Banknote,
    },
};

function CdarStatusBadge({ status, label }) {
    if (!status) {
        return null;
    }

    const config = CDAR_STATUS_CONFIG[status] ?? {
        badge: 'bg-slate-500/15 text-slate-300',
        icon: CheckCircle2,
    };
    const Icon = config.icon;

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${config.badge}`}
            title={`Statut PA : ${label}`}
        >
            <Icon className="h-3 w-3" strokeWidth={2} />
            PA · {label}
        </span>
    );
}

function FacturesPipeline({ pipeline }) {
    return (
        <div className={`${cardClass} p-5 sm:p-6`}>
            <h2 className="mb-5 text-base font-semibold text-white">
                Pipeline des factures
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {pipeline.map((step, index) => {
                    const Icon = PIPELINE_ICON[step.status] ?? FileEdit;
                    const style = PIPELINE_STYLE[step.color] ?? PIPELINE_STYLE.slate;

                    return (
                        <div
                            key={step.status}
                            className="relative flex flex-col items-center text-center"
                        >
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
                            <p className="mt-3 text-sm font-semibold text-white">
                                {step.label}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                                {step.amount_label}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const KPI_FACTURES_HEIGHT = 'h-[132px] overflow-hidden';

export default function Index({ kpis, pipeline, overdue, factures, filters }) {
    const [localFilters, setLocalFilters] = useState(filters);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedFacture, setSelectedFacture] = useState(null);

    function openPaymentModal(facture) {
        setSelectedFacture(facture);
        setPaymentModalOpen(true);
    }

    function closePaymentModal() {
        setPaymentModalOpen(false);
        setSelectedFacture(null);
    }

    function applyFilters(next = localFilters) {
        router.get(route('factures.index'), next, {
            preserveState: true,
            replace: true,
        });
    }

    function updateFilter(key, value) {
        const next = { ...localFilters, [key]: value };
        setLocalFilters(next);
        applyFilters(next);
    }

    function updateDocumentType(value) {
        updateFilter('document_type', value);
    }

    function generateAvoir(id) {
        router.post(route('factures.generate-avoir', id), {}, { preserveScroll: true });
    }

    function sendFacture(id, reference) {
        if (
            !window.confirm(
                `Envoyer la facture ${reference} par email au client ?`,
            )
        ) {
            return;
        }

        router.post(route('factures.send', id), {}, { preserveScroll: true });
    }

    return (
        <>
            <Head title="Liste des factures — Copifi" />
            <FacturationLayout
                title="Liste des factures"
                description="Suivez votre chiffre d'affaires et le recouvrement de vos créances."
                headerActions={
                    <Link
                        href={route('factures.create')}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#3b82f6] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(59,130,246,0.2)] transition hover:bg-blue-600"
                    >
                        <Plus className="h-4 w-4" />
                        Nouvelle facture
                    </Link>
                }
            >
                <div className="space-y-6">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <KpiChiffreAffaires
                            value={formatMoney(kpis.month_total)}
                            trendPercent={kpis.month_trend}
                            className={KPI_FACTURES_HEIGHT}
                        />
                        <KpiEncoursClient
                            value={formatMoney(kpis.encours_amount)}
                            invoiceCount={kpis.encours_count}
                            className={KPI_FACTURES_HEIGHT}
                        />
                        <KPICard
                            className={KPI_FACTURES_HEIGHT}
                            label="Factures en retard"
                            value={String(kpis.overdue_count)}
                            valueClassName={
                                kpis.overdue_count > 0 ? 'text-red-400' : 'text-white'
                            }
                            IconComponent={AlertTriangle}
                            iconWrapClass="bg-red-950/70 text-red-400"
                            meta={
                                overdue.length > 0 ? (
                                    <div className="w-full space-y-0.5">
                                        {overdue.slice(0, 2).map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center justify-between gap-2 text-xs"
                                            >
                                                <div className="flex min-w-0 items-center gap-1.5">
                                                    <span
                                                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                                            item.urgency === 'danger'
                                                                ? 'bg-red-500'
                                                                : 'bg-amber-500'
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
                                                            : 'text-amber-400'
                                                    }`}
                                                >
                                                    {item.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-xs text-slate-500">
                                        Aucune facture en retard.
                                    </span>
                                )
                            }
                        />
                    </div>

                    <FacturesPipeline pipeline={pipeline} />

                    <div className={`${cardClass} overflow-hidden`}>
                        <div className="flex flex-col gap-4 border-b border-slate-800/80 p-5">
                            <TypeFilterButtons
                                value={localFilters.document_type ?? ''}
                                onChange={updateDocumentType}
                            />
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-wrap gap-2">
                                <FilterSelect
                                    value={localFilters.status}
                                    onChange={(e) => updateFilter('status', e.target.value)}
                                >
                                    <option value="">Tous les statuts</option>
                                    <option value="draft">Brouillon</option>
                                    <option value="sent">Envoyé</option>
                                    <option value="paid">Payé</option>
                                    <option value="cancelled">Annulé</option>
                                </FilterSelect>
                                <FilterSelect
                                    value={localFilters.date_range}
                                    onChange={(e) => updateFilter('date_range', e.target.value)}
                                >
                                    <option value="">Toutes les dates</option>
                                    <option value="this_month">Ce mois</option>
                                    <option value="last_month">Mois dernier</option>
                                    <option value="last_90_days">90 derniers jours</option>
                                </FilterSelect>
                                <FilterSelect
                                    value={localFilters.amount_range}
                                    onChange={(e) =>
                                        updateFilter('amount_range', e.target.value)
                                    }
                                >
                                    <option value="">Montant : Tous</option>
                                    <option value="under_5000">Moins de 5 000 €</option>
                                    <option value="5000_15000">5 000 € – 15 000 €</option>
                                    <option value="over_15000">Plus de 15 000 €</option>
                                </FilterSelect>
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
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[980px] text-left text-sm">
                                <thead>
                                    <tr>
                                        <th className={tableHeaderClass}>N° Facture</th>
                                        <th className={tableHeaderClass}>Client</th>
                                        <th className={`${tableHeaderClass} text-right`}>
                                            Montant TTC
                                        </th>
                                        <th className={tableHeaderClass}>
                                            Date d&apos;émission
                                        </th>
                                        <th className={tableHeaderClass}>Échéance</th>
                                        <th className={tableHeaderClass}>Statut</th>
                                        <th className={`${tableHeaderClass} text-right`}>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {factures.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-4 py-16 text-center text-slate-500"
                                            >
                                                Aucun document trouvé.
                                            </td>
                                        </tr>
                                    ) : (
                                        factures.data.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="border-b border-slate-800/60 transition hover:bg-white/[0.02]"
                                            >
                                                <td className="px-4 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex flex-wrap items-center gap-2 font-medium text-slate-200">
                                                            <span>{item.reference}</span>
                                                            <DocumentTypeBadge type={item.type} />
                                                        </div>
                                                        {item.parent_reference ? (
                                                            <span className="text-xs text-slate-500">
                                                                Facture {item.parent_reference}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    {item.client ? (
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-2 ring-[#1e293b] ${item.client.avatar_class}`}
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
                                                <td
                                                    className={`px-4 py-4 text-right font-medium tabular-nums ${
                                                        item.type === 'avoir'
                                                            ? 'text-red-400'
                                                            : 'text-white'
                                                    }`}
                                                >
                                                    {item.type === 'avoir' ? '− ' : ''}
                                                    {formatMoney(item.total_ttc, item.currency_code)}
                                                </td>
                                                <td className="px-4 py-4 text-slate-400">
                                                    {item.issue_date_label}
                                                </td>
                                                <td
                                                    className={`px-4 py-4 ${DUE_DATE_CLASS[item.due_date_display.variant]}`}
                                                >
                                                    {item.due_date_display.label}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <StatusBadge
                                                            status={item.status}
                                                            label={item.status_label}
                                                        />
                                                        <CdarStatusBadge
                                                            status={item.cdar_status}
                                                            label={item.cdar_status_label}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Link
                                                            href={route(
                                                                'factures.edit',
                                                                item.id,
                                                            )}
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
                                                        <a
                                                            href={route(
                                                                'factures.pdf',
                                                                item.id,
                                                            )}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-sky-400"
                                                            title="Télécharger le PDF"
                                                            aria-label="Télécharger le PDF"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </a>
                                                        {item.can_send ? (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    sendFacture(
                                                                        item.id,
                                                                        item.reference,
                                                                    )
                                                                }
                                                                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-400 transition hover:bg-blue-500/10 hover:text-blue-300"
                                                                title="Envoyer par email au client"
                                                            >
                                                                <Send className="h-4 w-4" />
                                                                Envoyer
                                                            </button>
                                                        ) : null}
                                                        {item.can_record_payment ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => openPaymentModal(item)}
                                                                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/10 hover:text-emerald-300"
                                                                title="Enregistrer un paiement"
                                                            >
                                                                <Banknote className="h-4 w-4" />
                                                                Encaisser
                                                            </button>
                                                        ) : null}
                                                        {item.can_create_avoir ? (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    generateAvoir(item.id)
                                                                }
                                                                className="rounded-lg p-2 text-amber-500/80 transition hover:bg-amber-500/10 hover:text-amber-400"
                                                                title="Générer un avoir"
                                                            >
                                                                <Receipt className="h-4 w-4" />
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

                        {factures.meta.last_page > 1 ? (
                            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-800/80 px-5 py-4 sm:flex-row">
                                <p className="text-sm text-slate-500">
                                    {factures.meta.from}–{factures.meta.to} sur{' '}
                                    {factures.meta.total} factures
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {factures.links.map((link, index) => (
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

            <PaymentModal
                isOpen={paymentModalOpen}
                onClose={closePaymentModal}
                facture={selectedFacture}
            />
        </>
    );
}
