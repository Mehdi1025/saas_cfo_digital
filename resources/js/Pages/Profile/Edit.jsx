import AppDashboardLayout from '@/Layouts/AppDashboardLayout';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

const GLASS_PANEL =
    'border border-glassBorder bg-[linear-gradient(145deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.01)_100%)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-[20px]';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AppDashboardLayout title="Profil">
            <div className="mx-auto max-w-5xl space-y-6">
                <div className={`${GLASS_PANEL} rounded-3xl p-6 sm:p-8`}>
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                        className="max-w-xl"
                    />
                </div>

                <div className={`${GLASS_PANEL} rounded-3xl p-6 sm:p-8`}>
                    <UpdatePasswordForm className="max-w-xl" />
                </div>

                <div className={`${GLASS_PANEL} rounded-3xl p-6 sm:p-8`}>
                    <DeleteUserForm className="max-w-xl" />
                </div>
            </div>
        </AppDashboardLayout>
    );
}
