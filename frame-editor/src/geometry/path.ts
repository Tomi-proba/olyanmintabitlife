import type { Outline, Point } from './types';
import { boundingBox, dist } from './vec';

function cubicBezierPoint(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const mt = 1 - t;
  const a = mt * mt * mt;
  const b = 3 * mt * mt * t;
  const c = 3 * mt * t * t;
  const d = t * t * t;
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  };
}

/** Samples a closed outline into a dense polygon, `segmentsPerCurve` points per Bezier segment. */
export function sampleOutline(outline: Outline, segmentsPerCurve = 16): Point[] {
  const n = outline.length;
  if (n === 0) return [];
  if (n === 1) return [outline[0].point];

  const points: Point[] = [];
  for (let i = 0; i < n; i++) {
    const a = outline[i];
    const b = outline[(i + 1) % n];
    for (let s = 0; s < segmentsPerCurve; s++) {
      const t = s / segmentsPerCurve;
      points.push(cubicBezierPoint(a.point, a.handleOut, b.handleIn, b.point, t));
    }
  }
  return points;
}

/** Same, but for an open path (no wraparound segment from the last point back to the first). */
export function sampleOpenPath(outline: Outline, segmentsPerCurve = 16): Point[] {
  const n = outline.length;
  if (n < 2) return outline.map((cp) => cp.point);

  const points: Point[] = [];
  for (let i = 0; i < n - 1; i++) {
    const a = outline[i];
    const b = outline[i + 1];
    for (let s = 0; s < segmentsPerCurve; s++) {
      const t = s / segmentsPerCurve;
      points.push(cubicBezierPoint(a.point, a.handleOut, b.handleIn, b.point, t));
    }
  }
  points.push(outline[n - 1].point);
  return points;
}

/** Builds an SVG path `d` attribute string for a closed outline. */
export function outlineToSvgPath(outline: Outline): string {
  const n = outline.length;
  if (n === 0) return '';
  if (n === 1) return `M ${outline[0].point.x} ${outline[0].point.y}`;

  const fmt = (p: Point) => `${round(p.x)} ${round(p.y)}`;
  let d = `M ${fmt(outline[0].point)}`;
  for (let i = 0; i < n; i++) {
    const a = outline[i];
    const b = outline[(i + 1) % n];
    d += ` C ${fmt(a.handleOut)} ${fmt(b.handleIn)} ${fmt(b.point)}`;
  }
  d += ' Z';
  return d;
}

function round(v: number): number {
  return Math.round(v * 1000) / 1000;
}

export function outlineBoundingBox(outline: Outline) {
  return boundingBox(outline.map((cp) => cp.point));
}

export interface NearestOnOutline {
  segmentIndex: number;
  t: number;
  point: Point;
  distance: number;
}

/** Finds the closest point on a closed outline to `target`, for "click on the curve to insert a point here" interactions. */
export function findNearestOnOutline(outline: Outline, target: Point, segmentsPerCurve = 24): NearestOnOutline {
  const n = outline.length;
  let best: NearestOnOutline = { segmentIndex: 0, t: 0, point: outline[0]?.point ?? target, distance: Infinity };

  for (let i = 0; i < n; i++) {
    const a = outline[i];
    const b = outline[(i + 1) % n];
    for (let s = 0; s <= segmentsPerCurve; s++) {
      const t = s / segmentsPerCurve;
      const point = cubicBezierPoint(a.point, a.handleOut, b.handleIn, b.point, t);
      const distance = dist(point, target);
      if (distance < best.distance) {
        best = { segmentIndex: i, t, point, distance };
      }
    }
  }

  return best;
}
