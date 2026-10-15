import { describe, expect, it } from 'vitest';
import { deletePoint, insertPointOnSegment, moveAnchor, moveHandle, toggleCornerType } from '../outlineEdits';
import { ellipseOutline } from '../roundedPolygon';
import { sampleOutline } from '../path';

describe('insertPointOnSegment', () => {
  it('adds exactly one point without changing the sampled curve shape', () => {
    const outline = ellipseOutline(0, 0, 10, 8);
    const before = sampleOutline(outline, 64);
    const after = insertPointOnSegment(outline, 0, 0.5);
    expect(after.length).toBe(outline.length + 1);

    const afterSampled = sampleOutline(after, 64);
    // Compare overall shape via bounding extremes rather than point-by-point (sampling density differs slightly).
    const extent = (pts: typeof before) => ({
      minX: Math.min(...pts.map((p) => p.x)),
      maxX: Math.max(...pts.map((p) => p.x)),
      minY: Math.min(...pts.map((p) => p.y)),
      maxY: Math.max(...pts.map((p) => p.y)),
    });
    const e1 = extent(before);
    const e2 = extent(afterSampled);
    expect(e2.minX).toBeCloseTo(e1.minX, 1);
    expect(e2.maxX).toBeCloseTo(e1.maxX, 1);
    expect(e2.minY).toBeCloseTo(e1.minY, 1);
    expect(e2.maxY).toBeCloseTo(e1.maxY, 1);
  });

  it('the new point lies exactly on the original curve', () => {
    const outline = ellipseOutline(0, 0, 10, 8);
    const after = insertPointOnSegment(outline, 0, 0.5);
    const newPoint = after[1].point;
    const onEllipse = (newPoint.x * newPoint.x) / 100 + (newPoint.y * newPoint.y) / 64;
    expect(onEllipse).toBeCloseTo(1, 2);
  });
});

describe('deletePoint', () => {
  it('removes exactly the targeted point', () => {
    const outline = ellipseOutline(0, 0, 10, 8);
    const targetId = outline[1].id;
    const after = deletePoint(outline, targetId);
    expect(after).toHaveLength(outline.length - 1);
    expect(after.some((cp) => cp.id === targetId)).toBe(false);
  });

  it('refuses to shrink below a 3-point outline', () => {
    const outline = ellipseOutline(0, 0, 10, 8).slice(0, 3);
    const after = deletePoint(outline, outline[0].id);
    expect(after).toBe(outline);
  });
});

describe('toggleCornerType', () => {
  it('flips smooth to sharp and back without crashing', () => {
    const outline = ellipseOutline(0, 0, 10, 8);
    const id = outline[0].id;
    const sharp = toggleCornerType(outline, id);
    expect(sharp.find((cp) => cp.id === id)?.corner).toBe('sharp');
    const smoothAgain = toggleCornerType(sharp, id);
    expect(smoothAgain.find((cp) => cp.id === id)?.corner).toBe('smooth');
  });

  it('gives a zero-length-handle sharp point real handles when turned smooth', () => {
    const outline = [
      { id: 'a', point: { x: 0, y: 0 }, handleIn: { x: 0, y: 0 }, handleOut: { x: 0, y: 0 }, corner: 'sharp' as const },
      { id: 'b', point: { x: 10, y: 0 }, handleIn: { x: 10, y: 0 }, handleOut: { x: 10, y: 0 }, corner: 'sharp' as const },
      { id: 'c', point: { x: 10, y: 10 }, handleIn: { x: 10, y: 10 }, handleOut: { x: 10, y: 10 }, corner: 'sharp' as const },
    ];
    const result = toggleCornerType(outline, 'b');
    const b = result.find((cp) => cp.id === 'b')!;
    expect(b.corner).toBe('smooth');
    const handleLen = Math.hypot(b.handleOut.x - b.point.x, b.handleOut.y - b.point.y);
    expect(handleLen).toBeGreaterThan(0);
  });
});

describe('moveAnchor', () => {
  it('translates the point and both handles together', () => {
    const outline = ellipseOutline(0, 0, 10, 8);
    const id = outline[0].id;
    const original = outline.find((cp) => cp.id === id)!;
    const handleOutOffset = { x: original.handleOut.x - original.point.x, y: original.handleOut.y - original.point.y };

    const moved = moveAnchor(outline, id, { x: 5, y: 5 });
    const newCp = moved.find((cp) => cp.id === id)!;
    expect(newCp.point).toEqual({ x: 5, y: 5 });
    expect(newCp.handleOut.x - newCp.point.x).toBeCloseTo(handleOutOffset.x, 6);
    expect(newCp.handleOut.y - newCp.point.y).toBeCloseTo(handleOutOffset.y, 6);
  });
});

describe('moveHandle', () => {
  it('mirrors the opposite handle for a smooth point', () => {
    const outline = [
      { id: 'a', point: { x: 0, y: 0 }, handleIn: { x: -5, y: 0 }, handleOut: { x: 5, y: 0 }, corner: 'smooth' as const },
    ];
    const moved = moveHandle(outline, 'a', 'out', { x: 0, y: 8 });
    const a = moved[0];
    expect(a.handleOut).toEqual({ x: 0, y: 8 });
    expect(a.handleIn.x).toBeCloseTo(0, 6);
    expect(a.handleIn.y).toBeCloseTo(-8, 6);
  });

  it('moves handles independently for a sharp point', () => {
    const outline = [
      { id: 'a', point: { x: 0, y: 0 }, handleIn: { x: -5, y: 0 }, handleOut: { x: 5, y: 0 }, corner: 'sharp' as const },
    ];
    const moved = moveHandle(outline, 'a', 'out', { x: 0, y: 8 });
    const a = moved[0];
    expect(a.handleOut).toEqual({ x: 0, y: 8 });
    expect(a.handleIn).toEqual({ x: -5, y: 0 });
  });
});
