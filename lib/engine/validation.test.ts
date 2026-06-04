/**
 * Math validation sweep — a regression guard against the "UBI reduces profit" CLASS of bug, where
 * a display transform smuggles in a spurious dependency. For a broad parameter grid it asserts:
 *  - the automation choice is invariant to the level levers (A, t) and to scale (L);
 *  - the profit-side displays (profit, cost saved, demand lost, cost index) are invariant to A and L;
 *  - consumer spending DOES move with A (so the suite can actually fail — not everything is flat);
 *  - the identity profit = (1-t)(cost saved - demand lost) holds everywhere;
 *  - the capital tax scales ONLY the profit change, by exactly (1-t);
 *  - every display field equals an independent, first-principles recompute.
 */
import { describe, it, expect } from 'vitest';
import type { Params } from './types';
import {
  alphaNE,
  alphaCO,
  aggregateProfit,
  alphaEquity,
  alphaCoalition,
  tauStar,
  wedge,
} from './static';
import { steadyMetrics } from './dynamic';

const base: Omit<Params, 'N' | 'c' | 'k' | 'lambda' | 'eta'> = {
  w: 1,
  A: 1,
  L: 1,
  mu: 0,
  tau: 0,
  t: 0,
};
const grid: Params[] = [];
for (const N of [1, 2, 4, 10, 20])
  for (const c of [0.1, 0.3, 0.6, 0.9])
    for (const lambda of [0.3, 0.5, 0.8, 1])
      for (const eta of [0, 0.3, 0.7, 1, 1.3])
        for (const k of [0.5, 1, 2]) grid.push({ ...base, N, c, k, lambda, eta });

const approx = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol;
const ALPHAS = [0, 0.2, 0.5, 0.85, 1];
const A_LEVELS = [0.5, 1, 5, 20];
const L_LEVELS = [1, 2, 7];

