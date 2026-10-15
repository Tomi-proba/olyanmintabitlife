import * as THREE from 'three';
import type { Outline } from '../geometry/types';
import type { FrameParams, TempleParams } from '../state/editorStore';
import { mirrorOutline } from '../geometry/mirror';
import { sampleOutline } from '../geometry/path';
import { findOuterHingePoint } from '../geometry/hinge';
import { buildLensAndRim } from './buildLensAndRim';
import { buildTemple } from './buildTemple';

export interface FrameModel {
  rimRight: THREE.BufferGeometry;
  rimLeft: THREE.BufferGeometry;
  lensRight: THREE.BufferGeometry;
  lensLeft: THREE.BufferGeometry;
  templeRight: THREE.BufferGeometry;
  templeLeft: THREE.BufferGeometry;
}

/** Builds the full live 3D model (both lenses, both rims, both temples) from the right-side outline + params. */
export function buildFrameModel(outline: Outline, frame: FrameParams, temple: TempleParams): FrameModel {
  const sampledRight = sampleOutline(outline, 24);
  const sampledLeft = sampleOutline(mirrorOutline(outline, 0), 24);

  const right = buildLensAndRim(sampledRight, frame);
  const left = buildLensAndRim(sampledLeft, frame);

  const hingeRight = findOuterHingePoint(sampledRight);
  const hingeLeft = findOuterHingePoint(sampledLeft);

  return {
    rimRight: right.rim,
    lensRight: right.lens,
    rimLeft: left.rim,
    lensLeft: left.lens,
    templeRight: buildTemple(hingeRight, frame, temple),
    templeLeft: buildTemple(hingeLeft, frame, temple),
  };
}

export function disposeFrameModel(model: FrameModel) {
  model.rimRight.dispose();
  model.rimLeft.dispose();
  model.lensRight.dispose();
  model.lensLeft.dispose();
  model.templeRight.dispose();
  model.templeLeft.dispose();
}
