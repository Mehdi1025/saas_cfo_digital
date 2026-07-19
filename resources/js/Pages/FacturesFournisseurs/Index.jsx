import FacturationLayout from '@/Layouts/FacturationLayout';
import { formatMoney } from '@/utils/currency';
import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    Ban,
    Banknote,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Inbox,
    Send,
    ShieldCheck,
} from 'lucide-react';

const tableHeaderClass =
    'border-b border-slate-800/80 bg-[#151d2c] px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500';

const CDAR_STATUS_CONFIG = {
    déposée: {
        badge: 'bg-violet-500/15 text-violet-300',
        icon: Send,
    },
    approuvée: {
        badge: 'bg-emerald-500/15 text-emerald-400',
        icon: ShieldCheck,
    },
    rejetée: {
        badge: 'bg-red-500/15 text-red-400',
        icon: Ban,
    },
    refusée: {
        badge: 'bg-orange-500/15 text-orange-400',
        icon: Ban,
    },
    suspendue: {
        badge: 'bg-amber-500/15 text-amber-400',
        icon: AlertTriangle,
    },
    encaissée: {
        badge: 'bg-teal-500/15 text-teal-400',
        icon: Banknote,
    },
};

function CdarStatusBadge({ status, label }) {
    if (!status) {
        return (
            <span className="inline-flex items-center rounded-full bg-slate-500/10 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                —
            </span>
        );
    }

    const config = CDAR_STATUS_CONFIG[status] ?? {
        badge: 'bg-slate-500/15 text-slate-300',
        icon: CheckCircle2,
    };
    const Icon = config.icon;

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${config.badge}`}
            title={`Statut CDAR : ${label}`}
        >
            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
            {label}
        </span>
    );
}

export default function FacturesFournisseursIndex({ factures }) {
    return (
        <>
            <Head title="Factures fournisseurs — Achats" />
            <FacturationLayout
                title="Factures fournisseurs"
                description="Boîte de réception des factures d'achat reçues via la Plateforme Agréée."
                headerActions={
                    <span className="inline-flex items-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300">
                        <Inbox className="h-4 w-4" />
                        Réception PA
                    </span>
                }
            >
                <div className="overflow-hidden rounded-xl border border-[#1e293b] bg-[#111827]">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[960px] text-left text-sm">
                            <thead>
                                <tr className={tableHeaderClass}>
                                    <th className="font-medium">Date d&apos;émission</th>
                                    <th className="font-medium">Fournisseur</th>
                                    <th className="font-medium">Référence</th>
                                    <th className="font-medium text-right">Montant HT</th>
                                    <th className="font-medium text-right">Montant TTC</th>
                                    <th className="font-medium">Statut CDAR</th>
                                    <th className="font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {factures.data.map((facture) => (
                                    <tr
                                        key={facture.id}
                                        className="border-t border-slate-800/80 transition hover:bg-white/[0.02]"
                                    >
                                        <td className="px-4 py-4 text-slate-300">
                                            {facture.issue_date_label}
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="font-semibold text-slate-100">
                                                {facture.supplier_name}
                                            </p>
                                            {facture.supplier_siret ? (
                                                <p className="text-xs text-slate-500">
                                                    SIRET {facture.supplier_siret}
                                                </p>
                                            ) : null}
                                        </td>
                                        <td className="px-4 py-4 font-medium text-slate-200">
                                            {facture.reference}
                                        </td>
                                        <td className="px-4 py-4 text-right tabular-nums text-slate-200">
                                            {formatMoney(facture.amount_ht)}
                                        </td>
                                        <td className="px-4 py-4 text-right tabular-nums font-semibold text-white">
                                            {formatMoney(facture.amount_ttc)}
                                        </td>
                                        <td className="px-4 py-4">
                                            <CdarStatusBadge
                                                status={facture.cdar_status}
                                                label={facture.cdar_status_label}
                                            />
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            {facture.pdf_url ? (
                                                <a
                                                    href={facture.pdf_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-300"
                                                >
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                    Voir le PDF
                                                </a>
                                            ) : (
                                                <span className="text-xs text-slate-500">PDF indisponible</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {factures.data.length === 0 ? (
                                    <tr className="border-t border-slate-800/80">
                                        <td
                                            colSpan={7}
                                            className="px-4 py-16 text-center text-sm text-slate-500"
                                        >
                                            Aucune facture fournisseur reçue pour le moment. Les documents
                                            transmis par votre Plateforme Agréée s&apos;afficheront ici.
                                        </td>
                                    </tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 px-4 py-3 text-sm text-slate-400">
                        <p>
                            {factures.meta.from
                                ? `Affichage de ${factures.meta.from} à ${factures.meta.to} sur ${factures.meta.total}`
                                : 'Aucun résultat'}
                        </p>
                        <div className="flex items-center gap-1">
                            {factures.links.map((link, index) => {
                                if (link.label.includes('Previous') || link.label.includes('&laquo;')) {
                                    return (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            preserveScroll
                                            className={`rounded-lg border border-slate-700 p-2 transition ${link.url ? 'hover:bg-white/5' : 'pointer-events-none opacity-40'}`}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Link>
                                    );
                                }
                                if (link.label.includes('Next') || link.label.includes('&raquo;')) {
                                    return (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            preserveScroll
                                            className={`rounded-lg border border-slate-700 p-2 transition ${link.url ? 'hover:bg-white/5' : 'pointer-events-none opacity-40'}`}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Link>
                                    );
                                }

                                return null;
                            })}
                        </div>
                    </div>
                </div>
            </FacturationLayout>
        </>
    );
}
