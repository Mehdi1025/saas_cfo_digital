import DashboardHome, {
    DashboardHeaderActions,
} from '@/Components/FinFlow/DashboardHome';
import FacturationLayout from '@/Layouts/FacturationLayout';
import { Head } from '@inertiajs/react';

export default function Dashboard({
    kpis,
    revenue_chart,
    invoice_distribution,
    recent_activity,
}) {
    return (
        <>
            <Head title="Vue d'ensemble — Facturation" />
            <FacturationLayout
                title="Vue d'ensemble"
                description="Gérez vos finances, factures et devis en temps réel."
                headerActions={<DashboardHeaderActions />}
            >
                <div className="mx-auto max-w-[1600px] space-y-6">
                    <DashboardHome
                        kpis={kpis}
                        revenue_chart={revenue_chart}
                        invoice_distribution={invoice_distribution}
                        recent_activity={recent_activity}
                    />
                </div>
            </FacturationLayout>
        </>
    );
}
