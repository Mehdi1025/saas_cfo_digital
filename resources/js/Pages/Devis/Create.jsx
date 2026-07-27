import CompanyBrandLogo from '@/Components/FinFlow/CompanyBrandLogo';
import FacturationLayout from '@/Layouts/FacturationLayout';
import { companySenderLines } from '@/utils/company';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    ChevronDown,
    ChevronLeft,
    Download,
    Minus,
    Plus,
    Search,
    Send,
    Trash2,
} from 'lucide-react';
import { useEffect, useMemo } from 'react';

import { useClientVatRate } from '@/hooks/useClientVatRate';
import {
    feePerDayForDestination,
} from '@/utils/documentTotals';
import {
    emptyLineDiscountFields,
    lineTotalHt,
} from '@/utils/ligneAmounts';
import { formatVatRateLabel } from '@/utils/taxRates';
import { currencyOptions, currencySymbol, formatMoney } from '@/utils/currency';

const inputClass =
    'w-full rounded-lg border border-slate-600/45 bg-[#151a24] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30';

const hideNumberSpin =
    '[appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

const inputNumberClass =
    `${inputClass} ${hideNumberSpin} text-center tabular-nums`;

const inputPriceClass =
    `${inputClass} ${hideNumberSpin} pl-8 text-right tabular-nums`;

const selectCompactClass =
    'h-[42px] w-full shrink-0 rounded-lg border border-slate-600/45 bg-[#151a24] px-1.5 text-center text-xs text-white outline-none transition focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30';

const labelClass = 'mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400';

const sectionClass = 'rounded-xl border border-[#1e293b] bg-[#111827] p-5 sm:p-6';

const VALIDITY_OPTIONS = [
    { value: 15, label: '15 jours' },
    { value: 30, label: '30 jours' },
    { value: 45, label: '45 jours' },
    { value: 60, label: '60 jours' },
    { value: 90, label: '90 jours' },
];

const OPERATION_CATEGORY_OPTIONS = [
    { value: 'bien', label: 'Bien' },
    { value: 'service', label: 'Service' },
    { value: 'mixte', label: 'Mixte' },
];

const REFERENCE_PLACEHOLDER = 'Généré à la sauvegarde';

function displayReference(reference, isEditing) {
    if (reference) {
        return reference;
    }

    return isEditing ? '—' : REFERENCE_PLACEHOLDER;
}

function formatDisplayDate(iso) {
    if (!iso) {
        return '—';
    }

    return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date(`${iso}T12:00:00`));
}

function addDaysToIso(iso, days) {
    if (!iso) {
        return '';
    }

    const date = new Date(`${iso}T12:00:00`);
    date.setDate(date.getDate() + Number(days));

    return date.toISOString().slice(0, 10);
}

function computeTotals(
    lignes,
    globalDiscount = 0,
    typePrestation = 'service',
    joursStockage = 0,
    vatRate = 0,
    destinationName = null,
    destinations = [],
) {
    const rate = Number(vatRate) || 0;
    const linesHt = lignes.reduce((sum, ligne) => sum + lineTotalHt(ligne), 0);
    const linesTax = lignes.reduce(
        (sum, ligne) => sum + lineTotalHt(ligne) * (rate / 100),
        0,
    );
    const feePerDay = feePerDayForDestination(destinations, destinationName);
    const fraisPort =
        typePrestation === 'produit'
            ? Math.max(0, Number(joursStockage) || 0) * feePerDay
            : 0;
    const fraisTax = fraisPort * (rate / 100);

    const discountRate = Math.min(100, Math.max(0, Number(globalDiscount) || 0));
    const discountMultiplier = 1 - discountRate / 100;
    const netLinesHt = linesHt * discountMultiplier;
    const netLinesTax = linesTax * discountMultiplier;
    const subtotalHt = netLinesHt + fraisPort;
    const tax = netLinesTax + fraisTax;
    const totalTtc = subtotalHt + tax;

    return {
        linesSubtotal: linesHt,
        fraisPort,
        subtotalHt,
        tax,
        totalTtc,
        discountRate,
    };
}

