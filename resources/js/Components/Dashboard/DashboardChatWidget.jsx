import { Loader2, Send, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

const GLASS_PANEL =
    'border border-glassBorder bg-[linear-gradient(145deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.01)_100%)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-[20px]';

const SUGGESTED_QUESTIONS = [
    'Résume ma situation financière globale',
    'Quelles factures sont en retard ?',
    'Compare mon CA saisi et mon CA encaissé',
    'Quels sont mes principaux risques ?',
];

const markdownComponents = {
    p: ({ children }) => (
        <p className="mb-2 text-sm leading-relaxed text-gray-300 last:mb-0">{children}</p>
    ),
    ul: ({ children }) => (
        <ul className="mb-2 list-disc space-y-1 pl-4 text-sm text-gray-300">{children}</ul>
    ),
    ol: ({ children }) => (
        <ol className="mb-2 list-decimal space-y-1 pl-4 text-sm text-gray-300">{children}</ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
    h3: ({ children }) => (
        <h4 className="mb-2 mt-3 text-sm font-bold text-white first:mt-0">{children}</h4>
    ),
};

function ChatBubble({ role, content, isTyping = false }) {
    const isUser = role === 'user';

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[90%] rounded-2xl px-4 py-3 sm:max-w-[82%] ${
                    isUser
                        ? 'rounded-br-md border border-neonMint/25 bg-neonMint/10 text-white'
                        : 'rounded-bl-md border border-white/10 bg-white/[0.04] text-gray-200'
                }`}
            >
                {isTyping ? (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Loader2 className="h-4 w-4 animate-spin text-neonBlue" />
                        Analyse en cours…
                    </div>
                ) : isUser ? (
                    <p className="text-sm leading-relaxed">{content}</p>
                ) : (
                    <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
                )}
            </div>
        </div>
    );
}

export default function DashboardChatWidget() {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content:
                'Bonjour ! Je suis votre copilote financier Copifi. J\'ai accès à vos données de pilotage (saisie mensuelle) et à votre facturation (devis, factures, encaissements). Posez-moi vos questions.',
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const scrollRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const sendMessage = async (text) => {
        const trimmed = text.trim();
        if (!trimmed || isLoading) {
            return;
        }

        const nextMessages = [...messages, { role: 'user', content: trimmed }];
        setMessages(nextMessages);
        setInput('');
        setError(null);
        setIsLoading(true);

        try {
            const { data } = await window.axios.post(route('copilot.chat'), {
                messages: nextMessages.filter((m) => m.role === 'user' || m.role === 'assistant'),
            });

            setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
        } catch (err) {
            const apiError = err?.response?.data?.error;
            const status = err?.response?.status;

            if (status === 419) {
                setError('Session expirée. Rechargez la page puis réessayez.');
            } else if (typeof apiError === 'string' && apiError.length > 0) {
                setError(apiError);
            } else if (!err?.response) {
                setError('Impossible de joindre le copilote. Vérifiez votre connexion ou réessayez.');
            } else {
                setError('Le copilote est momentanément indisponible. Réessayez dans un instant.');
            }
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        sendMessage(input);
    };

    return (
        <div className={`${GLASS_PANEL} flex h-full min-h-[520px] flex-col overflow-hidden rounded-3xl`}>
            <div className="relative flex items-center gap-3 border-b border-white/10 px-5 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#00F0FF] to-[#00FF9D] shadow-[0_0_20px_rgba(0,240,255,0.25)]">
                    <Sparkles className="h-5 w-5 text-black" />
                </div>
                <div>
                    <p className="text-sm font-bold text-white">Copilote financier</p>
                    <p className="text-xs text-neonMint">Connecté à vos données · IA</p>
                </div>
                <span className="relative ml-auto flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neonMint opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-neonMint" />
                </span>
            </div>

            <div
                ref={scrollRef}
                className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5"
            >
                {messages.map((msg, index) => (
                    <ChatBubble key={`${msg.role}-${index}`} role={msg.role} content={msg.content} />
                ))}
                {isLoading ? <ChatBubble role="assistant" isTyping /> : null}
            </div>

            {messages.length <= 1 ? (
                <div className="flex flex-wrap gap-2 px-4 pb-3 sm:px-5">
                    {SUGGESTED_QUESTIONS.map((q) => (
                        <button
                            key={q}
                            type="button"
                            onClick={() => sendMessage(q)}
                            disabled={isLoading}
                            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-gray-400 transition hover:border-neonBlue/35 hover:bg-neonBlue/10 hover:text-gray-200 disabled:opacity-50"
                        >
                            {q}
                        </button>
                    ))}
                </div>
            ) : null}

            {error ? <p className="px-5 pb-2 text-xs text-rose-300">{error}</p> : null}

            <form onSubmit={handleSubmit} className="border-t border-white/10 p-4 sm:p-5">
                <div className="flex items-end gap-3">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                        rows={1}
                        placeholder="Ex : Ma marge baisse, que faire ?"
                        disabled={isLoading}
                        className="max-h-28 min-h-[44px] flex-1 resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition focus:border-neonBlue/40 focus:ring-2 focus:ring-neonBlue/20 disabled:opacity-60"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#00F0FF] to-[#00FF9D] text-black shadow-[0_0_18px_rgba(0,240,255,0.25)] transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Envoyer"
                    >
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </button>
                </div>
                <p className="mt-2 text-center text-[10px] text-gray-600">
                    Aide à la décision — pas de conseil fiscal ou juridique.
                </p>
            </form>
        </div>
    );
}
