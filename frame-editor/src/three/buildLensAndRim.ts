import * as THREE from 'three';
import type { Point } from '../geometry/types';
import { offsetPolygon } from '../geometry/offset';
import { applyBaseCurveBend } from './bend';
import type { FrameParams } from '../state/editorStore';

function toVector2(points: Point[]): THREE.Vector2[] {
  return points.map((p) => new THREE.Vector2(p.x, p.y));
}

export interface LensAndRim {
  rim: THREE.BufferGeometry;
  lens: THREE.BufferGeometry;
}

const LENS_THICKNESS_MM = 1.4;

/**
 * Builds one eye's rim (an extruded, beveled band around the lens outline)
 * and lens (a thin flat fill of the exact outline), both bent to the
 * frame's base curve.
 */
export function buildLensAndRim(sampledOutline: Point[], frame: FrameParams): LensAndRim {
  const outerBoundary = offsetPolygon(sampledOutline, frame.rimThicknessMm);

  const rimShape = new THREE.Shape(toVector2(outerBoundary));
  rimShape.holes.push(new THREE.Path(toVector2(sampledOutline)));

  const bevel = Math.min(frame.bevelMm, frame.rimDepthMm / 2 - 0.05, frame.rimThicknessMm / 2 - 0.05);
  const bevelEnabled = bevel > 0.05;

  const rim = new THREE.ExtrudeGeometry(rimShape, {
    depth: frame.rimDepthMm,
    bevelEnabled,
    bevelThickness: bevelEnabled ? bevel : 0,
    bevelSize: bevelEnabled ? bevel : 0,
    bevelSegments: 3,
    curveSegments: 1,
  });
  rim.translate(0, 0, -frame.rimDepthMm / 2);

  const lensShape = new THREE.Shape(toVector2(sampledOutline));
  const lens = new THREE.ExtrudeGeometry(lensShape, {
    depth: LENS_THICKNESS_MM,
    bevelEnabled: false,
    curveSegments: 1,
  });
  lens.translate(0, 0, -LENS_THICKNESS_MM / 2);

  applyBaseCurveBend(rim, frame.baseCurveMm);
  applyBaseCurveBend(lens, frame.baseCurveMm);

  return { rim, lens };
}
