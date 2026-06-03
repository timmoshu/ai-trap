/**
 * Scenario <-> URL (architecture D-7). The entire scenario serializes to a human-readable,
 * versioned query string, so permalinks need no backend and links are inspectable (the
 * transparency brand). Unknown/out-of-range values fall back to documented defaults.
 */
import type { Params } from './types';
import { DEFAULTS, DYNAMIC_DEFAULTS } from './defaults';

export const SCENARIO_VERSION = 1;
export type View = 'timeseries' | 'hill';

export interface Scenario extends Params {
  /** wage-rigidity off-switch. Flexible wages (false) remove the demand externality. */
  wageRigid: boolean;
  adjustmentSpeed: number;
  reabsorptionRate: number;
  view: View;
}

export const DEFAULT_SCENARIO: Scenario = {
  ...DEFAULTS,
  wageRigid: true,
  adjustmentSpeed: DYNAMIC_DEFAULTS.adjustmentSpeed,
  reabsorptionRate: DYNAMIC_DEFAULTS.reabsorptionRate,
  view: 'timeseries',
};

/**
 * Effective model parameters after applying the wage-rigidity toggle.
 * Flexible wages => no demand shortfall; we model that as full reabsorption (eta = 1 => ell = 0),
 * which makes the over-automation wedge vanish. This is the A2 inoculation, stated on /method.
 */
export function effectiveParams(sc: Scenario): Params {
  const eta = sc.wageRigid ? sc.eta : 1;
  return {
    N: sc.N,
    c: sc.c,
    w: sc.w,
    k: sc.k,
    lambda: sc.lambda,
    eta,
    A: sc.A,
    L: sc.L,
    mu: sc.mu,
    tau: sc.tau,
  };
}

const num = (x: number): string => String(Math.round(x * 10000) / 10000);

/**
 * Encode only what differs from the default scenario, so a pristine view yields an empty (clean)
 * URL and a shared link carries just the parameters the user actually changed. decodeScenario fills
 * every omitted key from the documented defaults, so this round-trips exactly.
 */
export function encodeScenario(sc: Scenario): string {
  const d = DEFAULT_SCENARIO;
  const q = new URLSearchParams();
  const setNum = (key: string, val: number, def: number) => {
    if (Math.abs(val - def) > 1e-9) q.set(key, num(val));
  };
  setNum('N', sc.N, d.N);
  setNum('c', sc.c, d.c);
  setNum('lambda', sc.lambda, d.lambda);
  setNum('eta', sc.eta, d.eta);
  setNum('k', sc.k, d.k);
  setNum('tau', sc.tau, d.tau);
  setNum('mu', sc.mu, d.mu);
  setNum('A', sc.A, d.A);
  if (sc.wageRigid !== d.wageRigid) q.set('wageRigid', sc.wageRigid ? '1' : '0');
  setNum('spd', sc.adjustmentSpeed, d.adjustmentSpeed);
  setNum('reab', sc.reabsorptionRate, d.reabsorptionRate);
  if (sc.view !== d.view) q.set('view', sc.view);
  const rest = q.toString();
  // version prefix only when there is something to version (keeps the default URL empty)
  return rest ? `v=${SCENARIO_VERSION}&${rest}` : '';
}

const f = (q: URLSearchParams, key: string, fallback: number): number => {
  const raw = q.get(key);
  if (raw === null || raw.trim() === '') return fallback;
  const v = Number(raw);
  return Number.isFinite(v) ? v : fallback;
};

export function decodeScenario(input: string | URLSearchParams): Scenario {
  const q = typeof input === 'string' ? new URLSearchParams(input) : input;
  const d = DEFAULT_SCENARIO;
  const viewRaw = q.get('view');
  const view: View = viewRaw === 'hill' ? 'hill' : 'timeseries';
  return {
    N: Math.max(1, Math.min(20, Math.round(f(q, 'N', d.N)))),
    c: clampRange(f(q, 'c', d.c), 0, 1),
    w: 1,
    k: clampRange(f(q, 'k', d.k), 0.05, 5),
    lambda: clampRange(f(q, 'lambda', d.lambda), 0.01, 1),
    eta: clampRange(f(q, 'eta', d.eta), 0, 1.5),
    A: Math.max(0, f(q, 'A', d.A)),
    L: 1,
    mu: clampRange(f(q, 'mu', d.mu), 0, 0.99),
    tau: clampRange(f(q, 'tau', d.tau), 0, 2),
    wageRigid: q.get('wageRigid') === '0' ? false : true,
    adjustmentSpeed: clampRange(f(q, 'spd', d.adjustmentSpeed), 0.01, 1),
    reabsorptionRate: clampRange(f(q, 'reab', d.reabsorptionRate), 0.01, 1),
    view,
  };
}

function clampRange(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}
