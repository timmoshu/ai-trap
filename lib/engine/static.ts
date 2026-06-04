/**
 * Verified static engine — a faithful TypeScript port of engine/layoff_trap.py (Gate 0 PASS).
 * Every formula is cross-checked against the arXiv source; parity.test.ts asserts numerical
 * equality to the Python reference. Pure functions, no I/O, no React.
 */
import type { Params } from './types';

export const clamp = (x: number, lo = 0, hi = 1): number => Math.max(lo, Math.min(hi, x));

/** cost saving s = w - c */
export const s = (p: Params): number => p.w - p.c;

/** master externality parameter ell = lambda(1 - eta)w. Negative when eta > 1 (trap reverses). */
export const ell = (p: Params): number => p.lambda * (1 - p.eta) * p.w;

/** Nash (private) automation, with tax tau — Prop 1(i). */
export const alphaNE = (p: Params): number => clamp((s(p) - p.tau - ell(p) / p.N) / p.k);

/** Cooperative / efficiency optimum (internalizes full ell) — Prop 1(ii). */
export const alphaCO = (p: Params): number => clamp((s(p) - ell(p)) / p.k);

/** mu-weighted social planner optimum — Prop 2(i). */
export const alphaSP = (p: Params): number => {
  const pmu = p.mu >= 1 ? 0.999999 : p.mu;
  return clamp((s(p) - ell(p)) / p.k - (pmu * ell(p)) / (p.lambda * (1 - pmu) * p.k));
};

/** Over-automation wedge = alphaNE(no tax) - alphaCO = ell(1 - 1/N)/k — Prop 1(iii). */
export const wedge = (p: Params): number => alphaNE({ ...p, tau: 0 }) - alphaCO(p);

/** Interior Pigouvian rate tau* = ell(1 - 1/N) — Prop 5(i). Exact only in the interior regime. */
export const tauStar = (p: Params): number => ell(p) * (1 - 1 / p.N);

/** Automation threshold in N: no automation if N <= N*. Infinity when there is no cost saving. */
export const Nstar = (p: Params): number => {
  const sv = s(p);
  return sv > 0 ? ell(p) / sv : Infinity;
};

/** Coalition of size M — Prop 4. Only M = N restores the optimum. */
export const alphaCoalition = (p: Params, M: number): number =>
  clamp((s(p) - (ell(p) * M) / p.N) / p.k);

/** Aggregate demand at symmetric automation a — Eq (2). */
export const demand = (p: Params, a: number): number =>
  p.A + p.lambda * p.w * p.L * p.N * (1 - (1 - p.eta) * a);

/** Total worker income at symmetric automation a. */
export const workerIncome = (p: Params, a: number): number =>
  p.w * p.L * p.N * (1 - (1 - p.eta) * a);

/** Constant part of per-firm profit, Pi0 = A/N + (lambda - 1)wL. */
export const Pi0 = (p: Params): number => p.A / p.N + (p.lambda - 1) * p.w * p.L;

/**
 * Per-firm profit at symmetric automation a.
 * pi(a) = Pi0 + L[a(s - ell) - (k/2)a^2], which (at symmetric play) peaks at a = alphaCO —
 * this is why the free market, playing alphaNE > alphaCO, overshoots into lower profit.
 */
export const profitPerFirm = (p: Params, a: number): number =>
  Pi0(p) + p.L * (a * (s(p) - ell(p)) - (p.k / 2) * a * a);

/** Aggregate profit across all N firms at symmetric automation a. */
export const aggregateProfit = (p: Params, a: number): number => p.N * profitPerFirm(p, a);

/**
 * Profit of ONE firm that automates `alphaI` while its N-1 rivals stay symmetric at `aBar`.
 * This is the firm's own incentive: it peaks at alphaI = (s - ell/N)/k = alphaNE — to the RIGHT of
 * the cooperative optimum alphaCO = (s - ell)/k — because the firm captures the full cost saving s
 * but bears only 1/N of the demand externality (ell/N vs. ell). That gap is exactly why competing
 * firms over-automate. Equals profitPerFirm when alphaI = aBar (symmetric play).
 */
export const profitPerFirmUnilateral = (p: Params, alphaI: number, aBar: number): number => {
  const D = p.A + p.lambda * p.w * p.L * (p.N - (1 - p.eta) * (alphaI + (p.N - 1) * aBar));
  const cost = p.L * (alphaI * p.c + (1 - alphaI) * p.w) + (p.k / 2) * p.L * alphaI * alphaI;
  return D / p.N - cost;
};

/** One firm's profit-and-loss, broken into the parts the lay reader cares about. */
export interface FirmPnL {
  alpha: number;
  /** revenue P·q = this firm's 1/N slice of aggregate demand (output is fixed, so this IS price). */
  revenue: number;
  /** wages still on the payroll = (1 - alpha)·w·L. */
  wages: number;
  /** AI running cost = alpha·c·L. */
  ai: number;
  /** one-off retooling / transformation cost = (k/2)·alpha²·L (the convex brake that ends the race). */
  transform: number;
  /** per-task automation tax remitted = tau·alpha·L (0 when the tax is off). */
  tax: number;
  /** revenue − wages − ai − transform − tax. Peaks (in alpha) at the taxed Nash (s − tau − ell/N)/k. */
  profit: number;
}

/**
 * Decompose ONE firm's profit at its own automation `alphaI`, with rivals symmetric at `aBar`.
 * This is `profitPerFirmUnilateral` opened up into its revenue and cost parts, PLUS the per-task
 * tax that the unilateral helper omits (the tax shifts the firm's own profit peak left toward the
 * optimum — that is the Pigouvian fix seen from inside the firm's books). With tau = 0 the `profit`
 * field equals profitPerFirmUnilateral exactly (asserted in tests).
 */
export const firmPnL = (p: Params, alphaI: number, aBar: number): FirmPnL => {
  const D = p.A + p.lambda * p.w * p.L * (p.N - (1 - p.eta) * (alphaI + (p.N - 1) * aBar));
  const revenue = D / p.N;
  const wages = (1 - alphaI) * p.w * p.L;
  const ai = alphaI * p.c * p.L;
  const transform = (p.k / 2) * alphaI * alphaI * p.L;
  const tax = (p.tau ?? 0) * alphaI * p.L;
  return {
    alpha: alphaI,
    revenue,
    wages,
    ai,
    transform,
    tax,
    profit: revenue - wages - ai - transform - tax,
  };
};

/**
 * Nash automation under a worker-equity share eps. The paper proves the wedge closes only at
 * eps = 1/lambda (which exceeds 1 when lambda < 1, so it is unreachable with eps <= 1).
 * This functional form reproduces that proven threshold: at eps = 0 it equals alphaNE; at
 * eps = 1/lambda the internalized term equals ell(1 - 1/N), giving alphaCO. Labeled illustrative.
 */
export const alphaEquity = (p: Params, eps: number): number =>
  clamp((s(p) - ell(p) / p.N - eps * p.lambda * ell(p) * (1 - 1 / p.N)) / p.k);

/** The eps at which worker equity would fully close the wedge: 1/lambda. */
export const equityThreshold = (p: Params): number => 1 / p.lambda;
