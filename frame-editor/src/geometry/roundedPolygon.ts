import type { ControlPoint, Outline, Point } from './types';
import { makeControlPointId } from './curveFit';
import { dist, normalize, sub } from './vec';

export interface RoundedVertex {
  point: Point;
  /** Corner radius in the same units as the points; 0 = a sharp corner. */
  radius: number;
}

/**
 * Builds a closed vector outline from a polygon's vertices, rounding each
 * corner with a single cubic Bezier arc sized to that vertex's radius
 * (clamped so it can't overrun a short edge) and connecting corners with
 * straight segments. Used to author preset lens shapes (rectangle,
 * wayfarer, aviator, cat-eye, ...) as outlines that are immediately
 * editable in the same ControlPoint model a hand-drawn shape produces.
 */
export function polygonWithRoundedCorners(vertices: RoundedVertex[]): Outline {
  const n = vertices.length;
  if (n < 3) {
    return vertices.map((v) => ({ id: makeControlPointId(), point: v.point, handleIn: v.point, handleOut: v.point, corner: 'sharp' as const }));
  }

  const outline: Outline = [];

  for (let i = 0; i < n; i++) {
    const prev = vertices[(i - 1 + n) % n].point;
    const curr = vertices[i].point;
    const next = vertices[(i + 1) % n].point;

    const lenIn = dist(prev, curr);
    const lenOut = dist(curr, next);
    const radius = Math.max(0, Math.min(vertices[i].radius, lenIn * 0.49, lenOut * 0.49));

    const dirIn = normalize(sub(curr, prev));
    const dirOut = normalize(sub(next, curr));

    if (radius < 1e-6) {
      outline.push({ id: makeControlPointId(), point: curr, handleIn: curr, handleOut: curr, corner: 'sharp' });
      continue;
    }

    const cornerStart: Point = { x: curr.x - dirIn.x * radius, y: curr.y - dirIn.y * radius };
    const cornerEnd: Point = { x: curr.x + dirOut.x * radius, y: curr.y + dirOut.y * radius };

    const cosTheta = Math.max(-1, Math.min(1, dirIn.x * dirOut.x + dirIn.y * dirOut.y));
    const turnAngle = Math.acos(cosTheta);
    const handleLength = radius * (4 / 3) * Math.tan(turnAngle / 4);

    const startHandleOut: Point = { x: cornerStart.x + dirIn.x * handleLength, y: cornerStart.y + dirIn.y * handleLength };
    const endHandleIn: Point = { x: cornerEnd.x - dirOut.x * handleLength, y: cornerEnd.y - dirOut.y * handleLength };

    const startPoint: ControlPoint = {
      id: makeControlPointId(),
      point: cornerStart,
      handleIn: cornerStart,
      handleOut: startHandleOut,
      corner: 'smooth',
    };
    const endPoint: ControlPoint = {
      id: makeControlPointId(),
      point: cornerEnd,
      handleIn: endHandleIn,
      handleOut: cornerEnd,
      corner: 'smooth',
    };

    outline.push(startPoint, endPoint);
  }

  return outline;
}

/** A true ellipse, approximated with the standard 4-point cubic Bezier construction. */
export function ellipseOutline(centerX: number, centerY: number, radiusX: number, radiusY: number): Outline {
  const k = 0.5522847498; // 4/3 * tan(pi/8), the standard quarter-ellipse Bezier handle constant.
  const hx = radiusX * k;
  const hy = radiusY * k;

  const points: { point: Point; handleIn: Point; handleOut: Point }[] = [
    {
      point: { x: centerX + radiusX, y: centerY },
      handleIn: { x: centerX + radiusX, y: centerY - hy },
      handleOut: { x: centerX + radiusX, y: centerY + hy },
    },
    {
      point: { x: centerX, y: centerY + radiusY },
      handleIn: { x: centerX + hx, y: centerY + radiusY },
      handleOut: { x: centerX - hx, y: centerY + radiusY },
    },
    {
      point: { x: centerX - radiusX, y: centerY },
      handleIn: { x: centerX - radiusX, y: centerY + hy },
      handleOut: { x: centerX - radiusX, y: centerY - hy },
    },
    {
      point: { x: centerX, y: centerY - radiusY },
      handleIn: { x: centerX - hx, y: centerY - radiusY },
      handleOut: { x: centerX + hx, y: centerY - radiusY },
    },
  ];

  return points.map((p) => ({ id: makeControlPointId(), point: p.point, handleIn: p.handleIn, handleOut: p.handleOut, corner: 'smooth' as const }));
}
