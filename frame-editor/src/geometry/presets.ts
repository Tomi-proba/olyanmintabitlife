import type { Outline } from './types';
import type { TargetMeasurements } from './measure';
import { ellipseOutline, polygonWithRoundedCorners } from './roundedPolygon';

export interface FramePreset {
  id: string;
  name: string;
  /** Raw outline in arbitrary local units — always passed through fitOutlineToMeasurements on load. */
  buildOutline: () => Outline;
  defaultMeasurements: TargetMeasurements;
}

/**
 * Classic silhouettes, authored as rounded-polygon/ellipse vertex specs so
 * they load as fully editable ControlPoint outlines — not fixed images or
 * flat presets. Loading a preset fits it to `defaultMeasurements` with the
 * same fitOutlineToMeasurements() a hand-drawn shape goes through, so the
 * data model is identical either way. Proportions approximate the classic
 * shape; they're a starting point for editing, not a precise replica.
 */
export const PRESETS: FramePreset[] = [
  {
    id: 'round',
    name: 'Round',
    buildOutline: () => ellipseOutline(22, 0, 22, 20),
    defaultMeasurements: { lensWidthMm: 44, lensHeightMm: 40, bridgeWidthMm: 20 },
  },
  {
    id: 'rectangle',
    name: 'Rectangle',
    buildOutline: () =>
      polygonWithRoundedCorners([
        { point: { x: 2, y: -17 }, radius: 4 },
        { point: { x: 48, y: -17 }, radius: 4 },
        { point: { x: 48, y: 17 }, radius: 4 },
        { point: { x: 2, y: 17 }, radius: 4 },
      ]),
    defaultMeasurements: { lensWidthMm: 50, lensHeightMm: 36, bridgeWidthMm: 18 },
  },
  {
    id: 'wayfarer',
    name: 'Wayfarer',
    buildOutline: () =>
      polygonWithRoundedCorners([
        { point: { x: 6, y: -15 }, radius: 3 },
        { point: { x: 44, y: -15 }, radius: 3 },
        { point: { x: 50, y: 16 }, radius: 7 },
        { point: { x: 2, y: 16 }, radius: 7 },
      ]),
    defaultMeasurements: { lensWidthMm: 50, lensHeightMm: 34, bridgeWidthMm: 20 },
  },
  {
    id: 'aviator',
    name: 'Aviator',
    buildOutline: () =>
      polygonWithRoundedCorners([
        { point: { x: 10, y: -19 }, radius: 10 },
        { point: { x: 44, y: -15 }, radius: 16 },
        { point: { x: 42, y: 14 }, radius: 10 },
        { point: { x: 22, y: 18 }, radius: 14 },
        { point: { x: 4, y: 10 }, radius: 8 },
      ]),
    defaultMeasurements: { lensWidthMm: 54, lensHeightMm: 42, bridgeWidthMm: 16 },
  },
  {
    id: 'cat_eye',
    name: 'Cat-Eye',
    buildOutline: () =>
      polygonWithRoundedCorners([
        { point: { x: 6, y: -15 }, radius: 5 },
        { point: { x: 42, y: -16 }, radius: 10 },
        { point: { x: 50, y: 10 }, radius: 3 },
        { point: { x: 26, y: 16 }, radius: 8 },
        { point: { x: 4, y: 8 }, radius: 6 },
      ]),
    defaultMeasurements: { lensWidthMm: 50, lensHeightMm: 38, bridgeWidthMm: 18 },
  },
];
