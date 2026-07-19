import DonutChartCard from '@/Components/FinFlow/DonutChartCard';
import FacturationLayout from '@/Layouts/FacturationLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    Banknote,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    CreditCard,
    Download,
    Filter,
    Landmark,
    MoreVertical,
    Percent,
    Plus,
    RefreshCw,
    Search,
    Wallet,
    X,
    XCircle,
} from 'lucide-react';
import { useId, useState } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

const cardClass = 'relative overflow-hidden rounded-xl border border-[#1e293b] bg-[#111827] p-5 shadow-sm';
const chartCardClass =
    'relative flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#1e293b] bg-[#111827] p-6 shadow-sm';

function formatMoney(amount, decimals = 2) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(amount || 0);
}

function statusBadge(status) {
    if (status === 'success') {
        return {
            className: 'bg-emerald-500/15 text-emerald-400',
            icon: CheckCircle2,
            label: 'Réussi',
        };
    }
    if (status === 'pending') {
        return {
            className: 'bg-amber-500/15 text-amber-400',
            icon: Clock,
            label: 'En attente',
        };
    }
    return {
        className: 'bg-red-500/15 text-red-400',
        icon: XCircle,
        label: 'Échoué',
    };
}

function MethodIcon({ method, className = 'h-4 w-4' }) {
    if (method === 'card') {
        return <CreditCard className={className} strokeWidth={2} />;
    }
    if (method === 'sepa') {
        return <Landmark className={className} strokeWidth={2} />;
    }
    if (method === 'direct_debit') {
        return <RefreshCw className={className} strokeWidth={2} />;
    }
    return <Wallet className={className} strokeWidth={2} />;
}

