import { describe, expect, it } from 'vitest';
import { beautifyStroke } from '../curveFit';
import { fitOutlineToMeasurements, measureOutline } from '../measure';

function circleStroke(centerX: number, radius: number) {
  return Array.from({ length: 40 }, (_, i) => {
    const a = (i / 40) * Math.PI * 2;
    return { x: centerX + Math.cos(a) * radius, y: Math.sin(a) * radius };
  });
}

describe('fitOutlineToMeasurements', () => {
  it('rescales the outline to match the target width/height exactly', () => {
    const outline = beautifyStroke(circleStroke(15, 8), { smoothness: 0.3, closed: true }).outline;
    const fitted = fitOutlineToMeasurements(outline, { lensWidthMm: 50, lensHeightMm: 38, bridgeWidthMm: 18 });
    const measured = measureOutline(fitted);
    expect(measured.lensWidthMm).toBeCloseTo(50, 3);
    expect(measured.lensHeightMm).toBeCloseTo(38, 3);
  });

  it('positions the inner edge at bridgeWidthMm / 2', () => {
    const outline = beautifyStroke(circleStroke(15, 8), { smoothness: 0.3, closed: true }).outline;
    const fitted = fitOutlineToMeasurements(outline, { lensWidthMm: 50, lensHeightMm: 38, bridgeWidthMm: 20 });
    const measured = measureOutline(fitted);
    expect(measured.innerEdgeOffsetMm).toBeCloseTo(10, 3);
  });

  it('is idempotent: fitting an already-fitted outline to the same targets is a no-op', () => {
    const outline = beautifyStroke(circleStroke(15, 8), { smoothness: 0.3, closed: true }).outline;
    const target = { lensWidthMm: 44, lensHeightMm: 34, bridgeWidthMm: 18 };
    const once = fitOutlineToMeasurements(outline, target);
    const twice = fitOutlineToMeasurements(once, target);
    for (let i = 0; i < once.length; i++) {
      expect(twice[i].point.x).toBeCloseTo(once[i].point.x, 3);
      expect(twice[i].point.y).toBeCloseTo(once[i].point.y, 3);
    }
  });
});
