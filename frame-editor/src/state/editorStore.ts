import { create } from 'zustand';
import type { Outline, Point } from '../geometry/types';
import type { TargetMeasurements } from '../geometry/measure';
import { beautifyStroke } from '../geometry/curveFit';
import { fitOutlineToMeasurements, measureOutline } from '../geometry/measure';
import { deletePoint, insertPointOnSegment, moveAnchor, moveHandle, toggleCornerType } from '../geometry/outlineEdits';
import { PRESETS } from '../geometry/presets';

export type EditorMode = 'sketch' | 'edit';

export interface FrameParams {
  rimThicknessMm: number;
  rimDepthMm: number;
  bevelMm: number;
  /** Bend radius in mm for the front-curve "wrap": smaller = more curved, larger = flatter. */
  baseCurveMm: number;
}

export interface TempleParams {
  thicknessMm: number;
  /** 0-1: how much the temple narrows from the hinge to the tip. */
  taperRatio: number;
  lengthMm: number;
  /** How far the tip drops to curve behind the ear. */
  earDropMm: number;
}

interface DocumentSnapshot {
  outline: Outline | null;
  measurements: TargetMeasurements;
  frame: FrameParams;
  temple: TempleParams;
}

const DEFAULT_MEASUREMENTS: TargetMeasurements = { lensWidthMm: 50, lensHeightMm: 36, bridgeWidthMm: 18 };
const DEFAULT_FRAME: FrameParams = { rimThicknessMm: 4, rimDepthMm: 6, bevelMm: 0.6, baseCurveMm: 150 };
const DEFAULT_TEMPLE: TempleParams = { thicknessMm: 4, taperRatio: 0.6, lengthMm: 135, earDropMm: 12 };

function snapshotEquals(a: DocumentSnapshot, b: DocumentSnapshot): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

interface EditorStore {
  mode: EditorMode;

  // Sketch-stage state (not undo-tracked; the "document" below is what gets committed).
  rawStroke: Point[];
  isDrawing: boolean;
  smoothness: number;
  showOriginalStroke: boolean;
  previewOutline: Outline | null;

  // The committed, editable document.
  outline: Outline | null;
  measurements: TargetMeasurements;
  frame: FrameParams;
  temple: TempleParams;

  selectedPointId: string | null;

  history: { past: DocumentSnapshot[]; future: DocumentSnapshot[] };
  /** Captured once at the start of a drag/slider gesture, committed to history on release. */
  gestureCheckpoint: DocumentSnapshot | null;

  // Sketch actions
  beginStroke: (point: Point) => void;
  appendStrokePoint: (point: Point) => void;
  endStroke: () => void;
  setSmoothness: (value: number) => void;
  setShowOriginalStroke: (value: boolean) => void;
  startNewSketch: () => void;
  commitSketch: () => void;

  // Edit actions
  selectPoint: (id: string | null) => void;
  beginGesture: () => void;
  endGesture: () => void;
  dragAnchor: (id: string, point: Point) => void;
  dragHandle: (id: string, which: 'in' | 'out', point: Point) => void;
  addPointOnSegment: (index: number, t?: number) => void;
  removePoint: (id: string) => void;
  toggleCorner: (id: string) => void;

  setMeasurements: (partial: Partial<TargetMeasurements>) => void;
  setFrameParams: (partial: Partial<FrameParams>) => void;
  setTempleParams: (partial: Partial<TempleParams>) => void;

  loadPreset: (id: string) => void;

  undo: () => void;
  redo: () => void;
}

