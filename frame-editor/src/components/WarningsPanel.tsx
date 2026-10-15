import { useEditorStore } from '../state/editorStore';
import { checkManufacturability } from '../geometry/manufacturability';
import { measureOutline } from '../geometry/measure';

export function WarningsPanel() {
  const outline = useEditorStore((s) => s.outline);
  const frame = useEditorStore((s) => s.frame);

  if (!outline) return null;

  const measured = measureOutline(outline);
  const warnings = checkManufacturability({
    rimThicknessMm: frame.rimThicknessMm,
    rimDepthMm: frame.rimDepthMm,
    lensWidthMm: measured.lensWidthMm,
    lensHeightMm: measured.lensHeightMm,
    bridgeWidthMm: measured.innerEdgeOffsetMm * 2,
  });

  if (warnings.length === 0) {
    return <div className="warnings-panel warnings-ok">✓ No manufacturability issues detected.</div>;
  }

  return (
    <div className="warnings-panel">
      {warnings.map((w) => (
        <div key={w.id} className={`warning warning-${w.level}`}>
          {w.level === 'error' ? '⛔' : '⚠️'} {w.message}
        </div>
      ))}
    </div>
  );
}
