import { describe, expect, it } from 'vitest';
import { offsetPolygon } from '../offset';
import { signedArea } from '../vec';

function circlePolygon(radius: number, steps = 64) {
  return Array.from({ length: steps }, (_, i) => {
    const a = (i / steps) * Math.PI * 2;
    return { x: Math.cos(a) * radius, y: Math.sin(a) * radius };
  });
}

describe('offsetPolygon', () => {
  it('grows a CCW circle outward by approximately the offset distance', () => {
    const circle = circlePolygon(20);
    // Ensure CCW orientation for this test's assumption.
    const ccwCircle = signedArea(circle) > 0 ? circle : circle.slice().reverse();
    const offset = offsetPolygon(ccwCircle, 2);
    const avgRadius = offset.reduce((sum, p) => sum + Math.hypot(p.x, p.y), 0) / offset.length;
    expect(avgRadius).toBeCloseTo(22, 0);
  });

  it('shrinks with a negative distance', () => {
    const circle = circlePolygon(20);
    const ccwCircle = signedArea(circle) > 0 ? circle : circle.slice().reverse();
    const offset = offsetPolygon(ccwCircle, -3);
    const avgRadius = offset.reduce((sum, p) => sum + Math.hypot(p.x, p.y), 0) / offset.length;
    expect(avgRadius).toBeCloseTo(17, 0);
  });

  it('is a no-op for a zero offset or degenerate input', () => {
    const circle = circlePolygon(20);
    expect(offsetPolygon(circle, 0)).toEqual(circle);
    expect(offsetPolygon([{ x: 0, y: 0 }], 5)).toEqual([{ x: 0, y: 0 }]);
  });
});
