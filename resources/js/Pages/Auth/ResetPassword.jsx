import InputError from '@/Components/InputError';
import AuthShell from '@/Pages/Auth/AuthShell';
import {
    passwordRequirements,
    validatePasswordResetForm,
} from '@/utils/authValidation';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

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

function PasswordHints({ password }) {
    const requirements = passwordRequirements(password);

    const items = [
        { key: 'minLength', label: 'Au moins 8 caracteres', ok: requirements.minLength },
        { key: 'hasLetter', label: 'Au moins une lettre', ok: requirements.hasLetter },
        { key: 'hasNumber', label: 'Au moins un chiffre', ok: requirements.hasNumber },
    ];

    return (
        <ul className="mt-2 space-y-1 text-xs text-slate-500">
            {items.map((item) => (
                <li
                    key={item.key}
                    className={item.ok ? 'text-emerald-400' : undefined}
                >
                    {item.ok ? '✓' : '•'} {item.label}
                </li>
            ))}
        </ul>
    );
}

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });
    const [clientErrors, setClientErrors] = useState({});

    const submit = (e) => {
        e.preventDefault();

        const validationErrors = validatePasswordResetForm(data);
        setClientErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            return;
        }

        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthShell
            mode="login"
            title="Nouveau mot de passe"
            subtitle="Choisissez un mot de passe securise pour votre compte."
            showTabs={false}
            showSocial={false}
        >
            <Head title="Reinitialiser le mot de passe" />

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <label htmlFor="email" className="text-sm font-semibold text-slate-200">
                        E-mail
                    </label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        readOnly
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-400"
                        autoComplete="username"
                    />
                    <InputError
                        message={clientErrors.email || errors.email}
                        className="mt-2"
                    />
                </div>

                <div>
                    <label htmlFor="password" className="text-sm font-semibold text-slate-200">
                        Nouveau mot de passe
                    </label>
                    <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-black/45 px-4 py-3 focus-within:border-emerald-400/50">
                        <LockIcon />
                        <input
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="w-full border-0 bg-transparent p-0 text-sm text-white placeholder:text-slate-500 focus:ring-0"
                            placeholder="********"
                            autoComplete="new-password"
                            autoFocus
                            required
                            onChange={(e) => setData('password', e.target.value)}
                        />
                    </div>
                    <PasswordHints password={data.password} />
                    <InputError
                        message={clientErrors.password || errors.password}
                        className="mt-2"
                    />
                </div>

                <div>
                    <label
                        htmlFor="password_confirmation"
                        className="text-sm font-semibold text-slate-200"
                    >
                        Confirmer le mot de passe
                    </label>
                    <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-black/45 px-4 py-3 focus-within:border-emerald-400/50">
                        <LockIcon />
                        <input
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className="w-full border-0 bg-transparent p-0 text-sm text-white placeholder:text-slate-500 focus:ring-0"
                            placeholder="********"
                            autoComplete="new-password"
                            required
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                        />
                    </div>
                    <InputError
                        message={
                            clientErrors.password_confirmation ||
                            errors.password_confirmation
                        }
                        className="mt-2"
                    />
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#18c98f] px-5 py-4 text-sm font-bold text-black shadow-[0_0_30px_rgba(24,201,143,0.25)] transition hover:bg-[#25e0a4] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    Reinitialiser le mot de passe
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
