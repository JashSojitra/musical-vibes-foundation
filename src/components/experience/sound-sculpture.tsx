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
      viewBox="0 0 1400 700"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="symphony-ribbon"
          x1="90"
          y1="80"
          x2="610"
          y2="510"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#efd3a5" />
          <stop offset=".48" stopColor="#b98a48" />
          <stop offset="1" stopColor="#e4bd78" />
        </linearGradient>
      </defs>
      {Array.from({ length: 32 }, (_, i) => (
        <path
          key={i}
          d={`M -100 ${520 + i * 2} C 330 ${680 - i * 3}, 470 ${180 + i * 7}, 850 ${440 + i * 2} S 1230 ${170 + i * 5}, 1500 ${240 + i * 2}`}
          stroke="url(#symphony-ribbon)"
          strokeWidth={i % 8 === 0 ? 1.5 : 0.65}
          opacity={0.22 + (i % 8) * 0.07}
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
              intensity={0.45}
              onReady={() => setReady(true)}
              onFailure={() => setFailed(true)}
            />
          </SceneBoundary>
        ) : null}
      </div>
      <div className="symphony-motion-controls">
        <p className="symphony-motion-status">
          {reduced
            ? "Still artwork · reduced motion"
            : failed
              ? "Still artwork · 3D unavailable"
              : ""}
        </p>
        {!reduced && !failed ? (
          <button
            onClick={() => setPaused(!paused)}
            aria-pressed={paused}
            aria-label={
              paused ? "Resume sculpture motion" : "Pause sculpture motion"
            }
          >
            {paused ? "Resume motion" : "Pause motion"}{" "}
            <span aria-hidden="true">{paused ? "▷" : "Ⅱ"}</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
