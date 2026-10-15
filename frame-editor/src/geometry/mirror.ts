import type { ControlPoint, Outline, Point } from './types';
import { makeControlPointId } from './curveFit';

export function mirrorPoint(p: Point, axisX = 0): Point {
  return { x: 2 * axisX - p.x, y: p.y };
}

/**
 * Mirrors a closed outline across the vertical line x = axisX (the bridge
 * axis). Mirroring flips winding order, so the point order is reversed and
 * each point's handleIn/handleOut are swapped to keep the curve's shape
 * (and its orientation-dependent math, like offsetting) consistent.
 */
export function mirrorOutline(outline: Outline, axisX = 0): Outline {
  const mirrored: Outline = outline.map((cp) => ({
    id: makeControlPointId(),
    point: mirrorPoint(cp.point, axisX),
    handleIn: mirrorPoint(cp.handleOut, axisX),
    handleOut: mirrorPoint(cp.handleIn, axisX),
    corner: cp.corner,
  }));
  return mirrored.reverse();
}

export function mirrorControlPoint(cp: ControlPoint, axisX = 0): ControlPoint {
  return {
    id: cp.id,
    point: mirrorPoint(cp.point, axisX),
    handleIn: mirrorPoint(cp.handleOut, axisX),
    handleOut: mirrorPoint(cp.handleIn, axisX),
    corner: cp.corner,
  };
}
