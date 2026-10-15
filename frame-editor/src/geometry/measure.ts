import type { Outline, Point } from './types';
import { outlineBoundingBox } from './path';

export interface LensMeasurements {
  lensWidthMm: number;
  lensHeightMm: number;
  /** Distance from the bridge axis (x=0) to the lens's inner edge. Bridge width is twice this. */
  innerEdgeOffsetMm: number;
}

export function measureOutline(outline: Outline): LensMeasurements {
  const bbox = outlineBoundingBox(outline);
  return {
    lensWidthMm: bbox.maxX - bbox.minX,
    lensHeightMm: bbox.maxY - bbox.minY,
    innerEdgeOffsetMm: bbox.minX,
  };
}

export interface TargetMeasurements {
  lensWidthMm: number;
  lensHeightMm: number;
  bridgeWidthMm: number;
}

/**
 * Rescales and repositions an outline (assumed to live in x >= 0, drawn
 * for the eye on the +x side of the bridge) so its bounding box matches
 * the given lens width/height and its inner edge sits at bridgeWidthMm/2
 * from the bridge axis. This is what the numeric mm inputs drive — they
 * don't redraw the shape, they fit the existing shape to the target size.
 */
export function fitOutlineToMeasurements(outline: Outline, target: TargetMeasurements): Outline {
  const bbox = outlineBoundingBox(outline);
  const currentWidth = bbox.maxX - bbox.minX || 1;
  const currentHeight = bbox.maxY - bbox.minY || 1;
  const scaleX = target.lensWidthMm / currentWidth;
  const scaleY = target.lensHeightMm / currentHeight;
  const centerY = (bbox.minY + bbox.maxY) / 2;
  const targetInnerX = target.bridgeWidthMm / 2;

  const mapPoint = (p: Point): Point => ({
    x: targetInnerX + (p.x - bbox.minX) * scaleX,
    y: centerY + (p.y - centerY) * scaleY,
  });

  return outline.map((cp) => ({
    ...cp,
    point: mapPoint(cp.point),
    handleIn: mapPoint(cp.handleIn),
    handleOut: mapPoint(cp.handleOut),
  }));
}
