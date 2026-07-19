import FlashMessages from '@/Components/FinFlow/FlashMessages';
import CfoPageShell from '@/Components/CfoPageShell';
import AppDashboardLayout from '@/Layouts/AppDashboardLayout';

export default function FacturationLayout({
    children,
    title,
    description,
    headerActions,
    topBar,
    showPageHeading = true,
    mainClassName = '',
    badge = 'Facturation',
}) {
    return (
        <AppDashboardLayout title={title} badge={badge}>
            <CfoPageShell className={mainClassName}>
                {topBar}

                {showPageHeading ? (
                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            {description ? (
                                <p className="max-w-xl text-sm text-gray-400 sm:text-base">
                                    {description}
                                </p>
                            ) : null}
                        </div>
                        {headerActions}
                    </div>
                ) : null}

                {children}
                <FlashMessages />
            </CfoPageShell>
        </AppDashboardLayout>
    );
}
