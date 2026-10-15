import type { Point } from './types';
import { dist, lerp } from './vec';

/**
 * Resamples a polyline to (approximately) even spacing along its length.
 * Always keeps the first and last point. Degenerate input (0-1 points, or
 * zero total length) is returned unchanged.
 */
export function resamplePolyline(points: Point[], spacing: number): Point[] {
  if (points.length < 2 || spacing <= 0) return points.slice();

  const totalLength = polylineLength(points);
  if (totalLength === 0) return [points[0]];

  const result: Point[] = [points[0]];
  let traveled = 0;
  let nextTarget = spacing;

  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const segmentLength = dist(a, b);
    if (segmentLength === 0) continue;

    while (nextTarget <= traveled + segmentLength) {
      const t = (nextTarget - traveled) / segmentLength;
      result.push(lerp(a, b, t));
      nextTarget += spacing;
    }
    traveled += segmentLength;
  }

  const last = points[points.length - 1];
  const lastResult = result[result.length - 1];
  if (lastResult.x !== last.x || lastResult.y !== last.y) {
    result.push(last);
  }

  return result;
}

export function polylineLength(points: Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += dist(points[i - 1], points[i]);
  }
  return total;
}
