/**
 * Lockup horizontal Copifi (nav, emails, footer).
 * L’espacement marque + mot est figé dans l’asset : ne scaler que proportionnellement (hauteur).
 */
const LOCKUPS = {
    horizontal: '/images/copifi-logo.png',
};

const SIZES = {
    sm: 'h-8 sm:h-9',
    md: 'h-10 sm:h-11',
    lg: 'h-11 sm:h-12 md:h-[3.25rem]',
    nav: 'h-10 sm:h-11 md:h-12 lg:h-[3.35rem]',
};

export default function CopifiLogo({
    lockup = 'horizontal',
    size = 'md',
    className = '',
    blend = true,
}) {
    const src = LOCKUPS[lockup] ?? LOCKUPS.horizontal;
    const height = SIZES[size] ?? SIZES.md;

    return (
        <img
            src={src}
            alt="Copifi"
            className={`block w-auto shrink-0 select-none object-contain object-left ${height} ${
                blend ? 'mix-blend-screen' : ''
            } ${className}`}
            draggable={false}
        />
    );
}
