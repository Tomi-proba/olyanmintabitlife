/**
 * A generic, original (not traced from any real product/photo) face/nose
 * reference silhouette: a face oval, a simple nose wedge at the bridge, and
 * ears, all non-interactive and drawn faintly so the user can judge fit
 * while sketching. Purely illustrative — not to scale with any real face.
 */
export function FaceGuide() {
  return (
    <g opacity={0.35} stroke="#8a97a6" fill="none" strokeWidth={0.4}>
      {/* Face oval. */}
      <ellipse cx={0} cy={-6} rx={62} ry={78} />
      {/* Nose bridge wedge. */}
      <path d="M -4 2 L 0 -14 L 4 2" />
      {/* Simple ear marks near the temple attachment height. */}
      <ellipse cx={-66} cy={-2} rx={4} ry={10} />
      <ellipse cx={66} cy={-2} rx={4} ry={10} />
    </g>
  );
}
