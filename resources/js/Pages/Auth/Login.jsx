import InputError from '@/Components/InputError';
import AuthShell from '@/Pages/Auth/AuthShell';
import { buildAuthQueryParams, SUBSCRIBE_INTENT } from '@/utils/subscribeFlow';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

function MailIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-slate-500">
            <path
                d="M4 6h16v12H4V6Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
            />
            <path
                d="m4 7 8 6 8-6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function LockIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-slate-500">
            <path
                d="M7 10V8a5 5 0 0 1 10 0v2"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
            <path
                d="M6 10h12v10H6V10Z"
                fill="currentColor"
                opacity="0.35"
            />
        </svg>
    );
}

function EyeIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-slate-500">
            <path
                d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                stroke="currentColor"
                strokeWidth="1.6"
            />
            <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.6" />
        </svg>
    );
}

function readCsrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

export default function Login({ status, canResetPassword, redirect = null, intent = null }) {
    const { flash } = usePage().props;
    const isSubscribeFlow = intent === SUBSCRIBE_INTENT;
    const authParams = buildAuthQueryParams({ redirect, intent });
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
        redirect: redirect ?? '',
        intent: intent ?? '',
        _token: readCsrfToken(),
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthShell
            mode="login"
            title={isSubscribeFlow ? 'Connectez-vous pour continuer' : 'Bon retour'}
            subtitle={
                isSubscribeFlow
                    ? 'Connectez-vous pour acceder directement au paiement securise Stripe.'
                    : 'Accedez a votre espace d analyse financiere.'
            }
            redirect={redirect}
            intent={intent}
        >
            <Head title="Connexion" />

            {flash?.error && (
                <div className="mb-5 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100">
                    {flash.error}
                </div>
            )}

            {status && (
                <div className="mb-5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <label htmlFor="email" className="text-sm font-semibold text-slate-200">
                        Email
                    </label>
                    <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-black/45 px-4 py-3 focus-within:border-emerald-400/50">
                        <MailIcon />
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="w-full border-0 bg-transparent p-0 text-sm text-white placeholder:text-slate-500 focus:ring-0"
                            placeholder="nom@entreprise.com"
                            autoComplete="username"
                            autoFocus
                            onChange={(e) => setData('email', e.target.value)}
                        />
                    </div>
                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div>
                    <div className="flex items-center justify-between">
                        <label htmlFor="password" className="text-sm font-semibold text-slate-200">
                            Mot de passe
                        </label>
                        {canResetPassword && (
                            <Link
                                href={route('password.request', authParams)}
                                className="text-xs font-semibold text-emerald-300 transition hover:text-emerald-200"
                            >
                                Oublie ?
                            </Link>
                        )}
                    </div>
                    <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-black/45 px-4 py-3 focus-within:border-emerald-400/50">
                        <LockIcon />
                        <input
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="w-full border-0 bg-transparent p-0 text-sm text-white placeholder:text-slate-500 focus:ring-0"
                            placeholder="********"
                            autoComplete="current-password"
                            onChange={(e) => setData('password', e.target.value)}
                        />
                        <EyeIcon />
                    </div>
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <label className="flex items-center gap-3 text-sm text-slate-400">
                    <input
                        type="checkbox"
                        checked={data.remember}
                        onChange={(e) => setData('remember', e.target.checked)}
                        className="rounded border-white/10 bg-black/50 text-emerald-500 focus:ring-emerald-400"
                    />
                    Se souvenir de moi
                </label>

                <button
                    type="submit"
                    disabled={processing}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#18c98f] px-5 py-4 text-sm font-bold text-black shadow-[0_0_30px_rgba(24,201,143,0.25)] transition hover:bg-[#25e0a4] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSubscribeFlow ? 'Continuer vers l abonnement' : 'Acceder au tableau de bord'}
                    <span aria-hidden>{'->'}</span>
                </button>
            </form>
        </AuthShell>
    );
}
