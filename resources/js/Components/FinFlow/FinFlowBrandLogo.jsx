const SIZES = {
    sm: { frame: 'h-7', asset: 'h-14' },
    md: { frame: 'h-9', asset: 'h-[4.5rem]' },
    lg: { frame: 'h-11', asset: 'h-[5.5rem]' },
};

/**
 * logo.png contient deux versions empilées : couleur (haut) et blanc (bas).
 */
export default function FinFlowBrandLogo({ variant = 'color', size = 'md', className = '' }) {
    const { frame, asset } = SIZES[size] ?? SIZES.md;
    const isWhite = variant === 'white';

    return (
        <span className={`inline-flex shrink-0 items-center overflow-hidden ${frame} ${className}`}>
            <img
                src="/images/finflow-logo.png"
                alt="Copifi"
                className={`${asset} w-auto max-w-none select-none object-contain object-left ${
                    isWhite ? 'translate-y-[-50%] object-bottom' : 'object-top'
                }`}
                draggable={false}
            />
        </span>
    );
}
