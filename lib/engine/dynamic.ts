/**
 * Stylized dynamic wrapper — our "minimal feedback loop" (PRD §5.3, architecture D-4).
 *
 * The paper is STATIC; this animates an honest transition whose STEADY STATE EQUALS the paper's
 * exact equilibrium. It is stable by construction: the target automation is independent of the
 * demand level (demand cancels from the firm's decision), so there is no doom-spiral — only the
 * cascade: automation rises (fast) -> layoffs rise -> reabsorption lags (slow) -> spending dips ->
 * profits overshoot down -> partial recovery as workers are re-hired.
 *
 * Per period: alpha_t -> target at adjustmentSpeed; reabsorption progress g_t: 0 -> 1 at
 * reabsorptionRate. Re-hired share = eta * alpha_t * g_t. On-screen: "destination faithful,
 * path illustrative."
 */
import type { DynamicPoint, Params } from './types';
import { alphaNE, alphaCO, aggregateProfit } from './static';
import { DYNAMIC_DEFAULTS } from './defaults';

export interface DynamicConfig {
  adjustmentSpeed: number;
  reabsorptionRate: number;
  periods: number;
}

/** Profit gained at the efficient optimum vs. no automation — the 100% reference for profitIndex. */
const profitDenom = (p: Params): number => aggregateProfit(p, alphaCO(p)) - aggregateProfit(p, 0);

/** Simulate the cascade as firms move automation toward `target`. */
export function simulateToTarget(
  p: Params,
  target: number,
  cfg: DynamicConfig = DYNAMIC_DEFAULTS,
): DynamicPoint[] {
  const baseDemand = p.A + p.lambda * p.w * p.L * p.N;
  const denom = profitDenom(p);
  const profitGain = (a: number) => aggregateProfit(p, a) - aggregateProfit(p, 0);

  let alpha = 0;
  let g = 0;
  const pts: DynamicPoint[] = [];

  for (let t = 0; t < cfg.periods; t++) {
    const rehired = p.eta * alpha * g; // share of the workforce re-hired so far
    const demand = p.A + p.lambda * p.w * p.L * p.N * (1 - alpha + rehired);
    pts.push({
      t,
      automation: alpha * 100,
      unemployment: Math.max(0, alpha - rehired) * 100,
      demandIndex: (demand / baseDemand) * 100,
      profitIndex: denom > 1e-9 ? (profitGain(alpha) / denom) * 100 : 0,
    });
    alpha += cfg.adjustmentSpeed * (target - alpha);
    g += cfg.reabsorptionRate * (1 - g);
  }
  return pts;
}

/** Default path: firms race to the free-market (Nash) automation level, with any tax applied. */
export function simulate(p: Params, cfg: DynamicConfig = DYNAMIC_DEFAULTS): DynamicPoint[] {
  return simulateToTarget(p, alphaNE(p), cfg);
}

/** Steady-state drivers at a given automation level — the invariant target and the reference line. */
export function steadyMetrics(p: Params, target: number): DynamicPoint {
  const baseDemand = p.A + p.lambda * p.w * p.L * p.N;
  const denom = profitDenom(p);
  const demand = p.A + p.lambda * p.w * p.L * p.N * (1 - (1 - p.eta) * target);
  return {
    t: -1,
    automation: target * 100,
    unemployment: Math.max(0, target * (1 - p.eta)) * 100,
    demandIndex: (demand / baseDemand) * 100,
    profitIndex:
      denom > 1e-9 ? ((aggregateProfit(p, target) - aggregateProfit(p, 0)) / denom) * 100 : 0,
  };
}
