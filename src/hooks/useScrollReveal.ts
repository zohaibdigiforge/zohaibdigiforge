import { useEffect, useRef } from 'react';

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Fallback if IntersectionObserver is not supported
    if (!('IntersectionObserver' in window)) {
      el.classList.add('reveal-visible');
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          // Only trigger ONCE for performance & smooth UX
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: options?.threshold ?? 0.1,
      rootMargin: options?.rootMargin ?? '0px 0px -40px 0px',
    });

    observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [options?.threshold, options?.rootMargin]);

  return ref;
}
