import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

export default function UpdatePasswordForm({ className = '' }) {
    const [isEditingPassword, setIsEditingPassword] = useState(false);

    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
        recentlySuccessful,
        clearErrors,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setIsEditingPassword(false);
            },
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current.focus();
                }
            },
        });
    };

    const cancelEditing = () => {
        reset();
        clearErrors();
        setIsEditingPassword(false);
    };

    return (
        <section className={className}>
            <header>
                <h2 className="font-display text-lg font-semibold tracking-wide text-white">
                    Modifier le mot de passe
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                    Utilisez un mot de passe long et aleatoire pour mieux securiser votre compte.
                </p>
            </header>

            {!isEditingPassword ? (
                <div className="mt-6">
                    <PrimaryButton
                        onClick={() => setIsEditingPassword(true)}
                        className="border-neonMint/20 bg-neonMint px-5 text-obsidian hover:bg-neonMint/90 focus:bg-neonMint/90 focus:ring-neonMint"
                    >
                        Modifier le mot de passe
                    </PrimaryButton>
                </div>
            ) : (
                <form onSubmit={updatePassword} className="mt-6 space-y-6">
                    <div>
                        <InputLabel
                            htmlFor="current_password"
                            value="Mot de passe actuel"
                            className="text-gray-300"
                        />

                        <TextInput
                            id="current_password"
                            ref={currentPasswordInput}
                            value={data.current_password}
                            onChange={(e) =>
                                setData('current_password', e.target.value)
                            }
                            type="password"
                            className="mt-1 block w-full border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:border-neonMint focus:ring-neonMint"
                            autoComplete="current-password"
                        />

                        <InputError
                            message={errors.current_password}
                            className="mt-2"
                        />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="password"
                            value="Nouveau mot de passe"
                            className="text-gray-300"
                        />

                        <TextInput
                            id="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            type="password"
                            className="mt-1 block w-full border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:border-neonMint focus:ring-neonMint"
                            autoComplete="new-password"
                        />

                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="password_confirmation"
                            value="Confirmer le mot de passe"
                            className="text-gray-300"
                        />

                        <TextInput
                            id="password_confirmation"
                            value={data.password_confirmation}
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                            type="password"
                            className="mt-1 block w-full border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:border-neonMint focus:ring-neonMint"
                            autoComplete="new-password"
                        />

                        <InputError
                            message={errors.password_confirmation}
                            className="mt-2"
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <PrimaryButton
                            disabled={processing}
                            className="border-neonMint/20 bg-neonMint px-5 text-obsidian hover:bg-neonMint/90 focus:bg-neonMint/90 focus:ring-neonMint"
                        >
                            Enregistrer
                        </PrimaryButton>

                        <SecondaryButton
                            onClick={cancelEditing}
                            type="button"
                            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                        >
                            Annuler
                        </SecondaryButton>

                        <Transition
                            show={recentlySuccessful}
                            enter="transition ease-in-out"
                            enterFrom="opacity-0"
                            leave="transition ease-in-out"
                            leaveTo="opacity-0"
                        >
                            <p className="text-sm text-neonMint">
                                Enregistre.
                            </p>
                        </Transition>
                    </div>
                </form>
            )}
        </section>
    );
}
