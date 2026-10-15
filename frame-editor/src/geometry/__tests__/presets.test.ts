import { describe, expect, it } from 'vitest';
import { PRESETS } from '../presets';
import { fitOutlineToMeasurements, measureOutline } from '../measure';
import { sampleOutline } from '../path';

describe('PRESETS', () => {
  it('has at least 5 distinct presets with unique ids', () => {
    expect(PRESETS.length).toBeGreaterThanOrEqual(5);
    const ids = PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every preset builds a valid, finite outline', () => {
    for (const preset of PRESETS) {
      const outline = preset.buildOutline();
      expect(outline.length).toBeGreaterThanOrEqual(3);
      const sampled = sampleOutline(outline);
      for (const p of sampled) {
        expect(Number.isFinite(p.x)).toBe(true);
        expect(Number.isFinite(p.y)).toBe(true);
      }
    }
  });

  it('every preset fits exactly to its own default measurements', () => {
    for (const preset of PRESETS) {
      const outline = preset.buildOutline();
      const fitted = fitOutlineToMeasurements(outline, preset.defaultMeasurements);
      const measured = measureOutline(fitted);
      expect(measured.lensWidthMm).toBeCloseTo(preset.defaultMeasurements.lensWidthMm, 2);
      expect(measured.lensHeightMm).toBeCloseTo(preset.defaultMeasurements.lensHeightMm, 2);
      expect(measured.innerEdgeOffsetMm).toBeCloseTo(preset.defaultMeasurements.bridgeWidthMm / 2, 2);
    }
  });
});
