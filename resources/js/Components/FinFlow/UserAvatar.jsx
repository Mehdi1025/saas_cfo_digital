import { userAvatarGradient, userInitials } from '@/utils/user';

const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
};

export default function UserAvatar({ user, size = 'md', className = '' }) {
    const initials = userInitials(user?.name);
    const gradient = userAvatarGradient(user?.email ?? user?.name ?? '');

    return (
        <div
            className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white ring-1 ring-white/15 ${gradient} ${sizeClasses[size] ?? sizeClasses.md} ${className}`}
            aria-hidden="true"
        >
            {initials}
        </div>
    );
}
