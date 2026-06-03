'use client';
import { Slider } from './Slider';
import styles from './Controls.module.css';

/**
 * Pigouvian tax control (FR-1.5). Defaults OFF and is never auto-applied.
 * "Set to optimum-restoring tax" uses the corner-correct numeric solve (architecture D-5).
 */
export function TaxControl({
  tau,
  optimumTax,
  onChange,
  onApply,
}: {
  tau: number;
  optimumTax: number;
  onChange: (v: number) => void;
  onApply?: () => void;
}) {
  const on = tau > 1e-9;
  return (
    <div className={styles.group}>
      <div className={styles.groupTitle}>
        Automation tax <span className={styles.muted}>— off by default</span>
      </div>
      <Slider
        id="param-tau"
        label="Automation tax"
        symbol="τ"
        value={tau}
        min={0}
        max={1}
        step={0.01}
        onChange={onChange}
        format={(v) => v.toFixed(2)}
        citation="A tax on each automated job. Turning it on pulls automation back toward the level that's best for everyone."
      />
      <div className={styles.taxRow}>
        <button
          type="button"
          className={styles.applyBtn}
          onClick={() => {
            onChange(optimumTax);
            onApply?.();
          }}
          disabled={optimumTax <= 1e-9}
        >
          Apply the tax that closes the gap
        </button>
        {on && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={() => {
              onChange(0);
              onApply?.();
            }}
          >
            Turn off
          </button>
        )}
      </div>
    </div>
  );
}
