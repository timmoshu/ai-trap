/**
 * FR-1.1 / architecture D-3 — engine fidelity gate.
 * Recompute every golden-fixture row in TypeScript and assert equality to the verified
 * Python reference (engine/layoff_trap.py) within 1e-9, across interior, corner, and eta>1 cases.
 */
import { describe, it, expect } from 'vitest';
import fixture from './__fixtures__/reference.json';
import type { Params } from './types';
import {
  s,
  ell,
  alphaNE,
  alphaCO,
  alphaSP,
  wedge,
  tauStar,
  Nstar,
  demand,
  workerIncome,
} from './static';

const TOL = 1e-9;

describe('engine parity vs verified Python reference', () => {
  it('reproduces every fixture row within 1e-9', () => {
    expect(fixture.rows.length).toBeGreaterThan(500);
    for (const row of fixture.rows as Array<{ params: Params; out: Record<string, number> }>) {
      const p = row.params;
      const a = alphaNE(p);
      const got: Record<string, number> = {
        s: s(p),
        ell: ell(p),
        alphaNE: a,
        alphaCO: alphaCO(p),
        alphaSP: alphaSP(p),
        wedge: wedge(p),
        tauStar: tauStar(p),
        Nstar: Nstar(p),
        demandAtNE: demand(p, a),
        workerIncomeAtNE: workerIncome(p, a),
      };
      for (const key of Object.keys(row.out)) {
        const diff = Math.abs(got[key] - row.out[key]);
        if (diff > TOL) {
          throw new Error(
            `parity mismatch on ${key}: got ${got[key]} expected ${row.out[key]} (diff ${diff}) for params ${JSON.stringify(p)}`,
          );
        }
        expect(diff).toBeLessThanOrEqual(TOL);
      }
    }
  });
});
