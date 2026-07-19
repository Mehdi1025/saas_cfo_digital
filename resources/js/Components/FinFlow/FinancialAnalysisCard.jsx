import { Loader2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

const cardBase =
    'relative overflow-hidden rounded-xl border border-slate-800 bg-[#151d2c] p-5 shadow-sm';

function AnalysisSkeleton() {
    return (
        <div className="animate-pulse space-y-3">
            <div className="h-4 w-3/4 rounded bg-slate-700/80" />
            <div className="h-4 w-full rounded bg-slate-700/60" />
            <div className="h-4 w-5/6 rounded bg-slate-700/60" />
            <div className="mt-4 h-4 w-2/5 rounded bg-slate-700/80" />
            <div className="h-4 w-full rounded bg-slate-700/60" />
            <div className="h-4 w-11/12 rounded bg-slate-700/60" />
        </div>
    );
}

const markdownComponents = {
    h1: ({ children }) => (
        <h3 className="mb-3 mt-4 text-lg font-bold text-white first:mt-0">{children}</h3>
    ),
    h2: ({ children }) => (
        <h4 className="mb-2 mt-4 text-base font-bold text-white first:mt-0">{children}</h4>
    ),
    h3: ({ children }) => (
        <h5 className="mb-2 mt-3 text-sm font-bold text-slate-100 first:mt-0">{children}</h5>
    ),
    p: ({ children }) => (
        <p className="mb-3 text-sm leading-relaxed text-slate-300 last:mb-0">{children}</p>
    ),
    ul: ({ children }) => (
        <ul className="mb-3 list-disc space-y-1.5 pl-5 text-sm text-slate-300">{children}</ul>
    ),
    ol: ({ children }) => (
        <ol className="mb-3 list-decimal space-y-1.5 pl-5 text-sm text-slate-300">{children}</ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    strong: ({ children }) => (
        <strong className="font-semibold text-slate-100">{children}</strong>
    ),
    em: ({ children }) => <em className="italic text-slate-300">{children}</em>,
};

export default function FinancialAnalysisCard() {
    const [analysis, setAnalysis] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    async function generateAnalysis() {
        setIsLoading(true);
        setError('');
        setAnalysis('');

        try {
            const { data } = await window.axios.post(route('facturation.analyze'));

            if (data.analysis) {
                setAnalysis(data.analysis);
            } else {
                setError('Réponse inattendue du serveur.');
            }
        } catch (err) {
            if (err.response?.status === 419) {
                setError('Session expirée. Rechargez la page puis réessayez.');
                return;
            }

            const message =
                err.response?.data?.error ??
                err.response?.data?.message ??
                'Impossible de générer l\'analyse pour le moment. Réessayez plus tard.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className={cardBase}>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400">
                        <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="font-display text-lg font-semibold text-slate-100">
                            Analyse Financière par IA
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Propulsé par Groq · Données anonymisées
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={generateAnalysis}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Sparkles className="h-4 w-4" />
                    )}
                    {isLoading ? 'Analyse en cours…' : 'Générer mon analyse financière'}
                </button>
            </div>

            {isLoading ? <AnalysisSkeleton /> : null}

            {!isLoading && error ? (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                </div>
            ) : null}

            {!isLoading && analysis ? (
                <div className="rounded-lg border border-slate-700/60 bg-[#111827]/60 p-4">
                    <ReactMarkdown components={markdownComponents}>
                        {analysis}
                    </ReactMarkdown>
                </div>
            ) : null}

            {!isLoading && !analysis && !error ? (
                <p className="text-sm text-slate-500">
                    Cliquez sur le bouton pour obtenir une analyse de votre trésorerie,
                    vos retards de paiement et des recommandations actionnables.
                </p>
            ) : null}
        </div>
    );
}
