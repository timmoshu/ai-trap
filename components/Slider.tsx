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
  /** compact mode (mobile drawer): hide the long citation, keep the short hint. */
  compact?: boolean;
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
  compact,
}: SliderProps) {
  const showCitation = citation && !compact;
  const showHelp = Boolean(hint || showCitation);
  const display = format ? format(value) : String(value);
  // Filled track up to the thumb so the lever's position reads at a glance (esp. on touch).
  const pct = max > min ? Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100)) : 0;
  return (
    <div className={`${styles.row} ${disabled ? styles.disabledRow : ''}`}>
      <div className={styles.head}>
        <label htmlFor={id} className={styles.label}>
          <span className={styles.labelText}>{label}</span>
          {symbol && <span className={styles.symbol}>{symbol}</span>}
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
        style={{
          background: `linear-gradient(to right, var(--accent) ${pct}%, var(--surface-2) ${pct}%)`,
        }}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={display}
        aria-describedby={showHelp ? `${id}-cite` : undefined}
      />
      {showHelp && (
        <p id={`${id}-cite`} className={styles.cite}>
          {hint && <span className={styles.hint}>{hint}</span>}
          {showCitation && citation}
        </p>
      )}
    </div>
  );
}
