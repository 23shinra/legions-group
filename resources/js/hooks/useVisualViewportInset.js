import { useEffect, useState } from 'react';

/**
 * Bottom inset when the on-screen keyboard shrinks the visual viewport (iOS PWA).
 *
 * @returns {{ bottom: number, height: number | null }}
 */
export function useVisualViewportInset(active = true) {
    const [inset, setInset] = useState({ bottom: 0, height: null });

    useEffect(() => {
        if (!active || typeof window === 'undefined') {
            return undefined;
        }

        const viewport = window.visualViewport;
        if (!viewport) {
            return undefined;
        }

        const update = () => {
            const bottom = Math.max(
                0,
                window.innerHeight - viewport.height - viewport.offsetTop,
            );

            setInset({ bottom, height: viewport.height });
        };

        update();
        viewport.addEventListener('resize', update);
        viewport.addEventListener('scroll', update);

        return () => {
            viewport.removeEventListener('resize', update);
            viewport.removeEventListener('scroll', update);
        };
    }, [active]);

    return inset;
}

export function scrollFieldIntoView(event) {
    window.requestAnimationFrame(() => {
        event.currentTarget?.scrollIntoView({
            block: 'center',
            behavior: 'smooth',
        });
    });
}
