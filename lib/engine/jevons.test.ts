/**
 * Jevons / output-expansion overlay (Phase-C what-if). Verifies the labeled extension behaves:
 * reduces to pure displacement at eps=0, the threshold marks the jobs-created/destroyed flip, jobs
 * rise with elasticity, and over-automation raises the elasticity bar.
 */
import { describe, it, expect } from 'vitest';
import type { Params } from './types';
import { jevonsJobs, jevonsThreshold } from './jevons';
import { alphaNE, alphaCO } from './static';

const base: Params = { N: 4, c: 0.3, w: 1, k: 1, lambda: 0.5, eta: 0.3, A: 1, L: 1, mu: 0, tau: 0 };
const approx = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol;
const ALPHAS = [0.1, 0.35, 0.6125, 0.85];

describe('Jevons output-expansion overlay', () => {
  it('at eps=0 is the fixed-output corner: pure displacement (1-alpha)*100', () => {
    for (const a of ALPHAS) expect(approx(jevonsJobs(base, a, 0), (1 - a) * 100)).toBe(true);
  });

  it('the threshold elasticity makes automation employment-neutral (jobs = 100)', () => {
    for (const a of ALPHAS) {
      const eps = jevonsThreshold(base, a);
      expect(approx(jevonsJobs(base, a, eps), 100, 1e-7)).toBe(true);
    }
  });

  it('the marginal threshold (alpha -> 0) equals w/s', () => {
    expect(approx(jevonsThreshold(base, 0), base.w / (base.w - base.c))).toBe(true);
  });

  it('above the threshold automation creates jobs; below it destroys them', () => {
    for (const a of ALPHAS) {
      const eps = jevonsThreshold(base, a);
      expect(jevonsJobs(base, a, eps + 0.3)).toBeGreaterThan(100);
      expect(jevonsJobs(base, a, Math.max(0, eps - 0.3))).toBeLessThan(100);
    }
  });

  it('employment rises monotonically with elasticity', () => {
    for (const a of ALPHAS) {
      let prev = -Infinity;
      for (const eps of [0, 0.5, 1, 2, 4]) {
        const j = jevonsJobs(base, a, eps);
        expect(j).toBeGreaterThanOrEqual(prev);
        prev = j;
      }
    }
  });

  it('over-automation raises the Jevons bar: threshold(alphaNE) > threshold(alphaCO) > marginal', () => {
    const tNE = jevonsThreshold(base, alphaNE(base));
    const tCO = jevonsThreshold(base, alphaCO(base));
    const tMarg = jevonsThreshold(base, 0);
    expect(tNE).toBeGreaterThan(tCO);
    expect(tCO).toBeGreaterThan(tMarg);
  });

  it('cheaper AI lowers the marginal threshold (bigger price cuts trigger Jevons sooner)', () => {
    const cheap = jevonsThreshold({ ...base, c: 0.1 }, 0);
    const dear = jevonsThreshold({ ...base, c: 0.5 }, 0);
    expect(cheap).toBeLessThan(dear);
  });
});
