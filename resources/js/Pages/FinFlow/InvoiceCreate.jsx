import CompanyBrandLogo from '@/Components/FinFlow/CompanyBrandLogo';
import DocumentTimeline from '@/Components/FinFlow/DocumentTimeline';
import FacturationLayout from '@/Layouts/FacturationLayout';
import { companyBrandColor, companySenderLines } from '@/utils/company';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    ChevronDown,
    ChevronLeft,
    Monitor,
    Plus,
    Receipt,
    Send,
    Smartphone,
    Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { useClientVatRate } from '@/hooks/useClientVatRate';
import {
    computeInvoiceTotals,
    feePerDayForDestination,
} from '@/utils/documentTotals';
import {
    emptyLineDiscountFields,
    formatLineDiscountLabel,
    lineTotalHt,
} from '@/utils/ligneAmounts';
import {
    formatFinancialDiscountDeadline,
    quoteFinancialDiscount,
} from '@/utils/financialDiscount';
import { formatVatRateLabel } from '@/utils/taxRates';
import { currencyOptions, currencySymbol, formatMoney } from '@/utils/currency';

const inputDark =
    'w-full rounded-lg border border-slate-600/45 bg-[#151a24] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-slate-400/80 focus:ring-1 focus:ring-slate-400/25';

const inputNumberDark =
    `${inputDark} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`;

const selectCompactDark =
    'h-[42px] w-full shrink-0 rounded-lg border border-slate-600/45 bg-[#151a24] px-1.5 text-center text-xs text-white outline-none transition focus:border-slate-400/80 focus:ring-1 focus:ring-slate-400/25';

const labelClass = 'mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400';

const EMPTY_CLIENT = { name: '', email: '', address: '' };

const REFERENCE_PLACEHOLDER = 'Généré à la sauvegarde';

const OPERATION_CATEGORY_OPTIONS = [
    { value: 'bien', label: 'Bien' },
    { value: 'service', label: 'Service' },
    { value: 'mixte', label: 'Mixte' },
];

function displayReference(reference, isEditing) {
    if (reference) {
        return reference;
    }

    return isEditing ? '—' : REFERENCE_PLACEHOLDER;
}

function mapDocumentToForm(document, formDefaults) {
    return {
        tiers_id: document.client?.id ?? '',
        issue_date: document.issue_date ?? formDefaults.issue_date,
        due_date: document.due_date ?? formDefaults.due_date,
        currency_code: document.currency_code ?? formDefaults.currency_code ?? 'EUR',
        type_prestation:
            document.type_prestation ?? formDefaults.type_prestation ?? 'service',
        operation_category:
            document.operation_category ?? formDefaults.operation_category ?? 'service',
        delivery_address: document.delivery_address ?? formDefaults.delivery_address ?? '',
        vat_on_debits: Boolean(document.vat_on_debits ?? formDefaults.vat_on_debits ?? false),
        destination: document.destination ?? formDefaults.destination ?? '',
        jours_stockage: document.jours_stockage ?? formDefaults.jours_stockage ?? 0,
        financial_discount_percent:
            document.financial_discount_percent ?? formDefaults.financial_discount_percent ?? 0,
        financial_discount_days:
            document.financial_discount_days ?? formDefaults.financial_discount_days ?? '',
        lignes: document.lignes?.length ? document.lignes : formDefaults.lignes,
    };
}

