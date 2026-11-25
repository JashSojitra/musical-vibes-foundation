/**
 * Motion engine for the archive tunnel. Owns the camera position, input
 * physics, the settle/unsettle choreography and every per-frame style write,
 * so React only re-renders when the nearest month or the settled month changes.
 *
 * Coordinates: each month layer fills the stage; its photographs hang off an
 * anchor at the stage centre. A photo's element is sized to its flat-grid
 * rectangle; the tunnel pose shrinks/rotates it with transforms, so the settle
 * is a pure transform/opacity interpolation (no layout during animation).
 */
import { gsap } from "gsap";

export type EngineMonth = { key: string; aspects: number[] };
type Rect = { x: number; y: number; w: number; h: number };
type Pose = {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  s: number;
};

type ItemState = {
  el: HTMLElement;
  img: HTMLImageElement | null;
  p: number;
  ring: Pose;
  grid: Rect;
};
type LayerState = {
  index: number;
  key: string;
  el: HTMLElement;
  title: HTMLElement | null;
  items: ItemState[];
  titleP: { p: number };
  titleSize: { w: number; h: number };
  layout: Layout | null;
};
type Layout = {
  rects: Rect[];
  /** In stage pixels. */
  heading: { x: number; y: number; size: number };
};

export type EngineOptions = {
  months: EngineMonth[];
  initial: number;
  reduced: boolean;
  onCenter: (index: number) => void;
  onSettle: (index: number) => void;
  onUnsettle: () => void;
};

/** Month label size follows the viewport (clamp(40px, 9.4vw, 112px)), not the stage. */
const LABEL_SIZE = () =>
  Math.min(
    112,
    Math.max(
      40,
      (typeof window === "undefined" ? 1440 : window.innerWidth) * 0.094,
    ),
  );
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++)
    h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}
