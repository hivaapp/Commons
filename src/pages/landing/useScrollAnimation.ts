import { useEffect, useRef } from 'react';

export function useScrollAnimation(options?: IntersectionObserverInit) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.classList.add('landed-visible');
                    observer.unobserve(el);
                }
            },
            { threshold: 0.15, rootMargin: '0px 0px -50px 0px', ...options }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return ref;
}

export function useCountUp(
    target: number,
    duration = 1500,
    prefix = '',
    suffix = '',
    decimals = 0
) {
    const ref = useRef<HTMLSpanElement>(null);
    const started = useRef(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !started.current) {
                    started.current = true;
                    const start = performance.now();

                    function tick(now: number) {
                        const elapsed = now - start;
                        const progress = Math.min(elapsed / duration, 1);
                        const eased = 1 - Math.pow(1 - progress, 3);
                        const current = eased * target;

                        if (el) {
                            const formatted = decimals > 0
                                ? current.toFixed(decimals)
                                : Math.floor(current).toLocaleString('en-IN');
                            el.textContent = `${prefix}${formatted}${suffix}`;
                        }

                        if (progress < 1) requestAnimationFrame(tick);
                    }

                    requestAnimationFrame(tick);
                    observer.unobserve(el);
                }
            },
            { threshold: 0.3 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [target, duration, prefix, suffix, decimals]);

    return ref;
}

export function useBarAnimation() {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.classList.add('bars-animate');
                    observer.unobserve(el);
                }
            },
            { threshold: 0.2 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return ref;
}

export const fadeUpClass = 'landed-section';
export const staggerChild = (i: number) => ({ transitionDelay: `${i * 0.1}s` } as React.CSSProperties);
