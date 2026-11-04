"use client";
import ArrowIcon from "@/components/arrow-icon";

import Image from "next/image";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import type { MediaAsset } from "@/types/content";
import { TextLink } from "../ui";

export default function CommunityMemories({
  photos,
}: {
  photos: MediaAsset[];
}) {
  const [active, setActive] = useState(0);
  return (
    <section
      className="community-memories"
      id="memories"
      aria-labelledby="memories-title"
    >
      <div className="chapter-rule">
        <span>03 / The community album</span>
        <span>Real people. Shared moments.</span>
      </div>
      <div className="memory-layout">
        <div className="memory-intro">
          <p className="symphony-kicker">A life shared is a life enriched.</p>
          <h2 id="memories-title">
            The moments
            <br />
            <em>we carry.</em>
          </h2>
          <p>
            A familiar face. A shared story. A brighter day. A glimpse into the
            community we create together.
          </p>
          <TextLink href="/gallery">Open the community album</TextLink>
          <div className="memory-controls">
            <button
              aria-label="Previous memory"
              onClick={() =>
                setActive((active + photos.length - 1) % photos.length)
              }
            >
              <ArrowIcon direction="left" />
            </button>
            <span aria-live="polite">
              0{active + 1}
              <i />0{photos.length}
            </span>
            <button
              aria-label="Next memory"
              onClick={() => setActive((active + 1) % photos.length)}
            >
              <ArrowIcon direction="right" />
            </button>
          </div>
        </div>
        <div className="memory-stage" aria-label="Community photographs">
          {photos.map((photo, i) => {
            const layer = (i - active + photos.length) % photos.length;
            return (
              <figure
                className="memory-card"
                key={photo.id}
                style={
                  {
                    "--layer": layer,
                    zIndex: photos.length - layer,
                    transform: `translate(${layer === 0 ? 0 : layer === 1 ? -34 : 28}px,${layer === 0 ? 0 : layer === 1 ? -13 : 8}px) rotate(${layer === 0 ? -2 : layer === 1 ? -9 : 7}deg) scale(${1 - layer * 0.035})`,
                  } as CSSProperties
                }
                aria-hidden={layer !== 0}
              >
                <Link
                  href="/gallery"
                  tabIndex={layer === 0 ? 0 : -1}
                  aria-label={`Explore the gallery: ${photo.caption}`}
                >
                  <div className="memory-image">
                    <Image
                      src={photo.src}
                      alt={layer === 0 ? photo.alt : ""}
                      fill
                      sizes="(max-width:700px) 80vw, 45vw"
                      style={{ objectPosition: photo.position }}
                    />
                  </div>
                  <figcaption>
                    <span>{photo.category}</span>
                    <strong>{photo.caption}</strong>
                    <small>Musical Vibes Foundation · Community archive</small>
                  </figcaption>
                </Link>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