function rand(seed: number) {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Justified rows that keep every aspect ratio, shrunk until they fit `maxH`. */
export function justifiedLayout(
  aspects: number[],
  width: number,
  targetH: number,
  gap: number,
  maxH: number,
) {
  const attempt = (rowH: number) => {
    const rects: Rect[] = [];
    let y = 0;
    let row: number[] = [];
    let rowW = 0;
    let previous = rowH;
    const heightOf = (items: number, w: number) =>
      (rowH * (width - gap * (items - 1))) / w;
    const flush = (last: boolean) => {
      if (!row.length) return;
      const natural = rowW + gap * (row.length - 1);
      // A short last row keeps the height of the rows above it instead of growing.
      const h =
        last && natural < width
          ? Math.min(rowH, previous)
          : heightOf(row.length, rowW);
      previous = h;
      let x = 0;
      for (const i of row) {
        const w = aspects[i] * h;
        rects[i] = { x, y, w, h };
        x += w + gap;
      }
      y += h + gap;
      row = [];
      rowW = 0;
    };
    aspects.forEach((a, i) => {
      // Break before this photo if the row is already full enough and adding it would shrink the row further from the target.
      if (row.length && rowW + a * rowH + gap * row.length > width) {
        const without = heightOf(row.length, rowW);
        const withIt = heightOf(row.length + 1, rowW + a * rowH);
        if (
          without / rowH <= 1.3 &&
          Math.abs(without - rowH) < Math.abs(withIt - rowH)
        )
          flush(false);
      }
      row.push(i);
      rowW += a * rowH;
      if (rowW + gap * (row.length - 1) >= width) flush(false);
    });
    flush(true);
    return { rects, height: Math.max(0, y - gap) };
  };
  let rowH = targetH;
  let result = attempt(rowH);
  while (result.height > maxH && rowH > 56) {
    rowH *= 0.92;
    result = attempt(rowH);
  }
  return result;
}

export class TunnelEngine {
  pos: number;
  target: number;
  private opts: EngineOptions;
  private stage: HTMLElement;
  private W = 1;
  private H = 1;
  private layers = new Map<number, LayerState>();
  private listeners = new Set<(pos: number) => void>();
  private settled: number | null = null;
  private settling: number | null = null;
  private calm = { v: 0 };
  private settleTl: gsap.core.Timeline | null = null;
  private monthsSignature = "";
  private dirty = true;
  private enabled = true;
  private lastInput = 0;
  private center = -1;
  private drag: null | {
    id: number;
    x: number;
    y: number;
    start: number;
    moved: boolean;
    lastT: number;
    lastV: number;
    touch: boolean;
    vel: number;
  } = null;
  private suppressClick = false;
  private wheelAccum = 0;
  private wheelLock = 0;
  private scrubbing = false;
  private destroyed = false;

  constructor(stage: HTMLElement, opts: EngineOptions) {
    this.stage = stage;
    this.opts = opts;
    this.pos = this.target = clamp(
      opts.initial,
      0,
      Math.max(0, opts.months.length - 1),
    );
    this.monthsSignature = opts.months
      .map((m) => `${m.key}:${m.aspects.map((a) => a.toFixed(3)).join(",")}`)
      .join("|");
    this.measure();
    stage.addEventListener("wheel", this.onWheel, { passive: false });
    stage.addEventListener("pointerdown", this.onPointerDown);
    stage.addEventListener("click", this.onClickCapture, true);
    gsap.ticker.add(this.tick);
  }

  get count() {
    return this.opts.months.length;
  }
  get compact() {
    return this.W < 640;
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    gsap.ticker.remove(this.tick);
    this.stage.removeEventListener("wheel", this.onWheel);
    this.stage.removeEventListener("pointerdown", this.onPointerDown);
    this.stage.removeEventListener("click", this.onClickCapture, true);
    this.endDrag();
    this.settleTl?.kill();
    gsap.killTweensOf(this.calm);
    for (const layer of this.layers.values()) this.killLayerTweens(layer);
    this.listeners.clear();
    this.layers.clear();
  }

  subscribe(fn: (pos: number) => void) {
    this.listeners.add(fn);
    fn(this.pos);
    return () => void this.listeners.delete(fn);
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) this.endDrag();
  }

  setReduced(reduced: boolean) {
    if (this.opts.reduced === reduced) return;
    this.opts.reduced = reduced;
    this.pos = this.target = Math.round(this.target);
    this.unsettle(true);
    for (const layer of this.layers.values()) {
      if (reduced) this.flatten(layer);
      else {
        layer.titleP.p = 0;
        for (const item of layer.items) item.p = 0;
      }
    }
    this.dirty = true;
  }

  /** Data changed (new albums, filter): keep position by index, re-layout. */
  setMonths(months: EngineMonth[]) {
    const signature = months
      .map((m) => `${m.key}:${m.aspects.map((a) => a.toFixed(3)).join(",")}`)
      .join("|");
    if (signature === this.monthsSignature) return;
    this.monthsSignature = signature;
    this.opts.months = months;
    const max = Math.max(0, months.length - 1);
    this.target = clamp(Math.round(this.target), 0, max);
    this.pos = clamp(this.pos, 0, max);
    this.unsettle(true);
    for (const layer of this.layers.values()) {
      layer.layout = null;
      this.prepareLayer(layer);
    }
    this.dirty = true;
  }

  measure() {
    const rect = this.stage.getBoundingClientRect();
    const W = Math.max(1, rect.width);
    const H = Math.max(1, rect.height);
    if (W === this.W && H === this.H) return false;
    this.W = W;
    this.H = H;
    this.stage.style.setProperty("--ia-label-size", `${LABEL_SIZE()}px`);
    for (const layer of this.layers.values()) {
      layer.layout = null;
      this.prepareLayer(layer);
    }
    this.dirty = true;
    return true;
  }

  /** Collect layer and item elements after React rendered a new window of months. */
  refresh() {
    const seen = new Set<number>();
    this.stage.querySelectorAll<HTMLElement>("[data-layer]").forEach((el) => {
      const index = Number(el.dataset.layer);
      seen.add(index);
      const month = this.opts.months[index];
      if (!month) return;
      const existing = this.layers.get(index);
      const items = Array.from(el.querySelectorAll<HTMLElement>("[data-item]"));
      if (
        existing &&
        existing.el === el &&
        existing.items.length === items.length &&
        existing.items.every(
          (item, i) =>
            item.el === items[i] && item.img === items[i].querySelector("img"),
        ) &&
        existing.key === month.key
      )
        return;
      const layer: LayerState = {
        index,
        key: month.key,
        el,
        title: el.querySelector<HTMLElement>("[data-title]"),
        items: items.map((item) => ({
          el: item,
          img: item.querySelector("img"),
          p: 0,
          ring: this.ringPose(month.key, 0, 1),
          grid: { x: 0, y: 0, w: 1, h: 1 },
        })),
        titleP: { p: 0 },
        titleSize: { w: 0, h: 0 },
        layout: null,
      };
      if (existing) this.killLayerTweens(existing);
      this.layers.set(index, layer);
      this.prepareLayer(layer);
      if (this.settled === index) this.snapSettled(layer);
      else if (this.opts.reduced) this.flatten(layer);
    });
    for (const [index, layer] of this.layers) {
      if (seen.has(index)) continue;
      this.killLayerTweens(layer);
      this.layers.delete(index);
    }
    this.dirty = true;
    this.render();
  }

  /** Re-measure titles once web fonts are ready. */
  remeasureTitles() {
    for (const layer of this.layers.values()) {
      layer.layout = null;
      this.prepareLayer(layer);
    }
    this.dirty = true;
  }

  goTo(index: number, instant = false) {
    const max = this.count - 1;
    const next = clamp(Math.round(index), 0, Math.max(0, max));
    this.markInput();
    this.scrubbing = false;
    this.target = next;
    if (instant || this.opts.reduced) this.pos = next;
    if (this.settled !== next) this.unsettle();
    this.dirty = true;
  }

  step(direction: number) {
    this.goTo(Math.round(this.target) + direction);
  }

  /** Continuous position from the timeline scrubber while dragging. */
  scrubTo(value: number) {
    this.scrubbing = true;
    this.markInput();
    this.target = clamp(value, 0, Math.max(0, this.count - 1));
    if (this.opts.reduced) this.pos = Math.round(this.target);
    this.unsettle();
    this.dirty = true;
  }
  scrubEnd() {
    this.scrubbing = false;
    this.target = clamp(
      Math.round(this.target),
      0,
      Math.max(0, this.count - 1),
    );
    this.lastInput = performance.now() - 1000;
  }

  // ---------------------------------------------------------------- input

  private markInput() {
    this.lastInput = performance.now();
  }

  private onWheel = (event: WheelEvent) => {
    if (!this.enabled || this.count < 2 || !event.shiftKey || event.ctrlKey)
      return;
    const unit =
      event.deltaMode === 1 ? 33 : event.deltaMode === 2 ? this.H : 1;
    const dominant =
      Math.abs(event.deltaY) >= Math.abs(event.deltaX)
        ? event.deltaY
        : event.deltaX;
    const delta = dominant * unit;
    const max = this.count - 1;
    // At either end of the archive a settled tunnel lets the page scroll on.
    const atStart = this.target <= 0 && delta < 0;
    const atEnd = this.target >= max && delta > 0;
    if (
      (atStart || atEnd) &&
      !this.drag &&
      Math.abs(this.pos - this.target) < 0.01
    )
      return;
    event.preventDefault();
    this.markInput();
    if (this.opts.reduced) {
      const now = performance.now();
      this.wheelAccum += delta;
      if (now > this.wheelLock && Math.abs(this.wheelAccum) > 60) {
        this.step(Math.sign(this.wheelAccum));
        this.wheelAccum = 0;
        this.wheelLock = now + 420;
      }
      return;
    }
    this.target = clamp(
      this.target + clamp(delta, -240, 240) * 0.0026,
      -0.22,
      max + 0.22,
    );
    this.unsettle();
    this.dirty = true;
  };

  private onPointerDown = (event: PointerEvent) => {
    if (!this.enabled || event.button !== 0 || this.count < 2) return;
    if ((event.target as HTMLElement).closest("[data-no-drag]")) return;
    this.drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      start: this.target,
      moved: false,
      lastT: performance.now(),
      lastV: this.target,
      touch: event.pointerType === "touch",
      vel: 0,
    };
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("pointercancel", this.onPointerUp);
  };

  private onPointerMove = (event: PointerEvent) => {
    const drag = this.drag;
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    // Touch travels with horizontal swipes so vertical swipes keep scrolling the page.
    const amount = drag.touch ? -dx : Math.abs(dy) >= Math.abs(dx) ? -dy : -dx;
    if (!drag.moved) {
      if (drag.touch && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8)
        return this.endDrag();
      if (Math.abs(amount) < 7) return;
      drag.moved = true;
      this.stage.classList.add("is-grabbing");
    }
    const span = drag.touch ? this.W * 0.8 : this.H * 0.6;
    const max = this.count - 1;
    const now = performance.now();
    if (this.opts.reduced) return;
    const raw = drag.start + amount / span;
    this.target =
      raw < 0 ? raw * 0.3 : raw > max ? max + (raw - max) * 0.3 : raw;
    const dt = Math.max(1, now - drag.lastT);
    drag.vel = lerp(drag.vel, ((this.target - drag.lastV) / dt) * 1000, 0.4);
    drag.lastT = now;
    drag.lastV = this.target;
    this.markInput();
    this.unsettle();
    this.dirty = true;
  };

  private onPointerUp = (event: PointerEvent) => {
    const drag = this.drag;
    if (!drag || event.pointerId !== drag.id) return;
    if (drag.moved) {
      this.suppressClick = true;
      setTimeout(() => (this.suppressClick = false), 0);
      if (this.opts.reduced) {
        const dx = event.clientX - drag.x;
        const dy = event.clientY - drag.y;
        const amount = drag.touch
          ? -dx
          : Math.abs(dy) >= Math.abs(dx)
            ? -dy
            : -dx;
        if (Math.abs(amount) > 50) this.step(Math.sign(amount));
      } else {
        // Momentum: a flick adds at most about half a month, so one gesture never skips months unexpectedly.
        const max = this.count - 1;
        const flung = this.target + clamp(drag.vel * 0.12, -0.6, 0.6);
        this.target = clamp(Math.round(flung), 0, Math.max(0, max));
        this.lastInput = performance.now() - 1000;
      }
    }
    this.endDrag();
  };

  private endDrag() {
    this.drag = null;
    this.stage.classList.remove("is-grabbing");
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("pointercancel", this.onPointerUp);
  }

  private onClickCapture = (event: MouseEvent) => {
    if (this.suppressClick) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  // --------------------------------------------------------------- layout

  private ringPose(key: string, k: number, n: number): Pose {
    const seed = hash(key);
    const r = (j: number) => rand(seed + k * 97 + j * 13);
    const compact = this.compact;
    const theta =
      (seed % 360) * (Math.PI / 180) +
      (k / Math.max(1, n)) * Math.PI * 2 +
      (r(1) - 0.5) * (Math.PI / Math.max(3, n)) * 0.9;
    const rx = this.W * (compact ? 0.3 : 0.34);
    const ry = this.H * (compact ? 0.3 : 0.31);
    const rr = 0.9 + r(2) * 0.24;
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    return {
      x: c * rx * rr,
      y: s * ry * rr,
      z: -40 - r(3) * 300,
      ry: -c * 40,
      rx: s * 32,
      rz: (r(4) - 0.5) * 9,
      s: (compact ? 0.13 : 0.17) * (0.82 + r(5) * 0.36),
    };
  }

  private ensureLayout(layer: LayerState): Layout {
    if (layer.layout) return layer.layout;
    const month = this.opts.months[layer.index];
    const aspects = month?.aspects ?? [];
    const compact = this.compact;
    const scrub = compact ? 26 : 96;
    const left = compact ? 14 : Math.max(24, Math.round(this.W * 0.045));
    const width = Math.max(120, Math.min(this.W - left - scrub, 1320));
    const headingSize = compact ? 30 : clamp(this.W * 0.032, 32, 48);
    const headingBlock = headingSize * 1.1 + (compact ? 10 : 16);
    const bar = compact ? 38 : 46;
    const maxH = Math.max(
      120,
      this.H - headingBlock - bar - (compact ? 24 : 40),
    );
    const targetH = compact
      ? clamp(this.W * 0.3, 96, 150)
      : clamp(this.H * 0.26, 150, 240);
    const { rects, height } = justifiedLayout(
      aspects,
      width,
      targetH,
      compact ? 5 : 8,
      maxH,
    );
    const blockH = headingBlock + height + bar;
    const top =
      Math.max(compact ? 10 : 18, (this.H - blockH) / 2) + headingBlock;
    layer.layout = {
      rects: rects.map((r) => ({ ...r, x: r.x + left, y: r.y + top })),
      heading: { x: left, y: top - headingBlock, size: headingSize },
    };
    return layer.layout;
  }

  private prepareLayer(layer: LayerState) {
    const layout = this.ensureLayout(layer);
    const n = layer.items.length;
    layer.items.forEach((item, k) => {
      const rect = layout.rects[k] ?? { x: 0, y: 0, w: 1, h: 1 };
      item.grid = rect;
      item.el.style.width = `${rect.w}px`;
      item.el.style.height = `${rect.h}px`;
      const pose = this.ringPose(layer.key, k, n);
      // The element is sized to its grid rect; the ring pose scales it to a fraction of the stage height.
      pose.s = (pose.s * this.H) / Math.max(1, rect.h);
      item.ring = pose;
      // Flat-grid size is only requested once this month settles (see settle()).
      if (item.img && layer.el.classList.contains("is-settled"))
        item.img.sizes = `${Math.round(rect.w)}px`;
    });
    if (layer.title) {
      layer.titleSize = {
        w: layer.title.offsetWidth,
        h: layer.title.offsetHeight,
      };
    }
  }

  private killLayerTweens(layer: LayerState) {
    gsap.killTweensOf([layer.titleP, ...layer.items]);
  }

  // ------------------------------------------------------------- settling

  /** Reduced motion: every month is shown as its flat grid, without the settled chrome. */
  private flatten(layer: LayerState) {
    layer.titleP.p = 1;
    for (const item of layer.items) item.p = 1;
  }

  private snapSettled(layer: LayerState) {
    this.flatten(layer);
    this.markSettled(layer);
  }

  /** Settled photos show their date chips and upgrade to the grid-sized derivative. */
  private markSettled(layer: LayerState) {
    layer.el.classList.add("is-settled");
    for (const item of layer.items)
      if (item.img) item.img.sizes = `${Math.round(item.grid.w)}px`;
  }

  private settle(index: number) {
    const layer = this.layers.get(index);
    if (!layer || this.settling === index || this.settled === index) return;
    this.settling = index;
    const reduced = this.opts.reduced;
    this.settleTl?.kill();
    this.killLayerTweens(layer);
    gsap.killTweensOf(this.calm);
    const tl = gsap.timeline({
      onUpdate: () => void (this.dirty = true),
      onComplete: () => {
        if (this.settling !== index) return;
        this.settling = null;
        this.settled = index;
        this.settleTl = null;
        this.markSettled(layer);
        this.opts.onSettle(index);
      },
    });
    this.settleTl = tl;
    if (reduced) {
      this.snapSettled(layer);
      tl.to(this.calm, { v: 1, duration: 0.01 });
      return;
    }
    // Reading order: rows top to bottom, left to right.
    const order = layer.items
      .map((item, k) => ({ item, k }))
      .sort(
        (a, b) =>
          a.item.grid.y - b.item.grid.y || a.item.grid.x - b.item.grid.x,
      );
    tl.to(layer.titleP, { p: 1, duration: 1.05, ease: "power3.inOut" }, 0);
    tl.to(this.calm, { v: 1, duration: 0.9, ease: "power2.out" }, 0);
    order.forEach(({ item }, i) => {
      tl.to(
        item,
        { p: 1, duration: 1.15, ease: "expo.inOut" },
        0.04 + i * 0.045,
      );
    });
    // Settle the label colour/chips once the grid has formed.
    tl.call(
      () => void (this.settling === index && this.markSettled(layer)),
      [],
      Math.max(0.6, tl.duration() - 0.35),
    );
  }

  private unsettle(immediate = false) {
    if (this.settled === null && this.settling === null) return;
    const index = this.settled ?? this.settling!;
    this.settled = null;
    this.settling = null;
    this.settleTl?.kill();
    this.settleTl = null;
    const layer = this.layers.get(index);
    this.opts.onUnsettle();
    if (!layer) return;
    layer.el.classList.remove("is-settled");
    if (this.opts.reduced) return;
    this.killLayerTweens(layer);
    gsap.killTweensOf(this.calm);
    if (immediate) {
      layer.titleP.p = 0;
      this.calm.v = 0;
      for (const item of layer.items) item.p = 0;
      this.dirty = true;
      return;
    }
    const markDirty = () => void (this.dirty = true);
    gsap.to(layer.titleP, {
      p: 0,
      duration: 0.55,
      ease: "power2.inOut",
      onUpdate: markDirty,
    });
    gsap.to(this.calm, {
      v: 0,
      duration: 0.4,
      ease: "power2.out",
      onUpdate: markDirty,
    });
    gsap.to(layer.items, {
      p: 0,
      duration: 0.6,
      ease: "power3.inOut",
      stagger: { each: 0.012, from: "end" },
      onUpdate: markDirty,
    });
  }

  // ---------------------------------------------------------------- frame

  private tick = (_time: number, deltaMs: number) => {
    if (this.destroyed) return;
    const dt = Math.min(0.05, Math.max(0.001, deltaMs / 1000));
    const max = Math.max(0, this.count - 1);
    const now = performance.now();
    const idle =
      !this.drag?.moved && !this.scrubbing && now - this.lastInput > 150;
    if (idle) {
      const snapped = clamp(Math.round(this.target), 0, max);
      if (snapped !== this.target) {
        this.target = snapped;
        this.dirty = true;
      }
    }
    if (this.opts.reduced) this.pos = Math.round(this.target);
    if (!this.opts.reduced && this.pos !== this.target) {
      const k = 1 - Math.exp(-dt * (this.drag?.moved ? 14 : 6.5));
      this.pos += (this.target - this.pos) * k;
      if (Math.abs(this.target - this.pos) < 0.0008) this.pos = this.target;
      this.dirty = true;
    }
    const nearest = clamp(Math.round(this.pos), 0, max);
    if (nearest !== this.center) {
      this.center = nearest;
      this.opts.onCenter(nearest);
    }
    if (idle && this.pos === this.target && this.enabled && this.count > 0)
      this.settle(nearest);
    if (!this.dirty) return;
    this.dirty = false;
    this.render();
    for (const fn of this.listeners) fn(this.pos);
  };

  private render() {
    const reduced = this.opts.reduced;
    const depth = this.compact ? 900 : 1150;
    const calm = this.calm.v;
    for (const layer of this.layers.values()) {
      const d = layer.index - this.pos;
      const el = layer.el;
      let opacity: number;
      if (reduced) {
        opacity = layer.index === Math.round(this.pos) ? 1 : 0;
        el.style.transform = "none";
      } else {
        opacity =
          d < 0
            ? clamp(1 + d * 2.6, 0, 1)
            : clamp(1 - d * 0.3, 0, 1) *
              (d > 3.3 ? clamp((3.8 - d) * 2, 0, 1) : 1);
        // While a month is settled the months behind recede into a quiet glow.
        if (d > 0.5) opacity *= 1 - calm * 0.78;
        el.style.transform = `translate3d(0,0,${(-d * depth).toFixed(1)}px) rotateZ(${(d * 13).toFixed(2)}deg)`;
      }
      el.style.opacity = opacity.toFixed(3);
      el.style.visibility = opacity < 0.01 ? "hidden" : "visible";
      if (opacity < 0.01) continue;
      const layout = this.ensureLayout(layer);
      const cx = this.W / 2;
      const cy = this.H / 2;
      for (const item of layer.items) {
        const p = item.p;
        const g = item.grid;
        const ring = item.ring;
        // Ring pose is centred on (ring.x, ring.y); grid pose is the rect's top-left in stage space.
        const rx = ring.x - g.w / 2;
        const ry = ring.y - g.h / 2;
        const gx = g.x - cx;
        const gy = g.y - cy;
        const x = lerp(rx, gx, p);
        const y = lerp(ry, gy, p);
        const z = lerp(ring.z, 0, p);
        const s = lerp(ring.s, 1, p);
        item.el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,${z.toFixed(1)}px) rotateX(${lerp(ring.rx, 0, p).toFixed(2)}deg) rotateY(${lerp(ring.ry, 0, p).toFixed(2)}deg) rotateZ(${lerp(ring.rz, 0, p).toFixed(2)}deg) scale(${s.toFixed(4)})`;
      }
      if (layer.title) {
        const t = layer.titleP.p;
        const label = LABEL_SIZE();
        const { w, h } = layer.titleSize;
        const sx = lerp(cx - w / 2, layout.heading.x, t);
        const sy = lerp(cy - h / 2, layout.heading.y, t);
        const sc = lerp(1, layout.heading.size / label, t);
        layer.title.style.transform = `translate3d(${sx.toFixed(1)}px,${sy.toFixed(1)}px,0) scale(${sc.toFixed(4)})`;
      }
    }
  }
}
