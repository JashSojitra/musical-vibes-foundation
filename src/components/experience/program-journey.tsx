"use client";
import { unavailableMedia } from "@/lib/media-placeholder";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import type { MediaAsset, Program } from "@/types/content";
import { Arrow, TextLink } from "../ui";

export default function ProgramJourney({
  programs,
  media,
}: {
  programs: Program[];
  media: MediaAsset[];
}) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    let disposed = false;
    let revert: (() => void) | undefined;
    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([{ gsap }, { ScrollTrigger }]) => {
        if (disposed || !root.current) return;
        gsap.registerPlugin(ScrollTrigger);
        const mm = gsap.matchMedia();
        mm.add(
          "(min-width: 981px) and (prefers-reduced-motion: no-preference)",
          () => {
            const context = gsap.context(() => {
              const cards = gsap.utils.toArray<HTMLElement>(".journey-card");
              cards.slice(0, -1).forEach((card, i) =>
                gsap.to(card, {
                  scale: 0.955,
                  transformOrigin: "center top",
                  ease: "none",
                  scrollTrigger: {
                    trigger: cards[i + 1],
                    start: "top 85%",
                    end: "top 145px",
                    scrub: 0.6,
                  },
                }),
              );
            }, root);
            return () => context.revert();
          },
        );
        revert = () => mm.revert();
        ScrollTrigger.refresh();
      },
    );
    return () => {
      disposed = true;
      revert?.();
    };
  }, []);
  return (
    <section
      className="program-journey"
      id="journey"
      ref={root}
      aria-labelledby="journey-title"
    >
      <div className="chapter-rule">
        <span>02 / Find your rhythm</span>
        <span>Our programs</span>
      </div>
      <div className="journey-layout">
        <div className="journey-intro">
          <p className="symphony-kicker">Different paths. One purpose.</p>
          <h2 id="journey-title">
            Small moments.
            <br />
            <em>Lasting connection.</em>
          </h2>
          <p>
            Come for a familiar song. Make space for a calmer day. Find your
            place in the circle.
          </p>
          <TextLink href="/programs">Explore all six programs</TextLink>
          <span className="journey-scroll-note">
            Scroll to discover <Arrow down />
          </span>
        </div>
        <div className="journey-cards">
          {programs.slice(0, 3).map((program, index) => {
            const photo =
              media.find((item) => item.id === program.imageId) ??
              unavailableMedia;
            return (
              <article
                className={`journey-card journey-card-${index}`}
                key={program.slug}
              >
                <div className="journey-image">
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes="(max-width: 980px) 90vw, 43vw"
                    style={{ objectPosition: photo.position }}
                  />
                  <span>{program.imageContext}</span>
                </div>
                <div className="journey-card-copy">
                  <span className="journey-number">
                    {program.number}
                    <small> / 06</small>
                  </span>
                  <p className="symphony-kicker">{program.category}</p>
                  <h3>{program.headline}</h3>
                  <p>{program.description}</p>
                  <Link href={`/programs/${program.slug}`}>
                    {program.title}
                    <Arrow />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
      <div className="journey-footer">
        <p>There’s more than one way to connect.</p>
        <div>
          {programs.slice(3).map((program) => (
            <Link key={program.slug} href={`/programs/${program.slug}`}>
              <small>{program.number}</small>
              {program.title}
              <Arrow />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
