import { useState } from 'react';
import { useEditorStore } from '../state/editorStore';
import { buildFrameModel, disposeFrameModel } from '../three/buildFrameModel';
import { downloadTextFile, exportOutlineToSvg } from '../export/exportSvg';
import { downloadBinaryFile, exportModelToGlb, exportModelToObj } from '../export/exportModel';

export function ExportButtons() {
  const outline = useEditorStore((s) => s.outline);
  const frame = useEditorStore((s) => s.frame);
  const temple = useEditorStore((s) => s.temple);
  const [busy, setBusy] = useState(false);

  if (!outline) return null;

  const handleSvg = () => {
    downloadTextFile('frame-outline.svg', exportOutlineToSvg(outline), 'image/svg+xml');
  };

  const handleGlb = async () => {
    setBusy(true);
    const model = buildFrameModel(outline, frame, temple);
    try {
      const data = await exportModelToGlb(model);
      downloadBinaryFile('frame-model.glb', data, 'model/gltf-binary');
    } finally {
      disposeFrameModel(model);
      setBusy(false);
    }
  };

  const handleObj = () => {
    const model = buildFrameModel(outline, frame, temple);
    try {
      const text = exportModelToObj(model);
      downloadTextFile('frame-model.obj', text, 'text/plain');
    } finally {
      disposeFrameModel(model);
    }
  };

  return (
    <div className="export-buttons">
      <button type="button" onClick={handleSvg}>
        Export SVG
      </button>
      <button type="button" onClick={handleGlb} disabled={busy}>
        Export GLB
      </button>
      <button type="button" onClick={handleObj}>
        Export OBJ
      </button>
    </div>
  );
}
