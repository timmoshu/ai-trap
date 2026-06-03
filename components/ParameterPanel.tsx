'use client';
import { PARAM_META, DEFAULTS, type Scenario } from '@/lib/engine';
import { Slider } from './Slider';
import styles from './Panel.module.css';

const fmt: Record<string, (v: number) => string> = {
  N: (v) => String(Math.round(v)),
  c: (v) => v.toFixed(2),
  lambda: (v) => v.toFixed(2),
  eta: (v) => v.toFixed(2),
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
  // Restore the paper's illustrative baseline (model params + assumptions); leave the view and
  // the illustrative animation speeds as the user set them.
  const resetToPaper = () =>
    update({
      N: DEFAULTS.N,
      c: DEFAULTS.c,
      lambda: DEFAULTS.lambda,
      eta: DEFAULTS.eta,
      k: DEFAULTS.k,
      mu: DEFAULTS.mu,
      tau: DEFAULTS.tau,
      wageRigid: true,
    });
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
          ? 'Pinned to 1 under flexible wages — turn sticky wages on to vary it.'
          : m.key === 'eta' && value > 1
            ? 'η > 1 — the trap reverses (under-automation). '
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
