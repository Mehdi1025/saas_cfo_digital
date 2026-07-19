/**
 * @param {string} [currencyCode='EUR']
 * @returns {string}
 */
export function currencySymbol(currencyCode = 'EUR') {
    const code = (currencyCode || 'EUR').toUpperCase();

    try {
        const part = new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: code,
        })
            .formatToParts(0)
            .find((p) => p.type === 'currency');

        return part?.value ?? code;
    } catch {
        return '€';
    }
}

/**
 * @param {number} amount
 * @param {string} [currencyCode='EUR']
 * @returns {string}
 */
export function formatMoney(amount, currencyCode = 'EUR') {
    const code = (currencyCode || 'EUR').toUpperCase();

    try {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: code,
            minimumFractionDigits: 2,
        }).format(amount || 0);
    } catch {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2,
        }).format(amount || 0);
    }
}

/**
 * @param {Record<string, number>|null|undefined} currencies
 * @returns {Array<{ code: string, rate: number }>}
 */
export function currencyOptions(currencies = {}) {
    return Object.entries(currencies)
        .filter(([code]) => code !== 'default')
        .map(([code, rate]) => ({ code, rate: Number(rate) }));
}
