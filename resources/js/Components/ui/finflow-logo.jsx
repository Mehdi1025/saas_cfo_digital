/**
 * Logo Copifi — icône F bleue + « inFlow » (le F graphique remplace la première lettre).
 */
export default function FinFlowLogo({ className = '' }) {
    return (
        <svg
            width="200"
            height="72"
            viewBox="0 0 130 57"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`mx-auto ${className}`}
            role="img"
            aria-label="Copifi"
        >
            {/* Icône F — remontée pour s’aligner sur la ligne du texte */}
            <g transform="translate(0, -6)">
                <rect y="17.4019" width="31" height="7" rx="3.5" fill="#2563EB" />
                <rect y="28.4019" width="7" height="15" rx="3.5" fill="#60A5FA" />
                <rect y="28.4019" width="15" height="7" rx="3.5" fill="#2563EB" />
                <rect
                    x="17"
                    y="28.4019"
                    width="7"
                    height="7"
                    rx="3.5"
                    fill="#2563EB"
                />
            </g>

            {/* « inFlow » — directement après le F bleu */}
            <text
                x="34"
                y="37"
                fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
                fontSize="22"
                fontWeight="600"
                fill="#111827"
            >
                Copifi
            </text>

            {/* Arc devant le « w » */}
            <g transform="translate(-6, -2)">
                <path
                    d="M95.149 47.1186C98.8017 48.4234 102.755 48.638 106.527 47.7361C110.3 46.8342 113.729 44.8548 116.396 42.0389C119.064 39.2231 120.855 35.6923 121.552 31.8767C122.248 28.061 121.821 24.125 120.32 20.5482C118.82 16.9713 116.312 13.9079 113.102 11.7311C109.891 9.55418 106.117 8.35776 102.239 8.28752C98.3611 8.21728 94.5462 9.27624 91.2592 11.3354C87.9722 13.3946 85.3548 16.3652 83.726 19.8854L85.5862 20.7462C87.0481 17.5868 89.3972 14.9206 92.3473 13.0725C95.2975 11.2243 98.7214 10.2739 102.202 10.3369C105.683 10.3999 109.07 11.4737 111.951 13.4275C114.833 15.3813 117.084 18.1308 118.43 21.341C119.777 24.5513 120.161 28.0839 119.535 31.5085C118.91 34.9331 117.302 38.102 114.908 40.6293C112.514 43.1565 109.437 44.9331 106.051 45.7425C102.665 46.552 99.1169 46.3594 95.8385 45.1884L95.149 47.1186Z"
                    fill="#2563EB"
                />
                <path
                    d="M87.4035 42.0871C89.1265 43.8938 91.1725 45.3619 93.4359 46.4156L94.301 44.5574C92.2696 43.6117 90.4333 42.294 88.8869 40.6725L87.4035 42.0871Z"
                    fill="#60A5FA"
                />
            </g>
        </svg>
    );
}
