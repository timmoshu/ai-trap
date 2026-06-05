/**
 * Named parameter baselines: the paper is the reference, every non-paper value is cited, the what-if
 * basis keeps the trap, and reabsorption closes it.
 */
import { describe, it, expect } from 'vitest';
import {
  BASELINES,
  baselineParams,
  whatifParams,
  activeBaselineId,
  WHATIF_BASELINE_ID,
} from './baselines';
import { DEFAULTS } from './defaults';
import { ell, alphaNE, alphaCO } from './static';

describe('parameter baselines', () => {
  it('the paper baseline is exactly the DEFAULTS (the reference point)', () => {
    expect(baselineParams('paper')).toEqual(DEFAULTS);
  });

  it('every value that differs from the paper carries a citation', () => {
    for (const b of BASELINES)
      for (const key of Object.keys(b.params) as (keyof typeof b.params)[])
        expect(b.cites[key], `${b.id}.${key} must cite its source`).toBeTruthy();
  });

  it('activeBaselineId round-trips each baseline and flags edits as custom', () => {
    for (const b of BASELINES) expect(activeBaselineId(baselineParams(b.id))).toBe(b.id);
    expect(activeBaselineId({ ...DEFAULTS, lambda: 0.42 })).toBe('custom');
  });

  it('the what-if basis (central) still has the trap, so the findings hold', () => {
    const w = whatifParams();
    expect(WHATIF_BASELINE_ID).toBe('central');
    expect(ell(w)).toBeGreaterThan(0); // demand externality present
    expect(alphaNE({ ...w, tau: 0 })).toBeGreaterThan(alphaCO(w)); // over-automation present
  });

  it('strong reabsorption closes the trap (eta>=1 => externality <= 0)', () => {
    expect(ell(baselineParams('reabsorption'))).toBeLessThanOrEqual(0);
  });
});
