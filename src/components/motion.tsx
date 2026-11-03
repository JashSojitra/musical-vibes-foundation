"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export default function Motion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const lastPath = useRef(pathname);

  useEffect(() => {
    if (lastPath.current !== pathname) {
      document.getElementById("main")?.focus({ preventScroll: true });
      lastPath.current = pathname;
    }
    let cancelled = false;
    let dispose: (() => void) | undefined;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
      .then(([{ gsap }, { ScrollTrigger }]) => {
        if (cancelled || !root.current) return;
        gsap.registerPlugin(ScrollTrigger);
        const mm = gsap.matchMedia();
        mm.add("(prefers-reduced-motion: no-preference)", () => {
          const context = gsap.context(() => {
            const title = root.current?.querySelector("[data-title]");
            if (title)
              gsap.from(title, {
                y: 25,
                duration: 1.1,
                ease: "power3.out",
                clearProps: "transform",
              });
            gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
              gsap.from(el, {
                y: 26,
                duration: 0.85,
                ease: "power3.out",
                scrollTrigger: { trigger: el, start: "top 94%", once: true },
                clearProps: "transform",
              });
            });
            gsap.utils
              .toArray<HTMLElement>("[data-image] .photo-frame")
              .forEach((el) => {
                gsap.from(el, {
                  clipPath: "inset(0 0 6% 0)",
                  duration: 1.2,
                  ease: "power2.out",
                  scrollTrigger: { trigger: el, start: "top 95%", once: true },
                  clearProps: "clipPath",
                });
              });
            const heroPhoto = root.current?.querySelector(".hero-photo");
            if (heroPhoto)
              gsap.to(heroPhoto, {
                yPercent: 12,
                ease: "none",
                scrollTrigger: {
                  trigger: ".home-hero",
                  start: "top top",
                  end: "bottom top",
                  scrub: 0.6,
                },
              });
            const line = root.current?.querySelector(".connection-rule");
            if (line)
              gsap.from(line, {
                scaleX: 0.15,
                transformOrigin: "left",
                ease: "none",
                scrollTrigger: {
                  trigger: line,
                  start: "top 95%",
                  end: "top 35%",
                  scrub: 1,
                },
              });
          }, root);
          return () => context.revert();
        });
        dispose = () => mm.revert();
        ScrollTrigger.refresh();
      })
      .catch(() => {
        /* The server-rendered document remains fully readable. */
      });
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [pathname]);

  return (
    <div ref={root} className="page-motion">
      {children}
    </div>
  );
}
