# Frame Studio

A sketch-to-3D eyewear frame editor: draw one lens outline freehand, clean
it up into a professional vector curve, fine-tune it like a vector editor,
and watch a real 3D model of the frame build itself live — right down to
rim bevel, front-curve wrap, and temple arms. Export the outline as SVG or
the model as GLB/OBJ for a manufacturer or 3D printing.

This is a separate app from the life-sim game at the repo root — its own
`package.json`, dependencies, and dev server, living in `/frame-editor`.

## Requirements

- Node.js 20+
- npm

## Setup

```bash
cd frame-editor
npm install
npm run dev
```

Open the printed local URL (typically `http://localhost:5173`). The 2D
sketch editor is on the left, the live 3D preview on the right (stacked
vertically below ~860px width).

Other scripts:

```bash
npm test       # Vitest — the pure geometry/curve-fitting core
npm run build  # tsc -b && vite build, output in dist/
```

## How it works, end to end

1. **Sketch** — draw one lens outline on the mm-gridded canvas (with a
   faint face/nose/ear guide behind it). It's automatically mirrored
   across the bridge axis live as you draw, so the frame is always
   symmetric — you only ever draw one side.
2. **Clean up** — the raw stroke is immediately fit into a smooth vector
   curve (see "The curve-fitting pipeline" below). A smoothness slider
   controls how aggressively that cleanup happens, and the original stroke
   is shown faintly behind the cleaned curve for comparison.
3. **Precise editing** — click "Looks good → Edit" to commit the shape as
   an editable set of anchor points and tangent handles (round = smooth,
   diamond = sharp corner). Drag anchors or handles, double-click the
   outline to add a point, toggle a point between sharp/smooth, delete a
   point, or type exact lens width/height/bridge width in mm. Every edit
   is undoable.
4. **Live 3D** — the 2D outline becomes the lens shape; a rim is extruded
   around it (adjustable thickness, depth, and bevel/edge-rounding), the
   whole thing bends to a "base curve" wrap radius so it sits like real
   eyewear, and temple arms attach automatically at the outer edge (their
   own thickness/taper/ear-curve are also adjustable). Every 2D edit and
   every parameter slider updates the 3D model in real time.
5. **Manufacturability** — live warnings if the rim is too thin to mill
   from acetate, the lens is unrealistically small/large, or the bridge
   width is out of a typical range.
6. **Export** — SVG of the (mirrored) outline in true mm units, or the 3D
   model as a binary GLB or an OBJ.
7. **Presets** — Round, Rectangle, Wayfarer, Aviator, and Cat-Eye load as
   fully editable outlines (built from the same rounded-polygon/ellipse
   generators a hand-drawn shape goes through), not fixed images — pick
   one and keep editing it like you drew it yourself.

## Project structure

```
src/
  geometry/    Pure TypeScript geometric core — no React/three.js/DOM
               imports, so it's fully unit-testable with Vitest. This is
               where almost all of the actual "engineering" lives:
    types.ts             Point / ControlPoint / Outline types (mm space)
    vec.ts                Vector math helpers
    resample.ts            Even-spacing polyline resampling
    simplify.ts              Ramer-Douglas-Peucker noise removal
    curveFit.ts               The beautify pipeline (see below)
    outlineEdits.ts             Insert/delete/toggle/move, used by the editor
    path.ts                      Bezier sampling, SVG path strings, nearest-point
    mirror.ts                     Reflects an outline across the bridge axis
    measure.ts                     mm measurement + fit-to-target-size
    offset.ts                      Polygon outward/inward offset (for the rim)
    roundedPolygon.ts               Rounded-polygon/ellipse builders (presets)
    presets.ts                       The 5 launch presets
    hinge.ts                          Finds the temple attachment point
    manufacturability.ts               The live warning checks
  three/       three.js-dependent geometry builders (consume /geometry's
               pure output, produce THREE.BufferGeometry):
    bend.ts              The base-curve cylindrical wrap
    buildLensAndRim.ts    Extrudes the rim band + flat lens fill
    taperedTube.ts         A custom tapered generalized-cylinder (temples)
    buildTemple.ts           One temple arm's curve + taper
    buildFrameModel.ts        Orchestrates both lenses/rims/temples
  export/      SVG and GLB/OBJ export + browser download helpers
  state/
    editorStore.ts  Zustand store: sketch stage, committed document
                    (outline/measurements/frame/temple params), undo/redo
  canvas/      SVG pointer-drag helpers (mm-space coordinate conversion)
  components/  SketchCanvas, Preview3D, ControlPanel and its pieces
```

## The curve-fitting pipeline (`geometry/curveFit.ts`)

This is the part worth understanding if you're touching it:

1. Resample the raw stroke to a **fixed, fine** 0.5mm spacing and detect
   real corners there (comparing direction a few points before/after each
   point). Keeping this independent of the smoothness-driven simplification
   is deliberate — detecting corners on an already-simplified, sparse point
   set makes every remaining vertex's turn angle look artificially large
   (fewer points around a loop means each one turns more, even for a
   perfect circle), which used to misclassify smooth circles as polygons
   full of sharp corners. Detecting on dense points first fixes that; see
   `__tests__/curveFit.test.ts`'s regression tests.
2. Simplify (RDP) the smooth stretches *between* detected corners —
   never through one — so a real corner survives exactly where it was
   drawn, while smooth curves still get reduced to a handful of points.
3. Fit Bezier handles: smooth points get a Catmull-Rom-derived tangent
   (shared, mirrored handles — a rounded curve through that point); corner
   points get independent, collapsed handles (a visible kink).
4. Snap near-straight segments to true lines, and cluster near-equal
   corner radii to a shared radius (both tolerances scale with the
   smoothness slider).

## Adding a new preset

Presets live in `geometry/presets.ts` as either a rounded-polygon vertex
list (most shapes) or an ellipse (Round). A rounded-polygon preset is just
an ordered list of `{ point, radius }` vertices (counter-clockwise) plus
the `defaultMeasurements` (lens width/height, bridge width in mm) it gets
fit to on load — see `geometry/roundedPolygon.ts` for how corners are
rounded with a single Bezier arc per corner.

## Known simplifications

This is a design/prototyping tool, not production CAD software:

- **Rim offsetting** (`geometry/offset.ts`) uses a simple per-vertex
  averaged-normal offset, not a true variable-miter polygon offset. It
  works well for the mostly-convex, gently-curved shapes eyewear lenses
  have, but isn't guaranteed self-intersection-free for extreme concave
  shapes or very large rim thicknesses relative to the local curve radius.
- **Temple geometry** is a simple tapered tube along a 4-point Catmull-Rom
  curve, not a hinge-jointed mechanism.
- Preset silhouettes (Wayfarer, Aviator, Cat-Eye, ...) approximate the
  classic shape as a starting point for editing — they're original,
  procedurally-generated outlines, not traced replicas of any real product.