function mapDocumentToForm(document, formDefaults) {
    const issueDate = document.issue_date ?? formDefaults.issue_date;
    const dueDate = document.due_date ?? formDefaults.due_date;
    const issue = new Date(`${issueDate}T12:00:00`);
    const due = new Date(`${dueDate}T12:00:00`);
    const diffDays = Math.max(1, Math.round((due - issue) / (1000 * 60 * 60 * 24)));

    return {
        tiers_id: document.client?.id ?? '',
        project_title: document.project_title ?? '',
        issue_date: issueDate,
        validity_days: VALIDITY_OPTIONS.some((o) => o.value === diffDays)
            ? diffDays
            : formDefaults.validity_days,
        due_date: dueDate,
        payment_terms: document.payment_terms ?? formDefaults.payment_terms,
        global_discount: document.global_discount ?? formDefaults.global_discount ?? 0,
        currency_code: document.currency_code ?? formDefaults.currency_code ?? 'EUR',
        type_prestation:
            document.type_prestation ?? formDefaults.type_prestation ?? 'service',
        operation_category:
            document.operation_category ?? formDefaults.operation_category ?? 'service',
        delivery_address: document.delivery_address ?? formDefaults.delivery_address ?? '',
        vat_on_debits: Boolean(document.vat_on_debits ?? formDefaults.vat_on_debits ?? false),
        destination: document.destination ?? formDefaults.destination ?? '',
        jours_stockage: document.jours_stockage ?? formDefaults.jours_stockage ?? 0,
        lignes: document.lignes?.length
            ? document.lignes
            : formDefaults.lignes,
    };
}

function DevisCreateTopBar({
    processing,
    onSaveDraft,
    saveDisabled = false,
    readOnly = false,
}) {
    return (
        <header className="sticky top-0 z-20 flex h-20 shrink-0 items-center justify-between gap-4 border-b border-finflow-border/50 bg-finflow-sidebar px-6 shadow-sm lg:px-10">
            <Link
                href={route('devis.index')}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-finflow-muted transition hover:text-white"
            >
                <ChevronLeft className="h-4 w-4 shrink-0" strokeWidth={2} />
                Devis
            </Link>
            {readOnly ? null : (
                <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                    <button
                        type="button"
                        onClick={onSaveDraft}
                        disabled={processing || saveDisabled}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-500/70 bg-transparent px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                    >
                        Enregistrer brouillon
                    </button>
                    <button
                        type="submit"
                        form="devis-create-form"
                        disabled={processing || saveDisabled}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#3b82f6] pl-3 pr-2 py-2 text-xs font-semibold text-white shadow-[0_0_20px_rgba(59,130,246,0.25)] transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50 sm:pl-4 sm:text-sm"
                    >
                        <Send className="h-4 w-4 shrink-0" strokeWidth={2} />
                        {processing ? 'Enregistrement…' : 'Envoyer'}
                        <ChevronDown className="h-4 w-4 shrink-0 opacity-90" />
                    </button>
                </div>
            )}
        </header>
    );
}

