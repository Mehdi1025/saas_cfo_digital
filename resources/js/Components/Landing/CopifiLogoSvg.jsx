import { forwardRef } from 'react';

/**
 * Lockup horizontal Copifi — paths avec stroke pour animation GSAP (draw → fill).
 * viewBox calibré pour centrage preloader.
 */
const CopifiLogoSvg = forwardRef(function CopifiLogoSvg({ className = '' }, ref) {
    return (
        <svg
            ref={ref}
            viewBox="0 0 320 72"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-hidden
        >
            {/* Marque — lobe gauche */}
            <path
                data-logo-part="mark"
                d="M18 36C18 24.5 28.5 19 38 26.5C43.5 30.5 43.5 41.5 38 45.5C28.5 53 18 47.5 18 36Z"
                stroke="#B8E8D0"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="transparent"
            />
            {/* Marque — lobe droit */}
            <path
                data-logo-part="mark"
                d="M42 36C42 24.5 52.5 19 62 26.5C67.5 30.5 67.5 41.5 62 45.5C52.5 53 42 47.5 42 36Z"
                stroke="#B8E8D0"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="transparent"
            />
            {/* Mot-symbole — C */}
            <path
                data-logo-part="word"
                d="M92 48C84 48 80 42 80 36C80 30 84 24 92 24C96 24 99 25.5 101.5 28"
                stroke="#B8E8D0"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="transparent"
            />
            {/* o */}
            <path
                data-logo-part="word"
                d="M108 36C108 30 111.5 24 118 24C124.5 24 128 30 128 36C128 42 124.5 48 118 48C111.5 48 108 42 108 36Z"
                stroke="#B8E8D0"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="transparent"
            />
            {/* p */}
            <path
                data-logo-part="word"
                d="M136 48V24M136 36C136 30 139.5 24 146 24C152.5 24 156 30 156 36C156 42 152.5 48 146 48C139.5 48 136 42 136 36Z"
                stroke="#B8E8D0"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="transparent"
            />
            {/* i (stem + dot) */}
            <path
                data-logo-part="word"
                d="M164 48V30M164 24V24.01"
                stroke="#B8E8D0"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="transparent"
            />
            {/* F */}
            <path
                data-logo-part="word"
                d="M178 48V24M178 24H192M178 36H188"
                stroke="#B8E8D0"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="transparent"
            />
            {/* i (stem + dot) */}
            <path
                data-logo-part="word"
                d="M200 48V30M200 24V24.01"
                stroke="#B8E8D0"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="transparent"
            />
        </svg>
    );
});

export default CopifiLogoSvg;
