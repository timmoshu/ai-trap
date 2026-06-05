/**
 * Pricing-power / first-mover extension — EXPLICITLY BEYOND THE PAPER (verification engine).
 *
 * The paper gives every firm a fixed 1/N share at one common price, so a firm's incentive to
 * automate is constant as rivals pile in. We relax that two ways, exactly as the canonical
 * technology-adoption timing game does (Fudenberg & Tirole 1985, "Preemption and Rent Equalization
 * in the Adoption of New Technology", REStud 52(3)):
 *
 *   1. SHARE RESPONDS TO COST (knob beta): a firm that automates cuts its marginal cost and captures
 *      market share via a logit demand system. beta = 0 -> share is 1/N for everyone -> the paper.
 *   2. ADOPTION COST FALLS OVER TIME (rate g): transforming later is cheaper, K(t) = K0*e^(-g t).
 *      This is the opposing, fast-follower force. K0 is the paper's own retooling cost (k/2)*target^2*L.
 *
 * The regime — FIRST-MOVER (preempt; winner-take-most) vs. FAST-FOLLOWER (wait for cheap adoption) —
 * is then ENDOGENOUS: it flips on the balance of the share prize (beta) against the cost-decline (g).
 *
 * NESTING (load-bearing, asserted in pricing.test.ts): the static primitive `firmProfitWithShare`
 * at beta = 0 equals the paper's `profitPerFirmUnilateral` to machine precision, and the best-response
 * automation collapses to alphaNE. Total output is never created or destroyed — beta only
 * REDISTRIBUTES a fixed pie across firms (sum of shares = 1), so the paper's no-GDP-claim invariant
 * holds. The timing dimension is an overlay (the paper is static); at beta = 0 it is the pure FT85
 * cost-capture race, with NO share effect.
 *
 * Spec: _bmad-output/planning-artifacts/gate0-pricing-power-extension.md.
 */
import type { Params } from './types';
import { s, alphaNE, profitPerFirm, aggregateProfit } from './static';

/** A firm's per-unit operating (marginal) cost at automation `alpha`: w on humans, c on AI. Falls with alpha. */
export const marginalCost = (p: Params, alpha: number): number => p.w - alpha * s(p);

/**
 * Logit market share of a firm with marginal cost `mcSelf` against `nOthers` rivals at `mcOther`.
 * = e^(-beta*mcSelf) / (e^(-beta*mcSelf) + nOthers*e^(-beta*mcOther)). Lower cost -> higher share.
 * At beta = 0 this is exactly 1/(1 + nOthers) = 1/N regardless of costs — the paper's fixed share.
 * Written in the numerically-stable logistic form so large beta never overflows.
 */
export const logitShare = (
  mcSelf: number,
  mcOther: number,
  nOthers: number,
  beta: number,
): number => 1 / (1 + nOthers * Math.exp(-beta * (mcOther - mcSelf)));

/**
 * ONE firm's STATIC profit when it automates `alphaI` while its N-1 rivals sit symmetric at `aBar`,
 * with logit shares (pricing power `beta`). This is `profitPerFirmUnilateral` with the fixed 1/N
 * slice replaced by an endogenous share — and at beta = 0 it equals it EXACTLY (revenue -> D/N).
 *
 * revenue = share_i * D (aggregate demand, which depends only on TOTAL automation — the paper's demand
 * externality, untouched by beta). cost = operating (wages + AI) + the convex retooling (k/2)alpha^2.
 */
export const firmProfitWithShare = (
  p: Params,
  alphaI: number,
  aBar: number,
  beta: number,
): number => {
  const shareI = logitShare(marginalCost(p, alphaI), marginalCost(p, aBar), p.N - 1, beta);
  const D = p.A + p.lambda * p.w * p.L * (p.N - (1 - p.eta) * (alphaI + (p.N - 1) * aBar));
  const cost = p.L * (alphaI * p.c + (1 - alphaI) * p.w) + (p.k / 2) * p.L * alphaI * alphaI;
  return shareI * D - cost;
};

/**
 * The firm's profit-maximizing automation given rivals at `aBar` and pricing power `beta` — its
 * best response. At beta = 0 this is the paper's alphaNE; beta > 0 adds a BUSINESS-STEALING motive
 * (automating also wins share), shifting the best response RIGHT — more over-automation. Found by a
 * fine grid scan (the objective is smooth; a grid is robust and ample for verification).
 */
export const bestResponseAutomation = (
  p: Params,
  aBar: number,
  beta: number,
  grid = 4000,
): number => {
  let bestA = 0;
  let bestPi = -Infinity;
  for (let i = 0; i <= grid; i++) {
    const a = i / grid;
    const pi = firmProfitWithShare(p, a, aBar, beta);
    if (pi > bestPi) {
      bestPi = pi;
      bestA = a;
    }
  }
  return bestA;
};

