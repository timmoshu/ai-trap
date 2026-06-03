'use client';
import { alphaNE, alphaCO, alphaEquity, alphaCoalition, type Params } from '@/lib/engine';
import styles from './Controls.module.css';

/**
 * "Policies in this model" (FR-1.8), now INTERACTIVE — selecting a policy applies it to the live
 * model above so you see what it does (and, for the level-shifting policies, what it pointedly does
 * not). The honesty caveat (Gate-0 note 3, red-team A7) stays alongside. Faithful to the paper:
 * UBI and a profit tax cancel from the firm's marginal automation decision; only the grand
 * coalition (or the separate Pigouvian tax) reaches the optimum.
 */
export type PolicyId = 'none' | 'ubi' | 'capitalTax' | 'equity' | 'bargaining';

interface PolicyDef {
  id: PolicyId;
  name: string;
  sub: string;
}
const POLICIES: PolicyDef[] = [
  { id: 'none', name: 'Free market', sub: 'no policy' },
  { id: 'ubi', name: 'UBI', sub: 'lift incomes' },
  { id: 'capitalTax', name: 'Capital / profit tax', sub: 'tax profits' },
  { id: 'equity', name: 'Worker equity', sub: 'workers share profit' },
  { id: 'bargaining', name: 'Bargaining', sub: 'all firms coordinate' },
];

/** The automation each policy produces, measured from the free-market (no-tax) baseline. */
export function policyAlpha(base: Params, id: PolicyId): number {
  const p0 = { ...base, tau: 0 };
  switch (id) {
    case 'equity':
      return alphaEquity(p0, 1);
    case 'bargaining':
      return alphaCoalition(p0, base.N);
    default:
      return alphaNE(p0); // none, ubi, capitalTax leave the automation decision untouched
  }
}

const pct = (a: number) => Math.round(a * 100);

export function PolicyPanel({
  base,
  active,
  onSelect,
}: {
  base: Params;
  active: PolicyId;
  onSelect: (p: PolicyId) => void;
}) {
  const co = alphaCO({ ...base, tau: 0 });
  const free = alphaNE({ ...base, tau: 0 });
  const atOptimum = (a: number) => Math.abs(a - co) < 1e-4;

  const result = (id: PolicyId): React.ReactNode => {
    const a = policyAlpha(base, id);
    switch (id) {
      case 'none':
        return (
          <>
            No policy: the free market automates <strong>{pct(free)}%</strong>, overshooting the{' '}
            <strong>{pct(co)}%</strong> that maximizes combined profit.
          </>
        );
      case 'ubi':
        return (
          <>
            UBI lifts incomes and props spending back up — but the automation decision doesn&apos;t
            depend on the demand <em>level</em>, so automation stays at{' '}
            <strong>{pct(free)}%</strong> and the gap doesn&apos;t budge. (Watch consumer spending
            recover while the profit gap holds.)
          </>
        );
      case 'capitalTax':
        return (
          <>
            A profit tax scales every firm&apos;s profit by the same factor (1−t), which cancels out
            of the automation decision — so <strong>nothing moves</strong>.
          </>
        );
      case 'equity':
        return (
          <>
            Giving workers a profit share helps <em>partly</em> — automation falls to{' '}
            <strong>{pct(a)}%</strong> — but it only fully closes the gap at an unreachable share (ε
            = 1/λ).
          </>
        );
      case 'bargaining':
        return (
          <>
            If all firms coordinate, each internalizes the demand its layoffs destroy and pulls
            automation back to the optimal <strong>{pct(co)}%</strong> — the gap closes.
          </>
        );
    }
  };

  return (
    <section className={styles.group} aria-label="Policies in this model">
      <div className={styles.groupTitle}>Could another policy fix it?</div>
      <p className={styles.policyIntro}>
        Pick a policy to apply it to the model above and watch what happens to automation, jobs, and
        profit. The vertical mark on each bar is the efficient optimum — a real fix has to land
        there.
      </p>
      <div className={styles.policyGrid} role="group" aria-label="Choose a policy to apply">
        {POLICIES.map((p) => {
          const a = policyAlpha(base, p.id);
          const on = active === p.id;
          return (
            <button
              key={p.id}
              type="button"
              className={`${styles.policyCard} ${on ? styles.policyOn : ''}`}
              aria-pressed={on}
              onClick={() => onSelect(p.id)}
            >
              <span className={styles.policyName}>
                {p.name}
                <small>{p.sub}</small>
              </span>
              <span className={styles.bar}>
                <span
                  className={`${styles.barFill} ${atOptimum(a) ? styles.barFix : styles.barTrap}`}
                  style={{ width: `${Math.max(0, Math.min(1, a)) * 100}%` }}
                />
                <span className={styles.target} style={{ left: `${co * 100}%` }} title="optimum" />
              </span>
              <span className={styles.policyVal}>{pct(a)}%</span>
            </button>
          );
        })}
      </div>
      <p className={styles.policyResult}>{result(active)}</p>
      <p className={styles.caveat}>
        Why most of these fail: UBI and a profit tax shift <em>levels</em>, not the firm&apos;s
        marginal automation incentive, so they cancel from the decision. Worker equity closes the
        wedge only at ε = 1/λ (unreachable when λ &lt; 1). Only the grand coalition — or the
        automation tax in the panel above — reaches the optimum. Honest caveat: a policy that
        instead raised reabsorption (η) would shrink the externality through the same channel the
        tax uses.
      </p>
    </section>
  );
}
