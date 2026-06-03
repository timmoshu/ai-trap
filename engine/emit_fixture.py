"""Emit the golden parity fixture from the verified reference engine (architecture D-3).

Run: python3 engine/emit_fixture.py   ->   lib/engine/__fixtures__/reference.json

The TypeScript engine's parity.test.ts recomputes every row and asserts equality to <= 1e-9.
CI itself runs no Python; this file is run only when the model changes, to regenerate the fixture.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Importing the reference engine runs its Gate-0 self-tests (prints to stdout); that's fine.
from layoff_trap import (  # noqa: E402
    Params, s, ell, alpha_NE, alpha_CO, alpha_SP, wedge, tau_star, Nstar,
    demand, worker_income,
)

N_GRID = [1, 2, 4, 20]
C_GRID = [0.1, 0.3, 0.6]
K_GRID = [0.5, 1.0, 2.0]
LAM_GRID = [0.3, 0.5, 1.0]
ETA_GRID = [0.0, 0.3, 1.0, 1.5]
TAU_GRID = [0.0, 0.2]
MU_GRID = [0.0, 0.6]

rows = []
for N in N_GRID:
    for c in C_GRID:
        for k in K_GRID:
            for lam in LAM_GRID:
                for eta in ETA_GRID:
                    for tau in TAU_GRID:
                        for mu in MU_GRID:
                            p = Params(N=N, c=c, w=1.0, k=k, lam=lam, eta=eta,
                                       A=1.0, L=1.0, mu=mu, tau=tau)
                            a_ne = alpha_NE(p)
                            rows.append({
                                "params": {
                                    "N": N, "c": c, "w": 1.0, "k": k, "lambda": lam,
                                    "eta": eta, "A": 1.0, "L": 1.0, "mu": mu, "tau": tau,
                                },
                                "out": {
                                    "s": s(p),
                                    "ell": ell(p),
                                    "alphaNE": a_ne,
                                    "alphaCO": alpha_CO(p),
                                    "alphaSP": alpha_SP(p),
                                    "wedge": wedge(p),
                                    "tauStar": tau_star(p),
                                    "Nstar": Nstar(p),
                                    "demandAtNE": demand(p, a_ne),
                                    "workerIncomeAtNE": worker_income(p, a_ne),
                                },
                            })

out_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                       "lib", "engine", "__fixtures__")
os.makedirs(out_dir, exist_ok=True)
out_path = os.path.join(out_dir, "reference.json")
with open(out_path, "w") as fh:
    json.dump({"version": 2, "generator": "engine/emit_fixture.py", "rows": rows}, fh, indent=0)

print(f"\nWrote {len(rows)} parity rows -> {out_path}")
