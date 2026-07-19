import { useCallback, useEffect, useState } from 'react';
import {
    applyVatRateToLines,
    resolveVatRateForClient,
} from '@/utils/taxRates';

/**
 * Synchronise le taux TVA (state + lignes) selon le pays du client (config Facturation & Taxes).
 *
 * @param {object} options
 * @param {import('@inertiajs/react').InertiaFormProps} options.form
 * @param {Array<{ id: number|string, country_code?: string, name?: string }>} options.clients
 * @param {Record<string, number>} options.taxRates
 * @param {boolean} [options.readOnly]
 */
export function useClientVatRate({ form, clients, taxRates, readOnly = false }) {
    const resolveRate = useCallback(
        (tiersId) => resolveVatRateForClient(clients, tiersId, taxRates),
        [clients, taxRates],
    );

    const [defaultVatRate, setDefaultVatRate] = useState(() =>
        resolveRate(form.data.tiers_id),
    );

    useEffect(() => {
        setDefaultVatRate(resolveRate(form.data.tiers_id));
    }, [form.data.tiers_id, resolveRate]);

    useEffect(() => {
        if (readOnly || !form.data.tiers_id) {
            return;
        }

        const newRate = resolveRate(form.data.tiers_id);
        const lignes = form.data.lignes ?? [];
        const needsSync = lignes.some(
            (ligne) => Number(ligne.vat_rate) !== newRate,
        );

        if (needsSync) {
            form.setData('lignes', applyVatRateToLines(lignes, newRate));
        }
    }, [form.data.tiers_id, readOnly, resolveRate]);

    const handleTierChange = useCallback(
        (nextTierId) => {
            if (readOnly) {
                return;
            }

            form.setData('tiers_id', nextTierId);
        },
        [form, readOnly],
    );

    return { defaultVatRate, handleTierChange };
}
