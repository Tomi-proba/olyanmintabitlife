import { useEffect, useState } from 'react';

interface NumericMmInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onCommit: (value: number) => void;
}

/** A labeled mm number input: types freely, commits (to the store/history) on blur or Enter. */
export function NumericMmInput({ label, value, min, max, step = 0.5, onCommit }: NumericMmInputProps) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = () => {
    const parsed = parseFloat(draft);
    if (Number.isFinite(parsed)) {
      onCommit(Math.max(min, Math.min(max, parsed)));
    } else {
      setDraft(String(value));
    }
  };

  return (
    <label className="numeric-input">
      <span>{label}</span>
      <div className="numeric-input-row">
        <input
          type="number"
          value={draft}
          min={min}
          max={max}
          step={step}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
          }}
        />
        <span className="unit">mm</span>
      </div>
    </label>
  );
}
