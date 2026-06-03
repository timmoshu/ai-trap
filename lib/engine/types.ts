/**
 * Parameters of the AI Layoff Trap model (Falk & Tsoukalas, arXiv:2603.20617).
 * Greek symbols are spelled out here (lambda, eta, alpha) per the project convention;
 * Greek glyphs appear only in display strings. Verified against engine/layoff_trap.py (Gate 0).
 */
export interface Params {
  /** number of symmetric competing firms (N >= 1). Wedge is 0 at N=1 (monopoly efficient). */
  N: number;
  /** AI cost per task (wage w normalized to 1, so c is effectively c/w). 0 <= c <= w. */
  c: number;
  /** wage per task (normalized to 1). */
  w: number;
  /** quadratic integration / adjustment cost (Lucas 1967). */
  k: number;
  /** worker MPC into the sector (lambda). */
  lambda: number;
  /** reabsorption / replacement rate (eta). May exceed 1 (reemployment at higher pay -> trap reverses). */
  eta: number;
  /** autonomous demand (A). UBI maps to raising A. */
  A: number;
  /** task-positions per firm (scale; set to 1). */
  L: number;
  /** planner weight on workers (mu). 0 = pure owner/efficiency surplus. */
  mu: number;
  /** per-task automation tax (tau). The Pigouvian lever; defaults OFF (0). */
  tau: number;
}

export interface StaticResult {
  s: number; // cost saving w - c
  ell: number; // master externality parameter lambda(1-eta)w
  alphaNE: number; // Nash (private) automation, with tax
  alphaCO: number; // cooperative / efficiency optimum
  alphaSP: number; // mu-weighted social planner optimum
  wedge: number; // alphaNE(no tax) - alphaCO  (over-automation gap)
  tauStar: number; // interior Pigouvian rate ell(1 - 1/N)
  tauStarExact: number; // tax that restores alphaCO including corner regimes (numeric)
  Nstar: number; // automation threshold in N (no automation if N <= N*)
}

/** One period of the stylized dynamic wrapper (steady state == static equilibrium). */
export interface DynamicPoint {
  t: number;
  /** % of jobs done by AI (automation/layoffs), alpha * 100. */
  automation: number;
  /** % of the workforce without a job (displaced and not yet re-hired). */
  unemployment: number;
  /** consumer spending, indexed to the pre-automation baseline = 100. */
  demandIndex: number;
  /** corporate profit as % of the best achievable (the efficient optimum = 100). */
  profitIndex: number;
}
