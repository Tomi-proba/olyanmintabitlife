import { PRESETS } from '../geometry/presets';
import { useEditorStore } from '../state/editorStore';

export function PresetPicker() {
  const loadPreset = useEditorStore((s) => s.loadPreset);

  return (
    <div className="preset-picker">
      {PRESETS.map((preset) => (
        <button key={preset.id} type="button" className="preset-button" onClick={() => loadPreset(preset.id)}>
          {preset.name}
        </button>
      ))}
    </div>
  );
}
