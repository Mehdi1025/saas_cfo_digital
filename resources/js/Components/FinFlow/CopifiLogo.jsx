const SIZES = {
    sm: 'h-8 sm:h-9',
    md: 'h-10 sm:h-11',
    lg: 'h-11 sm:h-12 md:h-[3.25rem]',
    nav: 'h-10 sm:h-11 md:h-12 lg:h-[3.35rem]',
};

export default function CopifiLogo({ size = 'md', className = '', blend = false, priority = false }) {
    const height = SIZES[size] ?? SIZES.md;

    return (
        <img
            src="/images/copifi-logo.png"
            alt="Copifi"
            width={152}
            height={48}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
            className={`w-auto min-w-[7.5rem] select-none object-contain object-left sm:min-w-[8.5rem] md:min-w-[9.5rem] ${height} ${
                blend ? 'mix-blend-screen' : ''
            } ${className}`}
            draggable={false}
        />
    );
}
