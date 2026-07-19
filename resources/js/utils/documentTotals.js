import { lineTotalHt } from '@/utils/ligneAmounts';

export const FRAIS_PORT_PAR_JOUR = 10;

/**
 * @param {Array<{name: string, fee_per_day: number}>} destinations
 * @param {string|null|undefined} destinationName
 */
export function feePerDayForDestination(destinations, destinationName) {
    if (!destinationName || !destinations?.length) {
        return FRAIS_PORT_PAR_JOUR;
    }

    const match = destinations.find((item) => item.name === destinationName);

    return match ? Number(match.fee_per_day) : FRAIS_PORT_PAR_JOUR;
}

/**
 * @param {Array<Record<string, unknown>>} lignes
 * @param {string} typePrestation
 * @param {number|string} joursStockage
 * @param {number} vatRate Taux TVA du client (config pays)
 * @param {string|null|undefined} destinationName
 * @param {Array<{name: string, fee_per_day: number}>} destinations
 */
export function computeInvoiceTotals(
    lignes,
    typePrestation,
    joursStockage,
    vatRate,
    destinationName = null,
    destinations = [],
) {
    const rate = Number(vatRate) || 0;
    const linesSubtotal = lignes.reduce(
        (sum, ligne) => sum + lineTotalHt(ligne),
        0,
    );
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
    const subtotalHt = linesSubtotal + fraisPort;
    const tax = linesTax + fraisTax;

    return {
        linesSubtotal,
        fraisPort,
        fraisTax,
        subtotalHt,
        tax,
        total: subtotalHt + tax,
    };
}
