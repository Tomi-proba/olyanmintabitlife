import { describe, expect, it } from 'vitest';
import { beautifyStroke } from '../curveFit';
import { sampleOutline, outlineBoundingBox } from '../path';
import { boundingBox } from '../vec';

function noisyCircle(radius: number, steps: number, noise: number, seed = 1): { x: number; y: number }[] {
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const r = radius + (rand() - 0.5) * noise;
    points.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
  }
  return points;
}

describe('beautifyStroke', () => {
  it('produces a closed outline with at least 3 control points from a noisy circle', () => {
    const stroke = noisyCircle(20, 60, 1.5);
    const { outline } = beautifyStroke(stroke, { smoothness: 0.5, closed: true });
    expect(outline.length).toBeGreaterThanOrEqual(3);
  });

  it('keeps the cleaned shape close to the drawn bounding box', () => {
    const stroke = noisyCircle(20, 60, 1.5);
    const inputBbox = boundingBox(stroke);
    const { outline } = beautifyStroke(stroke, { smoothness: 0.5, closed: true });
    const outBbox = outlineBoundingBox(outline);

    expect(outBbox.minX).toBeGreaterThan(inputBbox.minX - 5);
    expect(outBbox.maxX).toBeLessThan(inputBbox.maxX + 5);
    expect(outBbox.minY).toBeGreaterThan(inputBbox.minY - 5);
    expect(outBbox.maxY).toBeLessThan(inputBbox.maxY + 5);
  });

  it('higher smoothness removes more fine detail (fewer control points) on a very noisy stroke', () => {
    const stroke = noisyCircle(20, 80, 3);
    const low = beautifyStroke(stroke, { smoothness: 0.05, closed: true });
    const high = beautifyStroke(stroke, { smoothness: 0.95, closed: true });
    expect(high.outline.length).toBeLessThanOrEqual(low.outline.length);
  });

  it('a near-perfect rectangle stroke produces mostly straight segments', () => {
    const rect: { x: number; y: number }[] = [];
    const push = (x: number, y: number) => rect.push({ x, y });
    for (let t = 0; t <= 1; t += 0.05) push(t * 20, 0);
    for (let t = 0; t <= 1; t += 0.05) push(20, t * 10);
    for (let t = 0; t <= 1; t += 0.05) push(20 - t * 20, 10);
    for (let t = 0; t <= 1; t += 0.05) push(0, 10 - t * 10);

    const { outline } = beautifyStroke(rect, { smoothness: 0.6, closed: true });
    const straightCount = outline.filter((cp) => {
      const dxOut = cp.handleOut.x - cp.point.x;
      const dyOut = cp.handleOut.y - cp.point.y;
      return Math.hypot(dxOut, dyOut) < 1e-6;
    }).length;
    expect(straightCount).toBeGreaterThan(0);
  });

  it('handles a tiny stroke (fewer than 3 points) without throwing', () => {
    const { outline } = beautifyStroke([{ x: 0, y: 0 }, { x: 1, y: 1 }], { smoothness: 0.5, closed: true });
    expect(outline.length).toBe(2);
  });

  it('every outline control point produces a finite sampled polygon', () => {
    const stroke = noisyCircle(20, 60, 1.5);
    const { outline } = beautifyStroke(stroke, { smoothness: 0.5, closed: true });
    const sampled = sampleOutline(outline);
    for (const p of sampled) {
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
    }
  });

  it('regression: a clean circle stays smooth (not an octagon) regardless of how few points it was drawn with', () => {
    // Deliberately coarse, like a real pointer-event stroke (not densely sampled) — this is what
    // originally broke: detecting corners on the already-simplified sparse points made every
    // vertex's turn angle look large, misclassifying a smooth circle as a polygon full of corners.
    const coarseCircle = noisyCircle(20, 40, 0.3);
    const { outline } = beautifyStroke(coarseCircle, { smoothness: 0.5, closed: true });
    const sharpCount = outline.filter((cp) => cp.corner === 'sharp').length;
    expect(sharpCount).toBe(0);
  });

  it('a stroke with one real 90-degree corner keeps exactly that corner sharp', () => {
    const points: { x: number; y: number }[] = [];
    // A long smooth arc, then a hard 90-degree turn, then another long smooth arc — drawn with
    // enough points to resemble a real stroke, not an idealized polyline.
    for (let i = 0; i <= 60; i++) {
      const a = Math.PI * (i / 60) * 0.9;
      points.push({ x: Math.cos(a) * 20, y: Math.sin(a) * 20 });
    }
    const corner = points[points.length - 1];
    for (let i = 1; i <= 20; i++) {
      points.push({ x: corner.x, y: corner.y - i * 0.5 });
    }
    const { outline } = beautifyStroke(points, { smoothness: 0.3, closed: false });
    const sharpCount = outline.filter((cp) => cp.corner === 'sharp').length;
    expect(sharpCount).toBeGreaterThanOrEqual(1);
  });

  it('high smoothness cleans a mildly noisy circle into an entirely smooth shape', () => {
    // At low smoothness the tool intentionally hugs the raw stroke (noise and all); at high
    // smoothness it should confidently recognize this as a circle with no real corners.
    const stroke = noisyCircle(20, 60, 1.5);
    const high = beautifyStroke(stroke, { smoothness: 0.9, closed: true });
    expect(high.outline.filter((cp) => cp.corner === 'sharp')).toHaveLength(0);
  });
});
