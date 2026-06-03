/**
 * FR-1.2 basis / architecture D-4 — the dynamic invariant.
 * For any parameters and any positive speeds, the integrator's converged drivers must equal the
 * static equilibrium. Backs "destination faithful, path illustrative" and guarantees no doom-spiral.
 */
import { describe, it, expect } from 'vitest';
import type { Params } from './types';
import { simulate, steadyMetrics, type DynamicConfig } from './dynamic';
import { alphaNE } from './static';

const base: Params = { N: 4, c: 0.3, w: 1, k: 1, lambda: 0.5, eta: 0.3, A: 1, L: 1, mu: 0, tau: 0 };

const paramGrid: Params[] = [];
for (const N of [1, 2, 4, 20]) {
  for (const eta of [0, 0.3, 1.0, 1.5]) {
    for (const c of [0.1, 0.3, 0.6]) {
      for (const tau of [0, 0.2]) {
        paramGrid.push({ ...base, N, eta, c, tau });
      }
    }
  }
}

const speeds: DynamicConfig[] = [
  { adjustmentSpeed: 0.05, reabsorptionRate: 0.03, periods: 6000 },
  { adjustmentSpeed: 0.12, reabsorptionRate: 0.06, periods: 6000 },
  { adjustmentSpeed: 0.6, reabsorptionRate: 0.4, periods: 6000 },
];

describe('dynamic steady state equals static equilibrium', () => {
  it('converges to the static equilibrium for every parameter set and speed', () => {
    const TOL = 1e-6;
    for (const p of paramGrid) {
      const target = steadyMetrics(p, alphaNE(p));
      for (const cfg of speeds) {
        const last = simulate(p, cfg).at(-1)!;
        expect(Math.abs(last.automation - target.automation)).toBeLessThanOrEqual(TOL);
        expect(Math.abs(last.unemployment - target.unemployment)).toBeLessThanOrEqual(TOL);
        expect(Math.abs(last.demandIndex - target.demandIndex)).toBeLessThanOrEqual(TOL);
        expect(Math.abs(last.profitIndex - target.profitIndex)).toBeLessThanOrEqual(TOL);
      }
    }
  });

  it('never diverges or oscillates to infinity', () => {
    for (const p of paramGrid) {
      for (const pt of simulate(p, speeds[1])) {
        expect(Number.isFinite(pt.demandIndex)).toBe(true);
        expect(pt.unemployment).toBeGreaterThanOrEqual(0);
        expect(pt.demandIndex).toBeGreaterThan(-1);
        expect(pt.demandIndex).toBeLessThan(1000);
      }
    }
  });
});
