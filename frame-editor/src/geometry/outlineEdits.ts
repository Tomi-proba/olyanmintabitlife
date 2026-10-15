import type { ControlPoint, Outline, Point } from './types';
import { makeControlPointId } from './curveFit';
import { dist, length, normalize, sub } from './vec';
import { lerp } from './vec';

/** Splits the cubic Bezier segment between outline[index] and its next point at parameter t, inserting an exact on-curve point. */
export function insertPointOnSegment(outline: Outline, index: number, t = 0.5): Outline {
  const n = outline.length;
  if (n < 2) return outline;

  const a = outline[index % n];
  const b = outline[(index + 1) % n];

  const A = lerp(a.point, a.handleOut, t);
  const B = lerp(a.handleOut, b.handleIn, t);
  const C = lerp(b.handleIn, b.point, t);
  const D = lerp(A, B, t);
  const E = lerp(B, C, t);
  const F = lerp(D, E, t);

  const newA: ControlPoint = { ...a, handleOut: A };
  const newPoint: ControlPoint = { id: makeControlPointId(), point: F, handleIn: D, handleOut: E, corner: 'smooth' };
  const newB: ControlPoint = { ...b, handleIn: C };

  const next = outline.slice();
  next[index % n] = newA;
  next[(index + 1) % n] = newB;
  next.splice((index + 1) % n, 0, newPoint);
  return next;
}

/** Removes a point; its former neighbors connect directly using their own existing handles. */
export function deletePoint(outline: Outline, id: string): Outline {
  if (outline.length <= 3) return outline;
  return outline.filter((cp) => cp.id !== id);
}

/** Toggles a point between 'smooth' (mirrored, symmetric handles) and 'sharp' (independently draggable handles). */
export function toggleCornerType(outline: Outline, id: string): Outline {
  const n = outline.length;
  const index = outline.findIndex((cp) => cp.id === id);
  if (index === -1) return outline;

  const cp = outline[index];
  if (cp.corner === 'smooth') {
    return outline.map((p) => (p.id === id ? { ...p, corner: 'sharp' as const } : p));
  }

  // Going sharp -> smooth: if the handles are collapsed to the point, give them a sensible tangent
  // derived from the neighboring anchors so the corner visibly becomes smooth.
  const handleInLen = length(sub(cp.point, cp.handleIn));
  const handleOutLen = length(sub(cp.handleOut, cp.point));

  if (handleInLen > 1e-6 || handleOutLen > 1e-6) {
    const avgLen = (handleInLen + handleOutLen) / 2 || Math.max(handleInLen, handleOutLen);
    const dir = normalize(sub(cp.handleOut, cp.handleIn));
    const smoothed: ControlPoint = {
      ...cp,
      corner: 'smooth',
      handleIn: { x: cp.point.x - dir.x * avgLen, y: cp.point.y - dir.y * avgLen },
      handleOut: { x: cp.point.x + dir.x * avgLen, y: cp.point.y + dir.y * avgLen },
    };
    return outline.map((p) => (p.id === id ? smoothed : p));
  }

  const prev = outline[(index - 1 + n) % n];
  const next = outline[(index + 1) % n];
  const dir = normalize(sub(next.point, prev.point));
  const defaultLen = Math.min(dist(prev.point, cp.point), dist(cp.point, next.point)) * 0.35;
  const smoothed: ControlPoint = {
    ...cp,
    corner: 'smooth',
    handleIn: { x: cp.point.x - dir.x * defaultLen, y: cp.point.y - dir.y * defaultLen },
    handleOut: { x: cp.point.x + dir.x * defaultLen, y: cp.point.y + dir.y * defaultLen },
  };
  return outline.map((p) => (p.id === id ? smoothed : p));
}

/** Moves a point's anchor, carrying its handles along with it (rigid translation of the whole corner). */
export function moveAnchor(outline: Outline, id: string, newPoint: Point): Outline {
  return outline.map((cp) => {
    if (cp.id !== id) return cp;
    const delta = sub(newPoint, cp.point);
    return {
      ...cp,
      point: newPoint,
      handleIn: { x: cp.handleIn.x + delta.x, y: cp.handleIn.y + delta.y },
      handleOut: { x: cp.handleOut.x + delta.x, y: cp.handleOut.y + delta.y },
    };
  });
}

/**
 * Moves one tangent handle. If the point is 'smooth', the opposite handle
 * mirrors automatically to stay collinear (and the same length), like a
 * standard vector editor's smooth anchor.
 */
export function moveHandle(outline: Outline, id: string, which: 'in' | 'out', newPosition: Point): Outline {
  return outline.map((cp) => {
    if (cp.id !== id) return cp;

    if (cp.corner !== 'smooth') {
      return which === 'in' ? { ...cp, handleIn: newPosition } : { ...cp, handleOut: newPosition };
    }

    const dir = normalize(sub(newPosition, cp.point));
    const len = dist(newPosition, cp.point);
    const mirrored: Point = { x: cp.point.x - dir.x * len, y: cp.point.y - dir.y * len };

    return which === 'in'
      ? { ...cp, handleIn: newPosition, handleOut: mirrored }
      : { ...cp, handleOut: newPosition, handleIn: mirrored };
  });
}
