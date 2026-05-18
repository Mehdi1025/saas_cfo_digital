import TestDashboardLayout from '@/Layouts/TestDashboardLayout';

export default function TestSaisieMensuelle() {
    return (
        <TestDashboardLayout title="Saisie mensuelle">
            <div className="relative -m-8 flex min-h-full items-center justify-center bg-obsidian px-8 py-16">
                <div className="max-w-lg rounded-2xl border border-white/10 bg-white/[0.03] px-10 py-12 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md">
                    <p className="font-display text-lg font-bold text-white">Saisie mensuelle</p>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                        Page de démonstration — contenu à remplir. Les données saisies apparaîtront ici dans la
                        version complète.
                    </p>
                </div>
            </div>
        </TestDashboardLayout>
    );
}
