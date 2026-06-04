/**
 * Jevons / output-expansion overlay — the Phase-C "what-if" extension. EXPLICITLY BEYOND THE PAPER.
 *
 * The paper holds output FIXED (Y_i = L) — that fixed-output assumption is what creates the trap.
 * This overlay relaxes it: if automation lowers the unit cost, competitive pricing passes that to a
 * lower price, and price-elastic product demand EXPANDS output. Net employment is then the
 * displacement force (1-alpha) against the output-expansion force (price drop)^elasticity.
 *
 * It is a LAYERED model, not a re-derived equilibrium: Layer 1 (the paper, verified) decides how
 * much firms automate; this overlay only asks what elastic output does to employment at that level.
 * The paper's closure (fixed output, demand-set price) and this one (elastic output, cost-set price)
 * are mutually exclusive, so this does NOT reduce to the paper — it is a clearly-labeled what-if.
 * Documented in _bmad-output/planning-artifacts/gate0-jevons-extension.md.
 */
import type { Params } from './types';
import { DYNAMIC_DEFAULTS } from './defaults';
import type { DynamicConfig } from './dynamic';

/** Competitive price relative to pre-automation (= 1 at alpha=0), falling as automation cuts unit cost. */
const priceRatio = (p: Params, alpha: number): number => (p.w - alpha * (p.w - p.c)) / p.w;

/**
 * Employment index (100 = pre-automation) under the Jevons overlay at automation `alpha` and product
 * price-elasticity `eps`. = (1 - alpha) * priceRatio^(-eps) * 100. At eps = 0 this is the paper's
 * fixed-output corner — pure displacement, (1 - alpha) * 100.
 */
export const jevonsJobs = (p: Params, alpha: number, eps: number): number =>
  (1 - alpha) * Math.pow(priceRatio(p, alpha), -eps) * 100;

/**
 * The price-elasticity at which automation is employment-neutral at this `alpha` (jevonsJobs = 100):
 * above it automation CREATES net jobs, below it destroys them. The marginal value (alpha -> 0) is
 * w/s; it RISES with alpha, so over-automation makes the Jevons rescue harder.
 */
export const jevonsThreshold = (p: Params, alpha: number): number => {
  const s = p.w - p.c;
  if (alpha <= 1e-9) return p.w / s; // marginal threshold (limit as alpha -> 0)
  return Math.log(1 - alpha) / Math.log(priceRatio(p, alpha));
};

/** Output index (100 = before automation): elastic product demand expands as the price falls. */
export const jevonsOutput = (p: Params, alpha: number, eps: number): number =>
  Math.pow(priceRatio(p, alpha), -eps) * 100;

/** Consumer spending index (100 = before): price * quantity = priceRatio^(1-eps). Flat at eps = 1. */
export const jevonsSpending = (p: Params, alpha: number, eps: number): number =>
  Math.pow(priceRatio(p, alpha), 1 - eps) * 100;

/** One period of the Jevons cascade — every quantity indexed to 100 = before automation. */
export interface JevonsPoint {
  t: number;
  automation: number; // alpha * 100
  jobs: number; // (1-alpha) * priceRatio^(-eps) * 100  (the overlay; >100 = net job creation)
  spending: number; // priceRatio^(1-eps) * 100
  output: number; // priceRatio^(-eps) * 100
}

const jevonsPointAt = (p: Params, alpha: number, eps: number, t: number): JevonsPoint => ({
  t,
  automation: alpha * 100,
  jobs: jevonsJobs(p, alpha, eps),
  spending: jevonsSpending(p, alpha, eps),
  output: jevonsOutput(p, alpha, eps),
});

/**
 * Animate the Jevons cascade as firms ramp automation toward `target` (same illustrative path as the
 * main model — alpha_t -> target at adjustmentSpeed). The overlay is static in alpha, so each period
 * just reads the overlay at that period's alpha; the steady state is the overlay at `target`.
 */
export function simulateJevons(
  p: Params,
  target: number,
  eps: number,
  cfg: DynamicConfig = DYNAMIC_DEFAULTS,
): JevonsPoint[] {
  let alpha = 0;
  const pts: JevonsPoint[] = [];
  for (let t = 0; t < cfg.periods; t++) {
    pts.push(jevonsPointAt(p, alpha, eps, t));
    alpha += cfg.adjustmentSpeed * (target - alpha);
  }
  return pts;
}

/** The Jevons cascade outcome at a fixed automation level — used as the optimum (alphaCO) reference. */
export const jevonsSteady = (p: Params, alpha: number, eps: number): JevonsPoint =>
  jevonsPointAt(p, alpha, eps, -1);

/* -------------------------------------------------------------------------------------------------
 * The transition trough (Phase-C "pace" what-if) — BEYOND THE PAPER, and beyond the static Jevons.
 *
 * The static overlay assumes the market is already its price-implied size. But the rescue isn't
 * instant: automation cuts jobs NOW, while the bigger market only arrives as prices fall and new
 * uses catch on. So we let the market LAG — each period it crawls toward the size today's price
 * justifies, at its own (slow) speed, while automation ramps at its own (fast) speed. Jobs then
 * dip into a trough before recovering.
 *
 * The trough's FLOOR is the paper's pure-displacement number (1-target)*100 — the market hasn't
 * grown yet — and its CEILING is the Jevons long-run (jevonsJobs at target). So the same curve
 * travels from the paper's world to the Jevons world; the speed race decides how deep and how long.
 * No scarring, no welfare integral: the destination is pace-proof (it always recovers to the Jevons
 * long-run); only the journey depends on pace.
 * ------------------------------------------------------------------------------------------------- */
export interface JevonsTroughConfig {
  automationSpeed: number; // alpha -> target per period (how fast AI rolls out)
  demandGrowthSpeed: number; // market -> price-implied size per period (how fast the market grows back)
  periods: number;
}

export interface JevonsTroughPoint {
  t: number;
  automation: number; // alpha * 100
  market: number; // realized output index (100 = before); lags its price-implied target
  jobs: number; // (1-alpha) * market — dips into the trough, then recovers
}

/** Simulate the lagging-market transition. Jobs = (1-alpha)*market; market chases the size today's price justifies. */
export function simulateJevonsTrough(
  p: Params,
  target: number,
  eps: number,
  cfg: JevonsTroughConfig,
): JevonsTroughPoint[] {
  let alpha = 0;
  let market = 100; // starts at the pre-automation size — the rescue has not happened yet
  const pts: JevonsTroughPoint[] = [];
  for (let t = 0; t < cfg.periods; t++) {
    pts.push({ t, automation: alpha * 100, market, jobs: (1 - alpha) * market });
    // the market can only chase the size that TODAY's (already-fallen) price justifies
    const targetMarket = Math.pow(priceRatio(p, alpha), -eps) * 100;
    alpha += cfg.automationSpeed * (target - alpha);
    market += cfg.demandGrowthSpeed * (targetMarket - market);
  }
  return pts;
}

/** The trough's two reference levels: the paper's displacement floor and the Jevons long-run ceiling. */
export const troughFloor = (target: number): number => (1 - target) * 100;
export const troughCeiling = (p: Params, target: number, eps: number): number =>
  jevonsJobs(p, target, eps);
