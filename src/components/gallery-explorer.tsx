"use client";

import ArrowIcon from "@/components/arrow-icon";
import ArchiveCalendar from "@/components/archive-calendar";
import { journalDate } from "@/lib/date-format";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { GalleryCollection, MediaAsset } from "@/types/content";

const categories = [
  "All moments",
  "Music",
  "Seniors Club",
  "Celebrations",
] as const;
const pageSize = 24;
const albumHref = (id: string) =>
  `/gallery?collection=${encodeURIComponent(id)}#archive`;

function ArchiveImage({ photo, sizes }: { photo: MediaAsset; sizes: string }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <span
      className="archive-image-unavailable"
      role="img"
      aria-label="Photograph unavailable"
    >
      Photograph unavailable
    </span>
  ) : (
    <Image
      src={photo.src}
      alt={photo.alt}
      width={photo.width}
      height={photo.height}
      sizes={sizes}
      style={{ objectPosition: photo.position }}
      onError={() => setFailed(true)}
    />
  );
}

type Timeslice = { date?: string; photos: MediaAsset[] };

export default function GalleryExplorer({
  albums,
  timeline,
  collection,
}: {
  albums: GalleryCollection[];
  timeline: Timeslice[];
  collection?: GalleryCollection;
}) {
  const [view, setView] = useState<"albums" | "timeline">("albums");
  const [category, setCategory] =
    useState<(typeof categories)[number]>("All moments");
  const [date, setDate] = useState("");
  const [limit, setLimit] = useState(pageSize);
  const [selected, setSelected] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const dialogClose = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const jump = useRef(false);

  const showingAlbums = view === "albums" && !collection;
  const inCategory = (photo: MediaAsset, albumCategory = photo.category) =>
    category === "All moments" ||
    photo.category === category ||
    albumCategory === category;
  const filteredAlbums = albums.filter((album) =>
    album.photos.some((photo) => inCategory(photo, album.category)),
  );
  const dated = timeline
    .map((group) => ({
      ...group,
      photos: group.photos.filter((photo) => inCategory(photo)),
    }))
    .filter((group) => group.photos.length);
  const dates = dated.flatMap((group) => (group.date ? [group.date] : []));
  const groups =
    view === "timeline"
      ? dated.filter((group) => !date || group.date === date)
      : [
          {
            photos:
              collection?.photos.filter((photo) =>
                inCategory(photo, collection.category),
              ) ?? [],
          },
        ];
  const filtered = groups.flatMap((group) => group.photos);
  const index = selected ?? -1;
  const photo = filtered[index];

  const reset = () => {
    setDate("");
    setLimit(pageSize);
  };
  const selectDate = (value: string) => {
    if (value === date && value) resultHeading.current?.focus();
    jump.current = Boolean(value && value !== date);
    setDate(value);
    setLimit(pageSize);
  };
  useEffect(() => {
    if (!jump.current) return;
    jump.current = false;
    resultHeading.current?.focus();
  }, [date]);

  const open = (index: number, event: React.MouseEvent<HTMLButtonElement>) => {
    opener.current = event.currentTarget;
    setSelected(index);
    dialog.current?.showModal();
    dialogClose.current?.focus();
  };
  const isOpen = selected !== null;
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  function step(direction: number) {
    if (filtered.length > 1)
      setSelected(
        (current) =>
          ((current ?? 0) + direction + filtered.length) % filtered.length,
      );
  }

  let offset = 0;
  const visibleGroups = [];
  for (const group of groups) {
    if (offset >= limit) break;
    const photos = group.photos.slice(0, limit - offset);
    if (photos.length)
      visibleGroups.push({ date: group.date, photos, first: offset });
    offset += group.photos.length;
  }

  return (
    <section
      id="archive"
      className="gallery-explorer archive-explorer wrap"
      aria-label="Browse the photo archive"
    >
      <div className="archive-bar">
        <div className="archive-switch" role="group" aria-label="Archive view">
          <button
            type="button"
            aria-pressed={view === "albums"}
            onClick={() => {
              setView("albums");
              reset();
            }}
          >
            Albums
          </button>
          <button
            type="button"
            aria-pressed={view === "timeline"}
            onClick={() => {
              setView("timeline");
              reset();
            }}
          >
            Timeline
          </button>
        </div>
        <label className="archive-filter">
          Category
          <select
            aria-label="Category"
            value={category}
            onChange={({ target }) => {
              setCategory(target.value as typeof category);
              reset();
            }}
          >
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>
      {showingAlbums ? (
        <>
          <p className="gallery-count" role="status">
            {filteredAlbums.length}{" "}
            {filteredAlbums.length === 1 ? "album" : "albums"}
          </p>
          {filteredAlbums.length ? (
            <div className="gallery-collection-cards archive-album-cards">
              {filteredAlbums.map((album) => (
                <Link
                  className="gallery-collection-card"
                  key={album.id}
                  href={albumHref(album.id)}
                  prefetch={false}
                >
                  <div className="archive-cover">
                    <ArchiveImage
                      key={album.photos[0].src}
                      photo={album.photos[0]}
                      sizes="(max-width: 540px) 92vw, (max-width: 900px) 47vw, 30vw"
                    />
                  </div>
                  <span>
                    <small>
                      {album.category ?? album.photos[0].category}
                      {album.date && (
                        <>
                          {" "}
                          ·{" "}
                          <time dateTime={album.date}>
                            {journalDate(album.date)}
                          </time>
                        </>
                      )}
                    </small>
                    <strong>{album.title}</strong>
                    <i>
                      {album.photos.length}{" "}
                      {album.photos.length === 1 ? "photograph" : "photographs"}
                    </i>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p>No albums in this category.</p>
          )}
        </>
      ) : (
        <div
          className={
            view === "timeline" && dates.length ? "archive-timeline" : undefined
          }
        >
          {view === "timeline" && dates.length > 0 && (
            <ArchiveCalendar
              key={category}
              dates={dates}
              selected={date}
              onSelect={selectDate}
            />
          )}
          <div className="archive-results">
            {view === "albums" && collection ? (
              <header
                className="archive-album-header selected-collection"
                id="collection"
              >
                <Link href="/gallery#archive">
                  <ArrowIcon direction="left" /> All albums
                </Link>
                <h2>{collection.title}</h2>
                {collection.date && (
                  <time dateTime={collection.date}>
                    {journalDate(collection.date)}
                  </time>
                )}
                <div className="archive-related">
                  {collection.journalSlug && (
                    <Link href={`/updates/${collection.journalSlug}`}>
                      Read the Update <ArrowIcon />
                    </Link>
                  )}
                  {collection.eventSlug && (
                    <Link href={`/events/${collection.eventSlug}`}>
                      Related event
                    </Link>
                  )}
                </div>
              </header>
            ) : (
              <div className="archive-result-heading">
                <h2 ref={resultHeading} tabIndex={-1}>
                  {date ? journalDate(date) : "Photographs by date"}
                </h2>
                {date && (
                  <button type="button" onClick={() => selectDate("")}>
                    Clear date
                  </button>
                )}
              </div>
            )}
            <p className="gallery-count" role="status">
              {filtered.length}{" "}
              {filtered.length === 1 ? "photograph" : "photographs"}
            </p>
            {!filtered.length && <p>No photographs match your filters.</p>}
            {visibleGroups.map((group) => (
              <section
                className="archive-date-group"
                key={group.date ?? "undated"}
                aria-label={group.date ? journalDate(group.date) : undefined}
              >
                {view === "timeline" && !date && (
                  <h3>
                    {group.date ? (
                      <time dateTime={group.date}>
                        {journalDate(group.date)}
                      </time>
                    ) : (
                      "Date unrecorded"
                    )}
                  </h3>
                )}
                <div className="archive-photo-grid">
                  {group.photos.map((item, i) => (
                    <figure
                      key={`${item.id}-${group.first + i}`}
                      className="gallery-photo"
                    >
                      <button
                        type="button"
                        onClick={(event) => open(group.first + i, event)}
                        aria-label={`Open photograph ${group.first + i + 1}${item.alt ? `: ${item.alt}` : ""}`}
                      >
                        <ArchiveImage
                          key={item.src}
                          photo={item}
                          sizes="(max-width: 560px) 45vw, (max-width: 960px) 30vw, 24vw"
                        />
                        <span className="expand-photo" aria-hidden="true">
                          <ArrowIcon />
                        </span>
                      </button>
                      {item.caption && <figcaption>{item.caption}</figcaption>}
                    </figure>
                  ))}
                </div>
              </section>
            ))}
            {filtered.length > limit && (
              <button
                className="archive-more"
                type="button"
                onClick={() => setLimit(limit + pageSize)}
              >
                Show more photographs
              </button>
            )}
          </div>
        </div>
      )}
      <dialog
        className="lightbox"
        ref={dialog}
        aria-labelledby="lightbox-title"
        onClose={() => {
          setSelected(null);
          opener.current?.focus();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault();
            step(event.key === "ArrowRight" ? 1 : -1);
          }
        }}
      >
        <div className="lightbox-top">
          <span id="lightbox-title">The community archive</span>
          <button
            ref={dialogClose}
            type="button"
            onClick={() => dialog.current?.close()}
            aria-label="Close photograph"
          >
            Close ×
          </button>
        </div>
        {photo && (
          <>
            <div className="lightbox-stage">
              <button
                type="button"
                className="lightbox-prev"
                onClick={() => step(-1)}
                disabled={filtered.length < 2}
                aria-label="Previous photograph"
              >
                <ArrowIcon direction="left" />
              </button>
              <ArchiveImage key={photo.src} photo={photo} sizes="90vw" />
              <button
                type="button"
                className="lightbox-next"
                onClick={() => step(1)}
                disabled={filtered.length < 2}
                aria-label="Next photograph"
              >
                <ArrowIcon />
              </button>
            </div>
            <div className="lightbox-caption" aria-live="polite">
              <p>{photo.caption || photo.archive?.title}</p>
              <a
                href={photo.originalSrc ?? photo.src}
                target="_blank"
                rel="noopener noreferrer"
              >
                View full-resolution photograph
              </a>
              <span>
                {index + 1} / {filtered.length}
              </span>
            </div>
          </>
        )}
        <p className="lightbox-help">
          Use ← and → to explore. Press Escape to close.
        </p>
      </dialog>
    </section>
  );
}
