import type { CornerType, Outline } from '../geometry/types';
import { useEditorStore } from '../state/editorStore';
import { useDrag } from '../canvas/useDrag';

interface ControlPointHandlesProps {
  outline: Outline;
  selectedPointId: string | null;
}

/** Smooth points render as circles, sharp (corner) points as diamonds — the standard vector-editor convention. */
function AnchorHandle({ id, x, y, selected, corner }: { id: string; x: number; y: number; selected: boolean; corner: CornerType }) {
  const selectPoint = useEditorStore((s) => s.selectPoint);
  const dragAnchor = useEditorStore((s) => s.dragAnchor);
  const endGesture = useEditorStore((s) => s.endGesture);

  const onPointerDown = useDrag({
    onStart: () => selectPoint(id),
    onMove: (p) => dragAnchor(id, p),
    onEnd: endGesture,
  });

  const fill = selected ? '#2f6fed' : '#ffffff';
  const common = { stroke: '#2f6fed', strokeWidth: 0.4, onPointerDown, style: { cursor: 'move' as const } };

  if (corner === 'sharp') {
    const size = 1.9;
    const d = `M ${x} ${y - size} L ${x + size} ${y} L ${x} ${y + size} L ${x - size} ${y} Z`;
    return <path d={d} fill={fill} {...common} />;
  }

  return <circle cx={x} cy={y} r={1.6} fill={fill} {...common} />;
}

function HandleDot({
  id,
  which,
  x,
  y,
}: {
  id: string;
  which: 'in' | 'out';
  x: number;
  y: number;
}) {
  const dragHandle = useEditorStore((s) => s.dragHandle);
  const endGesture = useEditorStore((s) => s.endGesture);

  const onPointerDown = useDrag({
    onMove: (p) => dragHandle(id, which, p),
    onEnd: endGesture,
  });

  return <circle cx={x} cy={y} r={1.3} fill="#ff8a3d" onPointerDown={onPointerDown} style={{ cursor: 'move' }} />;
}

/** Draggable anchors (circle = smooth, diamond = sharp) for every point, plus tangent handles for the selected point. */
export function ControlPointHandles({ outline, selectedPointId }: ControlPointHandlesProps) {
  const selected = outline.find((cp) => cp.id === selectedPointId);

  return (
    <g>
      {selected && (
        <g stroke="#ff8a3d" strokeWidth={0.25}>
          <line x1={selected.point.x} y1={selected.point.y} x2={selected.handleIn.x} y2={selected.handleIn.y} />
          <line x1={selected.point.x} y1={selected.point.y} x2={selected.handleOut.x} y2={selected.handleOut.y} />
        </g>
      )}
      {selected && (
        <>
          <HandleDot id={selected.id} which="in" x={selected.handleIn.x} y={selected.handleIn.y} />
          <HandleDot id={selected.id} which="out" x={selected.handleOut.x} y={selected.handleOut.y} />
        </>
      )}
      {outline.map((cp) => (
        <AnchorHandle key={cp.id} id={cp.id} x={cp.point.x} y={cp.point.y} selected={cp.id === selectedPointId} corner={cp.corner} />
      ))}
    </g>
  );
}
