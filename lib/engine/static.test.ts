/**
 * Gate-0 headline behaviors (mirrors engine/layoff_trap.py self-tests) + the corner-regime
 * tax solver. These guard the comparative statics the whole product rests on.
 */
import { describe, it, expect } from 'vitest';
import type { Params } from './types';
import {
  alphaNE,
  alphaCO,
  wedge,
  tauStar,
  ell,
  profitPerFirm,
  profitPerFirmUnilateral,
} from './static';
import { solveTaxForOptimum } from './tax';

const base: Params = { N: 4, c: 0.3, w: 1, k: 1, lambda: 0.5, eta: 0.3, A: 1, L: 1, mu: 0, tau: 0 };
const approx = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol;

describe('Gate-0 comparative statics', () => {
  it('wedge matches the closed form ell(1-1/N)/k', () => {
    expect(approx(wedge(base), (ell(base) * (1 - 1 / base.N)) / base.k)).toBe(true);
    expect(approx(wedge(base), 0.2625)).toBe(true);
  });

  it('the interior Pigouvian tax restores the cooperative optimum', () => {
    const taxed = { ...base, tau: tauStar(base) };
    expect(approx(alphaNE(taxed), alphaCO(base))).toBe(true);
  });

  it('UBI (raising A) leaves Nash automation unchanged', () => {
    expect(approx(alphaNE({ ...base, A: base.A + 5 }), alphaNE(base))).toBe(true);
  });

  it('more competition widens the wedge; monopoly (N=1) is efficient', () => {
    expect(approx(wedge({ ...base, N: 1 }), 0)).toBe(true);
    expect(wedge({ ...base, N: 20 })).toBeGreaterThan(wedge(base));
    expect(wedge(base)).toBeGreaterThan(0);
  });

  it('eta > 1 reverses the trap (negative wedge, under-automation)', () => {
    const better = { ...base, eta: 1.5 };
    expect(ell(better)).toBeLessThan(0);
    expect(wedge(better)).toBeLessThan(0);
  });

  it("a single firm's profit peaks at alphaNE (right of the cooperative optimum)", () => {
    // Equals symmetric per-firm profit when the firm matches its rivals.
    expect(approx(profitPerFirmUnilateral(base, 0.4, 0.4), profitPerFirm(base, 0.4))).toBe(true);
    // Scan the firm's own automation (rivals fixed at the optimum): the argmax is alphaNE.
    let bestA = 0;
    let bestP = -Infinity;
    for (let i = 0; i <= 1000; i++) {
      const a = i / 1000;
      const p = profitPerFirmUnilateral(base, a, alphaCO(base));
      if (p > bestP) {
        bestP = p;
        bestA = a;
      }
    }
    expect(approx(bestA, alphaNE(base), 1e-3)).toBe(true);
    expect(alphaNE(base)).toBeGreaterThan(alphaCO(base)); // the firm wants to over-automate
  });
});

describe('corner-regime tax solver', () => {
  it('matches the closed form in the interior regime', () => {
    expect(approx(solveTaxForOptimum(base), tauStar(base), 1e-7)).toBe(true);
  });

  it('drives Nash onto the optimum even when untaxed alphaNE is capped at 1', () => {
    // k=0.5: alphaNE(no tax)=1.225->1 (capped), alphaCO=0.7 (interior)
    const corner: Params = { ...base, k: 0.5 };
    expect(alphaNE(corner)).toBe(1);
    const tau = solveTaxForOptimum(corner);
    expect(approx(alphaNE({ ...corner, tau }), alphaCO(corner), 1e-7)).toBe(true);
  });

  it('returns 0 (not the closed form) when both Nash and optimum are already saturated at 1', () => {
    // c=0.1,k=0.5: s=0.9, ell=0.35 -> alphaCO=(0.55)/0.5=1.1->1, alphaNE->1. Optimum already met.
    const saturated: Params = { ...base, c: 0.1, k: 0.5 };
    expect(alphaCO(saturated)).toBe(1);
    expect(solveTaxForOptimum(saturated)).toBe(0);
    expect(tauStar(saturated)).toBeGreaterThan(0); // the closed form would wrongly tax here
  });
});