describe('math validation sweep', () => {
  it('the automation choice is invariant to UBI (A), capital tax (t), and scale (L)', () => {
    for (const p of grid) {
      const ne = alphaNE(p);
      const co = alphaCO(p);
      for (const A of A_LEVELS) {
        expect(approx(alphaNE({ ...p, A }), ne)).toBe(true);
        expect(approx(alphaCO({ ...p, A }), co)).toBe(true);
      }
      for (const t of [0, 0.5, 0.9]) expect(approx(alphaNE({ ...p, t }), ne)).toBe(true);
      for (const L of L_LEVELS) {
        expect(approx(alphaNE({ ...p, L }), ne)).toBe(true);
        expect(approx(alphaCO({ ...p, L }), co)).toBe(true);
      }
    }
  });

  it('profit / cost-saved / demand-lost / cost-index are invariant to UBI (A) and scale (L)', () => {
    for (const p of grid)
      for (const a of ALPHAS) {
        const ref = steadyMetrics(p, a);
        for (const A of A_LEVELS) {
          const m = steadyMetrics({ ...p, A }, a);
          expect(approx(m.profitIndex, ref.profitIndex)).toBe(true);
          expect(approx(m.costSaved, ref.costSaved)).toBe(true);
          expect(approx(m.demandLost, ref.demandLost)).toBe(true);
          expect(approx(m.costIndex, ref.costIndex)).toBe(true);
        }
        for (const L of L_LEVELS) {
          const m = steadyMetrics({ ...p, L }, a);
          expect(approx(m.profitIndex, ref.profitIndex)).toBe(true);
          expect(approx(m.costSaved, ref.costSaved)).toBe(true);
          expect(approx(m.demandLost, ref.demandLost)).toBe(true);
        }
      }
  });

  it('consumer spending DOES respond to UBI (guards against a vacuously-passing suite)', () => {
    const p = grid.find((x) => x.N === 4 && x.eta === 0.3 && x.c === 0.3 && x.lambda === 0.5)!;
    const a = alphaNE(p);
    expect(steadyMetrics({ ...p, A: 20 }, a).demandIndex).toBeGreaterThan(
      steadyMetrics({ ...p, A: 1 }, a).demandIndex,
    );
  });

  it('profit = (1-t) * (cost saved - demand lost), everywhere', () => {
    for (const p of grid)
      for (const a of ALPHAS)
        for (const t of [0, 0.3, 0.7]) {
          const m = steadyMetrics({ ...p, t }, a);
          expect(approx(m.profitIndex - 100, (1 - t) * (m.costSaved - m.demandLost), 1e-7)).toBe(
            true,
          );
        }
  });

  it('the capital tax scales ONLY the profit change, by exactly (1-t)', () => {
    for (const p of grid)
      for (const a of ALPHAS) {
        const b = steadyMetrics(p, a);
        for (const t of [0.3, 0.7]) {
          const m = steadyMetrics({ ...p, t }, a);
          expect(approx(m.profitIndex - 100, (1 - t) * (b.profitIndex - 100), 1e-7)).toBe(true);
          expect(approx(m.demandIndex, b.demandIndex)).toBe(true);
          expect(approx(m.costSaved, b.costSaved)).toBe(true);
          expect(approx(m.demandLost, b.demandLost)).toBe(true);
        }
      }
  });

  it('the first-mover lines behave: mover == aggregate profit at equilibrium, and beats holding out', () => {
    for (const p of grid)
      for (const a of ALPHAS) {
        const m = steadyMetrics(p, a);
        // At the symmetric equilibrium (you move like everyone) the first-mover line IS the
        // per-firm aggregate profit, so it must equal the profitIndex.
        expect(approx(m.profitMover, m.profitIndex, 1e-9)).toBe(true);
        // Automating (mover) beats holding out — the dominant strategy — anywhere up to the firm's
        // own best response alphaNE (which is exactly where the realized target ever sits), given a
        // real cost saving and a non-negative externality. (Past 2*alphaNE it can flip, which the
        // chart never reaches.)
        if (p.w - p.c > 0 && p.eta <= 1 && a <= alphaNE(p) + 1e-9) {
          expect(m.profitMover).toBeGreaterThanOrEqual(m.profitHoldout - 1e-9);
        }
      }
  });

  it('every display field equals an independent first-principles recompute', () => {
    for (const p of grid)
      for (const a of ALPHAS) {
        const m = steadyMetrics(p, a);
        const wageBill = p.w * p.L * p.N;
        const net = a * (1 - p.eta); // unclamped: demand change can be negative when eta > 1
        const baseDemand = p.A + p.lambda * p.w * p.L * p.N;
        const demand = p.A + p.lambda * p.w * p.L * p.N * (1 - net);
        const refProfit =
          100 +
          ((1 - (p.t ?? 0)) * (aggregateProfit(p, a) - aggregateProfit(p, 0)) * 100) / wageBill;
        const refCostSaved = ((p.N * p.L * (a * (p.w - p.c) - (p.k / 2) * a * a)) / wageBill) * 100;
        const refCostIndex = ((p.w - a * (p.w - p.c) + (p.k / 2) * a * a) / p.w) * 100;
        expect(approx(m.profitIndex, refProfit)).toBe(true);
        expect(approx(m.costSaved, refCostSaved)).toBe(true);
        expect(approx(m.demandLost, p.lambda * net * 100)).toBe(true);
        expect(approx(m.costIndex, refCostIndex)).toBe(true);
        expect(approx(m.demandIndex, (demand / baseDemand) * 100)).toBe(true);
        expect(approx(m.unemployment, Math.max(0, net) * 100)).toBe(true);
      }
  });

  it('policy levers reach their paper-proven targets (interior cases)', () => {
    for (const p of grid) {
      // skip corner regimes where clipping hides the closed form
      const interior =
        alphaNE(p) > 1e-9 && alphaNE(p) < 1 - 1e-9 && alphaCO(p) > 1e-9 && alphaCO(p) < 1 - 1e-9;
      if (!interior) continue;
      // the Pigouvian tau* drives the Nash level onto the optimum
      expect(approx(alphaNE({ ...p, tau: tauStar(p) }), alphaCO(p), 1e-9)).toBe(true);
      // the full coalition (M = N) reaches the optimum; worker equity at eps = 1/lambda does too
      expect(approx(alphaCoalition(p, p.N), alphaCO(p), 1e-9)).toBe(true);
      expect(approx(alphaEquity(p, 1 / p.lambda), alphaCO(p), 1e-9)).toBe(true);
      // and the wedge is non-negative exactly when eta <= 1
      if (p.eta <= 1) expect(wedge(p)).toBeGreaterThanOrEqual(-1e-12);
      else expect(wedge(p)).toBeLessThanOrEqual(1e-12);
    }
  });
});
