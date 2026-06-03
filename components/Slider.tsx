'use client';
import styles from './Slider.module.css';

export interface SliderProps {
  id: string;
  label: string;
  symbol: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  citation?: string;
  illustrative?: boolean;
  /** optional marker value (e.g. a threshold) shown as a tick label */
  hint?: string;
  disabled?: boolean;
}

export function Slider({
  id,
  label,
  symbol,
  value,
  min,
  max,
  step,
  onChange,
  format,
  citation,
  illustrative,
  hint,
  disabled,
}: SliderProps) {
  const display = format ? format(value) : String(value);
  return (
    <div className={`${styles.row} ${disabled ? styles.disabledRow : ''}`}>
      <div className={styles.head}>
        <label htmlFor={id} className={styles.label}>
          <span className={styles.symbol}>{symbol}</span>
          <span>{label}</span>
          {illustrative && <span className={styles.tag}>illustrative</span>}
        </label>
        <output htmlFor={id} className={`${styles.value} tabular`}>
          {display}
        </output>
      </div>
      <input
        id={id}
        type="range"
        className={styles.range}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={display}
        aria-describedby={citation || hint ? `${id}-cite` : undefined}
      />
      {(citation || hint) && (
        <p id={`${id}-cite`} className={styles.cite}>
          {hint && <span className={styles.hint}>{hint}</span>}
          {citation}
        </p>
      )}
    </div>
  );
}
