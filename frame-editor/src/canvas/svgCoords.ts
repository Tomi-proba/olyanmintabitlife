import type { Point } from '../geometry/types';

/**
 * Converts a pointer event's client (screen) coordinates into the SVG's
 * user-space coordinates using the element's screen CTM, which stays
 * correct regardless of how the SVG is scaled/positioned by CSS. Our mm
 * design space uses the same y-down convention as SVG natively, so no
 * flip is needed here.
 */
export function clientToMm(svg: SVGSVGElement, clientX: number, clientY: number): Point {
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const point = svg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  const transformed = point.matrixTransform(ctm.inverse());
  return { x: transformed.x, y: transformed.y };
}
