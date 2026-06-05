'use client';
import {
  PARAM_META,
  DEFAULT_SCENARIO,
  BASELINES,
  baselineById,
  activeBaselineId,
  type Scenario,
  type Params,
} from '@/lib/engine';
import { Slider } from './Slider';
import styles from './Panel.module.css';

const fmt: Record<string, (v: number) => string> = {
  N: (v) => String(Math.round(v)),
  c: (v) => v.toFixed(2),
  lambda: (v) => `${Math.round(v * 100)}%`,
  eta: (v) => `${Math.round(v * 100)}%`,
  k: (v) => v.toFixed(2),
};

const symbolFor = (k: string): string => PARAM_META.find((m) => m.key === k)?.symbol ?? k;

export function ParameterPanel({
  scenario,
  update,
  compact,
}: {
  scenario: Scenario;
  update: (patch: Partial<Scenario>) => void;
  compact?: boolean;
}) {
  const structural = PARAM_META.filter((m) => m.key !== 'tau');
  const activeId = activeBaselineId(scenario);
  const active = activeId === 'custom' ? null : baselineById(activeId);

  // Load a named baseline: reset every model param, policy and speed to the paper, then apply the
  // baseline's cited overrides — keeping only which view the user is looking at. "Paper" = full reset.
  const applyBaseline = (id: string) => {
    if (id === 'custom') return;
    update({ ...DEFAULT_SCENARIO, ...baselineById(id).params, view: scenario.view });
  };

  // The slider tooltip: the parameter's meaning (always), plus — when the active scenario sets this
  // value away from the paper — that scenario's citation for the value it's currently showing.
  const citeFor = (m: (typeof PARAM_META)[number]): string => {
    const override = active?.cites?.[m.key];
    if (!active || !override) return m.citation;
    const val = (active.params as Record<string, number>)[m.key];
    return `${m.citation}  ·  In the “${active.name}” scenario, ${m.symbol} = ${val}: ${override}`;
  };

  return (
    <section className={styles.panel} aria-label="Model parameters">
      <div className={styles.titleRow}>
        <h2 className={styles.title}>Parameters</h2>
        <label className={styles.baselineWrap}>
          <span className={styles.baselineLabel}>Scenario</span>
          <select
            className={styles.baselineSelect}
            value={activeId}
            onChange={(e) => applyBaseline(e.target.value)}
            aria-label="Parameter scenario"
          >
            {BASELINES.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
            {activeId === 'custom' && <option value="custom">Custom (edited)</option>}
          </select>
        </label>
      </div>

      {active ? (
        <>
          <p className={styles.baselineBlurb}>{active.blurb}</p>
          {Object.keys(active.params).length > 0 && (
            <ul className={styles.baselineCites}>
              {(Object.entries(active.cites) as [keyof Params, string][]).map(([k, cite]) => (
                <li key={String(k)}>
                  <code>
                    {symbolFor(String(k))} = {String((active.params as Record<string, number>)[k])}
                  </code>{' '}
                  — {cite}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p className={styles.baselineBlurb}>
          Custom — you’ve edited the parameters. Pick a scenario to reset.
        </p>
      )}

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
            citation={citeFor(m)}
            hint={hint}
            illustrative={m.illustrative}
            disabled={etaPinned}
            compact={compact}
          />
        );
      })}
    </section>
  );
}
