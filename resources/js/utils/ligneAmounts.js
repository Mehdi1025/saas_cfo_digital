/**
 * Montant de base HT (quantité × prix unitaire).
 *
 * @param {{ quantity?: number|string, unit_price_ht?: number|string }} ligne
 * @returns {number}
 */
export function lineBaseAmount(ligne) {
    const qty = Number(ligne.quantity) || 0;
    const price = Number(ligne.unit_price_ht) || 0;

    return qty * price;
}

/**
 * Montant de la remise sur la ligne.
 *
 * @param {{ discount_type?: string|null, discount_value?: number|string|null, quantity?: number|string, unit_price_ht?: number|string }} ligne
 * @returns {number}
 */
export function lineDiscountAmount(ligne) {
    const type = ligne.discount_type;
    const value = Number(ligne.discount_value) || 0;

    if (!type || value <= 0) {
        return 0;
    }

    const base = lineBaseAmount(ligne);

    if (type === 'percent') {
        return base * (value / 100);
    }

    if (type === 'fixed') {
        return Math.min(value, base);
    }

    return 0;
}

/**
 * Total HT ligne après remise.
 *
 * @param {Record<string, unknown>} ligne
 * @returns {number}
 */
export function lineTotalHt(ligne) {
    return Math.max(0, lineBaseAmount(ligne) - lineDiscountAmount(ligne));
}

/**
 * Montant TVA sur le HT remisé.
 *
 * @param {Record<string, unknown>} ligne
 * @returns {number}
 */
export function lineVatAmount(ligne) {
    return lineTotalHt(ligne) * ((Number(ligne.vat_rate) || 0) / 100);
}

/**
 * @param {Record<string, unknown>} ligne
 * @returns {string|null}
 */
export function formatLineDiscountLabel(ligne) {
    const type = ligne.discount_type;
    const value = Number(ligne.discount_value) || 0;

    if (!type || value <= 0) {
        return null;
    }

    if (type === 'percent') {
        return `${value} %`;
    }

    if (type === 'fixed') {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
        }).format(value);
    }

    return null;
}

/**
 * @returns {Record<string, string|number>}
 */
export function emptyLineDiscountFields() {
    return {
        discount_type: '',
        discount_value: '',
    };
}