/* -------------------------------------------------------------------------------------------------
 * The timing game (FT85): 1 leader vs. N-1 symmetric followers, who all adopt together at t_F.
 * Each firm is a step function from 0 to `target`. While the leader is automated and followers are
 * not, the leader has lower cost -> (if beta>0) higher share AND lower operating cost = the lead prize.
 * Adoption costs K(t) = (k/2)*target^2*L*e^(-g t) — cheaper the longer you wait (the fast-follow pull).
 * ------------------------------------------------------------------------------------------------- */

export interface RaceConfig {
  /** per-period discount rate r; the discount factor is 1/(1+r). */
  discountRate: number;
  /** horizon in periods — long enough that discounting makes the tail negligible. */
  periods: number;
  /**
   * BEYOND-PAPER, illustrative: how big the lumpy one-time transformation investment is, as a
   * multiple of the paper's marginal retooling cost (k/2)target^2 L. The paper's term is a marginal
   * FOC cost; the FT85 "cost of adoption" that falls over time is the real, much larger fixed cost of
   * the AI transformation program (integration, org change). At scale = 1 the per-period operating
   * saving dwarfs it, so adopting now always wins (no fast-follower region) — that is itself the
   * honest finding. A larger, falling transformation cost is what makes waiting pay. NEVER feeds the
   * automation level (alphaNE), only the timing game.
   */
  transformScale: number;
}

export const RACE_DEFAULTS: RaceConfig = { discountRate: 0.05, periods: 200, transformScale: 1 };

/**
 * One-time transformation cost paid by a firm that adopts at period `t`: the paper's marginal
 * retooling (k/2)target^2 L, lifted by the beyond-paper `scale` and decaying at rate `g` (FT85).
 */
export const adoptionCost = (p: Params, target: number, g: number, t: number, scale = 1): number =>
  scale * (p.k / 2) * target * target * p.L * Math.exp(-g * t);

/** Aggregate sector demand given the leader's and followers' current automation (the paper's externality). */
const demandAt = (p: Params, leaderA: number, followerA: number): number =>
  p.A + p.lambda * p.w * p.L * (p.N - (1 - p.eta) * (leaderA + (p.N - 1) * followerA));

/**
 * Per-period operating profit for ONE firm (revenue from its logit share, minus wages+AI; retooling is
 * the separate K). The leader's share is computed once from the cost gap; each of the N-1 followers
 * splits the residual. `side` selects which firm we are. At beta = 0 every share is 1/N.
 */
const operatingProfit = (
  p: Params,
  side: 'leader' | 'follower',
  leaderA: number,
  followerA: number,
  beta: number,
): number => {
  const nOthers = p.N - 1;
  const leaderShare = logitShare(
    marginalCost(p, leaderA),
    marginalCost(p, followerA),
    nOthers,
    beta,
  );
  const myShare = side === 'leader' ? leaderShare : (1 - leaderShare) / nOthers;
  const myA = side === 'leader' ? leaderA : followerA;
  const D = demandAt(p, leaderA, followerA);
  return myShare * D - p.L * (myA * p.c + (1 - myA) * p.w);
};

/**
 * Discounted lifetime value of ONE firm, given the leader adopts at `tLeader` and every follower at
 * `tFollower`. `side` selects whose value we compute. Flow profit each period + the one-time adoption
 * cost discounted to the period it is paid.
 */
export const firmValue = (
  p: Params,
  target: number,
  beta: number,
  g: number,
  tLeader: number,
  tFollower: number,
  side: 'leader' | 'follower',
  cfg: RaceConfig = RACE_DEFAULTS,
): number => {
  const delta = 1 / (1 + cfg.discountRate);
  let V = 0;
  let df = 1;
  for (let t = 0; t < cfg.periods; t++) {
    const leaderA = t >= tLeader ? target : 0;
    const followerA = t >= tFollower ? target : 0;
    V += df * operatingProfit(p, side, leaderA, followerA, beta);
    df *= delta;
  }
  const tSelf = side === 'leader' ? tLeader : tFollower;
  V -= Math.pow(delta, tSelf) * adoptionCost(p, target, g, tSelf, cfg.transformScale);
  return V;
};

