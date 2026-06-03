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
 * Nash automation under a worker-equity share eps. The paper proves the wedge closes only at
 * eps = 1/lambda (which exceeds 1 when lambda < 1, so it is unreachable with eps <= 1).
 * This functional form reproduces that proven threshold: at eps = 0 it equals alphaNE; at
 * eps = 1/lambda the internalized term equals ell(1 - 1/N), giving alphaCO. Labeled illustrative.
 */
export const alphaEquity = (p: Params, eps: number): number =>
  clamp((s(p) - ell(p) / p.N - eps * p.lambda * ell(p) * (1 - 1 / p.N)) / p.k);

/** The eps at which worker equity would fully close the wedge: 1/lambda. */
export const equityThreshold = (p: Params): number => 1 / p.lambda;
