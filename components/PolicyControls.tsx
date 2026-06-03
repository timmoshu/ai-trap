'use client';
import type { Scenario, PolicyRegime } from '@/lib/engine';
import { Slider } from './Slider';
import styles from './Controls.module.css';
import panel from './Panel.module.css';

const REGIMES: { id: PolicyRegime; label: string }[] = [
  { id: 'free', label: 'Free market' },
  { id: 'tax', label: 'Tax' },
  { id: 'equity', label: 'Equity' },
  { id: 'bargaining', label: 'Bargaining' },
];

/**
 * Policies as native, live model parameters. The two "level" levers (UBI = A, capital tax = t) are
 * always on and never touch the automation decision — drag them and watch automation hold still.
 * The "automation policy" is a mutually-exclusive regime (paper gives no closed form for stacking),
 * each with a live intensity that actually moves the automation choice.
 */
export function PolicyControls({
  scenario,
  update,
  optimumTax,
}: {
  scenario: Scenario;
  update: (patch: Partial<Scenario>) => void;
  optimumTax: number;
}) {
  const regime = scenario.regime;
  return (
    <section className={panel.panel} aria-label="Policies">
      <h2 className={panel.title}>Policies</h2>

      <div className={styles.group}>
        <div className={styles.groupTitle}>
          Level policies{' '}
          <span className={styles.muted}>— change demand or profit, not automation</span>
        </div>
        <Slider
          id="pol-A"
          label="UBI — household income floor"
          symbol="A"
          value={scenario.A}
          min={1}
          max={10}
          step={0.5}
          onChange={(v) => update({ A: v })}
          format={(v) => v.toFixed(1)}
          citation="Raises autonomous demand. Cushions the spending dip — but cancels from the firm's automation decision, so automation never moves."
        />
        <Slider
          id="pol-t"
          label="Capital / profit tax"
          symbol="t"
          value={scenario.t ?? 0}
          min={0}
          max={0.9}
          step={0.05}
          onChange={(v) => update({ t: v })}
          format={(v) => `${Math.round(v * 100)}%`}
          citation="Scales every firm's profit by (1−t). Takes a share of the profit, but the automation decision is unchanged."
        />
      </div>

      <div className={styles.group}>
        <div className={styles.groupTitle}>
          Automation policy{' '}
          <span className={styles.muted}>— pick one; these can move automation</span>
        </div>
        <div className={styles.seg} role="group" aria-label="Automation policy">
          {REGIMES.map((r) => (
            <button
              key={r.id}
              type="button"
              aria-pressed={regime === r.id}
              className={`${styles.segBtn} ${regime === r.id ? styles.segActive : ''}`}
              onClick={() => update({ regime: r.id })}
            >
              {r.label}
            </button>
          ))}
        </div>

        {regime === 'tax' && (
          <>
            <Slider
              id="pol-tau"
              label="Automation tax"
              symbol="τ"
              value={scenario.tau}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => update({ tau: v })}
              format={(v) => v.toFixed(2)}
              citation="A per-task tax on automation. Unlike the others, this changes the firm's marginal decision — it pulls automation back toward the optimum."
            />
            <div className={styles.taxRow}>
              <button
                type="button"
                className={styles.applyBtn}
                onClick={() => update({ tau: optimumTax })}
                disabled={optimumTax <= 1e-9}
              >
                Set to the gap-closing level
              </button>
              {scenario.tau > 1e-9 && (
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => update({ tau: 0 })}
                >
                  Clear
                </button>
              )}
            </div>
          </>
        )}

        {regime === 'equity' && (
          <Slider
            id="pol-eps"
            label="Worker profit share"
            symbol="ε"
            value={scenario.eps}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => update({ eps: v })}
            format={(v) => `${Math.round(v * 100)}%`}
            citation="Workers get a share of profit, internalizing part of the externality. It only fully closes the gap at ε = 1/λ — which exceeds 100% when λ < 1, so it can't get there. (Illustrative.)"
          />
        )}

        {regime === 'bargaining' && (
          <Slider
            id="pol-M"
            label={`Firms coordinating (of ${scenario.N})`}
            symbol="M"
            value={scenario.M}
            min={1}
            max={scenario.N}
            step={1}
            onChange={(v) => update({ M: v })}
            format={(v) => `${Math.round(v)} of ${scenario.N}`}
            citation="A coalition of M firms internalizes the demand its layoffs destroy. Only the full coalition (M = N) reaches the optimum."
          />
        )}
      </div>
    </section>
  );
}
