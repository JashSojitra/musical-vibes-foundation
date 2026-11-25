"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  fractionAt,
  positionAt,
  timelineStops,
  type TimelineMonth,
} from "@/lib/archive-months";
import type { TunnelEngine } from "./tunnel-engine";

/**
 * Vertical timeline rail. One tick per month that has photographs (newest at
 * the top), a year marker where the year changes, and an accent thumb that
 * follows the camera continuously. Drag the rail to fly, click a tick to jump,
 * or focus the thumb (a slider) and use the arrow keys.
 */
export default function ArchiveScrubber({
  months,
  active,
  engine,
  onGo,
}: {
  months: TimelineMonth[];
  active: number;
  engine: TunnelEngine | null;
  onGo: (index: number) => void;
}) {
  const ticks = useRef<HTMLOListElement>(null);
  const thumb = useRef<HTMLDivElement>(null);
  const [bubble, setBubble] = useState<number | null>(null);
  const [mode, setMode] = useState<"idle" | "hover" | "drag">("idle");
  const [dense, setDense] = useState(false);
  const n = months.length;
  // Stops sit at their real place in time; months without photographs leave visible gaps.
  const scale = useMemo(() => timelineStops(months), [months]);
  const fraction = (pos: number) => fractionAt(scale, pos);

  // The thumb follows the live camera position without React renders.
  useEffect(() => {
    if (!engine) return;
    return engine.subscribe((pos) => {
      const rail = ticks.current;
      if (!rail || !thumb.current) return;
      thumb.current.style.transform = `translate3d(0, ${(fraction(pos) * rail.clientHeight).toFixed(1)}px, 0)`;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, n, scale]);

  useEffect(() => {
    const el = ticks.current;
    if (!el) return;
    const minGap = scale
      .slice(1)
      .reduce((m, s, i) => Math.min(m, s - scale[i]), 1);
    const check = () => setDense(n > 1 && el.clientHeight * minGap < 22);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [n, scale]);

  const indexAt = (clientY: number) => {
    const rect = ticks.current!.getBoundingClientRect();
    return positionAt(scale, (clientY - rect.top) / Math.max(1, rect.height));
  };

  const drag = useRef<number | null>(null);
  const onPointerDown = (event: React.PointerEvent) => {
    if (
      event.button !== 0 ||
      n < 2 ||
      (event.target as HTMLElement).closest("button")
    )
      return;
    drag.current = event.pointerId;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    setMode("drag");
    const f = indexAt(event.clientY);
    setBubble(Math.round(f));
    engine?.scrubTo(f);
  };
  const onPointerMove = (event: React.PointerEvent) => {
    if (n < 2) return;
    const f = indexAt(event.clientY);
    if (drag.current === event.pointerId) {
      engine?.scrubTo(f);
      setBubble(Math.round(f));
    } else if (event.pointerType === "mouse") {
      setMode("hover");
      setBubble(Math.round(f));
    }
  };
  const onPointerUp = (event: React.PointerEvent) => {
    if (drag.current !== event.pointerId) return;
    drag.current = null;
    engine?.scrubEnd();
    setMode("idle");
    setBubble(null);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const step: Record<string, number> = {
      ArrowDown: 1,
      ArrowRight: 1,
      PageDown: 3,
      ArrowUp: -1,
      ArrowLeft: -1,
      PageUp: -3,
    };
    if (event.key in step) {
      event.preventDefault();
      onGo(Math.min(n - 1, Math.max(0, active + step[event.key])));
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      onGo(event.key === "Home" ? 0 : n - 1);
    }
  };

  const current = months[active];
  const shown = bubble !== null ? months[bubble] : null;
  return (
    <div
      className={`ia-scrubber is-${mode}${dense ? " is-dense" : ""}`}
      data-no-drag
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={() =>
        mode === "hover" && (setMode("idle"), setBubble(null))
      }
    >
      <div className="ia-scrubber__rail" aria-hidden="true" />
      <ol
        className="ia-scrubber__ticks"
        ref={ticks}
        aria-label="Months with photographs"
      >
        {months.map((month, i) => {
          const yearStart =
            month.year !== null && month.year !== months[i - 1]?.year;
          return (
            <li
              key={month.key}
              className="ia-scrubber__tick"
              style={{ top: `${fraction(i) * 100}%` }}
            >
              {yearStart && (
                <span className="ia-scrubber__year" aria-hidden="true">
                  {month.year}
                </span>
              )}
              <button
                type="button"
                tabIndex={-1}
                aria-current={i === active ? "true" : undefined}
                aria-label={`${month.label}: ${month.photoCount} photographs`}
                onClick={() => onGo(i)}
              >
                <span className="ia-scrubber__label">
                  {month.key === "undated" ? "—" : month.shortLabel}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <div
        ref={thumb}
        className="ia-scrubber__thumb"
        role="slider"
        tabIndex={0}
        aria-label="Timeline month"
        aria-orientation="vertical"
        aria-valuemin={1}
        aria-valuemax={Math.max(1, n)}
        aria-valuenow={active + 1}
        aria-valuetext={
          current
            ? `${current.label}, ${current.photoCount} photographs`
            : "No months"
        }
        onKeyDown={onKeyDown}
      />
      <div className="ia-scrubber__track" aria-hidden="true">
        {shown && bubble !== null && (
          <span
            className="ia-scrubber__bubble"
            style={{ top: `${fraction(bubble) * 100}%` }}
          >
            {shown.label}
          </span>
        )}
      </div>
    </div>
  );
}
