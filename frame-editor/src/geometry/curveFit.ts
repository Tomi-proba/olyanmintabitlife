import type { Outline, Point } from './types';
import { dist, dot, length, normalize, sub } from './vec';
import { resamplePolyline } from './resample';
import { rdpSimplify } from './simplify';

let idCounter = 0;
function makeId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${idCounter}`;
}

function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

function lerpNum(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export interface BeautifyOptions {
  /** 0 = hug the raw stroke closely; 1 = aggressively clean up. */
  smoothness: number;
  /** Whether this stroke is a closed loop (a lens outline) or open (a bridge/brow line). */
  closed: boolean;
}

export interface BeautifyResult {
  outline: Outline;
  /** The dense resampled points corner detection ran on, for debugging/preview. */
  fitPoints: Point[];
}

/** Removes a trailing point that's essentially on top of the first point (user closed the loop by hand). */
function dedupeClosingPoint(points: Point[]): Point[] {
  if (points.length < 2) return points;
  const first = points[0];
  const last = points[points.length - 1];
  if (dist(first, last) < 1e-6) return points.slice(0, -1);
  return points;
}

/**
 * A fixed, fine resample spacing used only for corner detection. Keeping
 * this independent of the smoothness-driven simplification spacing is the
 * key fix for a real bug: detecting corners on an already-simplified,
 * sparse point set makes every remaining vertex's turn angle look large
 * (few points around a loop means each one turns more, even on a smooth
 * circle), which misclassified smooth curves as polygons full of sharp
 * corners. Detecting on dense, evenly-spaced points instead gives a turn
 * angle that reflects the actual drawn shape, not the simplification level.
 */
const CORNER_DETECTION_SPACING_MM = 0.5;
const CORNER_WINDOW_POINTS = 4;

/** Flags indices in a dense, evenly-spaced point array where the stroke turns sharply enough to be a real corner. */
function detectCornerIndices(points: Point[], angleThresholdDeg: number, closed: boolean): boolean[] {
  const n = points.length;
  const threshold = (angleThresholdDeg * Math.PI) / 180;
  const flags = new Array(n).fill(false);
  const w = Math.min(CORNER_WINDOW_POINTS, Math.max(1, Math.floor(n / 3)));

  for (let i = 0; i < n; i++) {
    if (!closed && (i < w || i >= n - w)) continue;

    const prev = points[((i - w) % n + n) % n];
    const curr = points[i];
    const next = points[(i + w) % n];

    const incoming = normalize(sub(curr, prev));
    const outgoing = normalize(sub(next, curr));
    const cosAngle = Math.max(-1, Math.min(1, dot(incoming, outgoing)));
    const turnAngle = Math.acos(cosAngle);

    if (turnAngle > threshold) flags[i] = true;
  }

  return flags;
}

function extractCircularSegment(points: Point[], startIdx: number, endIdx: number): Point[] {
  const n = points.length;
  if (endIdx >= startIdx) {
    return points.slice(startIdx, endIdx + 1);
  }
  return [...points.slice(startIdx, n), ...points.slice(0, endIdx + 1)];
}

/**
 * Simplifies a dense point set with RDP, but never simplifies *through* a
 * detected corner — each corner becomes a forced split point, so a true
 * corner's exact position always survives simplification while the smooth
 * stretches between corners still get reduced to a handful of points.
 */
function simplifyPreservingCorners(
  points: Point[],
  cornerFlags: boolean[],
  epsilon: number,
  closed: boolean,
): { points: Point[]; cornerFlags: boolean[] } {
  const n = points.length;
  const cornerIndices = cornerFlags.map((f, i) => (f ? i : -1)).filter((i) => i >= 0);

  if (closed && cornerIndices.length === 0) {
    // No real corners anywhere: simplify the whole loop as one open path from point 0 back to itself.
    const loop = [...points, points[0]];
    const simplified = rdpSimplify(loop, epsilon).slice(0, -1);
    return { points: simplified, cornerFlags: simplified.map(() => false) };
  }

  const boundaries = closed ? cornerIndices : Array.from(new Set([0, ...cornerIndices, n - 1])).sort((a, b) => a - b);
  const actualCorners = new Set(cornerIndices);

  const resultPoints: Point[] = [];
  const resultFlags: boolean[] = [];
  const segmentCount = closed ? boundaries.length : boundaries.length - 1;

  for (let s = 0; s < segmentCount; s++) {
    const startIdx = boundaries[s];
    const endIdx = boundaries[(s + 1) % boundaries.length];
    const segment = extractCircularSegment(points, startIdx, endIdx);
    const simplifiedSegment = rdpSimplify(segment, epsilon);

    const isLastSegment = s === segmentCount - 1;
    const keepLastPoint = isLastSegment && !closed;
    const pointsToAdd = keepLastPoint ? simplifiedSegment : simplifiedSegment.slice(0, -1);

    pointsToAdd.forEach((p, k) => {
      resultPoints.push(p);
      resultFlags.push(k === 0 && actualCorners.has(startIdx));
    });
  }

  return { points: resultPoints, cornerFlags: resultFlags };
}

function tangentAt(points: Point[], i: number, closed: boolean): Point {
  const n = points.length;
  if (closed) {
    const prev = points[(i - 1 + n) % n];
    const next = points[(i + 1) % n];
    return { x: (next.x - prev.x) / 2, y: (next.y - prev.y) / 2 };
  }
  if (i === 0) return sub(points[1], points[0]);
  if (i === n - 1) return sub(points[n - 1], points[n - 2]);
  const prev = points[i - 1];
  const next = points[i + 1];
  return { x: (next.x - prev.x) / 2, y: (next.y - prev.y) / 2 };
}

/**
 * Builds Bezier handles through a point sequence: 'smooth' points get a
 * Catmull-Rom-style tangent shared by both handles (a rounded curve
 * through that point); 'corner' points get independent, shorter handles
 * derived only from their own adjacent segment (a visible kink).
 */
function fitBezier(points: Point[], cornerFlags: boolean[], closed: boolean): Outline {
  const n = points.length;
  if (n < 3) {
    return points.map((p) => ({ id: makeId('cp'), point: p, handleIn: p, handleOut: p, corner: 'sharp' as const }));
  }

  const outline: Outline = [];
  for (let i = 0; i < n; i++) {
    const curr = points[i];
    const isEndpoint = !closed && (i === 0 || i === n - 1);
    const isCorner = cornerFlags[i] || isEndpoint;

    if (isCorner) {
      outline.push({ id: makeId('cp'), point: curr, handleIn: curr, handleOut: curr, corner: 'sharp' });
      continue;
    }

    const tangent = tangentAt(points, i, closed);
    const handleOut: Point = { x: curr.x + tangent.x / 3, y: curr.y + tangent.y / 3 };
    const handleIn: Point = { x: curr.x - tangent.x / 3, y: curr.y - tangent.y / 3 };
    outline.push({ id: makeId('cp'), point: curr, handleIn, handleOut, corner: 'smooth' });
  }
  return outline;
}

/** Samples a cubic Bezier segment at t in [0,1]. */
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

/** Collapses a segment's handles to a straight line if the fitted curve barely deviates from one. */
function snapStraightSegments(outline: Outline, toleranceMm: number, closed: boolean): Outline {
  const n = outline.length;
  const segmentCount = closed ? n : n - 1;
  const next: Outline = outline.map((cp) => ({ ...cp }));

  for (let i = 0; i < segmentCount; i++) {
    const a = outline[i];
    const b = outline[(i + 1) % n];

    let maxDeviation = 0;
    const steps = 8;
    for (let s = 1; s < steps; s++) {
      const t = s / steps;
      const onCurve = cubicBezierPoint(a.point, a.handleOut, b.handleIn, b.point, t);
      const onLine = { x: a.point.x + (b.point.x - a.point.x) * t, y: a.point.y + (b.point.y - a.point.y) * t };
      maxDeviation = Math.max(maxDeviation, dist(onCurve, onLine));
    }

    if (maxDeviation < toleranceMm) {
      next[i] = { ...next[i], handleOut: next[i].point };
      const bIndex = (i + 1) % n;
      next[bIndex] = { ...next[bIndex], handleIn: next[bIndex].point };
    }
  }

  return next;
}

/** Groups smooth corners whose approximate radius (handle length) is within `toleranceRatio` and averages them. */
function snapEqualRadii(outline: Outline, toleranceRatio: number): Outline {
  const radii = outline.map((cp) => {
    if (cp.corner !== 'smooth') return 0;
    return (length(sub(cp.handleOut, cp.point)) + length(sub(cp.point, cp.handleIn))) / 2;
  });

  const smoothIndices = outline.map((_, i) => i).filter((i) => outline[i].corner === 'smooth' && radii[i] > 0);
  const used = new Array(outline.length).fill(false);
  const groups: number[][] = [];

  for (const i of smoothIndices) {
    if (used[i]) continue;
    const group = [i];
    used[i] = true;
    for (const j of smoothIndices) {
      if (used[j]) continue;
      if (Math.abs(radii[i] - radii[j]) <= toleranceRatio * Math.max(radii[i], radii[j])) {
        group.push(j);
        used[j] = true;
      }
    }
    groups.push(group);
  }

  const next: Outline = outline.map((cp) => ({ ...cp }));
  for (const group of groups) {
    if (group.length < 2) continue;
    const avgRadius = group.reduce((sum, i) => sum + radii[i], 0) / group.length;
    for (const i of group) {
      const cp = next[i];
      const outDir = normalize(sub(cp.handleOut, cp.point));
      const inDir = normalize(sub(cp.point, cp.handleIn));
      next[i] = {
        ...cp,
        handleOut: { x: cp.point.x + outDir.x * avgRadius, y: cp.point.y + outDir.y * avgRadius },
        handleIn: { x: cp.point.x - inDir.x * avgRadius, y: cp.point.y - inDir.y * avgRadius },
      };
    }
  }
  return next;
}

/**
 * Turns a raw freehand stroke into a clean, professional-looking vector
 * outline:
 *  1. Resample to a fine, even spacing and detect real corners there (so
 *     corner detection doesn't depend on how aggressively we simplify).
 *  2. Simplify (RDP) the smooth stretches between corners, never through
 *     a corner, so corners survive simplification exactly where drawn.
 *  3. Fit Bezier handles — smooth points get rounded tangents, corners get
 *     independent handles (a visible kink).
 *  4. Snap near-straight segments to lines and near-equal corner radii to
 *     a shared radius.
 * `smoothness` (0-1) controls how aggressively steps 2 and 4 clean up, and
 * how high a turn angle has to be to count as a corner at all.
 */
export function beautifyStroke(rawPoints: Point[], options: BeautifyOptions): BeautifyResult {
  if (rawPoints.length < 3) {
    const outline = rawPoints.map((p) => ({ id: makeId('cp'), point: p, handleIn: p, handleOut: p, corner: 'sharp' as const }));
    return { outline, fitPoints: rawPoints.slice() };
  }

  const smoothness = clamp01(options.smoothness);
  const epsilon = lerpNum(0.12, 2.2, smoothness);
  const straightTolerance = lerpNum(0.15, 1.4, smoothness);
  const angleThresholdDeg = lerpNum(35, 65, smoothness);
  const radiusToleranceRatio = lerpNum(0.08, 0.35, smoothness);

  const dense = resamplePolyline(rawPoints, CORNER_DETECTION_SPACING_MM);
  const denseLoop = options.closed ? dedupeClosingPoint(dense) : dense;
  if (denseLoop.length < 3) {
    const outline = denseLoop.map((p) => ({ id: makeId('cp'), point: p, handleIn: p, handleOut: p, corner: 'sharp' as const }));
    return { outline, fitPoints: denseLoop };
  }

  const cornerFlags = detectCornerIndices(denseLoop, angleThresholdDeg, options.closed);
  const { points: fitPoints, cornerFlags: fitCornerFlags } = simplifyPreservingCorners(
    denseLoop,
    cornerFlags,
    epsilon,
    options.closed,
  );

  let outline = fitBezier(fitPoints, fitCornerFlags, options.closed);
  outline = snapStraightSegments(outline, straightTolerance, options.closed);
  outline = snapEqualRadii(outline, radiusToleranceRatio);

  return { outline, fitPoints };
}

export function makeControlPointId(): string {
  return makeId('cp');
}
