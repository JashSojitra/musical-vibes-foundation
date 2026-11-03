"use client";
import dynamic from "next/dynamic";
import { Component, useEffect, useRef, useState } from "react";

const Scene = dynamic(() => import("./sound-scene"), {
  ssr: false,
  loading: () => null,
});
class SceneBoundary extends Component<
  { children: React.ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
export function SculptureFallback() {
  return (
    <svg
      className="sculpture-fallback"
      viewBox="0 0 700 600"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="ribbon"
          x1="90"
          y1="80"
          x2="610"
          y2="510"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#efd3a5" />
          <stop offset=".48" stopColor="#c879a2" />
          <stop offset="1" stopColor="#e4bd78" />
        </linearGradient>
      </defs>
      {Array.from({ length: 11 }, (_, i) => (
        <ellipse
          key={i}
          cx="350"
          cy="300"
          rx={210 + i * 3}
          ry={105 + i * 3}
          stroke="url(#ribbon)"
          strokeWidth={i === 5 ? 4 : 1}
          opacity={0.35 + i * 0.045}
          transform={`rotate(${i * 8 - 40} 350 300)`}
        />
      ))}
    </svg>
  );
}
export default function SoundSculpture() {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [activated, setActivated] = useState(false);
  const [capable, setCapable] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);
  const [intensity, setIntensity] = useState(0.45);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReduced(query.matches);
      setReady(false);
      if (query.matches) return;
      // Test support before importing the renderer. Release the tiny probe immediately.
      const probe = document.createElement("canvas");
      try {
        const gl = probe.getContext("webgl2");
        if (!gl) {
          setFailed(true);
          return;
        }
        gl.getExtension("WEBGL_lose_context")?.loseContext();
        setCapable(true);
      } catch {
        setFailed(true);
      }
    };
    update();
    query.addEventListener("change", update);
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setActivated(true);
      },
      { rootMargin: "80px" },
    );
    if (host.current) observer.observe(host.current);
    const visibility = () => {
      if (document.hidden) setVisible(false);
      else if (host.current) {
        const r = host.current.getBoundingClientRect();
        setVisible(r.bottom > 0 && r.top < innerHeight);
      }
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      observer.disconnect();
      query.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  return (
    <div
      className={`sound-sculpture ${ready && !failed && !reduced ? "scene-ready" : ""}`}
      ref={host}
    >
      <div className="sculpture-art" aria-hidden="true">
        <SculptureFallback />
        {activated && capable && !reduced && !failed ? (
          <SceneBoundary onError={() => setFailed(true)}>
            <Scene
              active={!paused && visible}
              intensity={intensity}
              onReady={() => setReady(true)}
              onFailure={() => setFailed(true)}
            />
          </SceneBoundary>
        ) : null}
      </div>
      <div className="sculpture-controls">
        <div>
          <span className="sculpture-status">
            <i aria-hidden="true" />
            {reduced || failed ? "A STILL MOMENT" : "THE SHAPE OF TOGETHER"}
          </span>
          <p>
            {reduced
              ? "Still artwork · reduced motion"
              : failed
                ? "Still artwork · 3D unavailable"
                : "Interactive visual simulation · no audio"}
          </p>
        </div>
        {!reduced && !failed ? (
          <button
            onClick={() => setPaused(!paused)}
            aria-pressed={paused}
            aria-label={
              paused ? "Resume sculpture motion" : "Pause sculpture motion"
            }
          >
            {paused ? "Play motion" : "Pause motion"}{" "}
            <span aria-hidden="true">{paused ? "▷" : "Ⅱ"}</span>
          </button>
        ) : null}
      </div>
      {!reduced && !failed ? (
        <label className="sculpture-range">
          Shape the connection
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={intensity}
            onChange={(event) => setIntensity(Number(event.target.value))}
            aria-label="Sculpture energy"
          />
        </label>
      ) : null}
    </div>
  );
}
