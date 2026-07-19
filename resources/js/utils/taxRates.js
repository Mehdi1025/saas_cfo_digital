/**
 * Libellés des pays couverts par config/taxes.php (+ export courants).
 */
export const COUNTRY_LABELS = {
    FR: 'France',
    BE: 'Belgique',
    CH: 'Suisse',
    DE: 'Allemagne',
    LU: 'Luxembourg',
    ES: 'Espagne',
    IT: 'Italie',
    NL: 'Pays-Bas',
    PT: 'Portugal',
    GB: 'Royaume-Uni',
    US: 'États-Unis',
    CA: 'Canada',
    MA: 'Maroc',
    TN: 'Tunisie',
    AE: 'Émirats arabes unis',
};

const EXTRA_EXPORT_COUNTRIES = ['US', 'CA', 'MA', 'TN', 'AE'];

/**
 * Résout le taux de TVA applicable pour un code pays ISO.
 *
 * @param {string|null|undefined} countryCode
 * @param {Record<string, number>|null|undefined} taxRates
 * @returns {number}
 */
export function resolveVatRateForCountry(countryCode, taxRates = {}) {
    const fallback = Number(taxRates?.default ?? 0);

    if (!countryCode || String(countryCode).trim() === '') {
        return fallback;
    }

    const code = String(countryCode).trim().toUpperCase();
    const rate = taxRates[code];

    return rate !== undefined && rate !== null ? Number(rate) : fallback;
}

/**
 * @param {Array<{ id: number|string, country_code?: string }>} clients
 * @param {string|number|null|undefined} tiersId
 * @param {Record<string, number>|null|undefined} taxRates
 * @returns {number}
 */
export function resolveVatRateForClient(clients, tiersId, taxRates) {
    if (!tiersId) {
        return resolveVatRateForCountry(null, taxRates);
    }

    const client = clients.find((c) => String(c.id) === String(tiersId));

    return resolveVatRateForCountry(client?.country_code, taxRates);
}

/**
 * @param {Array<Record<string, unknown>>} lignes
 * @param {number} rate
 * @returns {Array<Record<string, unknown>>}
 */
export function applyVatRateToLines(lignes, rate) {
    const numericRate = Number(rate);

    return lignes.map((ligne) => ({
        ...ligne,
        vat_rate: numericRate,
    }));
}

/**
 * Options pays pour les formulaires clients (config + export hors liste).
 *
 * @param {Record<string, number>|null|undefined} taxRates
 * @returns {Array<{ code: string, label: string }>}
 */
export function countryOptionsForClientForm(taxRates = {}) {
    const codes = new Set(
        Object.keys(taxRates).filter((key) => key !== 'default'),
    );

    EXTRA_EXPORT_COUNTRIES.forEach((code) => codes.add(code));

    const options = [...codes]
        .sort((a, b) =>
            (COUNTRY_LABELS[a] ?? a).localeCompare(COUNTRY_LABELS[b] ?? b, 'fr'),
        )
        .map((code) => ({
            code,
            label: COUNTRY_LABELS[code] ?? code,
        }));

    options.push({
        code: '',
        label: 'Hors UE / Export (TVA 0 %)',
    });

    return options;
}

/**
 * @param {number} rate
 * @returns {string}
 */
export function formatVatRateLabel(rate) {
    return `${Number(rate).toLocaleString('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })} %`;
}