function formatDisplayDate(iso) {
    if (!iso) {
        return '';
    }
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function displayOrDash(value) {
    const v = typeof value === 'string' ? value.trim() : value;
    if (v === '' || v === null || v === undefined) {
        return '—';
    }
    return String(v);
}

function InvoiceCreateTopBar({
    processing,
    saveDisabled = false,
    isEditing = false,
    isAvoir = false,
    readOnly = false,
    canSend = false,
    canCreateAvoir = false,
    factureId = null,
    onSend,
    sending = false,
}) {
    return (
        <header className="sticky top-0 z-20 flex h-20 shrink-0 items-center justify-between gap-4 border-b border-finflow-border/50 bg-finflow-sidebar px-6 shadow-sm lg:px-10">
            <Link
                href={route('factures.index')}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-finflow-muted transition hover:text-white"
            >
                <ChevronLeft className="h-4 w-4 shrink-0" strokeWidth={2} />
                Factures
            </Link>
            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                {canCreateAvoir && factureId ? (
                    <Link
                        href={route('factures.generate-avoir', factureId)}
                        method="post"
                        as="button"
                        className="inline-flex items-center gap-2 rounded-xl border border-amber-500/60 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20 sm:text-sm"
                    >
                        <Receipt className="h-4 w-4 shrink-0" strokeWidth={2} />
                        Générer un avoir
                    </Link>
                ) : null}
                {canSend ? (
                    <button
                        type="button"
                        onClick={onSend}
                        disabled={sending || saveDisabled}
                        className="inline-flex items-center gap-2 rounded-xl border border-blue-500/60 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                    >
                        <Send className="h-4 w-4 shrink-0" strokeWidth={2} />
                        {sending ? 'Envoi…' : 'Envoyer au client'}
                    </button>
                ) : null}
                {!readOnly ? (
                <button
                    type="submit"
                    form="facture-create-form"
                    disabled={processing || saveDisabled}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#3b82f6] pl-3 pr-2 py-2 text-xs font-semibold text-white shadow-[0_0_20px_rgba(59,130,246,0.25)] transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50 sm:pl-4 sm:text-sm"
                >
                    {processing ? 'Enregistrement…' : isEditing ? 'Enregistrer' : isAvoir ? 'Créer l\'avoir' : 'Créer la facture'}
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-90" />
                </button>
                ) : null}
            </div>
        </header>
    );
}

/** Icône sombre à droite du bandeau (maquette éditeur) */
function EditorHeaderMark({ brandColor, className = '' }) {
    return (
        <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#12171f] shadow-lg ring-1 ring-white/10 ${className}`}
            aria-hidden
        >
            <div className="relative h-7 w-7">
                <div
                    className="absolute inset-0 rotate-45 rounded-sm border-2"
                    style={{ borderColor: brandColor, backgroundColor: `${brandColor}40` }}
                />
                <div className="absolute inset-2 rotate-45 border border-white/90" />
            </div>
        </div>
    );
}

function PreviewDocument({
    company,
    invoiceNo,
    isPersisted = false,
    documentTypeLabel = 'FACTURE',
    issueDate,
    dueDate,
    currency,
    client,
    lignes,
    subtotal,
    fraisPort = 0,
    tax,
    total,
    vatRateLabel = '',
    className = '',
}) {
    const brandColor = companyBrandColor(company);
    const senderLines = companySenderLines(company);
    const filledLines = lignes.filter(
        (l) => l.article_id && (l.label?.trim() || lineTotalHt(l) > 0),
    );

    return (
        <article
            className={`font-sans bg-white text-black shadow-2xl ring-1 ring-black/[0.07] rounded-sm p-6 sm:p-8 ${className}`}
        >
            <div className="mb-8 flex items-start justify-between gap-4">
                <CompanyBrandLogo company={company} className="!h-10 !w-10" />
                <div className="text-right">
                    <p className="font-serif text-2xl font-black uppercase tracking-tight text-black">
                        {documentTypeLabel}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-600">
                        {displayReference(invoiceNo, isPersisted)}
                    </p>
                </div>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-6 text-sm">
                <div>
                    <p className="font-semibold text-black">
                        {company?.name || '—'}
                    </p>
                    {senderLines.map((line) => (
                        <p key={line} className="mt-1 text-slate-600">
                            {line}
                        </p>
                    ))}
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        FACTURÉ À
                    </p>
                    <p className="mt-1 font-semibold text-black">
                        {displayOrDash(client.name)}
                    </p>
                    {client.email.trim() ? (
                        <p className="mt-1 text-slate-600">{client.email}</p>
                    ) : null}
                    {client.address.trim() ? (
                        <p className="mt-1 whitespace-pre-line text-slate-600">
                            {client.address}
                        </p>
                    ) : null}
                </div>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-6 border-t border-slate-200 pt-6 text-sm">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        DATE D&apos;ÉMISSION
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">
                        {issueDate ? formatDisplayDate(issueDate) : '—'}
                    </p>
                </div>
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        ÉCHÉANCE
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">
                        {dueDate ? formatDisplayDate(dueDate) : '—'}
                    </p>
                </div>
            </div>

            <div className="border-t-2 border-slate-900 pt-4">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-300 text-left">
                            <th className="pb-2.5 font-semibold text-black">
                                Description
                            </th>
                            <th className="pb-2.5 text-right font-semibold text-black">
                                Qté
                            </th>
                            <th className="pb-2.5 text-right font-semibold text-black">
                                Prix
                            </th>
                            <th className="pb-2.5 text-right font-semibold text-black">
                                Remise
                            </th>
                            <th className="pb-2.5 text-right font-semibold text-black">
                                Total
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filledLines.length === 0 ? (
                            <tr className="border-b border-slate-200">
                                <td
                                    colSpan={5}
                                    className="py-8 text-center text-sm text-slate-400"
                                >
                                    Aucun article
                                </td>
                            </tr>
                        ) : (
                            filledLines.map((l, index) => (
                                <tr
                                    key={l.article_id ?? index}
                                    className="border-b border-slate-200"
                                >
                                    <td className="py-3 pr-2 align-top">
                                        <p className="font-semibold text-black">
                                            {displayOrDash(l.label)}
                                        </p>
                                        {l.description?.trim() ? (
                                            <p className="mt-0.5 text-xs text-slate-500">
                                                {l.description}
                                            </p>
                                        ) : null}
                                    </td>
                                    <td className="py-3 text-right align-top tabular-nums text-slate-700">
                                        {displayOrDash(l.quantity)}
                                    </td>
                                    <td className="py-3 text-right align-top tabular-nums text-slate-700">
                                        {formatMoney(Number(l.unit_price_ht) || 0, currency)}
                                    </td>
                                    <td className="py-3 text-right align-top text-xs text-slate-600">
                                        {formatLineDiscountLabel(l) ?? '—'}
                                    </td>
                                    <td className="py-3 text-right align-top tabular-nums font-medium text-black">
                                        {lineTotalHt(l) > 0
                                            ? formatMoney(lineTotalHt(l), currency)
                                            : '—'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-6">
                <div className="ml-auto w-full max-w-[240px] space-y-3 text-sm">
                    <div className="flex justify-between gap-4 text-slate-600">
                        <span>Sous-total HT (lignes)</span>
                        <span className="font-semibold tabular-nums text-black">
                            {formatMoney(subtotal - fraisPort, currency)}
                        </span>
                    </div>
                    {fraisPort > 0 ? (
                        <div className="flex justify-between gap-4 text-slate-600">
                            <span>Frais de port</span>
                            <span className="font-semibold tabular-nums text-black">
                                {formatMoney(fraisPort, currency)}
                            </span>
                        </div>
                    ) : null}
                    <div className="flex justify-between gap-4 text-slate-600">
                        <span>
                            TVA
                            {vatRateLabel ? ` (${vatRateLabel})` : ''}
                        </span>
                        <span className="font-semibold tabular-nums text-black">
                            {formatMoney(tax, currency)}
                        </span>
                    </div>
                    <div
                        className="mt-2 flex items-center justify-between gap-3 rounded-md border px-4 py-3.5"
                        style={{
                            borderColor: `${brandColor}40`,
                            backgroundColor: `${brandColor}12`,
                        }}
                    >
                        <span className="font-bold text-black">
                            Total {currency}
                        </span>
                        <span
                            className="text-xl font-black tabular-nums"
                            style={{ color: brandColor }}
                        >
                            {formatMoney(total, currency)}
                        </span>
                    </div>
                </div>
            </div>
        </article>
    );
}

export default function InvoiceCreate({
    clients = [],
    catalogueArticles = [],
    formDefaults = null,
    document = null,
    vatRates: vatRatesProp = null,
}) {
    const { tax_rates: sharedTaxRates, currencies, company, delivery_destinations: deliveryDestinations = [] } = usePage().props;
    const brandColor = companyBrandColor(company);
    const senderLines = useMemo(() => companySenderLines(company), [company]);
    const taxRates = vatRatesProp ?? sharedTaxRates ?? {};

    const initialData = document
        ? mapDocumentToForm(document, formDefaults)
        : formDefaults;

    const form = useForm(initialData);
    const [previewMode, setPreviewMode] = useState('desktop');
    const [sending, setSending] = useState(false);

    const isEditing = Boolean(document?.id);
    const isReadOnly = isEditing && document?.can_be_edited === false;

    const { defaultVatRate, handleTierChange } = useClientVatRate({
        form,
        clients,
        taxRates,
        readOnly: isReadOnly,
    });

    const effectiveVatRate = form.data.vat_on_debits ? 0 : defaultVatRate;

    useEffect(() => {
        if (isReadOnly || !form.data.lignes?.length) {
            return;
        }

        const needsSync = form.data.lignes.some(
            (ligne) => Number(ligne.vat_rate) !== effectiveVatRate,
        );

        if (needsSync) {
            form.setData(
                'lignes',
                form.data.lignes.map((ligne) => ({
                    ...ligne,
                    vat_rate: effectiveVatRate,
                })),
            );
        }
    }, [effectiveVatRate, form.data.vat_on_debits, isReadOnly]);

    function onTierChange(nextTierId) {
        handleTierChange(nextTierId);

        const client = clients.find((c) => String(c.id) === String(nextTierId));

        if (
            form.data.operation_category !== 'service' &&
            client?.delivery_address &&
            !String(form.data.delivery_address ?? '').trim()
        ) {
            form.setData('delivery_address', client.delivery_address);
        }
    }

    const selectedClient = useMemo(
        () => clients.find((c) => String(c.id) === String(form.data.tiers_id)) ?? null,
        [clients, form.data.tiers_id],
    );

    const selectedFeePerDay = useMemo(
        () => feePerDayForDestination(deliveryDestinations, form.data.destination),
        [deliveryDestinations, form.data.destination],
    );

    const financialDiscountQuote = useMemo(
        () =>
            quoteFinancialDiscount({
                totalTtc: computeInvoiceTotals(
                    form.data.lignes,
                    form.data.type_prestation,
                    form.data.jours_stockage,
                    effectiveVatRate,
                    form.data.destination,
                    deliveryDestinations,
                ).total,
                percent: form.data.financial_discount_percent,
                days: form.data.financial_discount_days || null,
                issueDate: form.data.issue_date,
                paymentDate: form.data.issue_date,
            }),
        [
            form.data.lignes,
            form.data.type_prestation,
            form.data.jours_stockage,
            form.data.destination,
            form.data.financial_discount_percent,
            form.data.financial_discount_days,
            form.data.issue_date,
            deliveryDestinations,
            effectiveVatRate,
        ],
    );

    const totals = useMemo(
        () =>
            computeInvoiceTotals(
                form.data.lignes,
                form.data.type_prestation,
                form.data.jours_stockage,
                effectiveVatRate,
                form.data.destination,
                deliveryDestinations,
            ),
        [
            form.data.lignes,
            form.data.type_prestation,
            form.data.jours_stockage,
            form.data.destination,
            deliveryDestinations,
            effectiveVatRate,
        ],
    );

    function setPrestationType(type) {
        if (type === 'service') {
            form.setData({
                ...form.data,
                type_prestation: 'service',
                destination: '',
                jours_stockage: 0,
            });
            return;
        }

        form.setData({
            ...form.data,
            type_prestation: 'produit',
        });
    }

    const linesAreValid = useMemo(
        () =>
            form.data.lignes.length > 0 &&
            form.data.lignes.every((ligne) => Boolean(ligne.article_id)),
        [form.data.lignes],
    );

    const canChangeCurrency = !document?.id || document?.status === 'draft';
    const availableCurrencies = currencyOptions(currencies);
    const isAvoir = document?.type === 'avoir';
    const currencyCode = form.data.currency_code || 'EUR';
    const canSend = isEditing && !isAvoir && document?.status === 'draft';
    const canCreateAvoir = Boolean(document?.can_create_avoir);
    const documentTypeLabel = isAvoir ? 'AVOIR' : 'FACTURE';
    const pageHeading = isEditing
        ? isReadOnly
            ? isAvoir
                ? 'Voir l\'avoir'
                : 'Voir la facture'
            : isAvoir
              ? 'Modifier l\'avoir'
              : 'Modifier la facture'
        : 'Nouvelle Facture';

    function sendToClient() {
        if (!document?.id) {
            return;
        }

        setSending(true);
        router.post(route('factures.send', document.id), {}, {
            preserveScroll: true,
            onFinish: () => setSending(false),
        });
    }

    function selectArticle(index, articleId) {
        const lignes = [...form.data.lignes];
        const article = catalogueArticles.find(
            (item) => String(item.id) === String(articleId),
        );

        if (!articleId || !article) {
            lignes[index] = {
                ...lignes[index],
                article_id: '',
                label: '',
                description: '',
                unit_price_ht: 0,
            };
        } else {
            lignes[index] = {
                ...lignes[index],
                article_id: article.id,
                label: article.designation,
                description: article.description ?? '',
                unit_price_ht: article.price_ht,
                vat_rate: effectiveVatRate,
            };
        }

        form.setData('lignes', lignes);
    }

    function updateLine(index, field, value) {
        if (field === 'label' || field === 'description') {
            return;
        }

        const lignes = [...form.data.lignes];

        if (field === 'discount_type') {
            lignes[index] = {
                ...lignes[index],
                discount_type: value,
                discount_value: value ? lignes[index].discount_value : '',
            };
        } else {
            lignes[index] = { ...lignes[index], [field]: value };
        }

        form.setData('lignes', lignes);
    }

    function createEmptyLine() {
        return {
            article_id: '',
            label: '',
            description: '',
            quantity: 1,
            unit_price_ht: 0,
            ...emptyLineDiscountFields(),
            vat_rate: effectiveVatRate,
        };
    }

    function addLine() {
        form.setData('lignes', [...form.data.lignes, createEmptyLine()]);
    }

    function removeLine(index, event) {
        event?.preventDefault();
        event?.stopPropagation();

        if (isReadOnly) {
            return;
        }

        const remaining = form.data.lignes.filter((_, i) => i !== index);

        form.setData({
            ...form.data,
            lignes: remaining.length > 0 ? remaining : [createEmptyLine()],
        });
    }

    function submit(e) {
        e.preventDefault();

        if (document?.id) {
            form.put(route('factures.update', document.id));
            return;
        }

        form.post(route('factures.store'));
    }

    const previewClient = selectedClient
        ? {
              name: selectedClient.name ?? '',
              email: selectedClient.email ?? '',
              address: selectedClient.address ?? '',
          }
        : EMPTY_CLIENT;

    const previewProps = {
        company,
        invoiceNo: document?.reference,
        isPersisted: isEditing,
        documentTypeLabel,
        issueDate: form.data.issue_date,
        dueDate: form.data.due_date,
        currency: currencyCode,
        client: previewClient,
        lignes: form.data.lignes,
        subtotal: totals.subtotalHt,
        fraisPort: totals.fraisPort,
        tax: totals.tax,
        total: totals.total,
        vatRateLabel: selectedClient
            ? formatVatRateLabel(effectiveVatRate)
            : '',
    };

    return (
        <>
            <Head title={`${pageHeading} — Copifi`} />
            <FacturationLayout
                title=""
                showPageHeading={false}
                topBar={
                    <InvoiceCreateTopBar
                        processing={form.processing}
                        saveDisabled={!linesAreValid || !form.data.tiers_id}
                        isEditing={isEditing}
                        isAvoir={isAvoir}
                        readOnly={isReadOnly}
                        canSend={canSend}
                        canCreateAvoir={canCreateAvoir}
                        factureId={document?.id}
                        onSend={sendToClient}
                        sending={sending}
                    />
                }
                mainClassName="!px-0 !py-0"
            >
                <form id="facture-create-form" onSubmit={submit}>
                    <h1 className="border-b border-finflow-border/40 px-6 py-5 font-display text-2xl font-bold tracking-tight text-white sm:px-8 sm:text-3xl lg:px-10">
                        {pageHeading}
                        {document?.parent_reference ? (
                            <span className="mt-2 block text-sm font-normal text-slate-400">
                                Lié à la facture {document.parent_reference}
                            </span>
                        ) : null}
                        {isReadOnly ? (
                            <span className="mt-2 block text-sm font-normal text-amber-400/90">
                                Document verrouillé — consultation seule
                            </span>
                        ) : null}
                    </h1>

                    <fieldset
                        disabled={isReadOnly}
                        className={`min-w-0 border-0 p-0 ${isReadOnly ? '[&_*]:cursor-default' : ''}`}
                    >
                    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-0">
                        <div className="min-w-0 lg:col-span-7 lg:border-r lg:border-finflow-border/40 xl:col-span-8">
                            <div className="p-6 lg:p-8">
                                <div className="overflow-hidden rounded-xl border border-slate-700/40 bg-[#1a1f2b] shadow-xl">
                                    <div
                                        className="relative h-20 sm:h-24"
                                        style={{ backgroundColor: brandColor }}
                                    >
                                        <div className="absolute -bottom-5 right-5 z-10 sm:right-6">
                                            <EditorHeaderMark
                                                brandColor={brandColor}
                                                className="shadow-lg ring-2 ring-[#1a1f2b]"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-y-6 px-6 pb-8 pt-8 sm:px-8 sm:pt-9">
                                        <h2 className="text-3xl font-bold tracking-tight text-white">
                                            {isAvoir ? 'Avoir' : 'Facture'}
                                        </h2>

                                        <div className="rounded-xl border border-slate-600/45 bg-[#151a24]/90 p-4">
                                            <p className={labelClass}>Type de facturation</p>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {[
                                                    { value: 'service', label: 'Service' },
                                                    { value: 'produit', label: 'Produit' },
                                                ].map((option) => (
                                                    <button
                                                        key={option.value}
                                                        type="button"
                                                        onClick={() =>
                                                            setPrestationType(option.value)
                                                        }
                                                        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                                                            form.data.type_prestation ===
                                                            option.value
                                                                ? 'bg-blue-600 text-white'
                                                                : 'border border-slate-600 bg-[#0f1419] text-slate-300 hover:border-slate-500'
                                                        }`}
                                                    >
                                                        {option.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid gap-5 sm:grid-cols-2">
                                            <div className="rounded-xl border border-slate-600/45 bg-[#151a24]/90 p-5">
                                                <p className={labelClass}>De</p>
                                                <p className="font-semibold text-white">
                                                    {company?.name || '—'}
                                                </p>
                                                {senderLines.map((line) => (
                                                    <p
                                                        key={line}
                                                        className="mt-1.5 text-sm text-slate-400"
                                                    >
                                                        {line}
                                                    </p>
                                                ))}
                                            </div>
                                            <div className="rounded-xl border border-slate-600/45 bg-[#151a24]/90 p-5">
                                                <p className={labelClass}>À</p>
                                                <select
                                                    className={`${inputDark} mt-2`}
                                                    value={form.data.tiers_id}
                                                    onChange={(e) =>
                                                        onTierChange(e.target.value)
                                                    }
                                                    required
                                                >
                                                    <option value="" disabled>
                                                        Sélectionnez un client…
                                                    </option>
                                                    {clients.map((item) => (
                                                        <option key={item.id} value={item.id}>
                                                            {item.name}
                                                            {item.country_code
                                                                ? ` (${item.country_code})`
                                                                : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                                <p className="mt-2 text-xs text-slate-500">
                                                    Client absent de la liste ?{' '}
                                                    <Link
                                                        href={route('clients.index')}
                                                        className="font-medium text-blue-400 transition hover:text-blue-300"
                                                    >
                                                        Ajouter un client
                                                    </Link>
                                                    {' '}puis revenez sur cette page.
                                                </p>
                                                {form.errors.tiers_id ? (
                                                    <p className="mt-2 text-xs text-red-400">
                                                        {form.errors.tiers_id}
                                                    </p>
                                                ) : null}
                                                {selectedClient ? (
                                                    <div className="mt-3 space-y-1 text-sm text-slate-400">
                                                        <p className="text-xs text-slate-500">
                                                            TVA applicable :{' '}
                                                            <span className="font-medium text-slate-300">
                                                                {formatVatRateLabel(effectiveVatRate)}
                                                            </span>
                                                            {selectedClient.country_code
                                                                ? ` (${selectedClient.country_code})`
                                                                : ' (export)'}
                                                        </p>
                                                        {selectedClient.email ? (
                                                            <p>{selectedClient.email}</p>
                                                        ) : null}
                                                        {selectedClient.address ? (
                                                            <p className="whitespace-pre-line">
                                                                {selectedClient.address}
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                            <label className="block">
                                                <span className={labelClass}>
                                                    Date d&apos;émission
                                                </span>
                                                <div className="relative">
                                                    <input
                                                        type="date"
                                                        className={`${inputDark} pr-10`}
                                                        value={form.data.issue_date}
                                                        onChange={(e) =>
                                                            form.setData(
                                                                'issue_date',
                                                                e.target.value,
                                                            )
                                                        }
                                                        required
                                                    />
                                                    <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                                </div>
                                            </label>
                                            <label className="block">
                                                <span className={labelClass}>Échéance</span>
                                                <div className="relative">
                                                    <input
                                                        type="date"
                                                        className={`${inputDark} pr-10`}
                                                        value={form.data.due_date}
                                                        onChange={(e) =>
                                                            form.setData('due_date', e.target.value)
                                                        }
                                                    />
                                                    <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                                </div>
                                            </label>
                                            <label className="block">
                                                <span className={labelClass}>Devise</span>
                                                <select
                                                    className={inputDark}
                                                    value={form.data.currency_code}
                                                    onChange={(e) =>
                                                        form.setData(
                                                            'currency_code',
                                                            e.target.value,
                                                        )
                                                    }
                                                    disabled={!canChangeCurrency}
                                                    required
                                                >
                                                    {availableCurrencies.map(({ code }) => (
                                                        <option key={code} value={code}>
                                                            {code}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                        </div>

                                        {!isAvoir && !isReadOnly ? (
                                            <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
                                                <p className="text-sm font-semibold text-amber-200">
                                                    Remise financière (escompte)
                                                </p>
                                                <p className="mt-1 text-xs text-slate-400">
                                                    Réduction accordée si le client règle rapidement
                                                    (distincte de la remise commerciale sur les lignes).
                                                </p>
                                                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                                    <label className="block">
                                                        <span className={labelClass}>
                                                            Escompte (%)
                                                        </span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            step="0.01"
                                                            className={inputNumberDark}
                                                            value={form.data.financial_discount_percent}
                                                            onChange={(e) =>
                                                                form.setData(
                                                                    'financial_discount_percent',
                                                                    e.target.value,
                                                                )
                                                            }
                                                        />
                                                        {form.errors.financial_discount_percent ? (
                                                            <p className="mt-1 text-xs text-red-400">
                                                                {form.errors.financial_discount_percent}
                                                            </p>
                                                        ) : null}
                                                    </label>
                                                    <label className="block">
                                                        <span className={labelClass}>
                                                            Délai (jours après émission)
                                                        </span>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max="365"
                                                            step="1"
                                                            className={inputNumberDark}
                                                            value={form.data.financial_discount_days ?? ''}
                                                            onChange={(e) =>
                                                                form.setData(
                                                                    'financial_discount_days',
                                                                    e.target.value,
                                                                )
                                                            }
                                                            disabled={
                                                                !Number(
                                                                    form.data.financial_discount_percent,
                                                                )
                                                            }
                                                            placeholder="Ex. 10"
                                                        />
                                                        {form.errors.financial_discount_days ? (
                                                            <p className="mt-1 text-xs text-red-400">
                                                                {form.errors.financial_discount_days}
                                                            </p>
                                                        ) : null}
                                                    </label>
                                                </div>
                                                {Number(form.data.financial_discount_percent) > 0 &&
                                                form.data.financial_discount_days ? (
                                                    <p className="mt-3 text-xs text-amber-100/90">
                                                        Si paiement avant le{' '}
                                                        <span className="font-semibold">
                                                            {formatFinancialDiscountDeadline(
                                                                financialDiscountQuote.deadline,
                                                            )}
                                                        </span>
                                                        : escompte de{' '}
                                                        <span className="font-semibold">
                                                            {formatMoney(
                                                                financialDiscountQuote.discountAmount,
                                                                currencyCode,
                                                            )}
                                                        </span>{' '}
                                                        ? net{' '}
                                                        <span className="font-semibold">
                                                            {formatMoney(
                                                                financialDiscountQuote.netCashDue,
                                                                currencyCode,
                                                            )}
                                                        </span>
                                                    </p>
                                                ) : null}
                                            </div>
                                        ) : null}

                                        {!isAvoir ? (
                                            <div className="mb-4 rounded-xl border border-slate-600/45 bg-[#151a24]/90 p-4">
                                                <p className="mb-4 text-sm font-semibold text-white">
                                                    Informations réglementaires
                                                </p>
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <label className="block sm:col-span-2 sm:max-w-md">
                                                        <span className={labelClass}>
                                                            Catégorie d&apos;opération
                                                        </span>
                                                        <select
                                                            className={`${inputDark} mt-2`}
                                                            value={form.data.operation_category}
                                                            onChange={(e) => {
                                                                const nextCategory = e.target.value;
                                                                const nextData = {
                                                                    ...form.data,
                                                                    operation_category: nextCategory,
                                                                    delivery_address:
                                                                        nextCategory === 'service'
                                                                            ? ''
                                                                            : form.data.delivery_address,
                                                                };
                                                                if (nextCategory === 'service') {
                                                                    nextData.type_prestation = 'service';
                                                                    nextData.destination = '';
                                                                    nextData.jours_stockage = 0;
                                                                }
                                                                form.setData(nextData);
                                                            }}
                                                            disabled={isReadOnly}
                                                            required
                                                        >
                                                            {OPERATION_CATEGORY_OPTIONS.map(
                                                                (option) => (
                                                                    <option
                                                                        key={option.value}
                                                                        value={option.value}
                                                                    >
                                                                        {option.label}
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                        {form.errors.operation_category ? (
                                                            <p className="mt-1 text-xs text-red-400">
                                                                {form.errors.operation_category}
                                                            </p>
                                                        ) : null}
                                                    </label>
                                                    {form.data.operation_category !== 'service' ? (
                                                        <label className="block sm:col-span-2">
                                                            <span className={labelClass}>
                                                                Adresse de livraison
                                                            </span>
                                                            <textarea
                                                                className={`${inputDark} mt-2 min-h-[88px] resize-y`}
                                                                value={form.data.delivery_address ?? ''}
                                                                onChange={(e) =>
                                                                    form.setData(
                                                                        'delivery_address',
                                                                        e.target.value,
                                                                    )
                                                                }
                                                                disabled={isReadOnly}
                                                                placeholder="Adresse complète de livraison (si différente de la facturation)"
                                                                rows={3}
                                                            />
                                                            {form.errors.delivery_address ? (
                                                                <p className="mt-1 text-xs text-red-400">
                                                                    {form.errors.delivery_address}
                                                                </p>
                                                            ) : null}
                                                        </label>
                                                    ) : null}
                                                    <label className="flex items-start gap-3 sm:col-span-2">
                                                        <input
                                                            type="checkbox"
                                                            className="mt-1 h-4 w-4 rounded border-slate-600 bg-[#151a24] text-blue-600 focus:ring-blue-500"
                                                            checked={Boolean(form.data.vat_on_debits)}
                                                            onChange={(e) =>
                                                                form.setData(
                                                                    'vat_on_debits',
                                                                    e.target.checked,
                                                                )
                                                            }
                                                            disabled={isReadOnly}
                                                        />
                                                        <span>
                                                            <span
                                                                className={`${labelClass} normal-case tracking-normal`}
                                                            >
                                                                TVA sur les débits
                                                            </span>
                                                            <span className="mt-1 block text-xs font-normal normal-case tracking-normal text-slate-500">
                                                                Autoliquidation par le client — la
                                                                TVA n&apos;est pas facturée sur ce
                                                                document.
                                                            </span>
                                                            {form.errors.vat_on_debits ? (
                                                                <p className="mt-1 text-xs text-red-400">
                                                                    {form.errors.vat_on_debits}
                                                                </p>
                                                            ) : null}
                                                        </span>
                                                    </label>
                                                </div>
                                            </div>
                                        ) : null}

                                        <div className="space-y-3 rounded-xl border border-slate-600/45 p-3 sm:p-4">
                                            <div className="hidden gap-3 px-1 text-[10px] font-semibold uppercase tracking-wide text-[#94a3b8] lg:grid lg:grid-cols-12 lg:items-center">
                                                <span className="lg:col-span-4">Article</span>
                                                <span className="lg:col-span-1 text-center">Qté</span>
                                                <span className="lg:col-span-2">Prix unit.</span>
                                                <span className="lg:col-span-2">Remise</span>
                                                <span className="lg:col-span-1 text-right">HT</span>
                                                <span className="lg:col-span-1 text-center">TVA</span>
                                                <span className="lg:col-span-1" />
                                            </div>

                                            {form.data.lignes.map((ligne, index) => (
                                                <div
                                                    key={`ligne-${index}-${ligne.article_id || 'empty'}`}
                                                    className="rounded-lg border border-slate-700/50 bg-[#151a24] p-3 sm:p-4"
                                                >
                                                    <div className="grid gap-3 lg:grid-cols-12 lg:items-end">
                                                        <div className="lg:col-span-4">
                                                            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 lg:hidden">
                                                                Article
                                                            </p>
                                                            <select
                                                                className={`${inputDark} mb-2 text-xs`}
                                                                value={ligne.article_id}
                                                                onChange={(e) =>
                                                                    selectArticle(
                                                                        index,
                                                                        e.target.value,
                                                                    )
                                                                }
                                                                required
                                                            >
                                                                <option value="" disabled>
                                                                    Sélectionnez un service/produit…
                                                                </option>
                                                                {catalogueArticles.map((article) => (
                                                                    <option
                                                                        key={article.id}
                                                                        value={article.id}
                                                                    >
                                                                        {article.designation}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            {ligne.article_id ? (
                                                                <div className="rounded-lg border border-slate-700/40 bg-[#0f1419]/60 px-3 py-2">
                                                                    <p className="text-sm font-medium text-white">
                                                                        {ligne.label}
                                                                    </p>
                                                                    {ligne.description ? (
                                                                        <p className="mt-1 text-xs text-slate-400">
                                                                            {ligne.description}
                                                                        </p>
                                                                    ) : null}
                                                                </div>
                                                            ) : (
                                                                <p className="text-xs italic text-slate-500">
                                                                    Choisissez un article du catalogue.
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div className="lg:col-span-1">
                                                            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 lg:hidden">
                                                                Qté
                                                            </p>
                                                            <input
                                                                type="number"
                                                                min="0.01"
                                                                step="0.01"
                                                                className={`${inputNumberDark} w-full`}
                                                                value={ligne.quantity}
                                                                onChange={(e) =>
                                                                    updateLine(
                                                                        index,
                                                                        'quantity',
                                                                        e.target.value,
                                                                    )
                                                                }
                                                                required
                                                            />
                                                        </div>

                                                        <div className="lg:col-span-2">
                                                            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 lg:hidden">
                                                                Prix unitaire
                                                            </p>
                                                            <div className="relative">
                                                                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500">
                                                                    {currencySymbol(currencyCode)}
                                                                </span>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    className={`${inputNumberDark} w-full pl-7`}
                                                                    value={ligne.unit_price_ht}
                                                                    onChange={(e) =>
                                                                        updateLine(
                                                                            index,
                                                                            'unit_price_ht',
                                                                            e.target.value,
                                                                        )
                                                                    }
                                                                    required
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="lg:col-span-2">
                                                            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 lg:hidden">
                                                                Remise
                                                            </p>
                                                            <div className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-1.5">
                                                                <select
                                                                    className={selectCompactDark}
                                                                    value={ligne.discount_type ?? ''}
                                                                    onChange={(e) =>
                                                                        updateLine(
                                                                            index,
                                                                            'discount_type',
                                                                            e.target.value,
                                                                        )
                                                                    }
                                                                    title="Type de remise"
                                                                >
                                                                    <option value="">—</option>
                                                                    <option value="percent">%</option>
                                                                    <option value="fixed">€</option>
                                                                </select>
                                                                {ligne.discount_type ? (
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        step="0.01"
                                                                        max={
                                                                            ligne.discount_type ===
                                                                            'percent'
                                                                                ? '100'
                                                                                : undefined
                                                                        }
                                                                        className={`${inputNumberDark} min-w-0`}
                                                                        placeholder={
                                                                            ligne.discount_type ===
                                                                            'percent'
                                                                                ? '0–100'
                                                                                : '0,00'
                                                                        }
                                                                        value={ligne.discount_value ?? ''}
                                                                        onChange={(e) =>
                                                                            updateLine(
                                                                                index,
                                                                                'discount_value',
                                                                                e.target.value,
                                                                            )
                                                                        }
                                                                    />
                                                                ) : (
                                                                    <span className="truncate text-xs text-slate-600">
                                                                        Aucune
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="lg:col-span-1">
                                                            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 lg:hidden">
                                                                Montant HT
                                                            </p>
                                                            <div
                                                                className={`${inputDark} flex h-[42px] items-center justify-end bg-[#0f1419] font-medium text-slate-200`}
                                                            >
                                                                {formatMoney(
                                                                    lineTotalHt(ligne),
                                                                    currencyCode,
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="lg:col-span-1">
                                                            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 lg:hidden">
                                                                TVA
                                                            </p>
                                                            <div
                                                                className={`${inputDark} flex h-[42px] items-center justify-center bg-[#0f1419] text-sm font-medium text-slate-300`}
                                                                title={
                                                                    selectedClient
                                                                        ? `Taux pays client (${selectedClient.country_code || 'export'})`
                                                                        : 'Sélectionnez un client'
                                                                }
                                                            >
                                                                {selectedClient
                                                                    ? formatVatRateLabel(effectiveVatRate)
                                                                    : '—'}
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-end lg:col-span-1 lg:justify-center">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => removeLine(index, e)}
                                                                disabled={isReadOnly}
                                                                className="rounded-lg p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                                                                aria-label="Supprimer la ligne"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={addLine}
                                            className="inline-flex items-center gap-2 text-sm font-semibold text-[#22c55e] transition hover:text-[#4ade80]"
                                        >
                                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#22c55e]/15">
                                                <Plus className="h-4 w-4" strokeWidth={2.5} />
                                            </span>
                                            Ajouter un article
                                        </button>

                                        {form.data.type_prestation === 'produit' ? (
                                            <div className="mt-4 grid gap-4 rounded-xl border border-slate-600/45 bg-[#151a24]/90 p-4 sm:grid-cols-2">
                                                <label className="block">
                                                    <span className={labelClass}>
                                                        Destination
                                                    </span>
                                                    <select
                                                        className={`${inputDark} mt-2`}
                                                        value={form.data.destination ?? ''}
                                                        onChange={(e) =>
                                                            form.setData(
                                                                'destination',
                                                                e.target.value,
                                                            )
                                                        }
                                                    >
                                                        <option value="">
                                                            Aucune (sans frais de port)
                                                        </option>
                                                        {deliveryDestinations.map((dest) => (
                                                            <option key={dest.id} value={dest.name}>
                                                                {dest.name} ({dest.fee_per_day} €/jour)
                                                            </option>
                                                        ))}
                                                    </select>
                                                </label>
                                                <label className="block">
                                                    <span className={labelClass}>
                                                        Nombre de jours
                                                    </span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        className={`${inputNumberDark} mt-2`}
                                                        value={form.data.jours_stockage}
                                                        onChange={(e) =>
                                                            form.setData(
                                                                'jours_stockage',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                    <p className="mt-1.5 text-xs text-slate-500">
                                                        {selectedFeePerDay} € / jour — frais
                                                        calculés :{' '}
                                                        <span className="font-medium text-slate-300">
                                                            {formatMoney(
                                                                totals.fraisPort,
                                                                currencyCode,
                                                            )}
                                                        </span>
                                                    </p>
                                                </label>
                                            </div>
                                        ) : null}

                                        <div className="border-t border-slate-700/60 pt-6">
                                            <div className="ml-auto max-w-xs space-y-2 text-sm">
                                                <div className="flex justify-between gap-4 text-slate-400">
                                                    <span>Sous-total HT (lignes)</span>
                                                    <span className="tabular-nums text-white">
                                                        {formatMoney(
                                                            totals.linesSubtotal,
                                                            currencyCode,
                                                        )}
                                                    </span>
                                                </div>
                                                {totals.fraisPort > 0 ? (
                                                    <div className="flex justify-between gap-4 text-slate-400">
                                                        <span>Frais de port</span>
                                                        <span className="tabular-nums text-white">
                                                            {formatMoney(
                                                                totals.fraisPort,
                                                                currencyCode,
                                                            )}
                                                        </span>
                                                    </div>
                                                ) : null}
                                                <div className="flex justify-between gap-4 text-slate-400">
                                                    <span>TVA</span>
                                                    <span className="tabular-nums text-white">
                                                        {formatMoney(
                                                            totals.tax,
                                                            currencyCode,
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between gap-4 border-t border-slate-700/60 pt-3 text-base font-semibold text-white">
                                                    <span>Total TTC</span>
                                                    <span className="tabular-nums text-blue-400">
                                                        {formatMoney(
                                                            totals.total,
                                                            currencyCode,
                                                        )}
                                                    </span>
                                                </div>
                                                {financialDiscountQuote.eligible &&
                                                financialDiscountQuote.discountAmount > 0 ? (
                                                    <>
                                                        <div className="flex justify-between gap-4 text-amber-200/90">
                                                            <span>Escompte financier</span>
                                                            <span className="tabular-nums">
                                                                -
                                                                {formatMoney(
                                                                    financialDiscountQuote.discountAmount,
                                                                    currencyCode,
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between gap-4 font-semibold text-emerald-300">
                                                            <span>Net si paiement anticipé</span>
                                                            <span className="tabular-nums">
                                                                {formatMoney(
                                                                    financialDiscountQuote.netCashDue,
                                                                    currencyCode,
                                                                )}
                                                            </span>
                                                        </div>
                                                    </>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <aside className="min-w-0 bg-[#0a101c] px-6 pb-8 pt-6 sm:px-8 lg:sticky lg:top-20 lg:col-span-5 lg:max-h-[calc(100vh-5rem)] lg:self-start lg:overflow-y-auto lg:px-6 lg:pb-8 lg:pt-6 xl:col-span-4 xl:px-8">
                            <div className="mb-5 flex items-center justify-between gap-3">
                                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                    APERÇU EN DIRECT
                                </p>
                                <div className="flex rounded-lg border border-slate-600/60 bg-finflow-sidebar p-0.5">
                                    <button
                                        type="button"
                                        onClick={() => setPreviewMode('desktop')}
                                        className={`rounded-md p-2 transition ${previewMode === 'desktop' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                        aria-label="Aperçu bureau"
                                    >
                                        <Monitor className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPreviewMode('mobile')}
                                        className={`rounded-md p-2 transition ${previewMode === 'mobile' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                        aria-label="Aperçu mobile"
                                    >
                                        <Smartphone className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <PreviewDocument
                                {...previewProps}
                                className={
                                    previewMode === 'mobile'
                                        ? 'mx-auto max-w-[340px]'
                                        : 'w-full'
                                }
                            />

                            {isEditing ? (
                                <div className="mt-6">
                                    <DocumentTimeline events={document?.events ?? []} />
                                </div>
                            ) : null}
                        </aside>
                    </div>
                    </fieldset>
                </form>
            </FacturationLayout>
        </>
    );
}
