import { useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useEditorStore } from '../state/editorStore';
import { clientToMm } from '../canvas/svgCoords';
import { mirrorOutline } from '../geometry/mirror';
import { outlineToSvgPath } from '../geometry/path';
import { findNearestOnOutline } from '../geometry/path';
import { Grid } from './Grid';
import { FaceGuide } from './FaceGuide';
import { ControlPointHandles } from './ControlPointHandles';

const VIEW_HALF_WIDTH = 85;
const VIEW_HALF_HEIGHT = 65;

function strokeToPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  return `M ${points.map((p) => `${p.x} ${p.y}`).join(' L ')}`;
}

export function SketchCanvas() {
  const mode = useEditorStore((s) => s.mode);
  const rawStroke = useEditorStore((s) => s.rawStroke);
  const previewOutline = useEditorStore((s) => s.previewOutline);
  const showOriginalStroke = useEditorStore((s) => s.showOriginalStroke);
  const outline = useEditorStore((s) => s.outline);
  const selectedPointId = useEditorStore((s) => s.selectedPointId);

  const beginStroke = useEditorStore((s) => s.beginStroke);
  const appendStrokePoint = useEditorStore((s) => s.appendStrokePoint);
  const endStroke = useEditorStore((s) => s.endStroke);
  const selectPoint = useEditorStore((s) => s.selectPoint);
  const addPointOnSegment = useEditorStore((s) => s.addPointOnSegment);

  const svgRef = useRef<SVGSVGElement | null>(null);

  const handleBackgroundPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (mode !== 'sketch') {
      selectPoint(null);
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    const p = clientToMm(event.currentTarget, event.clientX, event.clientY);
    beginStroke(p);
  };

  const handleBackgroundPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (mode !== 'sketch') return;
    const p = clientToMm(event.currentTarget, event.clientX, event.clientY);
    appendStrokePoint(p);
  };

  const handleBackgroundPointerUp = () => {
    if (mode !== 'sketch') return;
    endStroke();
  };

  const handleOutlineDoubleClick = (event: ReactPointerEvent<SVGPathElement>) => {
    if (mode !== 'edit' || !outline || !svgRef.current) return;
    event.stopPropagation();
    const p = clientToMm(svgRef.current, event.clientX, event.clientY);
    const nearest = findNearestOnOutline(outline, p);
    if (nearest.distance < 6) {
      addPointOnSegment(nearest.segmentIndex, nearest.t);
    }
  };

  const mirroredPreview = previewOutline ? mirrorOutline(previewOutline, 0) : null;
  const mirroredOutline = outline ? mirrorOutline(outline, 0) : null;
  const mirroredRawStroke = rawStroke.map((p) => ({ x: -p.x, y: p.y }));

  return (
    <svg
      ref={svgRef}
      viewBox={`${-VIEW_HALF_WIDTH} ${-VIEW_HALF_HEIGHT} ${VIEW_HALF_WIDTH * 2} ${VIEW_HALF_HEIGHT * 2}`}
      className="sketch-canvas"
      onPointerDown={handleBackgroundPointerDown}
      onPointerMove={handleBackgroundPointerMove}
      onPointerUp={handleBackgroundPointerUp}
      role="img"
      aria-label="Frame sketch canvas"
    >
      <rect x={-VIEW_HALF_WIDTH} y={-VIEW_HALF_HEIGHT} width={VIEW_HALF_WIDTH * 2} height={VIEW_HALF_HEIGHT * 2} fill="#fbfcfe" />
      <FaceGuide />
      <Grid halfWidthMm={VIEW_HALF_WIDTH} halfHeightMm={VIEW_HALF_HEIGHT} />

      {showOriginalStroke && rawStroke.length > 1 && (
        <>
          <path d={strokeToPath(rawStroke)} stroke="#c9cfd6" strokeWidth={0.6} fill="none" />
          <path d={strokeToPath(mirroredRawStroke)} stroke="#c9cfd6" strokeWidth={0.6} fill="none" />
        </>
      )}

      {mode === 'sketch' && previewOutline && mirroredPreview && (
        <>
          <path d={outlineToSvgPath(previewOutline)} fill="rgba(47,111,237,0.12)" stroke="#2f6fed" strokeWidth={0.8} />
          <path d={outlineToSvgPath(mirroredPreview)} fill="rgba(47,111,237,0.12)" stroke="#2f6fed" strokeWidth={0.8} />
        </>
      )}

      {mode === 'edit' && outline && mirroredOutline && (
        <>
          <path
            d={outlineToSvgPath(mirroredOutline)}
            fill="rgba(47,111,237,0.08)"
            stroke="#9fb6e8"
            strokeWidth={0.6}
          />
          <path
            d={outlineToSvgPath(outline)}
            fill="rgba(47,111,237,0.12)"
            stroke="#2f6fed"
            strokeWidth={0.8}
            onDoubleClick={handleOutlineDoubleClick}
            style={{ cursor: 'copy' }}
          />
          <ControlPointHandles outline={outline} selectedPointId={selectedPointId} />
        </>
      )}
    </svg>
  );
}
