interface GridProps {
  halfWidthMm: number;
  halfHeightMm: number;
  minorStepMm?: number;
  majorStepMm?: number;
}

/** A millimeter reference grid, drawn in mm user-space (the parent flips y to match our y-up convention). */
export function Grid({ halfWidthMm, halfHeightMm, minorStepMm = 5, majorStepMm = 10 }: GridProps) {
  const verticalLines: number[] = [];
  for (let x = -Math.floor(halfWidthMm / minorStepMm) * minorStepMm; x <= halfWidthMm; x += minorStepMm) {
    verticalLines.push(x);
  }
  const horizontalLines: number[] = [];
  for (let y = -Math.floor(halfHeightMm / minorStepMm) * minorStepMm; y <= halfHeightMm; y += minorStepMm) {
    horizontalLines.push(y);
  }

  return (
    <g>
      {verticalLines.map((x) => (
        <line
          key={`v-${x}`}
          x1={x}
          y1={-halfHeightMm}
          x2={x}
          y2={halfHeightMm}
          stroke={Math.abs(x) % majorStepMm === 0 ? '#9fb3c8' : '#e4ebf1'}
          strokeWidth={Math.abs(x) % majorStepMm === 0 ? 0.3 : 0.15}
        />
      ))}
      {horizontalLines.map((y) => (
        <line
          key={`h-${y}`}
          x1={-halfWidthMm}
          y1={y}
          x2={halfWidthMm}
          y2={y}
          stroke={Math.abs(y) % majorStepMm === 0 ? '#9fb3c8' : '#e4ebf1'}
          strokeWidth={Math.abs(y) % majorStepMm === 0 ? 0.3 : 0.15}
        />
      ))}
      {/* Bridge (mirror) axis, emphasized. */}
      <line x1={0} y1={-halfHeightMm} x2={0} y2={halfHeightMm} stroke="#5b7a99" strokeWidth={0.4} strokeDasharray="2,1.5" />
      {/* Eye line. */}
      <line x1={-halfWidthMm} y1={0} x2={halfWidthMm} y2={0} stroke="#5b7a99" strokeWidth={0.3} strokeDasharray="1.5,1.5" opacity={0.6} />
    </g>
  );
}
