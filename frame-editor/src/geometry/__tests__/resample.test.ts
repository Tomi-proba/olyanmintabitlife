import { describe, expect, it } from 'vitest';
import { resamplePolyline, polylineLength } from '../resample';

describe('resamplePolyline', () => {
  it('keeps the first and last point', () => {
    const points = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }];
    const result = resamplePolyline(points, 2);
    expect(result[0]).toEqual(points[0]);
    expect(result[result.length - 1]).toEqual(points[points.length - 1]);
  });

  it('produces roughly evenly spaced points', () => {
    const points = [{ x: 0, y: 0 }, { x: 100, y: 0 }];
    const result = resamplePolyline(points, 10);
    for (let i = 1; i < result.length - 1; i++) {
      const d = Math.hypot(result[i].x - result[i - 1].x, result[i].y - result[i - 1].y);
      expect(d).toBeCloseTo(10, 4);
    }
  });

  it('does not change total length by more than a small amount', () => {
    const points = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }];
    const original = polylineLength(points);
    const result = resamplePolyline(points, 1);
    const resampled = polylineLength(result);
    expect(resampled).toBeGreaterThan(original - 2);
    expect(resampled).toBeLessThan(original + 2);
  });

  it('handles degenerate input gracefully', () => {
    expect(resamplePolyline([], 1)).toEqual([]);
    expect(resamplePolyline([{ x: 1, y: 1 }], 1)).toEqual([{ x: 1, y: 1 }]);
  });
});
