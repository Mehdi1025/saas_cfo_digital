/**
 * Calcule l'escompte financier (remise pour paiement anticipé) sur le solde TTC.
 *
 * @param {object} options
 * @param {number} options.totalTtc
 * @param {number} [options.settledAmount=0]
 * @param {number} [options.percent=0]
 * @param {number|null} [options.days=null]
 * @param {string|null} [options.issueDate=null] ISO date
 * @param {string|null} [options.paymentDate=null] ISO date
 */
export function quoteFinancialDiscount({
    totalTtc,
    settledAmount = 0,
    percent = 0,
    days = null,
    issueDate = null,
    paymentDate = null,
}) {
    const grossRemaining = Math.max(0, Number(totalTtc) - Number(settledAmount));

    if (
        grossRemaining <= 0
        || !percent
        || !days
        || !issueDate
        || !paymentDate
    ) {
        return {
            eligible: false,
            discountAmount: 0,
            netCashDue: grossRemaining,
            grossRemaining,
            deadline: null,
        };
    }

    const issue = new Date(`${issueDate}T12:00:00`);
    const deadline = new Date(issue);
    deadline.setDate(deadline.getDate() + Number(days));

    const paidAt = new Date(`${paymentDate}T12:00:00`);
    const eligible = paidAt <= deadline;

    if (!eligible) {
        return {
            eligible: false,
            discountAmount: 0,
            netCashDue: grossRemaining,
            grossRemaining,
            deadline: deadline.toISOString().slice(0, 10),
        };
    }

    const discountAmount = Math.round(grossRemaining * (Number(percent) / 100) * 100) / 100;
    const netCashDue = Math.round((grossRemaining - discountAmount) * 100) / 100;

    return {
        eligible: true,
        discountAmount,
        netCashDue,
        grossRemaining,
        deadline: deadline.toISOString().slice(0, 10),
    };
}

/**
 * @param {string|null|undefined} iso
 * @returns {string}
 */
export function formatFinancialDiscountDeadline(iso) {
    if (!iso) {
        return '—';
    }

    return new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}
