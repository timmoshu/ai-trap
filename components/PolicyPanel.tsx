'use client';
import {
  alphaNE,
  alphaCO,
  alphaEquity,
  alphaCoalition,
  equityThreshold,
  type Params,
} from '@/lib/engine';
import styles from './Controls.module.css';

/**
 * "Policies in this model" (FR-1.8) — a neutral comparison of what each lever does to the
 * automation rate, exactly as the paper models them. The honesty caveat (Gate-0 note 3,
 * red-team A7) is stated alongside.
 */
export function PolicyPanel({ base }: { base: Params }) {
  const co = alphaCO(base);
  const free = alphaNE(base);
  const thr = equityThreshold(base);

  const rows: { name: string; sub: string; alpha: number }[] = [
    { name: 'Free market', sub: 'no policy', alpha: free },
    { name: 'UBI', sub: 'raise autonomous demand A', alpha: free },
    { name: 'Capital / profit tax', sub: 'scales profit by (1−t)', alpha: free },
    { name: 'Worker equity', sub: 'profit share ε = 1', alpha: alphaEquity(base, 1) },
    { name: 'Bargaining', sub: 'grand coalition M = N', alpha: alphaCoalition(base, base.N) },
    { name: 'Pigouvian tax', sub: 'per-task automation tax', alpha: co },
  ];

  const atOptimum = (a: number) => Math.abs(a - co) < 1e-4;

  return (
    <section className={styles.group} aria-label="Policies in this model">
      <div className={styles.groupTitle}>Could another policy fix it?</div>
      <p className={styles.policyIntro}>
        Each bar is the automation rate a policy produces in this model; the vertical mark is the
        efficient optimum. A real fix has to move the bar onto the mark — but most popular responses
        just shift money around without touching the automation decision, so the bar doesn&apos;t
        budge. Only the automation tax (and full sector-wide bargaining) reaches the optimum.
      </p>
      <div className={styles.policy}>
        {rows.map((r) => (
          <div className={styles.policyRow} key={r.name}>
            <div className={styles.policyName}>
              {r.name}
              <small>{r.sub}</small>
            </div>
            <div className={styles.bar}>
              <div
                className={`${styles.barFill} ${atOptimum(r.alpha) ? styles.barFix : styles.barTrap}`}
                style={{ width: `${Math.max(0, Math.min(1, r.alpha)) * 100}%` }}
              />
              <div
                className={styles.target}
                style={{ left: `${co * 100}%` }}
                title="efficient optimum α(CO)"
              />
            </div>
            <div className={styles.policyVal}>{r.alpha.toFixed(3)}</div>
          </div>
        ))}
      </div>
      <p className={styles.caveat}>
        The vertical mark is the efficient optimum α(CO). UBI and a capital/profit tax shift{' '}
        <em>levels</em>, not the firm&apos;s marginal automation incentive, so they cancel from the
        decision and leave α unchanged. Worker equity closes the wedge only at ε = 1/λ ={' '}
        {thr.toFixed(2)} — with λ &lt; 1 that needs ε &gt; 1, which is unreachable. Only the grand
        coalition or the tax reaches the optimum. Honest caveat: a policy that instead raised
        reabsorption (η) would shrink the externality — the same channel the tax uses.
      </p>
    </section>
  );
}
