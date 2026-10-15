import type { Outline } from '../geometry/types';
import { mirrorOutline } from '../geometry/mirror';
import { outlineBoundingBox, outlineToSvgPath } from '../geometry/path';
import { boundingBox } from '../geometry/vec';

/** Builds a standalone SVG document (in real millimeter units) of both lens outlines, for sending to a manufacturer. */
export function exportOutlineToSvg(outline: Outline): string {
  const mirrored = mirrorOutline(outline, 0);
  const bboxRight = outlineBoundingBox(outline);
  const bboxLeft = outlineBoundingBox(mirrored);
  const bbox = boundingBox([
    { x: bboxRight.minX, y: bboxRight.minY },
    { x: bboxRight.maxX, y: bboxRight.maxY },
    { x: bboxLeft.minX, y: bboxLeft.minY },
    { x: bboxLeft.maxX, y: bboxLeft.maxY },
  ]);

  const margin = 5;
  const minX = bbox.minX - margin;
  const minY = bbox.minY - margin;
  const width = bbox.maxX - bbox.minX + margin * 2;
  const height = bbox.maxY - bbox.minY + margin * 2;

  const rightPath = outlineToSvgPath(outline);
  const leftPath = outlineToSvgPath(mirrored);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}mm" height="${height}mm" viewBox="${minX} ${minY} ${width} ${height}">
  <title>Frame lens outline</title>
  <g fill="none" stroke="#000000" stroke-width="0.25">
    <path d="${rightPath}" />
    <path d="${leftPath}" />
  </g>
</svg>
`;
}

export function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
