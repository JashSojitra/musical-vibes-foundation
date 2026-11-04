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

    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
      .then(([{ gsap }, { ScrollTrigger }]) => {
        if (cancelled || !root.current) return;
        gsap.registerPlugin(ScrollTrigger);
        const mm = gsap.matchMedia();
        mm.add(
          {
            motion: "(prefers-reduced-motion: no-preference)",
            mobile: "(max-width: 700px)",
            desktop: "(min-width: 701px)",
          },
          (mediaContext) => {
            if (!mediaContext.conditions?.motion) return;
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
                    scrollTrigger: {
                      trigger: el,
                      start: "top 95%",
                      once: true,
                    },
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
              const symphonyPhoto =
                root.current?.querySelector(".symphony-photo");
              if (symphonyPhoto)
                gsap.to(symphonyPhoto, {
                  y: 65,
                  ease: "none",
                  scrollTrigger: {
                    trigger: ".symphony-hero",
                    start: "top top",
                    end: "bottom top",
                    scrub: 0.8,
                  },
                });
              // The circle leads; the smaller picnic photograph catches up as the
              // story comes into view. Mobile keeps shorter travel and no pinning.
              const story = root.current?.querySelector(".symphony-story");
              if (story) {
                const mobile = mediaContext.conditions?.mobile;
                const timeline = gsap.timeline({
                  scrollTrigger: {
                    trigger: story,
                    start: "top 90%",
                    end: "bottom 75%",
                    scrub: 0.8,
                  },
                });
                timeline
                  .fromTo(
                    "[data-story-depth='main']",
                    { y: mobile ? 16 : 40 },
                    { y: mobile ? -8 : -24, ease: "none" },
                    0,
                  )
                  .fromTo(
                    "[data-story-depth='detail']",
                    { y: mobile ? 28 : 85 },
                    { y: mobile ? -8 : -35, ease: "none" },
                    0.1,
                  );
                gsap.from(".story-heading h2", {
                  y: 22,
                  duration: 1,
                  ease: "power3.out",
                  clearProps: "transform",
                  scrollTrigger: {
                    trigger: ".story-heading",
                    start: "top 90%",
                    once: true,
                  },
                });
              }
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
          },
        );
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