export interface RegimeResult {
  regime: 'first-mover' | 'fast-follower';
  /**
   * Preemption margin = value of MATCHING (adopt now, symmetric) − value of HANGING BACK (let the
   * rival lead, then follow at the cheapest worthwhile time). > 0 => no one will wait => firms race
   * to preempt => FIRST-MOVER. < 0 => each prefers the rival go first => they delay => FAST-FOLLOWER.
   */
  margin: number;
  /** value of adopting immediately alongside the rival (both symmetric from t=0). Share is 1/N throughout. */
  matchValue: number;
  /** best value from hanging back: rival leads at 0, this firm follows at its optimal later period. */
  waitValue: number;
  /** the firm's profit-maximizing wait length when it hangs back (1 = follow next period). */
  followerEntry: number;
  /** the leader's market share DURING a lead window (leader automated, followers not). 1/N at beta=0. */
  leadShare: number;
}

/**
 * Classify the equilibrium regime at (`beta`, `g`) — a preemption-vs-war-of-attrition test at the
 * earliest adoption date (FT85). Compare MATCHING (both adopt at 0, symmetric, share 1/N) against
 * HANGING BACK (rival leads at 0; this firm follows at its own best later period, paying the decayed
 * adoption cost but suffering the lead-window share/cost penalty). If matching beats waiting, no firm
 * will hang back -> they race forward -> FIRST-MOVER. If waiting wins, each wants the other to move
 * first -> they delay for cheap adoption -> FAST-FOLLOWER. The (beta, g) locus where margin = 0 is
 * the regime boundary. NOTE the asymmetry that drives it: when both match, shares are always 1/N
 * (beta drops out); beta only bites on the firm that hangs back and gets undercut — which is exactly
 * why more pricing power makes hanging back costlier and pushes toward first-mover.
 */
export const classifyRegime = (
  p: Params,
  target: number,
  beta: number,
  g: number,
  cfg: RaceConfig = RACE_DEFAULTS,
): RegimeResult => {
  // MATCH: adopt immediately alongside the rival (both at 0 => symmetric every period).
  const matchValue = firmValue(p, target, beta, g, 0, 0, 'leader', cfg);
  // HANG BACK: rival leads at 0; pick the best strictly-later follow time.
  let waitValue = -Infinity;
  let followerEntry = 1;
  for (let tF = 1; tF < cfg.periods; tF++) {
    const v = firmValue(p, target, beta, g, 0, tF, 'follower', cfg);
    if (v > waitValue) {
      waitValue = v;
      followerEntry = tF;
    }
  }
  const margin = matchValue - waitValue;
  const leadShare = logitShare(marginalCost(p, target), marginalCost(p, 0), p.N - 1, beta);
  return {
    regime: margin > 0 ? 'first-mover' : 'fast-follower',
    margin,
    matchValue,
    waitValue,
    followerEntry,
    leadShare,
  };
};

/**
 * Trace the regime boundary: for a given `beta`, the cost-decline rate g* at which the regime flips
 * (margin = 0). margin is monotone DECREASING in g (faster cost decline rewards waiting), so a
 * bisection finds the crossing. Returns null if the regime does not flip on [gLo, gHi].
 */
