import type { Point } from './types';
import { normalize, signedArea } from './vec';

/**
 * Offsets a densely-sampled closed polygon outward (or inward) by
 * `distance`, using the average of each vertex's two adjacent edge normals.
 * This is a simple, robust approximation (not a true variable-miter
 * offset), which is adequate for the mostly-convex, gently-curved outlines
 * eyewear lenses have. It is not guaranteed self-intersection-free for
 * highly concave shapes or very large offset distances relative to the
 * local curvature radius.
 */
export function offsetPolygon(points: Point[], distance: number): Point[] {
  const n = points.length;
  if (n < 3 || distance === 0) return points.slice();

  // Standard polygon signed-area convention: positive = counter-clockwise.
  const ccw = signedArea(points) > 0;

  const edgeNormals: Point[] = [];
  for (let i = 0; i < n; i++) {
    const a = points[i];
    const b = points[(i + 1) % n];
    const dir = normalize({ x: b.x - a.x, y: b.y - a.y });
    // Rotating the edge direction -90deg gives the outward normal for a CCW polygon.
    const normal = ccw ? { x: dir.y, y: -dir.x } : { x: -dir.y, y: dir.x };
    edgeNormals.push(normal);
  }

  return points.map((p, i) => {
    const prevNormal = edgeNormals[(i - 1 + n) % n];
    const currNormal = edgeNormals[i];
    const avg = normalize({ x: prevNormal.x + currNormal.x, y: prevNormal.y + currNormal.y });
    return { x: p.x + avg.x * distance, y: p.y + avg.y * distance };
  });
}
