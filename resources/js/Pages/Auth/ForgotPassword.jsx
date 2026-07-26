import InputError from '@/Components/InputError';
import AuthShell from '@/Pages/Auth/AuthShell';
import { isValidEmail } from '@/utils/authValidation';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

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

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });
    const [clientError, setClientError] = useState('');

    const submit = (e) => {
        e.preventDefault();
        setClientError('');

        if (!isValidEmail(data.email)) {
            setClientError('Veuillez saisir une adresse e-mail valide.');
            return;
        }

        post(route('password.email'));
    };

    return (
        <AuthShell
            mode="login"
            title="Mot de passe oublie"
            subtitle="Indiquez votre e-mail. Si un compte existe, vous recevrez un lien de reinitialisation."
            showTabs={false}
            showSocial={false}
        >
            <Head title="Mot de passe oublie" />

            {status && (
                <div className="mb-5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <label htmlFor="email" className="text-sm font-semibold text-slate-200">
                        E-mail
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
                            required
                            onChange={(e) => setData('email', e.target.value)}
                        />
                    </div>
                    <InputError message={clientError || errors.email} className="mt-2" />
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#18c98f] px-5 py-4 text-sm font-bold text-black shadow-[0_0_30px_rgba(24,201,143,0.25)] transition hover:bg-[#25e0a4] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    Envoyer le lien de reinitialisation
                    <span aria-hidden>{'->'}</span>
                </button>

                <div className="flex justify-center pt-2">
                    <Link
                        href={route('login')}
                        className="text-sm text-slate-500 underline transition hover:text-slate-300"
                    >
                        Retour a la connexion
                    </Link>
                </div>
            </form>
        </AuthShell>
    );
}
