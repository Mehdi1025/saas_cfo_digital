import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { useForm, usePage } from '@inertiajs/react';

export default function UpdateProfileInformation({ className = '' }) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
        });

    const submit = (e) => {
        e.preventDefault();

        patch(route('profile.update'));
    };

    return (
        <section className={className}>
            <header>
                <h2 className="font-display text-lg font-semibold tracking-wide text-white">
                    Informations du profil
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                    Mettez a jour les informations de votre compte et votre adresse e-mail.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="name" value="Nom" className="text-gray-300" />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:border-neonMint focus:ring-neonMint"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="E-mail" className="text-gray-300" />

                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:border-neonMint focus:ring-neonMint"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />

                    <InputError className="mt-2" message={errors.email} />
                </div>

                <div className="flex items-center gap-4">
                    <PrimaryButton
                        disabled={processing}
                        className="border-neonMint/20 bg-neonMint px-5 text-obsidian hover:bg-neonMint/90 focus:bg-neonMint/90 focus:ring-neonMint"
                    >
                        Enregistrer
                    </PrimaryButton>

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
        </section>
    );
}
