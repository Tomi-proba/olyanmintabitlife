import { describe, expect, it } from 'vitest';
import { mirrorOutline, mirrorPoint } from '../mirror';
import { beautifyStroke } from '../curveFit';
import { sampleOutline } from '../path';
import { signedArea } from '../vec';

describe('mirrorPoint', () => {
  it('reflects across x = axisX', () => {
    expect(mirrorPoint({ x: 5, y: 3 }, 0)).toEqual({ x: -5, y: 3 });
    expect(mirrorPoint({ x: 5, y: 3 }, 10)).toEqual({ x: 15, y: 3 });
  });
});

describe('mirrorOutline', () => {
  function sampleCircleOutline() {
    const stroke = Array.from({ length: 40 }, (_, i) => {
      const a = (i / 40) * Math.PI * 2;
      return { x: 10 + Math.cos(a) * 8, y: Math.sin(a) * 8 };
    });
    return beautifyStroke(stroke, { smoothness: 0.3, closed: true }).outline;
  }

  it('reflects every point across the bridge axis', () => {
    const outline = sampleCircleOutline();
    const mirrored = mirrorOutline(outline, 0);
    const originalXs = outline.map((cp) => cp.point.x).sort((a, b) => a - b);
    const mirroredXs = mirrored.map((cp) => -cp.point.x).sort((a, b) => a - b);
    for (let i = 0; i < originalXs.length; i++) {
      expect(mirroredXs[i]).toBeCloseTo(originalXs[i], 4);
    }
  });

  it('preserves winding orientation (same sign of signed area)', () => {
    const outline = sampleCircleOutline();
    const mirrored = mirrorOutline(outline, 0);
    const originalArea = signedArea(sampleOutline(outline));
    const mirroredArea = signedArea(sampleOutline(mirrored));
    expect(Math.sign(originalArea)).toBe(Math.sign(mirroredArea));
  });

  it('mirroring twice returns to the exact original point order and positions', () => {
    const outline = sampleCircleOutline();
    const twice = mirrorOutline(mirrorOutline(outline, 0), 0);
    expect(twice.length).toBe(outline.length);
    for (let i = 0; i < outline.length; i++) {
      expect(twice[i].point.x).toBeCloseTo(outline[i].point.x, 6);
      expect(twice[i].point.y).toBeCloseTo(outline[i].point.y, 6);
      expect(twice[i].handleIn.x).toBeCloseTo(outline[i].handleIn.x, 6);
      expect(twice[i].handleOut.x).toBeCloseTo(outline[i].handleOut.x, 6);
    }
  });
});
