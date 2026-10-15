import { useEditorStore } from '../state/editorStore';
import { measureOutline } from '../geometry/measure';
import { NumericMmInput } from './NumericMmInput';
import { ParamSlider } from './ParamSlider';
import { PresetPicker } from './PresetPicker';
import { WarningsPanel } from './WarningsPanel';
import { ExportButtons } from './ExportButtons';

function SketchControls() {
  const smoothness = useEditorStore((s) => s.smoothness);
  const setSmoothness = useEditorStore((s) => s.setSmoothness);
  const showOriginalStroke = useEditorStore((s) => s.showOriginalStroke);
  const setShowOriginalStroke = useEditorStore((s) => s.setShowOriginalStroke);
  const previewOutline = useEditorStore((s) => s.previewOutline);
  const commitSketch = useEditorStore((s) => s.commitSketch);
  const rawStroke = useEditorStore((s) => s.rawStroke);

  return (
    <div className="panel-section">
      <h2>1–2. Sketch &amp; Clean Up</h2>
      <p className="hint">
        Draw one lens outline on the canvas — it mirrors automatically. Adjust smoothness, then confirm to start
        precise editing.
      </p>
      <ParamSlider label="Smoothness" value={smoothness} min={0} max={1} step={0.01} onLiveChange={setSmoothness} />
      <label className="checkbox-row">
        <input type="checkbox" checked={showOriginalStroke} onChange={(e) => setShowOriginalStroke(e.target.checked)} />
        Show original stroke
      </label>
      <button type="button" className="primary-button" onClick={commitSketch} disabled={!previewOutline}>
        Looks good → Edit
      </button>
      {rawStroke.length === 0 && (
        <>
          <p className="hint">Or start from a classic shape:</p>
          <PresetPicker />
        </>
      )}
    </div>
  );
}

function EditControls() {
  const outline = useEditorStore((s) => s.outline);
  const selectedPointId = useEditorStore((s) => s.selectedPointId);
  const measurements = useEditorStore((s) => s.measurements);
  const frame = useEditorStore((s) => s.frame);
  const temple = useEditorStore((s) => s.temple);

  const setMeasurements = useEditorStore((s) => s.setMeasurements);
  const setFrameParams = useEditorStore((s) => s.setFrameParams);
  const setTempleParams = useEditorStore((s) => s.setTempleParams);
  const endGesture = useEditorStore((s) => s.endGesture);
  const removePoint = useEditorStore((s) => s.removePoint);
  const toggleCorner = useEditorStore((s) => s.toggleCorner);
  const startNewSketch = useEditorStore((s) => s.startNewSketch);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const historyPast = useEditorStore((s) => s.history.past.length);
  const historyFuture = useEditorStore((s) => s.history.future.length);

  if (!outline) return null;
  const measured = measureOutline(outline);
  const selected = outline.find((cp) => cp.id === selectedPointId);

  return (
    <div className="panel-section">
      <div className="toolbar-row">
        <button type="button" onClick={undo} disabled={historyPast === 0}>
          ↺ Undo
        </button>
        <button type="button" onClick={redo} disabled={historyFuture === 0}>
          ↻ Redo
        </button>
        <button type="button" onClick={startNewSketch}>
          Draw New Shape
        </button>
      </div>

      <h2>3. Precise Editing</h2>
      <p className="hint">
        Drag the round (smooth) or diamond (sharp) anchors, or the orange tangent handles. Double-click the outline
        to add a point.
      </p>
      <div className="toolbar-row">
        <button type="button" disabled={!selected} onClick={() => selected && toggleCorner(selected.id)}>
          Toggle {selected?.corner === 'smooth' ? '→ Sharp' : '→ Smooth'}
        </button>
        <button type="button" disabled={!selected} onClick={() => selected && removePoint(selected.id)}>
          Delete Point
        </button>
      </div>

      <div className="measurement-grid">
        <NumericMmInput label="Lens width" value={measurements.lensWidthMm} min={20} max={70} onCommit={(v) => setMeasurements({ lensWidthMm: v })} />
        <NumericMmInput label="Lens height" value={measurements.lensHeightMm} min={15} max={60} onCommit={(v) => setMeasurements({ lensHeightMm: v })} />
        <NumericMmInput label="Bridge width" value={measurements.bridgeWidthMm} min={10} max={30} onCommit={(v) => setMeasurements({ bridgeWidthMm: v })} />
      </div>
      <p className="hint">Current fit: {measured.lensWidthMm.toFixed(1)} × {measured.lensHeightMm.toFixed(1)}mm, bridge {(measured.innerEdgeOffsetMm * 2).toFixed(1)}mm</p>

      <h2>4. Frame &amp; Temples</h2>
      <ParamSlider label="Rim thickness" value={frame.rimThicknessMm} min={1} max={8} unit="mm" onLiveChange={(v) => setFrameParams({ rimThicknessMm: v })} onCommit={endGesture} />
      <ParamSlider label="Rim depth" value={frame.rimDepthMm} min={2} max={12} unit="mm" onLiveChange={(v) => setFrameParams({ rimDepthMm: v })} onCommit={endGesture} />
      <ParamSlider label="Edge rounding (bevel)" value={frame.bevelMm} min={0} max={2} step={0.05} unit="mm" onLiveChange={(v) => setFrameParams({ bevelMm: v })} onCommit={endGesture} />
      <ParamSlider label="Base curve (wrap)" value={frame.baseCurveMm} min={40} max={400} step={5} unit="mm radius" onLiveChange={(v) => setFrameParams({ baseCurveMm: v })} onCommit={endGesture} />

      <ParamSlider label="Temple thickness" value={temple.thicknessMm} min={2} max={8} unit="mm" onLiveChange={(v) => setTempleParams({ thicknessMm: v })} onCommit={endGesture} />
      <ParamSlider label="Temple taper" value={temple.taperRatio} min={0} max={0.9} step={0.05} onLiveChange={(v) => setTempleParams({ taperRatio: v })} onCommit={endGesture} />
      <ParamSlider label="Temple length" value={temple.lengthMm} min={110} max={150} unit="mm" onLiveChange={(v) => setTempleParams({ lengthMm: v })} onCommit={endGesture} />
      <ParamSlider label="Ear curve drop" value={temple.earDropMm} min={0} max={25} unit="mm" onLiveChange={(v) => setTempleParams({ earDropMm: v })} onCommit={endGesture} />

      <h2>5. Manufacturability</h2>
      <WarningsPanel />

      <h2>Export</h2>
      <ExportButtons />

      <h2>Presets</h2>
      <PresetPicker />
    </div>
  );
}

export function ControlPanel() {
  const mode = useEditorStore((s) => s.mode);
  return <div className="control-panel">{mode === 'sketch' ? <SketchControls /> : <EditControls />}</div>;
}
