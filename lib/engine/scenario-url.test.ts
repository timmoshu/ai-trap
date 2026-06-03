/**
 * FR-1.13 — scenario URL round-trip and resilient decoding.
 */
import { describe, it, expect } from 'vitest';
import {
  encodeScenario,
  decodeScenario,
  effectiveParams,
  DEFAULT_SCENARIO,
  type Scenario,
} from './scenario-url';

const sample: Scenario[] = [
  DEFAULT_SCENARIO,
  { ...DEFAULT_SCENARIO, N: 7, c: 0.42, lambda: 0.8, eta: 1.2, k: 1.5, tau: 0.13, view: 'hill' },
  { ...DEFAULT_SCENARIO, wageRigid: false, mu: 0.6, A: 3, adjustmentSpeed: 0.5 },
];

describe('scenario URL', () => {
  it('round-trips every field through encode/decode', () => {
    for (const sc of sample) {
      const back = decodeScenario(encodeScenario(sc));
      for (const key of Object.keys(sc) as (keyof Scenario)[]) {
        if (typeof sc[key] === 'number') {
          expect(Math.abs((back[key] as number) - (sc[key] as number))).toBeLessThan(1e-4);
        } else {
          expect(back[key]).toBe(sc[key]);
        }
      }
    }
  });

  it('falls back to defaults and clamps out-of-range or missing values', () => {
    const sc = decodeScenario('N=-5&eta=99&lambda=0&view=bogus');
    expect(sc.N).toBeGreaterThanOrEqual(1);
    expect(sc.eta).toBeLessThanOrEqual(3);
    expect(sc.lambda).toBeGreaterThanOrEqual(0.01);
    expect(sc.view).toBe('timeseries');
  });

  it('flexible wages remove the externality (effective eta = 1)', () => {
    const flex = effectiveParams({ ...DEFAULT_SCENARIO, wageRigid: false });
    expect(flex.eta).toBe(1);
    const rigid = effectiveParams({ ...DEFAULT_SCENARIO, wageRigid: true });
    expect(rigid.eta).toBe(DEFAULT_SCENARIO.eta);
  });

  it('clamps N to the slider grid and treats blank params as missing', () => {
    expect(decodeScenario('N=1000000000').N).toBe(20);
    expect(decodeScenario('c=&lambda=').c).toBeCloseTo(DEFAULT_SCENARIO.c, 6);
    expect(decodeScenario('c=&lambda=').lambda).toBeCloseTo(DEFAULT_SCENARIO.lambda, 6);
  });
});
