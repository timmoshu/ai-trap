/**
 * Jevons / output-expansion overlay (Phase-C what-if). Verifies the labeled extension behaves:
 * reduces to pure displacement at eps=0, the threshold marks the jobs-created/destroyed flip, jobs
 * rise with elasticity, and over-automation raises the elasticity bar.
 */
import { describe, it, expect } from 'vitest';
import type { Params } from './types';
import {
  jevonsJobs,
  jevonsThreshold,
  jevonsOutput,
  jevonsSpending,
  simulateJevons,
  simulateJevonsTrough,
  troughFloor,
  troughCeiling,
} from './jevons';
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

  it('output expands with automation and elasticity; flat at eps=0 and alpha=0', () => {
    expect(approx(jevonsOutput(base, 0, 2), 100)).toBe(true); // no automation -> no price cut
    expect(approx(jevonsOutput(base, 0.6125, 0), 100)).toBe(true); // eps=0 -> demand can't move
    expect(jevonsOutput(base, 0.6125, 2)).toBeGreaterThan(100); // elastic -> output grows
  });

  it('spending is flat at the unit-elastic case (eps=1) and identities hold', () => {
    for (const a of ALPHAS) {
      expect(approx(jevonsSpending(base, a, 1), 100)).toBe(true); // priceRatio^0 = 1
      // jobs = (1-alpha) * output  (output already carries the x100 index)
      expect(approx(jevonsJobs(base, a, 2), (1 - a) * jevonsOutput(base, a, 2), 1e-7)).toBe(true);
    }
  });

  it('spending rises only when demand is elastic (eps>1), falls when inelastic', () => {
    expect(jevonsSpending(base, 0.6125, 2)).toBeGreaterThan(100);
    expect(jevonsSpending(base, 0.6125, 0.5)).toBeLessThan(100);
  });

  it('transition trough: starts whole, dips, recovers to the Jevons long-run (pace-proof destination)', () => {
    const target = alphaNE(base);
    const eps = 3; // a strong long-run rescue (ceiling well above 100)
    const path = simulateJevonsTrough(base, target, eps, {
      automationSpeed: 0.4,
      demandGrowthSpeed: 0.08, // market much slower than automation -> a real trough
      periods: 200,
    });
    const jobs = path.map((d) => d.jobs);
    expect(approx(jobs[0], 100)).toBe(true); // before automation: whole
    const floor = troughFloor(target);
    const ceiling = troughCeiling(base, target, eps);
    const min = Math.min(...jobs);
    expect(min).toBeLessThan(100); // it dips
    expect(min).toBeGreaterThanOrEqual(floor - 1e-6); // never below the paper's displacement floor
    expect(min).toBeLessThan(ceiling); // the dip is below the long-run (a real trough)
    expect(approx(jobs[jobs.length - 1], ceiling, 1e-3)).toBe(true); // recovers to the Jevons long-run
  });

  it('faster automation (vs the market) makes a deeper trough; same destination', () => {
    const target = alphaNE(base);
    const eps = 3;
    const deep = simulateJevonsTrough(base, target, eps, {
      automationSpeed: 0.6,
      demandGrowthSpeed: 0.05,
      periods: 300,
    });
    const shallow = simulateJevonsTrough(base, target, eps, {
      automationSpeed: 0.15,
      demandGrowthSpeed: 0.05,
      periods: 300,
    });
    expect(Math.min(...deep.map((d) => d.jobs))).toBeLessThan(
      Math.min(...shallow.map((d) => d.jobs)),
    );
    // same destination regardless of pace
    expect(approx(deep[deep.length - 1].jobs, shallow[shallow.length - 1].jobs, 1e-2)).toBe(true);
  });

  it('simulateJevons ramps from before-automation to the steady overlay at the target', () => {
    const target = alphaNE(base);
    const path = simulateJevons(base, target, 2);
    expect(path.length).toBeGreaterThan(1);
    // starts before automation: alpha=0 -> everything at 100
    expect(approx(path[0].automation, 0)).toBe(true);
    expect(approx(path[0].jobs, 100)).toBe(true);
    expect(approx(path[0].output, 100)).toBe(true);
    // settles at the overlay evaluated at the target
    const end = path[path.length - 1];
    expect(approx(end.jobs, jevonsJobs(base, end.automation / 100, 2), 1e-6)).toBe(true);
    expect(end.automation).toBeGreaterThan(50); // ramped most of the way to ~61%
  });
});
