"use client";
import { useLayoutEffect, useMemo, useRef, useState, useId } from "react";
import type { TimelineMonth, TimelineFrame } from "@/lib/archive-months";
import { journalDate } from "@/lib/date-format";
import ArchiveImage from "../archive-image";
import { TunnelEngine } from "./tunnel-engine";

/** How many months are mounted around the nearest one (behind, ahead). */
const BEHIND = 1;
const AHEAD = 3;
const shortDate = new Intl.DateTimeFormat("en-CA", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export type TunnelProps = {
  months: TimelineMonth[];
  initialIndex: number;
  reduced: boolean;
  enabled: boolean;
  settledIndex: number | null;
  engineRef: React.RefObject<TunnelEngine | null>;
  onCenter: (index: number) => void;
  onSettle: (index: number) => void;
  onUnsettle: () => void;
  onOpenPhoto: (frame: TimelineFrame, opener: HTMLButtonElement) => void;
  onEngine?: (engine: TunnelEngine | null) => void;
  label: string;
};

export default function ArchiveTunnel(props: TunnelProps) {
  const { months, initialIndex, reduced, enabled, settledIndex, engineRef } =
    props;
  const helpId = useId();
  const stage = useRef<HTMLDivElement>(null);
  const [center, setCenter] = useState(initialIndex);
  const callbacks = useRef(props);
  useLayoutEffect(() => {
    callbacks.current = props;
  });

  const engineMonths = useMemo(
    () =>
      months.map((m) => ({
        key: m.key,
        aspects: m.featured.map(
          (p) => (p.photo.width || 1) / (p.photo.height || 1),
        ),
      })),
    [months],
  );

  // One engine per mounted stage; fully torn down on unmount (ticker, listeners, tweens).
  useLayoutEffect(() => {
    const el = stage.current!;
    const engine = new TunnelEngine(el, {
      months: engineMonths,
      initial: initialIndex,
      reduced,
      onCenter: (i) => {
        setCenter(i);
        callbacks.current.onCenter(i);
      },
      onSettle: (i) => callbacks.current.onSettle(i),
      onUnsettle: () => callbacks.current.onUnsettle(),
    });
    engineRef.current = engine;
    callbacks.current.onEngine?.(engine);
    const observer = new ResizeObserver(() => engine.measure());
    observer.observe(el);
    let alive = true;
    document.fonts?.ready.then(() => alive && engine.remeasureTitles());
    return () => {
      alive = false;
      observer.disconnect();
      engine.destroy();
      engineRef.current = null;
      callbacks.current.onEngine?.(null);
    };
    // The engine is created once; later prop changes are pushed below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(
    () => engineRef.current?.setMonths(engineMonths),
    [engineMonths, engineRef],
  );
  useLayoutEffect(
    () => engineRef.current?.setReduced(reduced),
    [reduced, engineRef],
  );
  useLayoutEffect(
    () => engineRef.current?.setEnabled(enabled),
    [enabled, engineRef],
  );
  // After React mounts a new window of months, hand the elements to the engine.
  useLayoutEffect(() => engineRef.current?.refresh());

  const first = Math.max(0, center - BEHIND);
  const last = Math.min(months.length - 1, center + AHEAD);
  const windowed = months
    .slice(first, last + 1)
    .map((month, offset) => ({ month, index: first + offset }));

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || !enabled) return;
    const engine = engineRef.current;
    if (!engine) return;
    const keys: Record<string, () => void> = {
      ArrowDown: () => engine.step(1),
      ArrowRight: () => engine.step(1),
      PageDown: () => engine.step(1),
      ArrowUp: () => engine.step(-1),
      ArrowLeft: () => engine.step(-1),
      PageUp: () => engine.step(-1),
      Home: () => engine.goTo(0),
      End: () => engine.goTo(months.length - 1),
    };
    const action = keys[event.key];
    if (action) {
      event.preventDefault();
      action();
    }
  };

  return (
    <div
      ref={stage}
      className={`ia-stage${reduced ? " is-reduced" : ""}`}
      tabIndex={enabled ? 0 : -1}
      role="region"
      aria-roledescription="photo tunnel"
      aria-label={props.label}
      aria-describedby={helpId}
      onKeyDown={onKeyDown}
    >
      <p id={helpId} className="ia-sr-only">
        Use the arrow keys, Page Up and Page Down, or Shift and the scroll wheel
        to travel between months. When a month settles, press Tab to reach its
        photographs.
      </p>
      <div className="ia-scene" aria-hidden={!enabled || undefined}>
        {windowed.map(({ month, index }) => {
          const live = enabled && index === settledIndex && index === center;
          return (
            <section
              key={month.key}
              className="ia-layer"
              data-layer={index}
              aria-hidden={index !== center || undefined}
              aria-labelledby={`ia-title-${month.key}`}
            >
              <h2 className="ia-title" data-title id={`ia-title-${month.key}`}>
                {month.year ? (
                  <>
                    {month.label.replace(` ${month.year}`, "")}{" "}
                    <span>{month.year}</span>
                  </>
                ) : (
                  month.label
                )}
              </h2>
              <ol className="ia-anchor" inert={!live}>
                {month.featured.map((frame, k) => (
                  <li key={frame.key} className="ia-item" data-item={k}>
                    <figure>
                      <button
                        type="button"
                        className="ia-frame"
                        tabIndex={live ? 0 : -1}
                        aria-label={`Open featured photograph ${k + 1}${frame.photo.alt ? `: ${frame.photo.alt}` : ""}`}
                        onClick={(event) =>
                          props.onOpenPhoto(frame, event.currentTarget)
                        }
                      >
                        <ArchiveImage
                          key={frame.photo.src}
                          photo={frame.photo}
                          sizes="(max-width: 640px) 140px, 220px"
                        />
                      </button>
                      {frame.date && (
                        <figcaption>
                          <time
                            dateTime={frame.date}
                            aria-label={journalDate(frame.date)}
                          >
                            {shortDate.format(new Date(frame.date))}
                          </time>
                        </figcaption>
                      )}
                    </figure>
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}
