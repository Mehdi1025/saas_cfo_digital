import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';

/**
 * Scroll vers la section Open Banking après retour Bridge (hash ou flash success).
 */
export function useBankingReturnScroll(sectionId = 'open-banking') {
    const { flash } = usePage().props;

    useEffect(() => {
        const hash = window.location.hash.replace('#', '');
        const bankingFlash =
            typeof flash?.success === 'string' &&
            /bridge|banque|synchronis/i.test(flash.success);

        if (hash !== sectionId && !bankingFlash) {
            return undefined;
        }

        const timer = window.setTimeout(() => {
            document.getElementById(sectionId)?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }, 150);

        return () => window.clearTimeout(timer);
    }, [flash?.success, sectionId]);
}
