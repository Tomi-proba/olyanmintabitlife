interface ParamSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  /** Called continuously while dragging, for live preview (no history push). */
  onLiveChange: (value: number) => void;
  /** Called once the drag/gesture ends, to commit one undo-able history entry. */
  onCommit?: () => void;
  formatValue?: (value: number) => string;
}

export function ParamSlider({ label, value, min, max, step = 0.1, unit = '', onLiveChange, onCommit, formatValue }: ParamSliderProps) {
  return (
    <label className="param-slider">
      <span className="param-slider-label">
        {label}
        <span className="param-slider-value">{formatValue ? formatValue(value) : value.toFixed(2)}{unit}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onLiveChange(parseFloat(e.target.value))}
        onPointerUp={onCommit}
        onKeyUp={onCommit}
      />
    </label>
  );
}
