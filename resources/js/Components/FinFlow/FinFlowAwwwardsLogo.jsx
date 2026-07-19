import { useState } from 'react';

const EASE = 'duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]';
const EASE_SLOW = 'duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]';

function FinFlowIcon({ isHovered }) {
    return (
        <svg viewBox="0 0 36 40" fill="none" className="h-full w-full" aria-hidden>
            {/* Document — contour avec coin plié */}
            <g
                className={`origin-center transition-transform ${EASE} ${
                    isHovered ? '-rotate-[8deg] scale-[0.96]' : 'rotate-0 scale-100'
                }`}
            >
                <path
                    d="M8 3.5h13.5L28 10v26.5H8V3.5z"
                    className="stroke-emerald-400 transition-colors duration-500"
                    strokeWidth="2.2"
                    strokeLinejoin="round"
                    fill="none"
                />
                <path
                    d="M21.5 3.5V10h6.5"
                    className="stroke-emerald-400 transition-colors duration-500"
                    strokeWidth="2.2"
                    strokeLinejoin="round"
                    fill="none"
                />
            </g>

            {/* Courbe de flux — segment gauche (emerald) */}
            <path
                d="M1 21.5C5.5 25 9.5 23.5 13 19.5"
                className={`origin-center stroke-emerald-400 transition-all ${EASE} ${
                    isHovered ? 'translate-x-[-1px] translate-y-[2px] rotate-[-4deg]' : 'translate-x-0 translate-y-0 rotate-0'
                }`}
                strokeWidth="2.4"
                strokeLinecap="round"
                fill="none"
            />

            {/* Courbe de flux — segment droit (lime, montée) */}
            <path
                d="M13 19.5C16.5 14.5 22 10.5 30 7.5"
                className={`origin-[13px_19.5px] stroke-[#CCFF00] transition-all ${EASE} ${
                    isHovered ? 'translate-x-[1px] translate-y-[-2px] rotate-[6deg] scale-105' : 'translate-x-0 translate-y-0 rotate-0 scale-100'
                }`}
                strokeWidth="2.4"
                strokeLinecap="round"
                fill="none"
            />
        </svg>
    );
}

export default function FinFlowAwwwardsLogo({ className = '' }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className={`group relative flex cursor-pointer select-none items-center gap-2.5 p-1 ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                className={`pointer-events-none absolute left-[38%] top-1/2 -z-10 h-14 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/25 blur-[22px] transition-all ${EASE_SLOW} ${
                    isHovered ? 'scale-[1.6] opacity-100' : 'scale-50 opacity-0'
                }`}
            />

            <div
                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center transition-transform ${EASE} ${
                    isHovered ? 'scale-105' : 'scale-100'
                }`}
            >
                <FinFlowIcon isHovered={isHovered} />
            </div>

            <div className="relative z-10 overflow-hidden">
                <span
                    className={`ff-serif block text-[1.35rem] leading-none transition-all ${EASE} ${
                        isHovered
                            ? 'bg-gradient-to-r from-white via-emerald-100 to-white bg-clip-text tracking-[0.04em] text-transparent'
                            : 'tracking-tight text-white'
                    }`}
                >
                    Copifi
                </span>
            </div>
        </div>
    );
}
