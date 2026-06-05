/**
 * Named parameter BASELINES (calibrations) — selectable scenarios for the model, and the anchor the
 * what-if tabs re-baseline to. The paper's own values are illustrative FIGURE values, never meant as a
 * forecast; these let the user pick a more world-like starting point. Every non-paper value carries a
 * citation (same standard as PARAM_META) and the whole set is labeled "a plausible scenario, not a
 * forecast" — we still make no empirical CLAIM, we expose cited alternatives and let the user choose.
 *
 * Only the parameters with a real empirical literature move (lambda = MPC, eta = spending recovery);
 * c/w ("how much cheaper AI is than a worker") is the hardest number to cite, so it stays at the
 * paper's value except where a scenario is explicitly about cheaper automation.
 */
import type { Params } from './types';
import { DEFAULTS } from './defaults';

export interface Baseline {
  id: string;
  name: string;
  /** one-line framing for the UI. */
  blurb: string;
  /** structural overrides on top of the paper (DEFAULTS). Empty = the paper itself. */
  params: Partial<Pick<Params, 'N' | 'c' | 'lambda' | 'eta' | 'k'>>;
  /** per-parameter justification for each value that differs from the paper. */
  cites: Partial<Record<keyof Params, string>>;
  /** the paper preset — its values are illustrative, not estimates. */
  illustrative?: boolean;
}

export const BASELINES: Baseline[] = [
  {
    id: 'paper',
    name: 'Paper (illustrative)',
    blurb:
      "The authors' figure values — illustrative, not empirical estimates. The reference point.",
    params: {},
    cites: {},
    illustrative: true,
  },
  {
    id: 'central',
    name: 'Central estimates',
    blurb:
      'Central empirical values for the spending and reemployment channels (AI cost as the paper). A plausible scenario, not a forecast.',
    params: { lambda: 0.6, eta: 0.5 },
    cites: {
      lambda:
        'Central marginal propensity to consume, above the paper’s 0.5 (Jappelli & Pistaferri 2014; Johnson, Parker & Souleles 2006).',
      eta: 'Only partial recovery of lost spending: displaced workers face large, persistent earnings losses (Jacobson, LaLonde & Sullivan 1993; Davis & von Wachter 2011).',
    },
  },
  {
    id: 'cheaper-ai',
    name: 'Cheaper AI',
    blurb:
      'Central estimates, but automation is far cheaper per task than the paper assumes — so firms automate more.',
    params: { lambda: 0.6, eta: 0.5, c: 0.15 },
    cites: {
      lambda: 'Central marginal propensity to consume (Jappelli & Pistaferri 2014).',
      eta: 'Partial recovery of lost spending (Davis & von Wachter 2011).',
      c: 'Illustrative of much cheaper automation — per-task AI/inference costs have fallen by orders of magnitude. Not a precise estimate; the hardest value to pin down.',
    },
  },
  {
    id: 'sticky',
    name: 'Sticky labor market',
    blurb: 'Liquidity-constrained workers and slow reemployment — the deepest-externality case.',
    params: { lambda: 0.7, eta: 0.3 },
    cites: {
      lambda: 'High MPC for liquidity-constrained households (Jappelli & Pistaferri 2014).',
      eta: 'Slow reemployment / large persistent earnings losses (Davis & von Wachter 2011).',
    },
  },
  {
    id: 'reabsorption',
    name: 'Strong reabsorption (Jones)',
    blurb:
      'Workers are reabsorbed into new work — the weak-links / reinstatement view. At full recovery the demand externality vanishes and the trap closes.',
    params: { eta: 1.0 },
    cites: {
      eta: 'Full reabsorption: the reinstatement / weak-links view (Acemoglu & Restrepo 2019; Jones). At η ≥ 1 the externality ℓ = λ(1−η)w ≤ 0 and the trap reverses.',
    },
  },
];

/** Which baseline the what-if tabs (Jevons, Pricing power) re-baseline to. */
export const WHATIF_BASELINE_ID = 'central';

export const baselineById = (id: string): Baseline =>
  BASELINES.find((b) => b.id === id) ?? BASELINES[0];

/** Full Params for a baseline: the paper defaults with the baseline's overrides applied. */
export const baselineParams = (id: string): Params => ({ ...DEFAULTS, ...baselineById(id).params });

/** The Params the what-if tabs use as their baseline scenario. */
export const whatifParams = (): Params => baselineParams(WHATIF_BASELINE_ID);

/** Which baseline a parameter set matches (by the structural params), or 'custom' if none. */
export const activeBaselineId = (p: Pick<Params, 'N' | 'c' | 'lambda' | 'eta' | 'k'>): string => {
  const close = (a: number, b: number) => Math.abs(a - b) < 1e-6;
  const match = BASELINES.find((b) => {
    const bp = baselineParams(b.id);
    return (
      close(bp.N, p.N) &&
      close(bp.c, p.c) &&
      close(bp.lambda, p.lambda) &&
      close(bp.eta, p.eta) &&
      close(bp.k, p.k)
    );
  });
  return match?.id ?? 'custom';
};
