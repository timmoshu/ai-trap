/**
 * Pricing-power / first-mover extension (beyond-paper what-if). Verifies the Gate-0 checks from
 * _bmad-output/planning-artifacts/gate0-pricing-power-extension.md:
 *   1. beta=0 recovers the paper's per-firm profit EXACTLY (logit share -> 1/N).
 *   2. beta=0 best response == alphaNE; beta>0 over-automates (business stealing).
 *   3. shares always sum to 1 and stay interior under logit (no instant winner-take-all corner).
 *   4. the regime flips: first-mover at high beta / low g, fast-follower at low beta / high g, and
 *      the boundary g*(beta) is monotone increasing.
 *   5. beta turns the share race on: at beta=0 the lead brings no share prize (leadShare == 1/N).
 */
import { describe, it, expect } from 'vitest';
import type { Params } from './types';
import { alphaNE, alphaCO, profitPerFirmUnilateral, s } from './static';
import {
  logitShare,
  marginalCost,
  firmProfitWithShare,
  bestResponseAutomation,
  adoptionCost,
  classifyRegime,
  regimeBoundaryG,
  RACE_DEFAULTS,
  symmetricNash,
  profitIndex,
  profitBreakevenBeta,
  simulatePricingRace,
} from './pricing';

const base: Params = { N: 4, c: 0.3, w: 1, k: 1, lambda: 0.5, eta: 0.3, A: 1, L: 1, mu: 0, tau: 0 };
const approx = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol;
const ALPHAS = [0, 0.1, 0.35, 0.6125, 0.85];

describe('Check 1 — beta=0 recovers the paper exactly', () => {
  it('logit share at beta=0 is 1/N for any costs', () => {
    for (const a of ALPHAS)
      expect(
        approx(logitShare(marginalCost(base, a), marginalCost(base, 0), base.N - 1, 0), 1 / base.N),
      ).toBe(true);
  });

  it('firmProfitWithShare(beta=0) == profitPerFirmUnilateral to machine precision', () => {
    for (const alphaI of ALPHAS)
      for (const aBar of ALPHAS)
        expect(
          approx(
            firmProfitWithShare(base, alphaI, aBar, 0),
            profitPerFirmUnilateral(base, alphaI, aBar),
          ),
        ).toBe(true);
  });

  it('holds across off-default parameterizations', () => {
    const variants: Params[] = [
      { ...base, N: 2 },
      { ...base, N: 10 },
      { ...base, c: 0.1, eta: 0.8 },
      { ...base, lambda: 1, eta: 1.2 }, // eta>1: trap reverses; nesting must still hold
    ];
    for (const p of variants)
      for (const alphaI of ALPHAS)
        for (const aBar of ALPHAS)
          expect(
            approx(
              firmProfitWithShare(p, alphaI, aBar, 0),
              profitPerFirmUnilateral(p, alphaI, aBar),
            ),
          ).toBe(true);
  });
});

describe('Check 2 — business stealing shifts the best response right', () => {
  it('beta=0 best response equals the paper alphaNE (symmetric rivals)', () => {
    // at symmetric play aBar = alphaNE, the firm best-responds at alphaNE
    const aNE = alphaNE(base);
    expect(approx(bestResponseAutomation(base, aNE, 0), aNE, 1 / 4000 + 1e-9)).toBe(true);
  });

  it('beta>0 makes the firm automate MORE than the paper (over-automation grows)', () => {
    const aNE = alphaNE(base);
    const brNeutral = bestResponseAutomation(base, aNE, 0);
    for (const beta of [1, 3, 8]) {
      const br = bestResponseAutomation(base, aNE, beta);
      expect(br).toBeGreaterThan(brNeutral - 1e-9);
    }
    // strictly higher at a meaningful beta
    expect(bestResponseAutomation(base, aNE, 8)).toBeGreaterThan(brNeutral + 0.01);
  });
});

describe('Check 3 — shares conserve and stay interior (no instant corner)', () => {
  it('leader + (N-1) follower shares sum to 1 for all beta', () => {
    for (const beta of [0, 0.5, 2, 5, 20]) {
      const leader = logitShare(
        marginalCost(base, 0.6125),
        marginalCost(base, 0),
        base.N - 1,
        beta,
      );
      const eachFollower = (1 - leader) / (base.N - 1);
      expect(approx(leader + (base.N - 1) * eachFollower, 1)).toBe(true);
    }
  });

  it('logit keeps the leader share interior at moderate beta (does not slam to 1)', () => {
    const target = alphaNE(base);
    const moderate = logitShare(marginalCost(base, target), marginalCost(base, 0), base.N - 1, 3);
    expect(moderate).toBeGreaterThan(1 / base.N); // the leader does gain share
    expect(moderate).toBeLessThan(0.9); // ...but nowhere near a corner at moderate beta
  });

  it('share rises monotonically with the cost gap (more automation -> more share)', () => {
    let prev = -Infinity;
    for (const a of ALPHAS) {
      const sh = logitShare(marginalCost(base, a), marginalCost(base, 0), base.N - 1, 5);
      expect(sh).toBeGreaterThanOrEqual(prev);
      prev = sh;
    }
  });
});

