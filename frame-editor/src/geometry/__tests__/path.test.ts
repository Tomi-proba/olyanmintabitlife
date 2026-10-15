import { describe, expect, it } from 'vitest';
import { ellipseOutline } from '../roundedPolygon';
import { findNearestOnOutline, outlineToSvgPath, sampleOutline } from '../path';

describe('outlineToSvgPath', () => {
  it('produces a path string starting with M and ending with Z', () => {
    const outline = ellipseOutline(0, 0, 10, 8);
    const d = outlineToSvgPath(outline);
    expect(d.startsWith('M')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
    expect(d).toContain('C');
  });

  it('returns an empty string for an empty outline', () => {
    expect(outlineToSvgPath([])).toBe('');
  });
});

describe('findNearestOnOutline', () => {
  it('finds a point very close to a point that is actually on the curve', () => {
    const outline = ellipseOutline(0, 0, 10, 8);
    const onCurve = sampleOutline(outline, 32)[5];
    const nearest = findNearestOnOutline(outline, onCurve, 32);
    expect(nearest.distance).toBeLessThan(0.5);
  });

  it('finds the closest edge for a point far outside the shape', () => {
    const outline = ellipseOutline(0, 0, 10, 8);
    const nearest = findNearestOnOutline(outline, { x: 1000, y: 0 });
    // The closest point on the ellipse to a point far out on +x should be near (10, 0).
    expect(nearest.point.x).toBeGreaterThan(9);
    expect(Math.abs(nearest.point.y)).toBeLessThan(1);
  });
});
