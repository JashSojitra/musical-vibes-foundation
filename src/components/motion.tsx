'use client';
import { useEffect, useRef } from 'react';
/** Enhancement only: the entire document remains visible without JavaScript. */
export default function Motion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let cancelled = false;
    let dispose: (() => void) | undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (cancelled || !root.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const context = gsap.context(() => {
          gsap.from('.hero-title > span', { yPercent: 25, stagger: .13, duration: 1.2, ease: 'power3.out' });
          gsap.from('.hero-bottom', { y: 18, duration: .9, delay: .45 });
          gsap.to('.hero-photo', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
          gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach(el => gsap.from(el, { y: 32, duration: .85, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 94%', once: true } }));
          gsap.fromTo('.rhythm-line', { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.story', start: 'top 80%', end: 'bottom 65%', scrub: .5 } });
          gsap.to('.record', { rotation: 70, ease: 'none', scrollTrigger: { trigger: '.music-chapter', start: 'top bottom', end: 'bottom top', scrub: 1 } });
          gsap.from('.wellness-word', { xPercent: -12, ease: 'none', scrollTrigger: { trigger: '.wellness-chapter', start: 'top bottom', end: 'bottom top', scrub: 1 } });
          gsap.to('.chapter-progress', { scaleX: 1, transformOrigin: 'left', ease: 'none', scrollTrigger: { trigger: '#programs', start: 'top bottom', end: 'bottom bottom', scrub: true } });
        }, root);
        return () => context.revert();
      });
      dispose = () => mm.revert();
    }).catch(() => { /* Static content remains available if enhancement cannot load. */ });
    return () => { cancelled = true; dispose?.(); };
  }, []);
  return <div ref={root}>{children}</div>;
}
