import { describe, expect, it } from 'vitest';
import { ellipseOutline, polygonWithRoundedCorners } from '../roundedPolygon';
import { sampleOutline } from '../path';

describe('polygonWithRoundedCorners', () => {
  it('produces a closed outline with finite points for a simple rectangle', () => {
    const outline = polygonWithRoundedCorners([
      { point: { x: 0, y: 0 }, radius: 2 },
      { point: { x: 10, y: 0 }, radius: 2 },
      { point: { x: 10, y: 10 }, radius: 2 },
      { point: { x: 0, y: 10 }, radius: 2 },
    ]);
    const sampled = sampleOutline(outline);
    expect(sampled.length).toBeGreaterThan(0);
    for (const p of sampled) {
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
    }
  });

  it('keeps the sampled shape within the bounding box of the input polygon', () => {
    const outline = polygonWithRoundedCorners([
      { point: { x: 0, y: 0 }, radius: 2 },
      { point: { x: 10, y: 0 }, radius: 2 },
      { point: { x: 10, y: 10 }, radius: 2 },
      { point: { x: 0, y: 10 }, radius: 2 },
    ]);
    const sampled = sampleOutline(outline);
    for (const p of sampled) {
      expect(p.x).toBeGreaterThanOrEqual(-0.01);
      expect(p.x).toBeLessThanOrEqual(10.01);
      expect(p.y).toBeGreaterThanOrEqual(-0.01);
      expect(p.y).toBeLessThanOrEqual(10.01);
    }
  });

  it('clamps a radius larger than half the edge length instead of overshooting', () => {
    const outline = polygonWithRoundedCorners([
      { point: { x: 0, y: 0 }, radius: 100 },
      { point: { x: 10, y: 0 }, radius: 100 },
      { point: { x: 10, y: 10 }, radius: 100 },
      { point: { x: 0, y: 10 }, radius: 100 },
    ]);
    const sampled = sampleOutline(outline);
    for (const p of sampled) {
      expect(p.x).toBeGreaterThanOrEqual(-0.01);
      expect(p.x).toBeLessThanOrEqual(10.01);
      expect(p.y).toBeGreaterThanOrEqual(-0.01);
      expect(p.y).toBeLessThanOrEqual(10.01);
    }
  });

  it('produces a true sharp corner when radius is 0', () => {
    const outline = polygonWithRoundedCorners([
      { point: { x: 0, y: 0 }, radius: 0 },
      { point: { x: 10, y: 0 }, radius: 0 },
      { point: { x: 10, y: 10 }, radius: 0 },
      { point: { x: 0, y: 10 }, radius: 0 },
    ]);
    expect(outline).toHaveLength(4);
    expect(outline.every((cp) => cp.corner === 'sharp')).toBe(true);
  });
});

describe('ellipseOutline', () => {
  it('produces 4 control points whose sampled shape matches the ellipse radii', () => {
    const outline = ellipseOutline(0, 0, 10, 6);
    expect(outline).toHaveLength(4);
    const sampled = sampleOutline(outline, 32);
    for (const p of sampled) {
      // Every sampled point should lie on (or extremely close to) the ellipse x^2/a^2 + y^2/b^2 = 1.
      const value = (p.x * p.x) / 100 + (p.y * p.y) / 36;
      expect(value).toBeGreaterThan(0.95);
      expect(value).toBeLessThan(1.05);
    }
  });
});
