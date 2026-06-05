/**
 * Public surface of the verified engine. Components import from here, never inline an equation.
 */
import type { Params, StaticResult } from './types';
import { s, ell, alphaNE, alphaCO, alphaSP, wedge, tauStar, Nstar } from './static';
import { solveTaxForOptimum } from './tax';

export * from './types';
export * from './static';
export * from './tax';
export * from './dynamic';
export * from './defaults';
export * from './scenario-url';
export * from './jevons';
export * from './pricing';
export * from './baselines';

/** Convenience aggregator: all the headline static quantities for a parameter set. */
export function computeStatic(p: Params): StaticResult {
  return {
    s: s(p),
    ell: ell(p),
    alphaNE: alphaNE(p),
    alphaCO: alphaCO(p),
    alphaSP: alphaSP(p),
    wedge: wedge(p),
    tauStar: tauStar(p),
    tauStarExact: solveTaxForOptimum(p),
    Nstar: Nstar(p),
  };
}
