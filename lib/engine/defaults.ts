import type { Params } from './types';

/**
 * The authors' ILLUSTRATIVE figure values — NOT empirical estimates.
 * Every default is paired with its citation so UI copy can never drift from the value
 * (architecture §4). Surfaced verbatim on /method.
 */
export const DEFAULTS: Params = {
  N: 4,
  c: 0.3,
  w: 1,
  k: 1,
  lambda: 0.5,
  eta: 0.3,
  A: 1,
  L: 1,
  mu: 0,
  tau: 0,
};

export interface ParamMeta {
  key: keyof Params;
  symbol: string; // display glyph
  label: string;
  citation: string;
  min: number;
  max: number;
  step: number;
  /** dynamic-layer knob that is illustrative, distinct from the paper's structural params. */
  illustrative?: boolean;
}

// Plain-language labels for the UI; the Greek symbols and exact formulas live on /method.
export const PARAM_META: ParamMeta[] = [
  {
    key: 'N',
    symbol: 'N',
    label: 'Competing firms',
    citation:
      'How many firms compete in the sector. With one (a monopoly) there is no trap; more firms make it worse.',
    min: 1,
    max: 20,
    step: 1,
  },
  {
    key: 'c',
    symbol: 'c⁄w',
    label: 'Cost of AI vs. a worker',
    citation:
      "How cheap AI is relative to a worker's pay. Cheaper AI → more automation. Illustrative 0.30 (the authors' figure value, not an estimate).",
    min: 0,
    max: 0.99,
    step: 0.01,
  },
  {
    key: 'lambda',
    symbol: 'λ',
    label: 'How much workers spend',
    citation:
      "Share of pay that workers spend back into the economy. Higher → a bigger demand spillover. Illustrative 0.5 (authors' figure value).",
    min: 0.3,
    max: 1,
    step: 0.01,
  },
  {
    key: 'eta',
    symbol: 'η',
    label: 'How fast laid-off workers find new jobs',
    citation:
      'How much of laid-off workers’ lost spending comes back as they find other work. At 100% the trap closes; above 100% (re-hired at better pay) it reverses. Illustrative 30%.',
    min: 0,
    max: 1.5,
    step: 0.01,
  },
  {
    key: 'k',
    symbol: 'k',
    label: 'Cost for a firm to switch to AI',
    citation:
      'How costly retooling for AI is. Higher → less automation. Illustrative 1 (authors’ figure value).',
    min: 0.5,
    max: 2,
    step: 0.05,
  },
  {
    key: 'tau',
    symbol: 'τ',
    label: 'Automation tax',
    citation: 'A tax on each automated job. Off by default; never applied automatically.',
    min: 0,
    max: 1,
    step: 0.01,
  },
];

/** Illustrative dynamic-layer speeds (our stylized wrapper; not in the static paper). */
export const DYNAMIC_DEFAULTS = {
  /** how fast firms move automation toward the target each period. */
  adjustmentSpeed: 0.11,
  /** how fast laid-off workers are re-hired each period (lags automation → the visible dip). */
  reabsorptionRate: 0.05,
  /** number of periods to simulate — long enough for the cascade to play out. */
  periods: 60,
};
