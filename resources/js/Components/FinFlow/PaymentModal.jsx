import { useForm } from '@inertiajs/react';
import { Banknote, X } from 'lucide-react';
import { useEffect, useMemo } from 'react';

import {
    formatFinancialDiscountDeadline,
    quoteFinancialDiscount,
} from '@/utils/financialDiscount';
import { formatMoney } from '@/utils/currency';

const PAYMENT_METHODS = [
    { value: 'virement', label: 'Virement bancaire' },
    { value: 'cb', label: 'Carte bancaire' },
    { value: 'especes', label: 'Espèces' },
    { value: 'cheque', label: 'Chèque' },
];

const inputClass =
    'w-full rounded-lg border border-slate-600/45 bg-[#151a24] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-slate-400/80 focus:ring-1 focus:ring-slate-400/25';

const labelClass = 'mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400';

function todayIsoDate() {
    return new Date().toISOString().slice(0, 10);
}

function suggestedAmount(facture, paymentDate) {
    const currencyTotal = Number(facture?.total_ttc) || 0;
    const settled = Number(facture?.settled_amount) || Number(facture?.amount_paid) || 0;
    const quote = quoteFinancialDiscount({
        totalTtc: currencyTotal,
        settledAmount: settled,
        percent: facture?.financial_discount_percent,
        days: facture?.financial_discount_days,
        issueDate: facture?.issue_date,
        paymentDate,
    });

    if (quote.eligible && quote.discountAmount > 0) {
        return quote.netCashDue;
    }

    return quote.grossRemaining;
}

