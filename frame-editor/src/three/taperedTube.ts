import * as THREE from 'three';

/**
 * Builds a closed, watertight tapered tube (a generalized cylinder whose
 * radius changes along its length) following `curve`. three.js's own
 * TubeGeometry has a constant radius, so this is a small custom builder —
 * used for the temple arms, which narrow from the hinge to the tip.
 */
export function buildTaperedTube(
  curve: THREE.Curve<THREE.Vector3>,
  radiusStart: number,
  radiusEnd: number,
  tubularSegments = 24,
  radialSegments = 8,
): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];

  const up = new THREE.Vector3(0, 1, 0);
  const rings: THREE.Vector3[][] = [];
  const ringCenters: THREE.Vector3[] = [];

  for (let i = 0; i <= tubularSegments; i++) {
    const u = i / tubularSegments;
    const center = curve.getPointAt(u);
    const tangent = curve.getTangentAt(u).normalize();

    let right = new THREE.Vector3().crossVectors(up, tangent);
    if (right.lengthSq() < 1e-6) right = new THREE.Vector3(1, 0, 0);
    right.normalize();
    const localUp = new THREE.Vector3().crossVectors(tangent, right).normalize();

    const radius = radiusStart + (radiusEnd - radiusStart) * u;
    const ring: THREE.Vector3[] = [];
    for (let j = 0; j <= radialSegments; j++) {
      const theta = (j / radialSegments) * Math.PI * 2;
      const point = new THREE.Vector3()
        .addScaledVector(right, Math.cos(theta) * radius)
        .addScaledVector(localUp, Math.sin(theta) * radius)
        .add(center);
      ring.push(point);
    }
    rings.push(ring);
    ringCenters.push(center);
  }

  for (const ring of rings) {
    for (const v of ring) positions.push(v.x, v.y, v.z);
  }

  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * (radialSegments + 1) + j;
      const b = a + radialSegments + 1;
      const c = a + 1;
      const d = b + 1;
      indices.push(a, b, c, b, d, c);
    }
  }

  // Simple triangle-fan caps at both ends, so the mesh is closed/watertight for export.
  const startCapIndex = positions.length / 3;
  positions.push(ringCenters[0].x, ringCenters[0].y, ringCenters[0].z);
  for (let j = 0; j < radialSegments; j++) {
    indices.push(startCapIndex, j + 1, j);
  }

  const endRingStart = tubularSegments * (radialSegments + 1);
  const endCapIndex = positions.length / 3;
  positions.push(ringCenters[tubularSegments].x, ringCenters[tubularSegments].y, ringCenters[tubularSegments].z);
  for (let j = 0; j < radialSegments; j++) {
    indices.push(endCapIndex, endRingStart + j, endRingStart + j + 1);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
