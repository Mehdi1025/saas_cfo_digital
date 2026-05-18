import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

export default function DeleteUserForm({ className = '' }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        clearErrors();
        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header>
                <h2 className="font-display text-lg font-semibold tracking-wide text-white">
                    Supprimer le compte
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                    Une fois votre compte supprime, toutes ses ressources et ses donnees seront supprimees definitivement.
                    Pensez a telecharger les informations que vous souhaitez conserver avant de continuer.
                </p>
            </header>

            <DangerButton
                onClick={confirmUserDeletion}
                className="rounded-lg border border-rose-400/30 bg-rose-400/10 text-rose-100 hover:bg-rose-400/20 focus:bg-rose-400/20 focus:ring-rose-400"
            >
                Supprimer le compte
            </DangerButton>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form
                    onSubmit={deleteUser}
                    className="border border-white/10 bg-obsidian p-6 text-white shadow-xl"
                >
                    <h2 className="font-display text-lg font-semibold text-white">
                        Etes-vous sur de vouloir supprimer votre compte ?
                    </h2>

                    <p className="mt-1 text-sm text-gray-400">
                        Une fois votre compte supprime, toutes ses ressources et ses donnees seront supprimees definitivement.
                        Veuillez saisir votre mot de passe pour confirmer la suppression definitive de votre compte.
                    </p>

                    <div className="mt-6">
                        <InputLabel
                            htmlFor="password"
                            value="Mot de passe"
                            className="sr-only text-gray-300"
                        />

                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            className="mt-1 block w-3/4 border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:border-neonMint focus:ring-neonMint"
                            isFocused
                            placeholder="Mot de passe"
                        />

                        <InputError
                            message={errors.password}
                            className="mt-2"
                        />
                    </div>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton
                            onClick={closeModal}
                            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                        >
                            Annuler
                        </SecondaryButton>

                        <DangerButton
                            className="ms-3 border-rose-400/30 bg-rose-400/10 text-rose-100 hover:bg-rose-400/20"
                            disabled={processing}
                        >
                            Supprimer le compte
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
