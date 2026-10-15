import { describe, expect, it } from 'vitest';
import { rdpSimplify } from '../simplify';

describe('rdpSimplify', () => {
  it('keeps the first and last point', () => {
    const points = [{ x: 0, y: 0 }, { x: 1, y: 0.01 }, { x: 2, y: -0.01 }, { x: 3, y: 0 }];
    const result = rdpSimplify(points, 0.5);
    expect(result[0]).toEqual(points[0]);
    expect(result[result.length - 1]).toEqual(points[points.length - 1]);
  });

  it('removes points that lie within epsilon of a straight line', () => {
    const points = [{ x: 0, y: 0 }, { x: 1, y: 0.01 }, { x: 2, y: -0.01 }, { x: 3, y: 0 }];
    const result = rdpSimplify(points, 0.5);
    expect(result.length).toBe(2);
  });

  it('keeps a real corner that exceeds epsilon', () => {
    const points = [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 5 }];
    const result = rdpSimplify(points, 0.1);
    expect(result.length).toBe(3);
  });

  it('leaves short input unchanged', () => {
    expect(rdpSimplify([{ x: 0, y: 0 }, { x: 1, y: 1 }], 1)).toHaveLength(2);
  });
});
