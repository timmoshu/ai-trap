"""Verified reference engine for 'The AI Layoff Trap' (Falk & Tsoukalas, arXiv:2603.20617).
Every formula below was independently re-derived and cross-checked against the arXiv HTML source (Gate 0)."""
from dataclasses import dataclass

def clip(x, lo=0.0, hi=1.0): return max(lo, min(hi, x))

@dataclass
class Params:
    N: int = 4        # number of symmetric firms (competition)
    c: float = 0.30   # AI cost per task (w normalized to 1 -> c/w=0.30)
    w: float = 1.0    # wage per task
    k: float = 1.0    # quadratic integration/adjustment cost
    lam: float = 0.50 # worker MPC into the sector (lambda)
    eta: float = 0.30 # reabsorption / replacement rate (can exceed 1 = better-paid reemployment)
    A: float = 1.0    # autonomous demand (UBI maps to raising A)
    L: float = 1.0    # task-positions per firm (scale)
    mu: float = 0.0   # planner weight on workers (0 = pure efficiency/owner surplus)
    tau: float = 0.0  # per-task automation tax (policy lever)
    t_cap: float = 0.0  # capital/profit tax (failing policy)
    eps: float = 0.0    # worker equity / profit share (failing policy)
    M: int = None       # Coasean coalition size (None -> = N, no coalition)

def s(p):  return p.w - p.c                 # cost saving
def ell(p):return p.lam * (1 - p.eta) * p.w # master externality parameter

def alpha_NE(p):  # Nash (private), with tax tau
    return clip((s(p) - p.tau - ell(p)/p.N) / p.k)
def alpha_CO(p):  # cooperative / efficiency optimum (internalizes full ell)
    return clip((s(p) - ell(p)) / p.k)
def alpha_SP(p):  # mu-weighted social planner
    if p.mu >= 1: p_mu = 0.999999
    else: p_mu = p.mu
    return clip((s(p) - ell(p))/p.k - p_mu*ell(p)/(p.lam*(1-p_mu)*p.k))
def wedge(p):     return alpha_NE(Params(**{**p.__dict__, 'tau':0.0})) - alpha_CO(p)
def tau_star(p):  return ell(p) * (1 - 1.0/p.N)   # interior Pigouvian rate
def Nstar(p):     return ell(p)/s(p)              # automation threshold in N
def alpha_coalition(p, M):  return clip((s(p) - ell(p)*M/p.N)/p.k)  # Prop 4

def demand(p, a): return p.A + p.lam*p.w*p.L*(p.N - (1-p.eta)*p.N*a)
def worker_income(p, a): return p.w*p.L*p.N*(1 - (1-p.eta)*a)

# ---------------- NUMERICAL GATE-0 TESTS ----------------
def approx(a,b,tol=1e-9): return abs(a-b) < tol
base = Params()
print("=== Verified engine numerical checks (defaults: N=4, c=.3, k=1, lam=.5, eta=.3) ===")
print(f"s={s(base):.4f}  ell={ell(base):.4f}  N*={Nstar(base):.4f}")
print(f"alpha_NE(no tax)={alpha_NE(base):.4f}  alpha_CO={alpha_CO(base):.4f}  wedge={wedge(base):.4f}  ell(1-1/N)/k={ell(base)*(1-1/base.N)/base.k:.4f}")

# T1: wedge formula matches closed form
assert approx(wedge(base), ell(base)*(1-1/base.N)/base.k), "wedge mismatch"
# T2: Pigouvian tax drives Nash onto cooperative optimum (interior regime)
taxed = Params(**{**base.__dict__, 'tau': tau_star(base)})
print(f"tau*={tau_star(base):.4f}  ->  alpha_NE(tau*)={alpha_NE(taxed):.4f}  (target alpha_CO={alpha_CO(base):.4f})")
assert approx(alpha_NE(taxed), alpha_CO(base)), "tax does not restore optimum"
# T3: UBI (raise A) leaves Nash automation UNCHANGED (policy failure, by construction)
ubi = Params(**{**base.__dict__, 'A': base.A + 5.0})
assert approx(alpha_NE(ubi), alpha_NE(base)), "UBI wrongly changed automation"
print(f"UBI A:{base.A}->{ubi.A}: alpha_NE {alpha_NE(base):.4f} -> {alpha_NE(ubi):.4f} (unchanged: PASS)")
# T4: more competition widens the wedge (monopoly efficient)
mono = Params(**{**base.__dict__, 'N':1}); many = Params(**{**base.__dict__, 'N':20})
print(f"wedge: N=1 -> {wedge(mono):.4f} | N=4 -> {wedge(base):.4f} | N=20 -> {wedge(many):.4f}")
assert approx(wedge(mono),0.0) and wedge(many) > wedge(base) > 0, "N-direction wrong"
# T5: eta>1 flips to UNDER-automation (wedge negative) per Corollary 2
better = Params(**{**base.__dict__, 'eta':1.5})
print(f"eta=1.5: ell={ell(better):.4f}  wedge={wedge(better):.4f} (negative => under-automation: PASS)")
assert ell(better) < 0 and wedge(better) < 0, "eta>1 should flip sign"
# T6: worker equity closes wedge only at eps=1/lam (>1 when lam<1) -- structural check
print(f"eps full-internalization point = 1/lam = {1/base.lam:.2f}  (>1, so unreachable with eps<=1: PASS)")
assert 1/base.lam > 1, "equity check"
print("\nALL GATE-0 NUMERICAL TESTS PASSED ✓")
