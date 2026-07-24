const SIZES = {
    sm: 'h-7 sm:h-8',
    md: 'h-8 sm:h-9',
    lg: 'h-9 sm:h-10 md:h-11',
};

export default function CopifiLogo({ size = 'md', className = '', blend = true }) {
    const height = SIZES[size] ?? SIZES.md;

    return (
        <img
            src="/images/copifi-logo.png"
            alt="Copifi"
            className={`w-auto max-w-[9.5rem] select-none object-contain object-left sm:max-w-[10.5rem] ${height} ${
                blend ? 'mix-blend-screen' : ''
            } ${className}`}
            draggable={false}
        />
    );
}