function CashInSparkline() {
    const gradId = useId().replace(/:/g, '');
    const data = [
        { x: 0, v: 40 },
        { x: 1, v: 55 },
        { x: 2, v: 48 },
        { x: 3, v: 62 },
        { x: 4, v: 58 },
        { x: 5, v: 70 },
    ];

    return (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14" aria-hidden>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id={`cash-${gradId}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Area
                        type="monotone"
                        dataKey="v"
                        stroke="#10b981"
                        strokeWidth={1.5}
                        fill={`url(#cash-${gradId})`}
                        dot={false}
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

function CollectionsChart({ data }) {
    return (
        <div className={`${chartCardClass} lg:col-span-2`}>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-300">
                    Évolution des encaissements
                </h2>
                <button
                    type="button"
                    className="rounded-lg border border-[#1e293b] bg-[#1e293b] px-3 py-1.5 text-xs font-medium text-[#94a3b8]"
                >
                    6 Derniers Mois
                </button>
            </div>
            <div className="min-h-[260px] w-full flex-1">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 8, left: 4, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                            tickFormatter={(v) => `${v}k`}
                            width={42}
                        />
                        <Tooltip
                            content={({ active, payload, label }) =>
                                active && payload?.length ? (
                                    <div className="rounded-lg border border-slate-700 bg-[#1e293b] px-3 py-2 text-xs shadow-lg">
                                        <p className="text-slate-200">{label}</p>
                                        <p className="text-blue-400">{payload[0].value}k €</p>
                                    </div>
                                ) : null
                            }
                        />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={{ r: 4, fill: '#111827', stroke: '#3b82f6', strokeWidth: 2 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function PaymentModal({ open, onClose, clients, invoices, kind = 'payment' }) {
    const isRefund = kind === 'refund';
    const form = useForm({
        tiers_id: clients[0]?.id ?? '',
        document_id: '',
        kind,
        amount: '',
        payment_method: 'manual',
        payment_method_detail: '',
        status: 'success',
        paid_at: new Date().toISOString().slice(0, 16),
        notes: '',
    });

    const filteredInvoices = invoices.filter(
        (inv) => !form.data.tiers_id || inv.tiers_id === Number(form.data.tiers_id),
    );

    function submit(e) {
        e.preventDefault();
        form.post(route('paiements.store'), {
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    }

    if (!open) {
        return null;
    }

    const inputClass =
        'w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2 text-sm text-white outline-none focus:border-blue-500';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-700 bg-[#111827] shadow-2xl">
                <div className="sticky top-0 flex items-center justify-between border-b border-slate-800 bg-[#111827] px-6 py-4">
                    <h2 className="text-lg font-semibold text-white">
                        {isRefund ? 'Effectuer un remboursement' : 'Enregistrer un paiement'}
                    </h2>
                    <button type="button" onClick={onClose} className="rounded-md p-1 text-slate-500 hover:text-slate-200">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <form onSubmit={submit} className="space-y-4 px-6 py-5">
                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Client
                        </label>
                        <select
                            value={form.data.tiers_id}
                            onChange={(e) => form.setData('tiers_id', e.target.value)}
                            className={inputClass}
                            required
                        >
                            <option value="">Sélectionner un client</option>
                            {clients.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Facture (optionnel)
                        </label>
                        <select
                            value={form.data.document_id}
                            onChange={(e) => form.setData('document_id', e.target.value)}
                            className={inputClass}
                        >
                            <option value="">Aucune facture liée</option>
                            {filteredInvoices.map((inv) => (
                                <option key={inv.id} value={inv.id}>
                                    {inv.reference} — {inv.client_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Montant (€)
                            </label>
                            <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={form.data.amount}
                                onChange={(e) => form.setData('amount', e.target.value)}
                                className={inputClass}
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Date
                            </label>
                            <input
                                type="datetime-local"
                                value={form.data.paid_at}
                                onChange={(e) => form.setData('paid_at', e.target.value)}
                                className={inputClass}
                                required
                            />
                        </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Méthode
                            </label>
                            <select
                                value={form.data.payment_method}
                                onChange={(e) => form.setData('payment_method', e.target.value)}
                                className={inputClass}
                            >
                                <option value="sepa">Virement SEPA</option>
                                <option value="card">Carte bancaire</option>
                                <option value="direct_debit">Prélèvement</option>
                                <option value="manual">Manuel</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Statut
                            </label>
                            <select
                                value={form.data.status}
                                onChange={(e) => form.setData('status', e.target.value)}
                                className={inputClass}
                            >
                                <option value="success">Réussi</option>
                                <option value="pending">En attente</option>
                                <option value="failed">Échoué</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Détail méthode
                        </label>
                        <input
                            value={form.data.payment_method_detail}
                            onChange={(e) => form.setData('payment_method_detail', e.target.value)}
                            placeholder="Carte ****4242"
                            className={inputClass}
                        />
                    </div>
                    <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
                        >
                            {isRefund ? 'Enregistrer le remboursement' : 'Enregistrer le paiement'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function RowActions({ payment, onRetry, onMarkSuccess }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="flex items-center justify-end gap-2">
            {payment.status === 'failed' ? (
                <button
                    type="button"
                    onClick={() => onRetry(payment.id)}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300"
                >
                    Relancer
                </button>
            ) : null}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-slate-200"
                >
                    <MoreVertical className="h-4 w-4" />
                </button>
                {open ? (
                    <>
                        <button type="button" className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                        <div className="absolute right-0 z-20 mt-1 w-40 rounded-lg border border-slate-700 bg-[#0f172a] py-1 shadow-xl">
                            {payment.status !== 'success' ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setOpen(false);
                                        onMarkSuccess(payment.id);
                                    }}
                                    className="block w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/5"
                                >
                                    Marquer réussi
                                </button>
                            ) : null}
                            {payment.status === 'failed' ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setOpen(false);
                                        onRetry(payment.id);
                                    }}
                                    className="block w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/5"
                                >
                                    Relancer
                                </button>
                            ) : null}
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
}

export default function PaymentsIndex({
    payments,
    stats,
    charts,
    alerts,
    clients,
    invoices,
    filters,
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [modal, setModal] = useState(null);

    function runSearch(e) {
        e.preventDefault();
        router.get(route('paiements.index'), { search }, { preserveState: true, preserveScroll: true, replace: true });
    }

    function retryPayment(id) {
        router.patch(route('paiements.retry', id), {}, { preserveScroll: true });
    }

    function markSuccess(id) {
        router.patch(route('paiements.mark-success', id), {}, { preserveScroll: true });
    }

    const methodChartData = charts.methods.map((m) => ({
        name: m.name,
        value: m.value,
        color: m.color,
    }));

    return (
        <>
            <Head title="Suivi des paiements — Copifi" />
            <FacturationLayout showPageHeading={false} mainClassName="!px-6 !py-6 lg:!px-10">
                <nav className="mb-4 text-sm text-slate-500">
                    <span>Gestion</span>
                    <span className="mx-2">›</span>
                    <span className="text-slate-300">Suivi des paiements</span>
                </nav>

                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                            Suivi des paiements
                        </h1>
                        <p className="mt-1 text-sm text-slate-400 sm:text-base">
                            Analysez vos encaissements, DSO et gérez les transactions.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <a
                            href={route('paiements.export')}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-100 hover:bg-white/5"
                        >
                            <Download className="h-4 w-4" />
                            Export Comptable
                        </a>
                        <button
                            type="button"
                            onClick={() => setModal('payment')}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#3b82f6] px-4 py-2.5 text-sm font-medium text-white shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:bg-blue-600"
                        >
                            <Plus className="h-4 w-4" />
                            Enregistrer Paiement
                        </button>
                    </div>
                </div>

                <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <article className={`${cardClass} min-h-[120px]`}>
                        <CashInSparkline />
                        <div className="relative z-10">
                            <p className="text-sm text-slate-400">Cash-in (30j)</p>
                            <p className="mt-2 text-3xl font-bold text-white">{formatMoney(stats.cash_in_30d, 0)}</p>
                            <span className="mt-1 inline-flex text-xs font-semibold text-emerald-400">
                                +{stats.cash_in_growth}%
                            </span>
                        </div>
                    </article>
                    <article className={cardClass}>
                        <p className="text-sm text-slate-400">DSO Moyen</p>
                        <p className="mt-2 text-3xl font-bold text-white">{stats.avg_dso} Jours</p>
                        <p className="mt-1 text-xs text-amber-400">{stats.dso_delta}j</p>
                        <p className="mt-1 text-xs text-slate-500">Objectif: &lt; 30 jours</p>
                    </article>
                    <article className={cardClass}>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-slate-400">Impayés (&gt;30j)</p>
                                <p className="mt-2 text-3xl font-bold text-red-400">
                                    {formatMoney(stats.unpaid_over_30d, 0)}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    {stats.unpaid_invoices_count} factures concernées
                                </p>
                            </div>
                            <AlertTriangle className="h-5 w-5 text-red-400" />
                        </div>
                    </article>
                    <article className={cardClass}>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-slate-400">Frais de transaction</p>
                                <p className="mt-2 text-3xl font-bold text-white">
                                    {formatMoney(stats.transaction_fees, 0)}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">~{stats.fee_rate}% du volume total</p>
                            </div>
                            <Percent className="h-5 w-5 text-slate-400" />
                        </div>
                    </article>
                </section>

                <section className="mb-6 grid gap-6 lg:grid-cols-3 lg:items-stretch">
                    <CollectionsChart data={charts.collections} />
                    <DonutChartCard
                        className="w-full"
                        title="Méthodes de paiement"
                        data={methodChartData}
                        centerValue={`${methodChartData.reduce((s, m) => s + m.value, 0)}%`}
                        centerSubtext="Répartition"
                    />
                </section>

                <section className="mb-6 overflow-hidden rounded-xl border border-[#1e293b] bg-[#111827]">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-4">
                        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-300">
                            Dernières transactions
                        </h2>
                        <form onSubmit={runSearch} className="relative min-w-[220px] max-w-sm flex-1 sm:flex-none">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Rechercher (Client, Facture)..."
                                className="w-full rounded-lg border border-slate-700 bg-[#0f172a] py-2 pl-9 pr-10 text-sm text-white outline-none focus:border-blue-500"
                            />
                            <Filter className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                        </form>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-800 bg-[#151d2c] text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Client / Facture</th>
                                    <th className="px-4 py-3">Méthode</th>
                                    <th className="px-4 py-3">Montant</th>
                                    <th className="px-4 py-3">Statut</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.data.map((payment) => {
                                    const badge = statusBadge(payment.status);
                                    const BadgeIcon = badge.icon;

                                    return (
                                        <tr key={payment.id} className="border-t border-slate-800/80 hover:bg-white/[0.02]">
                                            <td className="px-4 py-3.5 text-slate-400">{payment.paid_at_date}</td>
                                            <td className="px-4 py-3.5">
                                                <p className="font-semibold text-slate-100">{payment.client_name}</p>
                                                <p className="text-xs text-slate-500">
                                                    {payment.invoice_reference ?? '—'}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-2 text-slate-300">
                                                    <MethodIcon method={payment.payment_method} />
                                                    <span>
                                                        {payment.payment_method_detail ||
                                                            payment.payment_method_label}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 font-semibold tabular-nums text-slate-100">
                                                {formatMoney(payment.amount)}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
                                                >
                                                    <BadgeIcon className="h-3.5 w-3.5" />
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <RowActions
                                                    payment={payment}
                                                    onRetry={retryPayment}
                                                    onMarkSuccess={markSuccess}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 px-4 py-3 text-sm text-slate-400">
                        <p>
                            Affichage de {payments.meta.from} à {payments.meta.to} sur {payments.meta.total}
                        </p>
                        <div className="flex items-center gap-1">
                            {payments.links.map((link, index) => {
                                if (link.label.includes('Previous') || link.label.includes('&laquo;')) {
                                    return (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            preserveScroll
                                            className={`rounded-lg border border-slate-700 p-2 ${link.url ? 'hover:bg-white/5' : 'pointer-events-none opacity-40'}`}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Link>
                                    );
                                }
                                if (link.label.includes('Next') || link.label.includes('&raquo;')) {
                                    return (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            preserveScroll
                                            className={`rounded-lg border border-slate-700 p-2 ${link.url ? 'hover:bg-white/5' : 'pointer-events-none opacity-40'}`}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Link>
                                    );
                                }
                                return null;
                            })}
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-3">
                    <div className={`${cardClass} lg:col-span-2`}>
                        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-300">
                            Alertes d&apos;impayés
                        </h2>
                        <div className="space-y-3">
                            {alerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#0f172a] p-4"
                                >
                                    <div className="flex items-start gap-3">
                                        {alert.type === 'danger' ? (
                                            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                                        ) : (
                                            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                                        )}
                                        <div>
                                            <p className="font-semibold text-slate-100">{alert.title}</p>
                                            <p className="mt-0.5 text-sm text-slate-400">{alert.description}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            alert.payment_id
                                                ? retryPayment(alert.payment_id)
                                                : undefined
                                        }
                                        className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/5"
                                    >
                                        {alert.action === 'retry' ? 'Relancer' : 'Détails'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={cardClass}>
                        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-300">
                            Actions rapides
                        </h2>
                        <div className="space-y-3">
                            <button
                                type="button"
                                onClick={() => setModal('payment')}
                                className="flex w-full items-center gap-4 rounded-xl border border-slate-800 bg-[#0f172a] p-4 text-left transition hover:border-slate-600"
                            >
                                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
                                    <Wallet className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-100">Saisir Paiement Manuel</p>
                                    <p className="text-xs text-slate-500">Enregistrer un encaissement</p>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setModal('refund')}
                                className="flex w-full items-center gap-4 rounded-xl border border-slate-800 bg-[#0f172a] p-4 text-left transition hover:border-slate-600"
                            >
                                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400">
                                    <Banknote className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-100">Effectuer un Remboursement</p>
                                    <p className="text-xs text-slate-500">Créditer un client</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </section>
            </FacturationLayout>

            <PaymentModal
                key={modal ?? 'closed'}
                open={modal === 'payment'}
                onClose={() => setModal(null)}
                clients={clients}
                invoices={invoices}
                kind="payment"
            />
            <PaymentModal
                key={`refund-${modal ?? 'closed'}`}
                open={modal === 'refund'}
                onClose={() => setModal(null)}
                clients={clients}
                invoices={invoices}
                kind="refund"
            />
        </>
    );
}
