import FinFlowComingSoon from '@/Components/FinFlow/FinFlowComingSoon';
import FacturationLayout from '@/Layouts/FacturationLayout';
import { Head } from '@inertiajs/react';

export default function Placeholder({ pageTitle }) {
    return (
        <>
            <Head title={`${pageTitle} — Copifi`} />
            <FacturationLayout title={pageTitle}>
                <FinFlowComingSoon />
            </FacturationLayout>
        </>
    );
}
