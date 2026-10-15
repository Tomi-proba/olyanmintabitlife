import * as THREE from 'three';

/** How far (in -z) a point at horizontal offset `x` sags when wrapped around a cylinder of radius `baseCurveMm`. */
export function baseCurveSag(x: number, baseCurveMm: number): number {
  const radius = Math.max(20, baseCurveMm);
  const clampedX = Math.max(-radius + 0.01, Math.min(radius - 0.01, x));
  return radius - Math.sqrt(radius * radius - clampedX * clampedX);
}

/**
 * Bends a flat geometry around a vertical cylinder of radius `baseCurveMm`
 * centered behind the frame, so it wraps the face like real eyewear
 * instead of sitting as a flat cutout. Larger radius = flatter; smaller =
 * more curved. Mutates the geometry's position attribute in place.
 */
export function applyBaseCurveBend(geometry: THREE.BufferGeometry, baseCurveMm: number): THREE.BufferGeometry {
  const position = geometry.attributes.position;
  if (!position) return geometry;

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const z = position.getZ(i);
    position.setZ(i, z - baseCurveSag(x, baseCurveMm));
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}
