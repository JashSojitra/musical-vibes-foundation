"use client";
import { useEffect, useRef, useState } from "react";
const moods = [
  {
    name: "Stillness",
    line: "A moment to pause. A little space to breathe.",
    waves: 2.2,
    amplitude: 28,
  },
  {
    name: "Joy",
    line: "A familiar melody. A feeling shared.",
    waves: 4.1,
    amplitude: 60,
  },
  {
    name: "Togetherness",
    line: "Different rhythms. A beautiful connection.",
    waves: 3.2,
    amplitude: 42,
  },
];
export default function RhythmMoment() {
  const [selected, setSelected] = useState(2);
  const scope = useRef<HTMLDivElement>(null);
  const mood = moods[selected];
  useEffect(() => {
    let dispose: (() => void) | undefined;
    let cancelled = false;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    void import("gsap").then(({ gsap }) => {
      if (cancelled) return;
      const context = gsap.context(
        () =>
          gsap.fromTo(
            ".rhythm-wave",
            { y: 10 },
            { y: 0, duration: 0.65, stagger: 0.03, ease: "power2.out" },
          ),
        scope,
      );
      dispose = () => context.revert();
    });
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [selected]);
  return (
    <div className="rhythm-moment" ref={scope}>
      <div
        className="rhythm-options"
        role="group"
        aria-label="Choose a visual rhythm"
      >
        {moods.map((item, i) => (
          <button
            key={item.name}
            aria-pressed={selected === i}
            onClick={() => setSelected(i)}
          >
            {item.name}
            <span aria-hidden="true">0{i + 1}</span>
          </button>
        ))}
      </div>
      <svg viewBox="0 0 1000 240" className="rhythm-svg" aria-hidden="true">
        {Array.from({ length: 9 }, (_, i) => {
          const points = Array.from({ length: 161 }, (_, x) => {
            const p = x / 160;
            const y =
              120 +
              Math.sin(p * Math.PI * 2 * mood.waves + i * 0.14) *
                Math.sin(p * Math.PI) *
                (mood.amplitude + i * 3);
            return `${x ? "L" : "M"}${(p * 1000).toFixed(3)},${y.toFixed(3)}`;
          }).join(" ");
          return (
            <path
              key={i}
              d={points}
              className="rhythm-wave"
              fill="none"
              stroke={i % 2 ? "#b87e9c" : "#ddbb81"}
              strokeWidth={1.2}
            />
          );
        })}
      </svg>
      <p className="rhythm-caption" aria-live="polite">
        {mood.line}
      </p>
      <p className="micro-note">
        An interactive visual interpretation of connection. No audio or
        microphone.
      </p>
    </div>
  );
}