function currentSnapshot(s: Pick<EditorStore, 'outline' | 'measurements' | 'frame' | 'temple'>): DocumentSnapshot {
  return { outline: s.outline, measurements: s.measurements, frame: s.frame, temple: s.temple };
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  mode: 'sketch',

  rawStroke: [],
  isDrawing: false,
  smoothness: 0.5,
  showOriginalStroke: true,
  previewOutline: null,

  outline: null,
  measurements: DEFAULT_MEASUREMENTS,
  frame: DEFAULT_FRAME,
  temple: DEFAULT_TEMPLE,

  selectedPointId: null,

  history: { past: [], future: [] },
  gestureCheckpoint: null,

  beginStroke: (point) => set({ isDrawing: true, rawStroke: [point], previewOutline: null }),

  appendStrokePoint: (point) => {
    const { isDrawing, rawStroke, smoothness } = get();
    if (!isDrawing) return;
    const nextStroke = [...rawStroke, point];
    const preview = nextStroke.length >= 3 ? beautifyStroke(nextStroke, { smoothness, closed: true }).outline : null;
    set({ rawStroke: nextStroke, previewOutline: preview });
  },

  endStroke: () => {
    const { rawStroke, smoothness } = get();
    if (rawStroke.length >= 3) {
      set({ isDrawing: false, previewOutline: beautifyStroke(rawStroke, { smoothness, closed: true }).outline });
    } else {
      set({ isDrawing: false });
    }
  },

  setSmoothness: (value) => {
    const { rawStroke } = get();
    const preview = rawStroke.length >= 3 ? beautifyStroke(rawStroke, { smoothness: value, closed: true }).outline : null;
    set({ smoothness: value, previewOutline: preview });
  },

  setShowOriginalStroke: (value) => set({ showOriginalStroke: value }),

  startNewSketch: () => set({ mode: 'sketch', rawStroke: [], previewOutline: null, isDrawing: false }),

  commitSketch: () => {
    const { previewOutline, measurements, outline, frame, temple } = get();
    if (!previewOutline) return;
    const before = currentSnapshot({ outline, measurements, frame, temple });
    const fitted = fitOutlineToMeasurements(previewOutline, measurements);
    set((s) => ({
      mode: 'edit',
      outline: fitted,
      selectedPointId: null,
      history: { past: [...s.history.past, before], future: [] },
    }));
  },

  selectPoint: (id) => set({ selectedPointId: id }),

  beginGesture: () => {
    if (get().gestureCheckpoint) return;
    const { outline, measurements, frame, temple } = get();
    set({ gestureCheckpoint: currentSnapshot({ outline, measurements, frame, temple }) });
  },

  endGesture: () => {
    const { gestureCheckpoint, outline, measurements, frame, temple, history } = get();
    if (!gestureCheckpoint) return;
    const after = currentSnapshot({ outline, measurements, frame, temple });
    if (!snapshotEquals(gestureCheckpoint, after)) {
      set({ history: { past: [...history.past, gestureCheckpoint], future: [] }, gestureCheckpoint: null });
    } else {
      set({ gestureCheckpoint: null });
    }
  },

  dragAnchor: (id, point) => {
    const { outline } = get();
    if (!outline) return;
    get().beginGesture();
    set({ outline: moveAnchor(outline, id, point) });
  },

  dragHandle: (id, which, point) => {
    const { outline } = get();
    if (!outline) return;
    get().beginGesture();
    set({ outline: moveHandle(outline, id, which, point) });
  },

  addPointOnSegment: (index, t = 0.5) => {
    const { outline, measurements, frame, temple, history } = get();
    if (!outline) return;
    const before = currentSnapshot({ outline, measurements, frame, temple });
    set({
      outline: insertPointOnSegment(outline, index, t),
      history: { past: [...history.past, before], future: [] },
    });
  },

  removePoint: (id) => {
    const { outline, measurements, frame, temple, history, selectedPointId } = get();
    if (!outline) return;
    const before = currentSnapshot({ outline, measurements, frame, temple });
    set({
      outline: deletePoint(outline, id),
      selectedPointId: selectedPointId === id ? null : selectedPointId,
      history: { past: [...history.past, before], future: [] },
    });
  },

  toggleCorner: (id) => {
    const { outline, measurements, frame, temple, history } = get();
    if (!outline) return;
    const before = currentSnapshot({ outline, measurements, frame, temple });
    set({
      outline: toggleCornerType(outline, id),
      history: { past: [...history.past, before], future: [] },
    });
  },

  setMeasurements: (partial) => {
    const { outline, measurements } = get();
    if (!outline) {
      set({ measurements: { ...measurements, ...partial } });
      return;
    }
    get().beginGesture();
    const nextMeasurements = { ...measurements, ...partial };
    set({ measurements: nextMeasurements, outline: fitOutlineToMeasurements(outline, nextMeasurements) });
  },

  setFrameParams: (partial) => {
    get().beginGesture();
    set((s) => ({ frame: { ...s.frame, ...partial } }));
  },

  setTempleParams: (partial) => {
    get().beginGesture();
    set((s) => ({ temple: { ...s.temple, ...partial } }));
  },

  loadPreset: (id) => {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    const { outline, measurements, frame, temple, history } = get();
    const before = currentSnapshot({ outline, measurements, frame, temple });
    const fitted = fitOutlineToMeasurements(preset.buildOutline(), preset.defaultMeasurements);
    set({
      mode: 'edit',
      outline: fitted,
      measurements: preset.defaultMeasurements,
      selectedPointId: null,
      history: { past: [...history.past, before], future: [] },
    });
  },

  undo: () => {
    const { history, outline, measurements, frame, temple } = get();
    if (history.past.length === 0) return;
    const previous = history.past[history.past.length - 1];
    const current = currentSnapshot({ outline, measurements, frame, temple });
    set({
      outline: previous.outline,
      measurements: previous.measurements,
      frame: previous.frame,
      temple: previous.temple,
      mode: previous.outline ? 'edit' : 'sketch',
      history: { past: history.past.slice(0, -1), future: [current, ...history.future] },
    });
  },

  redo: () => {
    const { history, outline, measurements, frame, temple } = get();
    if (history.future.length === 0) return;
    const next = history.future[0];
    const current = currentSnapshot({ outline, measurements, frame, temple });
    set({
      outline: next.outline,
      measurements: next.measurements,
      frame: next.frame,
      temple: next.temple,
      mode: next.outline ? 'edit' : 'sketch',
      history: { past: [...history.past, current], future: history.future.slice(1) },
    });
  },
}));

export function selectLensMeasurements(outline: Outline | null) {
  if (!outline) return null;
  return measureOutline(outline);
}