export const regimeBoundaryG = (
  p: Params,
  target: number,
  beta: number,
  cfg: RaceConfig = RACE_DEFAULTS,
  gLo = 0,
  gHi = 1,
  iters = 40,
): number | null => {
  const marginAt = (g: number) => classifyRegime(p, target, beta, g, cfg).margin;
  let lo = gLo;
  let hi = gHi;
  if (marginAt(lo) <= 0 || marginAt(hi) >= 0) return null; // no clean first-mover -> fast-follow crossing
  for (let i = 0; i < iters; i++) {
    const mid = (lo + hi) / 2;
    if (marginAt(mid) > 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};

/* -------------------------------------------------------------------------------------------------
 * Page-facing summaries (the /pricing-power tab). All pure; equations stay in the engine.
 * ------------------------------------------------------------------------------------------------- */

/**
 * The symmetric Nash automation level WITH business stealing — the fixed point a* = bestResponse(a*).
 * At beta = 0 this is the paper's alphaNE; beta > 0 inflates it (each firm also automates to win share)
 * up to the corner a* = 1. Damped fixed-point iteration on the best response.
 */
export const symmetricNash = (p: Params, beta: number, iters = 80): number => {
  let a = alphaNE(p);
  for (let i = 0; i < iters; i++) a = 0.5 * a + 0.5 * bestResponseAutomation(p, a, beta, 2000);
  return a;
};

/** Combined profit (all N firms) indexed to before-automation = 100, in points of the baseline wage bill. */
export const profitIndex = (p: Params, a: number): number =>
  100 + ((aggregateProfit(p, a) - aggregateProfit(p, 0)) * 100) / (p.w * p.L * p.N);

/** ONE firm's profit indexed to before-automation = 100, automating `aSelf` while N-1 rivals sit at `aBar`. */
export const firmProfitIndex = (p: Params, aSelf: number, aBar: number, beta: number): number =>
  100 + ((firmProfitWithShare(p, aSelf, aBar, beta) - profitPerFirm(p, 0)) * 100) / (p.w * p.L);

/**
 * The pricing power at which AI stops paying for itself: the beta where the industry's combined profit
 * (at its business-stealing equilibrium) falls back to the before-automation baseline (index = 100).
 * Below it, automation still nets a gain; above it, the share race leaves everyone worse than not
 * automating at all. Bisection; null if it never crosses on [0, betaHi].
 */
export const profitBreakevenBeta = (p: Params, betaHi = 12): number | null => {
  const idxAt = (b: number) => profitIndex(p, symmetricNash(p, b));
  if (idxAt(0) < 100 || idxAt(betaHi) > 100) return null;
  let lo = 0;
  let hi = betaHi;
  for (let i = 0; i < 36; i++) {
    const mid = (lo + hi) / 2;
    if (idxAt(mid) > 100) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};

export interface PricingRacePoint {
  t: number;
  /** the first mover's profit, indexed to before-automation = 100. Builds a windfall as customers migrate, then drifts down. */
  leader: number;
  /** a follower's profit, indexed to 100. Starts whole, then slides below baseline as customers leave and it over-automates. */
  follower: number;
}

export interface PricingRaceResult {
  path: PricingRacePoint[];
  /** the first mover's peak profit index (the windfall height) while it is the sole automator. */
  peakLeader: number;
  /** where everyone ends once rivals catch up: the symmetric equilibrium profit index (below 100 in the trap). */
  settle: number;
  /** the fate of a holdout that never automates while rivals do — share and demand both collapse on it. */
  laggard: number;
}

/**
 * Simulate the share race over time — "destination faithful, path illustrative", like the main model.
 * EVERY firm starts un-automated: at t=0 all are at alpha=0, share 1/N, profit = the before-automation
 * baseline (index 100). Then automation rolls out: the first mover ramps fast (`leaderRampSpeed`), the
 * field lags (`catchupSpeed`), and both converge to the beta-implied equilibrium a* (= symmetricNash).
 *
 * Two distinct speeds, neither of which touches the equilibrium destination:
 *  - automation ramps (leader vs field) open the cost gap that makes the lead;
 *  - customers do NOT teleport: market share starts at parity and MIGRATES toward the share today's
 *    cost gap implies, at `switchSpeed`. So the first mover's windfall BUILDS from 100 into a hump,
 *    then decays as the field catches up. beta sets how FAR customers move (the windfall's height);
 *    switchSpeed sets how FAST (its shape). Neither changes `settle` — only the path.
 */
export const simulatePricingRace = (
  p: Params,
  beta: number,
  switchSpeed = 0.15,
  catchupSpeed = 0.11,
  leaderRampSpeed = 0.35,
  periods = 60,
): PricingRaceResult => {
  const aStar = symmetricNash(p, beta);
  const path: PricingRacePoint[] = [];
  const cost = (a: number) => p.L * (a * p.c + (1 - a) * p.w) + (p.k / 2) * p.L * a * a;
  const toIndex = (profit: number) => 100 + ((profit - profitPerFirm(p, 0)) * 100) / (p.w * p.L);
  let leaderA = 0; // the first mover's automation, ramping up from nothing
  let field = 0; // the rivals' automation, lagging behind
  let leaderShare = 1 / p.N; // customers start at parity and migrate — they do not teleport
  let peakLeader = -Infinity;
  for (let t = 0; t < periods; t++) {
    const D = p.A + p.lambda * p.w * p.L * (p.N - (1 - p.eta) * (leaderA + (p.N - 1) * field));
    const leaderProfit = leaderShare * D - cost(leaderA);
    const followerProfit = ((1 - leaderShare) / (p.N - 1)) * D - cost(field);
    const leader = toIndex(leaderProfit);
    if (leader > peakLeader) peakLeader = leader;
    path.push({ t, leader, follower: toIndex(followerProfit) });
    // ramp automation (both -> a*, the mover faster) and migrate customers toward the implied share
    leaderA += leaderRampSpeed * (aStar - leaderA);
    field += catchupSpeed * (aStar - field);
    const targetShare = logitShare(marginalCost(p, leaderA), marginalCost(p, field), p.N - 1, beta);
    leaderShare += switchSpeed * (targetShare - leaderShare);
  }
  return {
    path,
    peakLeader,
    settle: profitIndex(p, aStar),
    laggard: firmProfitIndex(p, 0, aStar, beta), // a firm that never automates while rivals reach a*
  };
};
