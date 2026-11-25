"use client";

import { useRef, useState, useSyncExternalStore, type RefObject } from "react";
import ArrowIcon from "@/components/arrow-icon";
import type { TimelineFrame, TimelineMonth } from "@/lib/archive-months";
import ArchiveTunnel from "./archive-tunnel";
import ArchiveScrubber from "./archive-scrubber";
import type { TunnelEngine } from "./tunnel-engine";
import "./archive-tunnel.css";

const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(change: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", change);
  return () => query.removeEventListener("change", change);
}
const reducedMotion = () => window.matchMedia(motionQuery).matches;

export default function TimelineTunnel({
  months,
  engineRef,
  onMonth,
  onOpen,
}: {
  months: TimelineMonth[];
  engineRef: RefObject<TunnelEngine | null>;
  onMonth: (key: string) => void;
  onOpen: (frame: TimelineFrame, opener: HTMLButtonElement) => void;
}) {
  const reduced = useSyncExternalStore(
    subscribeMotion,
    reducedMotion,
    () => true,
  );
  const [engine, setEngine] = useState<TunnelEngine | null>(null);
  const [center, setCenter] = useState(0);
  const [settled, setSettled] = useState<number | null>(null);
  const exhibit = useRef<HTMLDivElement>(null);
  const current = Math.min(center, months.length - 1);
  const go = (index: number) => engineRef.current?.goTo(index);

  return (
    <div className="ia" ref={exhibit}>
      <div
        className="ia-controls"
        role="group"
        aria-label="Timeline navigation"
      >
        <button
          type="button"
          aria-label="Earlier archived month"
          disabled={current === months.length - 1}
          onClick={() => engineRef.current?.step(1)}
        >
          <ArrowIcon direction="left" />
        </button>
        <select
          aria-label="Jump to archive month"
          value={months[current].key}
          onChange={({ target }) =>
            go(months.findIndex((month) => month.key === target.value))
          }
        >
          {months.map((month) => (
            <option key={month.key} value={month.key}>
              {month.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          aria-label="Later archived month"
          disabled={current === 0}
          onClick={() => engineRef.current?.step(-1)}
        >
          <ArrowIcon direction="right" />
        </button>
      </div>
      <div className="ia-body">
        <ArchiveTunnel
          months={months}
          initialIndex={0}
          reduced={reduced}
          enabled
          settledIndex={settled}
          engineRef={engineRef}
          onEngine={setEngine}
          onCenter={(index) => {
            setCenter(index);
            onMonth(months[index].key);
          }}
          onSettle={setSettled}
          onUnsettle={() => {
            const stage =
              exhibit.current?.querySelector<HTMLElement>(".ia-stage");
            if (stage?.contains(document.activeElement))
              stage.focus({ preventScroll: true });
            setSettled(null);
          }}
          onOpenPhoto={onOpen}
          label="Archive photo tunnel"
        />
        <ArchiveScrubber
          months={months}
          active={current}
          engine={engine}
          onGo={go}
        />
        <p className="ia-travel-hint">
          {months.length > 1 &&
            "Drag, swipe sideways or use the arrow keys to travel."}
        </p>
      </div>
      <p className="ia-sr-only" role="status">
        {settled !== null && months[settled]
          ? `${months[settled].label} photographs are ready to explore.`
          : ""}
      </p>
    </div>
  );
}
