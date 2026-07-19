import Checkbox from '@/Components/Checkbox';
import { FileCheck2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const MANDATE_BULLETS = [
    'Émettre et transmettre en mon nom et pour mon compte mes factures de vente au format structuré réglementaire (Factur-X, CII) vers les plateformes destinataires et le Portail Public de Facturation (PPF).',
    "Transmettre les données de transaction et de paiement (E-reporting) à l'administration fiscale, conformément à mes obligations réglementaires.",
    'Recevoir et mettre à ma disposition mes factures d\'achat électroniques.',
    "Assurer l'archivage à valeur probante de mes factures électroniques (émises et reçues) pour la durée légale de 10 ans.",
];

export default function ModalMandatFacturation({ isOpen, onClose, onConfirm, companyName }) {
    const [hasAccepted, setHasAccepted] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setHasAccepted(false);
        }
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    function handleConfirm() {
        if (!hasAccepted) {
            return;
        }

        onConfirm();
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mandat-facturation-title"
        >
            <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-[#111827] shadow-2xl">
                <header className="border-b border-slate-800 bg-gradient-to-r from-violet-500/10 via-transparent to-transparent px-6 py-5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/25">
                                <FileCheck2 className="h-6 w-6" strokeWidth={2} />
                            </div>
                            <div className="min-w-0 space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-300/90">
                                    Consentement obligatoire
                                </p>
                                <h2
                                    id="mandat-facturation-title"
                                    className="text-lg font-semibold leading-snug text-white sm:text-xl"
                                >
                                    Mandat d&apos;émission, de transmission et de réception de factures
                                    électroniques
                                </h2>
                                {companyName ? (
                                    <p className="text-sm text-slate-400">
                                        Entreprise :{' '}
                                        <span className="font-medium text-slate-200">{companyName}</span>
                                    </p>
                                ) : null}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
                            aria-label="Fermer"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </header>

                <div className="space-y-4 px-6 py-5">
                    <div className="max-h-72 space-y-4 overflow-y-auto rounded-xl border border-slate-800 bg-[#151d2c] p-4 text-sm leading-relaxed text-slate-300">
                        <p>
                            En activant la facturation électronique, je soussigné(e), agissant en qualité de
                            représentant légal de l&apos;entreprise, donne mandat exprès à l&apos;éditeur du logiciel
                            Copifi et à sa Plateforme Agréée partenaire pour :
                        </p>

                        <ul className="list-inside list-disc space-y-2 text-sm text-slate-300">
                            {MANDATE_BULLETS.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>

                        <p>
                            Je reconnais que ce mandat ne m&apos;exonère pas de ma responsabilité fiscale concernant la
                            facturation et le paiement de la TVA. J&apos;accepte que l&apos;utilisation de ce service
                            implique l&apos;acceptation de la clause &laquo;&nbsp;Facturation Électronique&nbsp;&raquo;
                            détaillée dans les Conditions Générales de Vente (CGV).
                        </p>
                    </div>

                    <div className="mt-6 rounded-md border border-slate-700 bg-slate-800/60 p-4 dark:bg-gray-800">
                        <label className="flex cursor-pointer items-start gap-3">
                            <Checkbox
                                checked={hasAccepted}
                                onChange={(e) => setHasAccepted(e.target.checked)}
                                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-600 bg-[#151d2c] text-violet-500 shadow-none focus:ring-violet-500/40 focus:ring-offset-0"
                            />
                            <span className="text-sm leading-relaxed text-slate-200 dark:text-gray-300">
                                J&apos;ai lu et j&apos;accepte les termes de ce mandat de facturation.
                            </span>
                        </label>
                    </div>

                    <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/5"
                        >
                            Annuler
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={!hasAccepted}
                            className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Confirmer l&apos;activation
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
