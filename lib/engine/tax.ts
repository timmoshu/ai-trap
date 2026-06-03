/**
 * Corner-regime tax solver (architecture D-5, Gate-0 note 1).
 * The clean tau* = ell(1 - 1/N) restores alphaCO only in the interior regime. When alphaNE is
 * capped at 1 (or the optimum is itself at a corner), we solve for the tax numerically.
 * alphaNE is continuous and monotonically non-increasing in tau, so bisection is exact.
 */
import type { Params } from './types';
import { alphaNE, alphaCO, ell, s } from './static';

/**
 * The tax that drives alphaNE onto alphaCO, valid in every regime.
 * Returns 0 when the firm is already at or below the optimum (incl. the eta>1 reversal,
 * where the trap runs the other way and no positive tax is the corrective lever).
 */
export function solveTaxForOptimum(p: Params): number {
  const target = alphaCO(p);
  const f = (tau: number): number => alphaNE({ ...p, tau }) - target;

  // Already at/under the optimum (e.g. eta > 1 under-automation): no positive tax restores it.
  if (f(0) <= 1e-12) return 0;

  // alphaNE hits 0 once tau >= s - ell/N; beyond that the tax can push no further.
  const hi = Math.max(0, s(p) - ell(p) / p.N);
  if (hi <= 0) return 0;
  if (f(hi) > 1e-12) return hi; // cannot fully reach the target even driving automation to 0

  let lo = 0;
  let h = hi;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + h) / 2;
    if (f(mid) > 0) lo = mid;
    else h = mid;
  }
  return (lo + h) / 2;
}
