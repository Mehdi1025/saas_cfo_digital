import { usePage } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, X, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function FlashMessages() {
    const { flash } = usePage().props;
    const [visible, setVisible] = useState(null);

    useEffect(() => {
        const complianceErrors = Array.isArray(flash?.compliance_errors)
            ? flash.compliance_errors.filter(Boolean)
            : [];

        if (flash?.success) {
            setVisible({ type: 'success', message: flash.success, details: [] });
        } else if (complianceErrors.length > 0 || flash?.error) {
            setVisible({
                type: 'error',
                message:
                    flash?.error ??
                    'La facture ne peut pas être émise : des informations obligatoires sont manquantes.',
                details: complianceErrors,
            });
        }
    }, [flash?.success, flash?.error, flash?.compliance_errors]);

    useEffect(() => {
        if (!visible) {
            return undefined;
        }

        const timer = window.setTimeout(() => setVisible(null), visible.details.length > 0 ? 12000 : 8000);

        return () => window.clearTimeout(timer);
    }, [visible]);

    if (!visible) {
        return null;
    }

    const isSuccess = visible.type === 'success';

    return (
        <div
            role="alert"
            className={`fixed bottom-6 right-6 z-50 flex max-w-lg items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${
                isSuccess
                    ? 'border-emerald-500/30 bg-emerald-950/95 text-emerald-100'
                    : 'border-red-500/30 bg-red-950/95 text-red-100'
            }`}
        >
            {isSuccess ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            ) : visible.details.length > 0 ? (
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            ) : (
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
            )}
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug">{visible.message}</p>
                {visible.details.length > 0 ? (
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-snug text-red-100/90">
                        {visible.details.map((detail) => (
                            <li key={detail}>{detail}</li>
                        ))}
                    </ul>
                ) : null}
            </div>
            <button
                type="button"
                onClick={() => setVisible(null)}
                className="shrink-0 rounded p-0.5 opacity-70 transition hover:opacity-100"
                aria-label="Fermer"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
