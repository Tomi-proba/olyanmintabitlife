import * as THREE from 'three';
import type { Point } from '../geometry/types';
import type { FrameParams, TempleParams } from '../state/editorStore';
import { baseCurveSag } from './bend';
import { buildTaperedTube } from './taperedTube';

/**
 * Builds one temple (arm): starts flush with the rim's back face at the
 * outer hinge point, runs back mostly straight, then curves down at the
 * tip to pass behind the ear. Tapers from `thicknessMm` at the hinge to a
 * narrower tip based on `taperRatio`.
 */
export function buildTemple(hingePoint: Point, frame: FrameParams, temple: TempleParams): THREE.BufferGeometry {
  const sign = hingePoint.x >= 0 ? 1 : -1;
  const startZ = -frame.rimDepthMm / 2 - baseCurveSag(hingePoint.x, frame.baseCurveMm);

  const start = new THREE.Vector3(hingePoint.x, hingePoint.y, startZ);
  const mid1 = new THREE.Vector3(hingePoint.x + sign * 1.5, hingePoint.y + 1, startZ - temple.lengthMm * 0.35);
  const mid2 = new THREE.Vector3(hingePoint.x + sign * 0.5, hingePoint.y - temple.earDropMm * 0.4, startZ - temple.lengthMm * 0.75);
  const end = new THREE.Vector3(hingePoint.x - sign * 0.5, hingePoint.y - temple.earDropMm, startZ - temple.lengthMm);

  const curve = new THREE.CatmullRomCurve3([start, mid1, mid2, end]);
  const radiusStart = temple.thicknessMm / 2;
  const radiusEnd = Math.max(0.6, radiusStart * (1 - temple.taperRatio));

  return buildTaperedTube(curve, radiusStart, radiusEnd, 20, 8);
}
