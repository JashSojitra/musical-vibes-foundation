"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { MediaAsset } from "@/types/content";

const categories = [
  "All moments",
  "Music",
  "Seniors Club",
  "Celebrations",
] as const;
export default function GalleryExplorer({ media }: { media: MediaAsset[] }) {
  const [category, setCategory] = useState<string>("All moments");
  const [selected, setSelected] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const filtered = media.filter(
    (item) => category === "All moments" || item.category === category,
  );
  const index = filtered.findIndex((item) => item.id === selected);
  const photo = filtered[index];
  const close = () => {
    dialog.current?.close();
    setSelected(null);
    opener.current?.focus();
  };
  const step = (direction: number) =>
    setSelected(
      filtered[(index + direction + filtered.length) % filtered.length].id,
    );
  useEffect(() => {
    if (!selected) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selected]);
  function open(photo: MediaAsset, event: React.MouseEvent<HTMLButtonElement>) {
    opener.current = event.currentTarget;
    setSelected(photo.id);
    dialog.current?.showModal();
  }
  return (
    <div className="gallery-explorer wrap">
      <div className="gallery-toolbar">
        <div
          className="filter-group"
          role="group"
          aria-label="Filter photographs"
        >
          {categories.map((item) => (
            <button
              key={item}
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <p className="gallery-count" role="status">
          {filtered.length} photographs
        </p>
      </div>
      <div className="editorial-gallery">
        {filtered.map((item, i) => (
          <figure
            key={item.id}
            className={`gallery-photo gallery-shape-${i % 5}`}
          >
            <button
              onClick={(event) => open(item, event)}
              aria-label={`Open photograph: ${item.alt}`}
            >
              <Image
                src={item.src}
                alt={item.alt}
                width={item.width}
                height={item.height}
                sizes="(max-width: 700px) 100vw, 45vw"
                style={{ objectPosition: item.position }}
              />
              <span className="expand-photo" aria-hidden="true">
                ↗
              </span>
            </button>
            <figcaption>
              <span>{item.caption}</span>
              <span>{item.category}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <dialog
        className="lightbox"
        ref={dialog}
        aria-labelledby="lightbox-title"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            step(1);
          }
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            step(-1);
          }
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        onClose={() => {
          document.body.style.overflow = "";
        }}
      >
        <div className="lightbox-top">
          <span id="lightbox-title">THE COMMUNITY ARCHIVE</span>
          <button onClick={close} autoFocus aria-label="Close photograph">
            Close ×
          </button>
        </div>
        {photo ? (
          <>
            <div className="lightbox-stage">
              <button
                className="lightbox-prev"
                onClick={() => step(-1)}
                aria-label="Previous photograph"
              >
                ←
              </button>
              <Image
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                sizes="90vw"
              />
              <button
                className="lightbox-next"
                onClick={() => step(1)}
                aria-label="Next photograph"
              >
                →
              </button>
            </div>
            <div className="lightbox-caption" aria-live="polite">
              <p>{photo.caption}</p>
              <span>
                {index + 1} / {filtered.length}
              </span>
            </div>
          </>
        ) : null}
        <p className="lightbox-help">
          Use ← and → to explore. Press Escape to close.
        </p>
      </dialog>
    </div>
  );
}
