import InputError from '@/Components/InputError';
import AuthShell from '@/Pages/Auth/AuthShell';
import {
    passwordRequirements,
    validateRegistrationForm,
} from '@/utils/authValidation';
import { SUBSCRIBE_INTENT } from '@/utils/subscribeFlow';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

function FieldIcon({ type }) {
    const paths = {
        user: (
            <>
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7" />
                <path d="M4 21a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </>
        ),
        mail: (
            <>
                <path d="M4 6h16v12H4V6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </>
        ),
        lock: (
            <>
                <path d="M7 10V8a5 5 0 0 1 10 0v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M6 10h12v10H6V10Z" fill="currentColor" opacity="0.35" />
            </>
        ),
    };

    return (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-slate-500">
            {paths[type]}
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

function readCsrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

export default function Register({ redirect = null, intent = null }) {
    const isSubscribeFlow = intent === SUBSCRIBE_INTENT;
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        redirect: redirect ?? '',
        intent: intent ?? '',
        _token: readCsrfToken(),
    });

    const [clientErrors, setClientErrors] = useState({});

    const submit = (e) => {
        e.preventDefault();

        const validationErrors = validateRegistrationForm(data);
        setClientErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            return;
        }

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const fields = [
        {
            id: 'name',
            label: 'Nom',
            type: 'text',
            icon: 'user',
            autoComplete: 'name',
            placeholder: 'Votre nom',
        },
        {
            id: 'email',
            label: 'Email',
            type: 'email',
            icon: 'mail',
            autoComplete: 'username',
            placeholder: 'nom@entreprise.com',
        },
        {
            id: 'password',
            label: 'Mot de passe',
            type: 'password',
            icon: 'lock',
            autoComplete: 'new-password',
            placeholder: '********',
        },
        {
            id: 'password_confirmation',
            label: 'Confirmer le mot de passe',
            type: 'password',
            icon: 'lock',
            autoComplete: 'new-password',
            placeholder: '********',
        },
    ];

    return (
        <AuthShell
            mode="register"
            title={isSubscribeFlow ? 'Creez votre compte pour continuer' : 'Creer un compte'}
            subtitle={
                isSubscribeFlow
                    ? 'Inscrivez-vous pour acceder directement au paiement securise Stripe.'
                    : 'Lancez votre espace d analyse financiere en quelques secondes.'
            }
            redirect={redirect}
            intent={intent}
        >
            <Head title="Inscription" />

            <form onSubmit={submit} className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id}>
                        <label htmlFor={field.id} className="text-sm font-semibold text-slate-200">
                            {field.label}
                        </label>
                        <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-black/45 px-4 py-3 focus-within:border-emerald-400/50">
                            <FieldIcon type={field.icon} />
                            <input
                                id={field.id}
                                type={field.type}
                                name={field.id}
                                value={data[field.id]}
                                className="w-full border-0 bg-transparent p-0 text-sm text-white placeholder:text-slate-500 focus:ring-0"
                                placeholder={field.placeholder}
                                autoComplete={field.autoComplete}
                                autoFocus={index === 0}
                                required
                                onChange={(e) => setData(field.id, e.target.value)}
                            />
                        </div>
                        {field.id === 'password' && (
                            <PasswordHints password={data.password} />
                        )}
                        <InputError
                            message={clientErrors[field.id] || errors[field.id]}
                            className="mt-2"
                        />
                    </div>
                ))}

                <button
                    type="submit"
                    disabled={processing}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#18c98f] px-5 py-4 text-sm font-bold text-black shadow-[0_0_30px_rgba(24,201,143,0.25)] transition hover:bg-[#25e0a4] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSubscribeFlow ? 'Continuer vers l abonnement' : 'Creer mon compte'}
                    <span aria-hidden>{'->'}</span>
                </button>
            </form>
        </AuthShell>
    );
}