function DevisPreview({
    company,
    reference,
    isPersisted = false,
    issueDate,
    dueDate,
    projectTitle,
    client,
    lignes,
    paymentTerms,
    subtotalHt,
    tax,
    totalTtc,
    vatRateLabel = '',
    currencyCode = 'EUR',
}) {
    const senderLines = companySenderLines(company);
    const filledLines = lignes.filter(
        (ligne) => ligne.article_id && (ligne.label?.trim() || lineTotalHt(ligne) > 0),
    );

    return (
        <article className="rounded-xl bg-[#1a2234] p-6 shadow-2xl ring-1 ring-white/5 sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <CompanyBrandLogo company={company} />
                    <div>
                        <p className="text-lg font-bold uppercase tracking-tight text-white">
                            Devis
                        </p>
                        <p className="text-sm text-slate-400">N° {displayReference(reference, isPersisted)}</p>
                    </div>
                </div>
                <div className="flex gap-1">
                    <button
                        type="button"
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-slate-300"
                        aria-label="Rechercher"
                    >
                        <Search className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-slate-300"
                        aria-label="Télécharger"
                    >
                        <Download className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-6 text-sm">
                <div>
                    <p className="font-semibold text-white">{company?.name || '—'}</p>
                    {senderLines.map((line) => (
                        <p key={line} className="mt-1 text-slate-400">
                            {line}
                        </p>
                    ))}
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        Facturé à
                    </p>
                    <p className="mt-1 font-semibold text-white">
                        {client?.name?.trim() || '—'}
                    </p>
                    {client?.address?.trim() ? (
                        <p className="mt-1 whitespace-pre-line text-slate-400">
                            {client.address}
                        </p>
                    ) : null}
                </div>
            </div>

            <div className="mb-6 grid grid-cols-3 gap-4 rounded-lg border border-slate-700/50 bg-[#151d2c] p-4 text-sm">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        Date
                    </p>
                    <p className="mt-1 font-medium text-white">
                        {formatDisplayDate(issueDate)}
                    </p>
                </div>
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        Validité
                    </p>
                    <p className="mt-1 font-medium text-white">
                        {formatDisplayDate(dueDate)}
                    </p>
                </div>
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        Projet
                    </p>
                    <p className="mt-1 font-medium text-white">
                        {projectTitle?.trim() || '—'}
                    </p>
                </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-700/50">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-700/80 bg-[#151d2c] text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                            <th className="px-4 py-3">Description</th>
                            <th className="px-4 py-3 text-right">Qté</th>
                            <th className="px-4 py-3 text-right">Prix</th>
                            <th className="px-4 py-3 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filledLines.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="px-4 py-8 text-center text-slate-500"
                                >
                                    Aucun article
                                </td>
                            </tr>
                        ) : (
                            filledLines.map((ligne, index) => (
                                <tr
                                    key={index}
                                    className="border-b border-slate-800/80 last:border-0"
                                >
                                    <td className="px-4 py-3 align-top">
                                        <p className="font-medium text-white">
                                            {ligne.label?.trim() || '—'}
                                        </p>
                                        {ligne.description?.trim() ? (
                                            <p className="mt-0.5 text-xs text-slate-500">
                                                {ligne.description}
                                            </p>
                                        ) : null}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                                        {ligne.quantity || '—'}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                                        {formatMoney(ligne.unit_price_ht, currencyCode)}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums font-medium text-white">
                                        {formatMoney(lineTotalHt(ligne), currencyCode)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 space-y-2 text-sm">
                <div className="flex justify-between text-slate-400">
                    <span>Sous-total HT</span>
                    <span className="tabular-nums text-white">
                        {formatMoney(subtotalHt, currencyCode)}
                    </span>
                </div>
                <div className="flex justify-between text-slate-400">
                    <span>
                        TVA{vatRateLabel ? ` (${vatRateLabel})` : ''}
                    </span>
                    <span className="tabular-nums text-white">{formatMoney(tax, currencyCode)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-700/60 pt-3">
                    <span className="font-semibold text-white">Total TTC</span>
                    <span className="text-2xl font-bold tabular-nums text-blue-400">
                        {formatMoney(totalTtc, currencyCode)}
                    </span>
                </div>
            </div>

            {paymentTerms?.trim() ? (
                <p className="mt-6 border-t border-slate-700/60 pt-4 text-xs leading-relaxed text-slate-500">
                    {paymentTerms}
                </p>
            ) : null}
        </article>
    );
}

export default function Create({
    clients,
    catalogueArticles,
    formDefaults,
    document = null,
    vatRates: vatRatesProp = null,
}) {
    const { tax_rates: sharedTaxRates, currencies, company, delivery_destinations: deliveryDestinations = [] } = usePage().props;
    const taxRates = vatRatesProp ?? sharedTaxRates ?? {};

    const initialData = document
        ? mapDocumentToForm(document, formDefaults)
        : formDefaults;

    const form = useForm(initialData);

    const isEditing = Boolean(document?.id);
    const isReadOnly = isEditing && document?.can_be_edited === false;

    const { defaultVatRate, handleTierChange } = useClientVatRate({
        form,
        clients,
        taxRates,
        readOnly: isEditing && document?.can_be_edited === false,
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

    const totals = useMemo(
        () =>
            computeTotals(
                form.data.lignes,
                form.data.global_discount,
                form.data.type_prestation,
                form.data.jours_stockage,
                effectiveVatRate,
                form.data.destination,
                deliveryDestinations,
            ),
        [
            form.data.lignes,
            form.data.global_discount,
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

    function updateValidityDays(days) {
        form.setData({
            ...form.data,
            validity_days: days,
            due_date: addDaysToIso(form.data.issue_date, days),
        });
    }

    function updateIssueDate(iso) {
        form.setData({
            ...form.data,
            issue_date: iso,
            due_date: addDaysToIso(iso, form.data.validity_days),
        });
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

        const remaining = form.data.lignes.filter((_, i) => i !== index);

        form.setData({
            ...form.data,
            lignes: remaining.length > 0 ? remaining : [createEmptyLine()],
        });
    }

    function adjustQuantity(index, delta) {
        const current = Number(form.data.lignes[index].quantity) || 0;
        const next = Math.max(0.01, current + delta);
        updateLine(index, 'quantity', next);
    }

    function submit(e) {
        e.preventDefault();

        if (document?.id) {
            form.put(route('devis.update', document.id));
            return;
        }

        form.post(route('devis.store'));
    }

    function saveDraft() {
        if (document?.id) {
            form.put(route('devis.update', document.id), { preserveScroll: true });
            return;
        }

        form.post(route('devis.store'), { preserveScroll: true });
    }

    const currencyCode = form.data.currency_code || 'EUR';
    const canChangeCurrency = !document?.id || document?.status === 'draft';
    const { subtotalHt, tax, totalTtc, fraisPort } = totals;
    const availableCurrencies = currencyOptions(currencies);

    return (
        <>
            <Head title={`${isEditing ? 'Modifier' : 'Nouveau'} devis — Copifi`} />
            <FacturationLayout
                title=""
                showPageHeading={false}
                topBar={
                    <DevisCreateTopBar
                        processing={form.processing}
                        onSaveDraft={saveDraft}
                        saveDisabled={!linesAreValid || isReadOnly}
                        readOnly={isReadOnly}
                    />
                }
                mainClassName="!px-0 !py-0"
            >
                <form id="devis-create-form" onSubmit={submit}>
                    {isReadOnly ? (
                        <p className="border-b border-amber-500/30 bg-amber-500/10 px-6 py-3 text-sm text-amber-200 lg:px-10">
                            Ce devis n&apos;est plus en brouillon — consultation seule.
                        </p>
                    ) : null}
                    <fieldset
                        disabled={isReadOnly}
                        className={`min-w-0 border-0 p-0 ${isReadOnly ? '[&_*]:cursor-default' : ''}`}
                    >
                    <div className="grid grid-cols-1 items-start lg:grid-cols-12 lg:gap-0">
                        {/* Formulaire — gauche */}
                        <div className="min-w-0 lg:col-span-7 lg:border-r lg:border-finflow-border/40 xl:col-span-8">
                            <div className="space-y-6 p-6 lg:p-8">
                                {/* Détails du devis */}
                                <section className={sectionClass}>
                                    <div className="mb-5 flex items-start justify-between gap-4">
                                        <h2 className="text-base font-semibold text-white">
                                            Détails du Devis
                                        </h2>
                                        <span className="shrink-0 text-xs font-medium italic text-slate-500">
                                            {displayReference(document?.reference, isEditing)}
                                        </span>
                                    </div>

                                    <div className="mb-5 rounded-xl border border-slate-700/60 bg-[#151d2c] p-4">
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

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label htmlFor="tiers_id" className={labelClass}>
                                                Client
                                            </label>
                                            <select
                                                id="tiers_id"
                                                value={form.data.tiers_id}
                                                onChange={(e) =>
                                                    onTierChange(e.target.value)
                                                }
                                                className={inputClass}
                                                required
                                            >
                                                <option value="">Sélectionner un client</option>
                                                {clients.map((client) => (
                                                    <option key={client.id} value={client.id}>
                                                        {client.name}
                                                        {client.country_code
                                                            ? ` (${client.country_code})`
                                                            : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            {form.errors.tiers_id ? (
                                                <p className="mt-1 text-xs text-red-400">
                                                    {form.errors.tiers_id}
                                                </p>
                                            ) : null}
                                            {selectedClient ? (
                                                <p className="mt-2 text-xs text-slate-500">
                                                    TVA applicable :{' '}
                                                    <span className="font-medium text-slate-300">
                                                        {formatVatRateLabel(defaultVatRate)}
                                                    </span>
                                                </p>
                                            ) : null}
                                        </div>

                                        <div>
                                            <label htmlFor="project_title" className={labelClass}>
                                                Titre du projet
                                            </label>
                                            <input
                                                id="project_title"
                                                type="text"
                                                value={form.data.project_title}
                                                onChange={(e) =>
                                                    form.setData(
                                                        'project_title',
                                                        e.target.value,
                                                    )
                                                }
                                                className={inputClass}
                                                placeholder="Refonte Plateforme SaaS"
                                                required
                                            />
                                            {form.errors.project_title ? (
                                                <p className="mt-1 text-xs text-red-400">
                                                    {form.errors.project_title}
                                                </p>
                                            ) : null}
                                        </div>

                                        <div>
                                            <label htmlFor="issue_date" className={labelClass}>
                                                Date d&apos;émission
                                            </label>
                                            <div className="relative">
                                                <input
                                                    id="issue_date"
                                                    type="date"
                                                    value={form.data.issue_date}
                                                    onChange={(e) =>
                                                        updateIssueDate(e.target.value)
                                                    }
                                                    className={`${inputClass} pr-10`}
                                                    required
                                                />
                                                <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="validity_days" className={labelClass}>
                                                Validité
                                            </label>
                                            <select
                                                id="validity_days"
                                                value={form.data.validity_days}
                                                onChange={(e) =>
                                                    updateValidityDays(Number(e.target.value))
                                                }
                                                className={inputClass}
                                            >
                                                {VALIDITY_OPTIONS.map((option) => (
                                                    <option
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label htmlFor="currency_code" className={labelClass}>
                                                Devise
                                            </label>
                                            <select
                                                id="currency_code"
                                                value={form.data.currency_code}
                                                onChange={(e) =>
                                                    form.setData('currency_code', e.target.value)
                                                }
                                                className={inputClass}
                                                disabled={!canChangeCurrency}
                                                required
                                            >
                                                {availableCurrencies.map(({ code }) => (
                                                    <option key={code} value={code}>
                                                        {code}
                                                    </option>
                                                ))}
                                            </select>
                                            {form.errors.currency_code ? (
                                                <p className="mt-1 text-xs text-red-400">
                                                    {form.errors.currency_code}
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>

                                    <input
                                        type="hidden"
                                        name="due_date"
                                        value={form.data.due_date}
                                    />
                                </section>

                                <section className={sectionClass}>
                                    <h2 className="mb-4 text-base font-semibold text-white">
                                        Informations réglementaires
                                    </h2>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <label className="block sm:col-span-2 sm:max-w-md">
                                            <span className={labelClass}>
                                                Catégorie d&apos;opération
                                            </span>
                                            <select
                                                className={`${inputClass} mt-2`}
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
                                                {OPERATION_CATEGORY_OPTIONS.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
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
                                                    className={`${inputClass} mt-2 min-h-[88px] resize-y`}
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
                                                <span className={`${labelClass} normal-case tracking-normal`}>
                                                    TVA sur les débits
                                                </span>
                                                <span className="mt-1 block text-xs font-normal normal-case tracking-normal text-slate-500">
                                                    Autoliquidation par le client — la TVA n&apos;est
                                                    pas facturée sur ce document.
                                                </span>
                                                {form.errors.vat_on_debits ? (
                                                    <p className="mt-1 text-xs text-red-400">
                                                        {form.errors.vat_on_debits}
                                                    </p>
                                                ) : null}
                                            </span>
                                        </label>
                                    </div>
                                </section>

                                {/* Lignes d'articles */}
                                <section className={sectionClass}>
                                    <div className="mb-4 flex items-center justify-between gap-3">
                                        <h2 className="text-base font-semibold text-white">
                                            Lignes d&apos;articles
                                        </h2>
                                        <button
                                            type="button"
                                            onClick={addLine}
                                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-400 transition hover:text-blue-300"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Ajouter un article
                                        </button>
                                    </div>

                                    {form.data.type_prestation === 'produit' ? (
                                        <div className="mb-4 grid gap-4 rounded-xl border border-slate-700/60 bg-[#151d2c] p-4 sm:grid-cols-2">
                                            <label className="block">
                                                <span className={labelClass}>Destination</span>
                                                <select
                                                    className={`${inputClass} mt-2`}
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
                                                    className={`${inputNumberClass} mt-2`}
                                                    value={form.data.jours_stockage}
                                                    onChange={(e) =>
                                                        form.setData(
                                                            'jours_stockage',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                                <p className="mt-1.5 text-xs text-slate-500">
                                                    {selectedFeePerDay} € / jour — frais :{' '}
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

                                    <div className="mb-3 hidden gap-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:grid sm:grid-cols-12">
                                        <span className="sm:col-span-5">Article</span>
                                        <span className="sm:col-span-2 text-center">Qté</span>
                                        <span className="sm:col-span-2 text-center">
                                            Prix unitaire
                                        </span>
                                        <span className="sm:col-span-2 text-right">Total</span>
                                        <span className="sm:col-span-1" />
                                    </div>

                                    <div className="space-y-3">
                                        {form.data.lignes.map((ligne, index) => (
                                            <div
                                                key={index}
                                                className="rounded-xl border border-slate-700/60 bg-[#151d2c] p-4"
                                            >
                                                <div className="grid gap-3 sm:grid-cols-12 sm:items-start">
                                                    <div className="sm:col-span-5">
                                                        <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:hidden">
                                                            Article
                                                        </label>
                                                        <select
                                                            value={ligne.article_id}
                                                            onChange={(e) =>
                                                                selectArticle(
                                                                    index,
                                                                    e.target.value,
                                                                )
                                                            }
                                                            className={`${inputClass} mb-2 text-xs`}
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
                                                            <div className="rounded-lg border border-slate-700/40 bg-[#0f1419]/60 px-3 py-2.5">
                                                                <p className="text-sm font-medium text-white">
                                                                    {ligne.label}
                                                                </p>
                                                                {ligne.description ? (
                                                                    <p className="mt-1 text-xs leading-relaxed text-slate-400">
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

                                                    <div className="sm:col-span-2">
                                                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:hidden">
                                                            Qté
                                                        </p>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    adjustQuantity(index, -1)
                                                                }
                                                                className="rounded-lg border border-slate-600/50 p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
                                                                aria-label="Diminuer"
                                                            >
                                                                <Minus className="h-3.5 w-3.5" />
                                                            </button>
                                                            <input
                                                                type="number"
                                                                min="0.01"
                                                                step="0.01"
                                                                value={ligne.quantity}
                                                                onChange={(e) =>
                                                                    updateLine(
                                                                        index,
                                                                        'quantity',
                                                                        e.target.value,
                                                                    )
                                                                }
                                                                className={inputNumberClass}
                                                                required
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    adjustQuantity(index, 1)
                                                                }
                                                                className="rounded-lg border border-slate-600/50 p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
                                                                aria-label="Augmenter"
                                                            >
                                                                <Plus className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="sm:col-span-2">
                                                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:hidden">
                                                            Prix unitaire
                                                        </p>
                                                        <div className="relative">
                                                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                                                                {currencySymbol(currencyCode)}
                                                            </span>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={ligne.unit_price_ht}
                                                                onChange={(e) =>
                                                                    updateLine(
                                                                        index,
                                                                        'unit_price_ht',
                                                                        e.target.value,
                                                                    )
                                                                }
                                                                className={inputPriceClass}
                                                                required
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="sm:col-span-12 sm:grid sm:grid-cols-12 sm:gap-3 sm:pt-1">
                                                        <div className="mt-2 sm:col-span-4 sm:mt-0">
                                                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                                                Remise
                                                            </p>
                                                            <div className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-1.5">
                                                                <select
                                                                    className={selectCompactClass}
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
                                                                        className={`${inputNumberClass} min-w-0`}
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
                                                        <div className="flex items-center justify-between sm:col-span-4 sm:flex-col sm:items-end">
                                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                                                Total HT
                                                            </p>
                                                            <p className="text-base font-semibold tabular-nums text-white">
                                                                {formatMoney(
                                                                    lineTotalHt(ligne),
                                                                    currencyCode,
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-end sm:col-span-1 sm:pt-1">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => removeLine(index, e)}
                                                            className="rounded-lg p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                                                            aria-label="Supprimer la ligne"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Pied de page — conditions + totaux */}
                                <section className={sectionClass}>
                                    <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
                                        <div>
                                            <h2 className="mb-3 text-base font-semibold text-white">
                                                Conditions de paiement
                                            </h2>
                                            <textarea
                                                id="payment_terms"
                                                value={form.data.payment_terms}
                                                onChange={(e) =>
                                                    form.setData(
                                                        'payment_terms',
                                                        e.target.value,
                                                    )
                                                }
                                                className={`${inputClass} min-h-[140px] resize-y leading-relaxed`}
                                                rows={5}
                                                placeholder="Acompte de 30% à la signature du devis. Solde à 30 jours fin de mois après livraison."
                                            />
                                        </div>

                                        <div className="flex flex-col justify-end">
                                            <div className="space-y-3 text-sm">
                                                <div className="flex items-center justify-between gap-4 text-slate-400">
                                                    <span>Sous-total HT (lignes)</span>
                                                    <span className="tabular-nums text-white">
                                                        {formatMoney(
                                                            totals.linesSubtotal,
                                                            currencyCode,
                                                        )}
                                                    </span>
                                                </div>
                                                {fraisPort > 0 ? (
                                                    <div className="flex items-center justify-between gap-4 text-slate-400">
                                                        <span>Frais de port</span>
                                                        <span className="tabular-nums text-white">
                                                            {formatMoney(
                                                                fraisPort,
                                                                currencyCode,
                                                            )}
                                                        </span>
                                                    </div>
                                                ) : null}
                                                <div className="flex items-center justify-between gap-4 text-slate-400">
                                                    <span>
                                                        TVA
                                                        {selectedClient
                                                            ? ` (${formatVatRateLabel(defaultVatRate)})`
                                                            : ''}
                                                    </span>
                                                    <span className="tabular-nums text-white">
                                                        {formatMoney(tax, currencyCode)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between gap-4 text-slate-400">
                                                    <span>Remise globale</span>
                                                    <div className="relative w-24">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            step="0.01"
                                                            value={form.data.global_discount}
                                                            onChange={(e) =>
                                                                form.setData(
                                                                    'global_discount',
                                                                    e.target.value,
                                                                )
                                                            }
                                                            className={`${inputClass} ${hideNumberSpin} pr-8 text-right tabular-nums`}
                                                        />
                                                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                                                            %
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between gap-4 border-t border-slate-700/60 pt-4">
                                                    <span className="text-base font-semibold text-white">
                                                        Total TTC
                                                    </span>
                                                    <span className="text-2xl font-bold tabular-nums text-blue-400">
                                                        {formatMoney(totalTtc, currencyCode)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>

                        {/* Aperçu — droite */}
                        <aside className="min-w-0 bg-[#0a101c] px-6 pb-8 pt-6 sm:px-8 lg:sticky lg:top-20 lg:col-span-5 lg:max-h-[calc(100vh-5rem)] lg:self-start lg:overflow-y-auto lg:px-6 lg:pb-8 lg:pt-6 xl:col-span-4 xl:px-8">
                            <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                Aperçu en direct
                            </p>
                            <DevisPreview
                                company={company}
                                reference={document?.reference}
                                isPersisted={isEditing}
                                issueDate={form.data.issue_date}
                                dueDate={form.data.due_date}
                                projectTitle={form.data.project_title}
                                client={selectedClient}
                                lignes={form.data.lignes}
                                paymentTerms={form.data.payment_terms}
                                subtotalHt={subtotalHt}
                                tax={tax}
                                totalTtc={totalTtc}
                                vatRateLabel={
                                    selectedClient
                                        ? formatVatRateLabel(defaultVatRate)
                                        : ''
                                }
                                currencyCode={currencyCode}
                            />
                        </aside>
                    </div>
                    </fieldset>
                </form>
            </FacturationLayout>
        </>
    );
}
