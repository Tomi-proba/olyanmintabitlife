import { describe, expect, it } from 'vitest';
import { findOuterHingePoint } from '../hinge';

describe('findOuterHingePoint', () => {
  it('finds the point with the largest absolute x', () => {
    const points = [{ x: 1, y: 0 }, { x: 10, y: 2 }, { x: -3, y: 1 }, { x: 5, y: -1 }];
    expect(findOuterHingePoint(points)).toEqual({ x: 10, y: 2 });
  });

  it('works for negative-x-dominant outlines (the mirrored lens)', () => {
    const points = [{ x: -1, y: 0 }, { x: -12, y: 3 }, { x: 4, y: 1 }];
    expect(findOuterHingePoint(points)).toEqual({ x: -12, y: 3 });
  });
});