export default function PaymentModal({ isOpen, onClose, facture }) {
    const form = useForm({
        amount: suggestedAmount(facture, todayIsoDate()),
        payment_date: todayIsoDate(),
        payment_method: 'virement',
        notes: '',
    });

    const paymentQuote = useMemo(() => {
        if (!facture) {
            return null;
        }

        return quoteFinancialDiscount({
            totalTtc: Number(facture.total_ttc) || 0,
            settledAmount: Number(facture.settled_amount) || Number(facture.amount_paid) || 0,
            percent: facture.financial_discount_percent,
            days: facture.financial_discount_days,
            issueDate: facture.issue_date,
            paymentDate: form.data.payment_date,
        });
    }, [facture, form.data.payment_date]);

    useEffect(() => {
        if (!isOpen || !facture) {
            return;
        }

        const date = todayIsoDate();
        form.setData({
            amount: suggestedAmount(facture, date),
            payment_date: date,
            payment_method: 'virement',
            notes: '',
        });
        form.clearErrors();
    }, [isOpen, facture?.id]);

    function onPaymentDateChange(value) {
        form.setData({
            ...form.data,
            payment_date: value,
            amount: suggestedAmount(facture, value),
        });
    }

    function submit(e) {
        e.preventDefault();

        if (!facture) {
            return;
        }

        form.post(route('factures.payments.store', facture.id), {
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    }

    if (!isOpen || !facture) {
        return null;
    }

    const currency = facture.currency_code ?? 'EUR';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-[#111827] shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                            <Banknote className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">
                                Enregistrer un paiement
                            </h2>
                            <p className="text-sm text-slate-400">
                                {facture.reference}
                                {facture.client?.name ? ` · ${facture.client.name}` : ''}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
                        aria-label="Fermer"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-5 px-6 py-5">
                    <div className="rounded-xl border border-slate-800 bg-[#151d2c] px-4 py-3 text-sm">
                        <div className="flex justify-between gap-4 text-slate-400">
                            <span>Total TTC</span>
                            <span className="font-semibold text-white">
                                {formatMoney(facture.total_ttc, currency)}
                            </span>
                        </div>
                        {facture.settled_amount > 0 || facture.amount_paid > 0 ? (
                            <>
                                <div className="mt-2 flex justify-between gap-4 text-slate-400">
                                    <span>Déjà réglé</span>
                                    <span className="font-semibold text-emerald-400">
                                        {formatMoney(
                                            facture.settled_amount ?? facture.amount_paid,
                                            currency,
                                        )}
                                    </span>
                                </div>
                                {facture.financial_discount_applied > 0 ? (
                                    <div className="mt-2 flex justify-between gap-4 text-slate-400">
                                        <span>Escompte déjà appliqué</span>
                                        <span className="font-semibold text-amber-300">
                                            {formatMoney(
                                                facture.financial_discount_applied,
                                                currency,
                                            )}
                                        </span>
                                    </div>
                                ) : null}
                                <div className="mt-2 flex justify-between gap-4 text-slate-400">
                                    <span>Solde restant</span>
                                    <span className="font-semibold text-amber-400">
                                        {formatMoney(facture.remaining_balance, currency)}
                                    </span>
                                </div>
                            </>
                        ) : null}
                    </div>

                    {paymentQuote?.eligible && paymentQuote.discountAmount > 0 ? (
                        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                            <p className="font-semibold">Escompte financier disponible</p>
                            <p className="mt-1 text-amber-100/90">
                                {facture.financial_discount_percent} % si paiement avant le{' '}
                                {formatFinancialDiscountDeadline(paymentQuote.deadline)} :{' '}
                                <span className="font-semibold">
                                    -{formatMoney(paymentQuote.discountAmount, currency)}
                                </span>
                            </p>
                            <p className="mt-2 text-emerald-200">
                                Net à encaisser :{' '}
                                <span className="font-bold">
                                    {formatMoney(paymentQuote.netCashDue, currency)}
                                </span>
                            </p>
                        </div>
                    ) : Number(facture.financial_discount_percent) > 0 ? (
                        <div className="rounded-xl border border-slate-700 bg-[#151d2c] px-4 py-3 text-sm text-slate-400">
                            Escompte non applicable à cette date (délai dépassé ou déjà soldé).
                        </div>
                    ) : null}

                    <div>
                        <label htmlFor="payment-amount" className={labelClass}>
                            Montant encaissé
                        </label>
                        <input
                            id="payment-amount"
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.data.amount}
                            onChange={(e) => form.setData('amount', e.target.value)}
                            className={inputClass}
                            required
                        />
                        {form.errors.amount ? (
                            <p className="mt-1 text-xs text-red-400">{form.errors.amount}</p>
                        ) : null}
                    </div>

                    <div>
                        <label htmlFor="payment-date" className={labelClass}>
                            Date d&apos;encaissement
                        </label>
                        <input
                            id="payment-date"
                            type="date"
                            value={form.data.payment_date}
                            onChange={(e) => onPaymentDateChange(e.target.value)}
                            className={inputClass}
                            required
                        />
                        {form.errors.payment_date ? (
                            <p className="mt-1 text-xs text-red-400">{form.errors.payment_date}</p>
                        ) : null}
                    </div>

                    <div>
                        <label htmlFor="payment-method" className={labelClass}>
                            Mode de paiement
                        </label>
                        <select
                            id="payment-method"
                            value={form.data.payment_method}
                            onChange={(e) => form.setData('payment_method', e.target.value)}
                            className={inputClass}
                            required
                        >
                            {PAYMENT_METHODS.map((method) => (
                                <option key={method.value} value={method.value}>
                                    {method.label}
                                </option>
                            ))}
                        </select>
                        {form.errors.payment_method ? (
                            <p className="mt-1 text-xs text-red-400">{form.errors.payment_method}</p>
                        ) : null}
                    </div>

                    <div>
                        <label htmlFor="payment-notes" className={labelClass}>
                            Notes (optionnel)
                        </label>
                        <input
                            id="payment-notes"
                            type="text"
                            value={form.data.notes}
                            onChange={(e) => form.setData('notes', e.target.value)}
                            placeholder="Référence du virement, n° de chèque…"
                            className={inputClass}
                        />
                        {form.errors.notes ? (
                            <p className="mt-1 text-xs text-red-400">{form.errors.notes}</p>
                        ) : null}
                    </div>

                    <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/5"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {form.processing ? 'Enregistrement…' : 'Enregistrer le paiement'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
