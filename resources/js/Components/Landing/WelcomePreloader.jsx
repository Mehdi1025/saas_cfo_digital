import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import CopifiLogoSvg from '@/Components/Landing/CopifiLogoSvg';

const BRAND_FILL = '#B8E8D0';
const PRELOADER_BG = '#0a0a0a';

function prefersReducedMotion() {
    return typeof window !== 'undefined'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function WelcomePreloader({ onComplete }) {
    const overlayRef = useRef(null);
    const panelRef = useRef(null);
    const logoWrapRef = useRef(null);
    const svgRef = useRef(null);

    useEffect(() => {
        const overlay = overlayRef.current;
        const panel = panelRef.current;
        const logoWrap = logoWrapRef.current;
        const svg = svgRef.current;

        if (!overlay || !panel || !logoWrap || !svg) {
            onComplete?.();
            return;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        if (prefersReducedMotion()) {
            gsap.set(overlay, { display: 'none' });
            document.body.style.overflow = previousOverflow;
            onComplete?.();
            return;
        }

        const paths = svg.querySelectorAll('path');
        paths.forEach((path) => {
            const length = path.getTotalLength();
            gsap.set(path, {
                strokeDasharray: length,
                strokeDashoffset: length,
                fill: 'transparent',
                stroke: BRAND_FILL,
            });
        });

        gsap.set(logoWrap, {
            transformOrigin: '50% 50%',
            force3D: true,
        });

        gsap.set(panel, {
            force3D: true,
        });

        const tl = gsap.timeline({
            defaults: { ease: 'power3.inOut' },
            onComplete: () => {
                document.body.style.overflow = previousOverflow;
                overlay.remove();
                onComplete?.();
            },
        });

        // Phase 1 — draw strokes
        tl.to(paths, {
            strokeDashoffset: 0,
            duration: 1.85,
            stagger: 0.1,
            ease: 'power3.inOut',
        });

        // Phase 2 — liquid fill
        tl.to(
            paths,
            {
                fill: BRAND_FILL,
                duration: 0.65,
                ease: 'power2.inOut',
            },
            '-=0.35',
        );

        // Phase 3 — morph zoom + curtain reveal
        tl.to(
            logoWrap,
            {
                scale: 28,
                opacity: 0,
                duration: 1.15,
                ease: 'power3.inOut',
            },
            '+=0.15',
        );

        tl.to(
            panel,
            {
                yPercent: -100,
                duration: 1.05,
                ease: 'power4.inOut',
            },
            '-=0.82',
        );

        return () => {
            tl.kill();
            document.body.style.overflow = previousOverflow;
        };
    }, [onComplete]);

    return (
        <div
            ref={overlayRef}
            id="copifi-preloader"
            className="fixed inset-0 z-[9999] overflow-hidden"
            aria-hidden="true"
        >
            <div
                ref={panelRef}
                className="absolute inset-0 flex items-center justify-center will-change-transform"
                style={{ backgroundColor: PRELOADER_BG }}
            >
                <div
                    ref={logoWrapRef}
                    className="relative flex w-[min(88vw,22rem)] items-center justify-center will-change-transform sm:w-[min(72vw,26rem)]"
                >
                    <CopifiLogoSvg
                        ref={svgRef}
                        className="h-auto w-full"
                    />
                </div>
            </div>
        </div>
    );
}
