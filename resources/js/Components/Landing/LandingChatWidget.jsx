import { Loader2, Send, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

const SUGGESTED_QUESTIONS = [
    'Qu\'est-ce que Mini CFO Digital ?',
    'La facturation est-elle incluse ?',
    'Combien coûte l\'abonnement ?',
    'Comment fonctionne l\'analyse IA ?',
];

const markdownComponents = {
    p: ({ children }) => (
        <p className="mb-2 text-sm leading-relaxed text-zinc-300 last:mb-0">{children}</p>
    ),
    ul: ({ children }) => (
        <ul className="mb-2 list-disc space-y-1 pl-4 text-sm text-zinc-300">{children}</ul>
    ),
    ol: ({ children }) => (
        <ol className="mb-2 list-decimal space-y-1 pl-4 text-sm text-zinc-300">{children}</ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
};

function ChatBubble({ role, content, isTyping = false }) {
    const isUser = role === 'user';

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 sm:max-w-[80%] ${
                    isUser
                        ? 'rounded-br-md border border-emerald-500/25 bg-emerald-500/15 text-emerald-50'
                        : 'rounded-bl-md border border-white/10 bg-white/[0.06] text-zinc-200'
                }`}
            >
                {isTyping ? (
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                        L&apos;assistant réfléchit…
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

export default function LandingChatWidget() {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content:
                'Bonjour ! Je suis l\'assistant Mini CFO Digital. Posez-moi vos questions sur le produit, la facturation ou les tarifs.',
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
            const { data } = await window.axios.post(route('landing.chat'), {
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
                setError('Impossible de joindre l\'assistant. Vérifiez votre connexion ou réessayez.');
            } else {
                setError('L\'assistant est momentanément indisponible. Réessayez dans un instant.');
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
        <div className="relative flex h-full min-h-[520px] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[rgba(255,255,255,0.05)] shadow-[0_20px_50px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/[0.06] via-transparent to-emerald-500/[0.08]"
            />

            <div className="relative z-10 flex items-center gap-3 border-b border-white/10 px-5 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-emerald-500 shadow-[0_0_20px_rgba(139,92,246,0.35)]">
                    <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                    <p className="text-sm font-bold text-white">Assistant Mini CFO</p>
                    <p className="text-xs text-emerald-400">En ligne · Propulsé par IA</p>
                </div>
                <span className="relative ml-auto flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </span>
            </div>

            <div
                ref={scrollRef}
                className="relative z-10 flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5"
            >
                {messages.map((msg, index) => (
                    <ChatBubble key={`${msg.role}-${index}`} role={msg.role} content={msg.content} />
                ))}
                {isLoading ? <ChatBubble role="assistant" isTyping /> : null}
            </div>

            {messages.length <= 1 ? (
                <div className="relative z-10 flex flex-wrap gap-2 px-4 pb-3 sm:px-5">
                    {SUGGESTED_QUESTIONS.map((q) => (
                        <button
                            key={q}
                            type="button"
                            onClick={() => sendMessage(q)}
                            disabled={isLoading}
                            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:border-violet-400/35 hover:bg-violet-500/10 hover:text-zinc-200 disabled:opacity-50"
                        >
                            {q}
                        </button>
                    ))}
                </div>
            ) : null}

            {error ? (
                <p className="relative z-10 px-5 pb-2 text-xs text-rose-400">{error}</p>
            ) : null}

            <form
                onSubmit={handleSubmit}
                className="relative z-10 border-t border-white/10 p-4 sm:p-5"
            >
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
                        placeholder="Posez votre question…"
                        disabled={isLoading}
                        className="max-h-28 min-h-[44px] flex-1 resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-violet-400/40 focus:ring-2 focus:ring-violet-400/20 disabled:opacity-60"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-emerald-500 text-white shadow-[0_0_18px_rgba(139,92,246,0.35)] transition hover:scale-105 hover:shadow-[0_0_28px_rgba(139,92,246,0.45)] disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Envoyer"
                    >
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </button>
                </div>
                <p className="mt-2 text-center text-[10px] text-zinc-600">
                    Réponses à titre informatif — pas de conseil fiscal ou juridique.
                </p>
            </form>
        </div>
    );
}
