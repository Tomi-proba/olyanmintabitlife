/**
 * Core geometry types for the frame editor. Everything in /geometry is pure
 * TypeScript with no React/three.js/DOM imports, so it's unit-testable with
 * Vitest in isolation — the same "pure engine" pattern as the life-sim
 * game's /engine.
 *
 * All coordinates in this module are in millimeters, in "design space": x=0
 * is the bridge (mirror) axis, +x points away from the bridge toward the
 * temple, +y points down (screen/SVG convention — a larger y is lower on
 * screen). One lens lives entirely in x >= 0; the other lens is its mirror
 * image at x <= 0.
 */

export interface Point {
  x: number;
  y: number;
}

export type CornerType = 'sharp' | 'smooth';

/**
 * A vector-editor anchor point: a point plus two Bezier handles. A cubic
 * segment between ControlPoint A and B uses A.handleOut and B.handleIn as
 * the Bezier control points. A handle equal to its own anchor point
 * degenerates that side of the segment to a straight line.
 */
export interface ControlPoint {
  id: string;
  point: Point;
  handleIn: Point;
  handleOut: Point;
  corner: CornerType;
}

/** A closed loop of control points, e.g. one lens outline. */
export type Outline = ControlPoint[];

export interface RawStroke {
  points: Point[];
}
