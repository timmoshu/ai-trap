'use client';
import { PARAM_META, DEFAULT_SCENARIO, type Scenario } from '@/lib/engine';
import { Slider } from './Slider';
import styles from './Panel.module.css';

const fmt: Record<string, (v: number) => string> = {
  N: (v) => String(Math.round(v)),
  c: (v) => v.toFixed(2),
  lambda: (v) => `${Math.round(v * 100)}%`,
  eta: (v) => `${Math.round(v * 100)}%`,
  k: (v) => v.toFixed(2),
};

export function ParameterPanel({
  scenario,
  update,
}: {
  scenario: Scenario;
  update: (patch: Partial<Scenario>) => void;
}) {
  const structural = PARAM_META.filter((m) => m.key !== 'tau');
  // Restore the paper's illustrative baseline — every model param, policy, and animation speed —
  // keeping only which view the user is looking at.
  const resetToPaper = () => update({ ...DEFAULT_SCENARIO, view: scenario.view });
  return (
    <section className={styles.panel} aria-label="Model parameters">
      <div className={styles.titleRow}>
        <h2 className={styles.title}>Parameters</h2>
        <button type="button" className={styles.resetBtn} onClick={resetToPaper}>
          ↺ Reset to paper
        </button>
      </div>
      {structural.map((m) => {
        const value = scenario[m.key] as number;
        const etaPinned = m.key === 'eta' && !scenario.wageRigid;
        const hint = etaPinned
          ? 'Pinned to 100% under flexible wages — turn sticky wages on to vary it.'
          : m.key === 'eta' && value > 1
            ? 'Above 100% — re-hired at better pay, so the trap reverses (under-automation). '
            : undefined;
        return (
          <Slider
            key={m.key}
            id={`param-${m.key}`}
            label={m.label}
            symbol={m.symbol}
            value={etaPinned ? 1 : value}
            min={m.min}
            max={m.max}
            step={m.step}
            onChange={(v) => update({ [m.key]: v } as Partial<Scenario>)}
            format={fmt[m.key]}
            citation={m.citation}
            hint={hint}
            illustrative={m.illustrative}
            disabled={etaPinned}
          />
        );
      })}
    </section>
  );
}
