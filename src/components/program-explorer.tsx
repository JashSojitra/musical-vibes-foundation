"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Program, MediaAsset } from "@/types/content";

export default function ProgramExplorer({
  programs,
  media,
}: {
  programs: Program[];
  media: MediaAsset[];
}) {
  const [selected, setSelected] = useState(programs[0].slug);
  const preview = useRef<HTMLDivElement>(null);
  const program =
    programs.find((item) => item.slug === selected) ?? programs[0];
  const image = media.find((item) => item.id === program.imageId)!;
  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    void import("gsap").then(({ gsap }) => {
      if (cancelled) return;
      const context = gsap.context(
        () =>
          gsap.fromTo(
            ".program-preview-image",
            { scale: 1.035, clipPath: "inset(0 0 8% 0)" },
            {
              scale: 1,
              clipPath: "inset(0 0 0% 0)",
              duration: 0.6,
              ease: "power2.out",
            },
          ),
        preview,
      );
      cleanup = () => context.revert();
    });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [selected]);
  return (
    <div className="program-explorer wrap">
      <div className="program-index">
        {programs.map((item) => (
          <Link
            key={item.slug}
            href={`/programs/${item.slug}`}
            className={`program-row ${selected === item.slug ? "is-selected" : ""}`}
            onMouseEnter={() => setSelected(item.slug)}
            onFocus={() => setSelected(item.slug)}
          >
            <span className="program-index-number">{item.number}</span>
            <div>
              <span className="eyebrow">{item.category}</span>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
            </div>
            <span className="program-row-arrow" aria-hidden="true">
              ↗
            </span>
          </Link>
        ))}
      </div>
      <aside
        className={`program-preview theme-${program.theme}`}
        ref={preview}
        aria-label="Program preview"
      >
        <div className="program-preview-image">
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            sizes="(max-width: 900px) 100vw, 40vw"
            style={{ objectPosition: image.position }}
          />
        </div>
        <div className="program-preview-copy">
          <span className="eyebrow">A WAY TO CONNECT / {program.number}</span>
          <p>{program.headline}</p>
          <span className="preview-caption">{program.imageContext}</span>
        </div>
      </aside>
    </div>
  );
}
