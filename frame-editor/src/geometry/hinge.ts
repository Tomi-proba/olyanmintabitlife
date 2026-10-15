import type { Point } from './types';

/** Finds the outline's outermost point (largest |x|) — where a temple hinge attaches. */
export function findOuterHingePoint(sampledOutline: Point[]): Point {
  let best = sampledOutline[0] ?? { x: 0, y: 0 };
  for (const p of sampledOutline) {
    if (Math.abs(p.x) > Math.abs(best.x)) best = p;
  }
  return best;
}
