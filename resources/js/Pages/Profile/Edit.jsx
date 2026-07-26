import AppDashboardLayout from '@/Layouts/AppDashboardLayout';
import DeleteUserForm from './Partials/DeleteUserForm';
import ManageSubscriptionForm from './Partials/ManageSubscriptionForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { Link } from '@inertiajs/react';
import { useEffect } from 'react';

const GLASS_PANEL =
    'border border-glassBorder bg-[linear-gradient(145deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.01)_100%)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-[20px]';

export default function Edit({ subscription }) {
    useEffect(() => {
        if (window.location.hash === '#subscription') {
            document.getElementById('subscription')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }
    }, []);

    return (
        <AppDashboardLayout title="Profil">
            <div className="selection:bg-neonBlue selection:text-obsidian relative -m-8 min-h-full bg-obsidian bg-neon-gradient px-8 pb-8 pt-8 font-display">
                <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                    <div className="absolute left-[-10%] top-[-20%] h-[50%] w-[50%] rounded-full bg-neonBlue/20 blur-[150px]" />
                    <div className="absolute bottom-[-20%] right-[-10%] h-[40%] w-[40%] rounded-full bg-neonMint/10 blur-[120px]" />
                </div>

                <div className="relative z-0 mx-auto max-w-5xl space-y-6">
                    <div className={`${GLASS_PANEL} rounded-3xl p-6 sm:p-8`}>
                        <ManageSubscriptionForm subscription={subscription} />
                    </div>

                    <div className={`${GLASS_PANEL} rounded-3xl p-6 sm:p-8`}>
                        <UpdateProfileInformationForm className="max-w-xl" />
                    </div>

                    <div className={`${GLASS_PANEL} rounded-3xl p-6 sm:p-8`}>
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    <div className={`${GLASS_PANEL} rounded-3xl p-6 sm:p-8`}>
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="font-display text-lg font-semibold tracking-wide text-white">
                                    Session
                                </h2>
                                <p className="mt-1 text-sm text-gray-400">
                                    Deconnectez-vous de votre compte sur cet appareil.
                                </p>
                            </div>
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                            >
                                Se deconnecter
                            </Link>
                        </div>
                    </div>

                    <div className={`${GLASS_PANEL} rounded-3xl p-6 sm:p-8`}>
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </AppDashboardLayout>
    );
}
