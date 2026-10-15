import { describe, expect, it } from 'vitest';
import { checkManufacturability } from '../manufacturability';

const GOOD_INPUT = { rimThicknessMm: 4, rimDepthMm: 6, lensWidthMm: 48, lensHeightMm: 38, bridgeWidthMm: 18 };

describe('checkManufacturability', () => {
  it('returns no warnings for a typical, well-proportioned frame', () => {
    expect(checkManufacturability(GOOD_INPUT)).toEqual([]);
  });

  it('flags a rim thinner than 2mm as an error', () => {
    const warnings = checkManufacturability({ ...GOOD_INPUT, rimThicknessMm: 1 });
    const rim = warnings.find((w) => w.id === 'rim_too_thin');
    expect(rim?.level).toBe('error');
  });

  it('flags lenses that are too small or too large', () => {
    expect(checkManufacturability({ ...GOOD_INPUT, lensWidthMm: 10 }).some((w) => w.id === 'lens_width_small')).toBe(true);
    expect(checkManufacturability({ ...GOOD_INPUT, lensWidthMm: 100 }).some((w) => w.id === 'lens_width_large')).toBe(true);
  });

  it('flags an unrealistic bridge width', () => {
    expect(checkManufacturability({ ...GOOD_INPUT, bridgeWidthMm: 2 }).some((w) => w.id === 'bridge_narrow')).toBe(true);
    expect(checkManufacturability({ ...GOOD_INPUT, bridgeWidthMm: 40 }).some((w) => w.id === 'bridge_wide')).toBe(true);
  });

  it('can return multiple warnings at once', () => {
    const warnings = checkManufacturability({ rimThicknessMm: 1, rimDepthMm: 1, lensWidthMm: 10, lensHeightMm: 10, bridgeWidthMm: 1 });
    expect(warnings.length).toBeGreaterThan(1);
  });
});
