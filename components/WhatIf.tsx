'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  DEFAULTS,
  alphaNE,
  alphaCO,
  jevonsJobs,
  jevonsOutput,
  jevonsThreshold,
  simulateJevons,
} from '@/lib/engine';
import { Slider } from './Slider';
import { Footer } from './Footer';
import prose from './Prose.module.css';
import model from './ModelApp.module.css';
import styles from './WhatIf.module.css';

const JevonsCharts = dynamic(() => import('./JevonsCharts'), { ssr: false });

/** Plain-language reading of the price-elasticity (eps): "demand grows +10*eps% per 10% price cut". */
function describeElasticity(eps: number): string {
  const g = Math.round(eps * 10);
  if (eps < 0.05) return "Demand doesn't move — the paper's fixed-output world.";
  if (eps < 0.7) return `Demand barely grows (+${g}%) — an inelastic staple, like bread or power.`;
  if (eps < 1.3) return `Demand roughly keeps pace (+${g}%) — total spending holds about steady.`;
  if (eps < 2.5) return `Demand outgrows the price cut (+${g}%) — an elastic good.`;
  return `Demand explodes (+${g}%) — like a new cheap technology (computing, lighting, streaming).`;
}

/**
 * The Phase-C "what-if" — BEYOND THE PAPER. A mirror of the main dashboard (same readout + cascade),
 * but the cascade runs the Jevons / output-expansion overlay (lib/engine/jevons.ts, verified in
 * gate0-jevons-extension.md) instead of the paper's fixed-output rules, with one added lever: how
 * much cheaper goods grow the market. The over-automation readout is unchanged — it's the paper's.
 */
export function WhatIf() {
  const [eps, setEps] = useState(1);
  const p = DEFAULTS;
  const aNE = alphaNE({ ...p, tau: 0 }); // market automation (the paper's trap, unchanged)
  const aCO = alphaCO(p); // profit-optimum (the paper's, unchanged)
  const gap = aNE - aCO;

  const path = useMemo(() => simulateJevons(p, aNE, eps), [p, aNE, eps]);
  const jobs = jevonsJobs(p, aNE, eps);
  const thrMarket = jevonsThreshold(p, aNE);
  const thrOpt = jevonsThreshold(p, aCO);
  const creates = jobs >= 100;
  const pct = (x: number) => Math.round(x * 100);

  // The break-even is pure arithmetic of the automation level: jobs = (1-alpha) * market, so
  // full employment needs the market to grow to 1/(1-alpha). Elasticity only decides whether
  // cheaper prices actually carry it that far (= the live output index).
  const autoShare = pct(aNE); // 61 — share of work done by AI
  const humanShare = pct(1 - aNE); // 39 — share still done by people
  const breakevenOut = Math.round(100 / (1 - aNE)); // 258 — market size that rehires everyone
  const breakevenMult = (1 / (1 - aNE)).toFixed(1); // 2.6×
  const optMult = (1 / (1 - aCO)).toFixed(1); // 1.5× — far lower bar at the optimum
  const outputNow = Math.round(jevonsOutput(p, aNE, eps)); // where cheaper prices carry the market
  const jobsGap = Math.abs(Math.round(jobs) - 100);

  return (
    <div className={prose.page}>
      <header className={prose.top}>
        <Link href="/" className={prose.brand}>
          The AI Trap
        </Link>
        <nav className={prose.nav}>
          <Link href="/">Model</Link>
          <Link href="/method">Method</Link>
          <Link href="/limitations">Limitations</Link>
        </nav>
      </header>

      <div className={styles.body}>
        <div className={styles.banner}>
          <strong>Beyond the paper.</strong> This is the same dashboard, with one assumption
          relaxed: output can now grow. The over-automation on the left is still the paper&apos;s
          result — but the cascade below runs the Jevons / Jones counter-argument. It is an{' '}
          <em>illustrative extension, not the authors&apos; result</em>.
        </div>

        <h1 className={styles.h1}>What if cheaper goods grow the market?</h1>
        <p className={styles.lede}>
          In the paper, output is fixed, so every automated job is a lost job. But if automation
          makes goods <em>cheaper</em>, demand can expand — and if it expands faster than the
          per-unit labor saving, automation ends up needing <em>more</em> workers, not fewer. Drag
          the one lever and watch the same cascade flip.
        </p>

        <div className={model.readout}>
          <div className={model.metric}>
            <span className={model.mLabel}>Market automation</span>
            <span className={`${model.val} tabular`}>{pct(aNE)}%</span>
          </div>
          <div className={model.metric}>
            <span className={model.mLabel}>Optimal level</span>
            <span className={`${model.val} tabular`}>{pct(aCO)}%</span>
          </div>
          <div className={`${model.gap} ${model.trap}`}>
            <span className={model.gapLabel}>Over-automation</span>
            <span className={`${model.gapVal} tabular`}>{pct(gap)} pts</span>
            <span className={model.gapState}>the trap</span>
          </div>
        </div>

        <Slider
          id="whatif-eps"
          label="Demand growth when AI cuts the price 10%"
          symbol=""
          value={eps}
          min={0}
          max={4}
          step={0.1}
          onChange={setEps}
          format={(v) => `+${Math.round(v * 10)}%`}
          citation="How much the market grows for every 10% automation knocks off the price. (Economists call this the price-elasticity of demand.)"
        />
        <p className={styles.translate}>{describeElasticity(eps)}</p>

        <div className={`${styles.verdict} ${creates ? styles.creates : styles.destroys}`}>
          <span className={styles.verdictLead}>
            AI does {autoShare}% of the work, so the same goods need only {humanShare}% of the
            workers. To rehire everyone, the market has to grow to {breakevenOut} (about{' '}
            {breakevenMult}× today&apos;s).
          </span>
          <span className={styles.verdictBig}>
            {Math.round(jobs)}{' '}
            <span className={styles.verdictUnit}>jobs for every 100 before automation</span>
          </span>
          <span className={styles.verdictTag}>
            {creates
              ? `Cheaper prices grow the market to ${outputNow} — past the ${breakevenOut} finish line — so automation adds ${jobsGap} jobs per 100.`
              : `Cheaper prices grow the market to only ${outputNow}, short of ${breakevenOut} — so ${jobsGap} of every 100 jobs are gone.`}
          </span>
        </div>

        <JevonsCharts data={path} optAutomation={pct(aCO)} />

        <p className={styles.insight}>
          <strong>The trap raises the finish line.</strong> More automation moves the market size
          you&apos;d need to rehire everyone. At the profit-optimal {pct(aCO)}%, the market need
          only grow <strong>{optMult}×</strong>; the market&apos;s overshoot to {pct(aNE)}% pushes
          it to <strong>{breakevenMult}×</strong> ({breakevenOut}). So over-automation doesn&apos;t
          just cost profit — it makes the Jevons rescue harder, because cheaper prices now have a
          taller mountain to climb. (In elasticity terms, the bar rises from +
          {Math.round(thrOpt * 10)}% to +{Math.round(thrMarket * 10)}% demand per 10% price cut.)
        </p>
        <p className={styles.caveat}>
          The optimistic &ldquo;productivity reallocates everyone&rdquo; story lives in the
          Acemoglu-Restrepo / Jones literature, which this paper omits — and whose <em>own</em>{' '}
          productivity parameter does the opposite (a Red Queen race that widens the trap). See the{' '}
          <Link href="/method">math</Link> and <Link href="/limitations">limitations</Link>.
        </p>
      </div>

      <Footer />
    </div>
  );
}

export default WhatIf;