describe('Check 4 — the regime flips, and the boundary is monotone', () => {
  const target = alphaNE(base);
  // A sizeable, falling transformation cost is what makes waiting pay (see RaceConfig.transformScale).
  const race = { ...RACE_DEFAULTS, transformScale: 10 };

  it("at the paper's tiny transformation cost (scale=1) it is ALWAYS a race — no one can afford to wait", () => {
    // the per-period operating saving dwarfs the one-time cost, so adopting now always wins.
    for (const beta of [0, 4, 12])
      for (const g of [0, 0.5, 2, 8])
        expect(classifyRegime(base, target, beta, g).regime).toBe('first-mover');
  });

  it('with a large falling transformation cost: high pricing power / slow decline => first-mover; opposite => fast-follower', () => {
    expect(classifyRegime(base, target, 12, 0.05, race).regime).toBe('first-mover');
    expect(classifyRegime(base, target, 0, 0.8, race).regime).toBe('fast-follower');
  });

  it('margin falls monotonically as adoption cost decays faster (g rewards waiting)', () => {
    let prev = Infinity;
    for (const g of [0, 0.1, 0.3, 0.6, 1.0]) {
      const m = classifyRegime(base, target, 4, g, race).margin;
      expect(m).toBeLessThan(prev);
      prev = m;
    }
  });

  it('margin rises monotonically with pricing power beta (share prize favors leading)', () => {
    let prev = -Infinity;
    for (const beta of [0, 1, 4, 10]) {
      const m = classifyRegime(base, target, beta, 0.3, race).margin;
      expect(m).toBeGreaterThan(prev);
      prev = m;
    }
  });

  it('the flip boundary g*(beta) is real and monotone increasing in beta', () => {
    const betas = [1, 2, 4, 8];
    const boundaries = betas.map((b) => regimeBoundaryG(base, target, b, race, 0, 5));
    // every probed beta has a real first-mover -> fast-follower crossing
    for (const g of boundaries) expect(g).not.toBeNull();
    // more pricing power tolerates faster cost decline before flipping to fast-follow
    for (let i = 1; i < boundaries.length; i++)
      expect(boundaries[i]!).toBeGreaterThan(boundaries[i - 1]!);
  });
});

describe('Check 5 — beta is the master switch for the share race', () => {
  it('at beta=0 the lead brings no share prize (leadShare == 1/N)', () => {
    const r = classifyRegime(base, alphaNE(base), 0, 0.1);
    expect(approx(r.leadShare, 1 / base.N)).toBe(true);
  });

  it('beta>0 gives the lead a real share prize (leadShare > 1/N)', () => {
    const r = classifyRegime(base, alphaNE(base), 5, 0.1);
    expect(r.leadShare).toBeGreaterThan(1 / base.N);
  });

  it('adoption cost decays from the paper retooling cost at t=0', () => {
    const target = alphaNE(base);
    const k0 = (base.k / 2) * target * target * base.L;
    expect(approx(adoptionCost(base, target, 0.2, 0), k0)).toBe(true);
    expect(adoptionCost(base, target, 0.2, 10)).toBeLessThan(k0);
  });

  it('cost saving s feeds the marginal-cost cut that drives shares', () => {
    expect(approx(marginalCost(base, 1), base.c)).toBe(true); // fully automated -> unit cost = c
    expect(approx(marginalCost(base, 0), base.w)).toBe(true); // no automation -> unit cost = w
    expect(approx(s(base), base.w - base.c)).toBe(true);
  });
});

describe('Check 6 — the headline findings (page-facing summaries, default inputs)', () => {
  it('beta=0 reproduces the paper exactly: symmetric Nash == alphaNE', () => {
    expect(approx(symmetricNash(base, 0), alphaNE(base), 1e-3)).toBe(true);
  });

  it('pricing power inflates automation past the paper, up to the corner', () => {
    expect(symmetricNash(base, 1)).toBeGreaterThan(alphaNE(base));
    expect(symmetricNash(base, 8)).toBeGreaterThan(0.99); // saturates at full automation
  });

  it('Finding #1: AI stops paying for itself — profit crosses below the no-automation baseline (100)', () => {
    // the paper alone (beta=0) leaves profit ABOVE 100; pricing power pushes it BELOW.
    expect(profitIndex(base, symmetricNash(base, 0))).toBeGreaterThan(100);
    expect(profitIndex(base, symmetricNash(base, 2))).toBeLessThan(100);
    const bStar = profitBreakevenBeta(base);
    expect(bStar).not.toBeNull();
    expect(bStar!).toBeGreaterThan(0); // there is a finite pricing power where AI stops paying
  });

  it('Finding #2: the social optimum is unchanged by pricing power (only the private race inflates)', () => {
    // alphaCO is beta-free: business stealing is a pure transfer, so the profit peak does not move.
    expect(approx(alphaCO(base), alphaCO({ ...base }), 0)).toBe(true);
    // and the combined profit at the optimum is the same regardless of how we got there
    expect(profitIndex(base, alphaCO(base))).toBeGreaterThan(profitIndex(base, alphaNE(base)));
  });

  it('Finding #3 (Q2): the first mover banks a windfall, then the whole industry settles below 100; the holdout is crushed', () => {
    const race = simulatePricingRace(base, 2);
    expect(race.peakLeader).toBeGreaterThan(150); // a large early windfall (well above the 100 baseline)
    expect(race.settle).toBeLessThan(100); // everyone ends below where they started
    expect(race.laggard).toBeLessThan(race.settle); // the firm that never moves is worse than the pack
    expect(race.path[0].leader).toBeGreaterThan(race.path[race.path.length - 1].leader); // mover drifts down
  });
});
