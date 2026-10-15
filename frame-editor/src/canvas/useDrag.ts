import { useCallback, useRef } from 'react';
import type { Point } from '../geometry/types';
import { clientToMm } from './svgCoords';

interface UseDragOptions {
  onStart?: () => void;
  onMove: (mmPoint: Point) => void;
  onEnd?: () => void;
}

/**
 * A small pointer-drag helper for SVG handles: starts on pointerdown,
 * tracks pointermove/pointerup on the window (so the drag keeps working
 * even once the pointer leaves the small handle it started on), and
 * converts every position into our mm-space coordinates via the owning
 * SVG element's screen CTM.
 */
export function useDrag({ onStart, onMove, onEnd }: UseDragOptions) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<SVGElement>) => {
      event.stopPropagation();
      const target = event.currentTarget as SVGGraphicsElement;
      const svg = target.ownerSVGElement ?? (target as unknown as SVGSVGElement);
      svgRef.current = svg;
      onStart?.();

      const handleMove = (e: PointerEvent) => {
        if (!svgRef.current) return;
        onMove(clientToMm(svgRef.current, e.clientX, e.clientY));
      };
      const handleUp = () => {
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);
        onEnd?.();
      };

      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
    },
    [onStart, onMove, onEnd],
  );

  return handlePointerDown;
}
