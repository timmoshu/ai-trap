'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  DEFAULTS,
  alphaNE,
  alphaCO,
  jevonsJobs,
  jevonsThreshold,
  simulateJevons,
} from '@/lib/engine';
import { Slider } from './Slider';
import { WhatIfTabs } from './WhatIfTabs';
import { Footer } from './Footer';
import prose from './Prose.module.css';
import model from './ModelApp.module.css';
import styles from './WhatIf.module.css';

const JevonsCharts = dynamic(() => import('./JevonsCharts'), { ssr: false });
const JevonsTransition = dynamic(() => import('./JevonsTransition'), { ssr: false });

/**
 * The lever is a market size, but its *meaning* is the underlying price-sensitivity of demand
 * (the contested parameter). This names what kind of good a given market growth implies, so the
 * dial still reads as a belief about the world, not an arbitrary number.
 */
function describeMarket(eps: number): string {
  if (eps < 0.05)
    return "That's the paper's fixed-output world — cheaper prices don't grow demand.";
  if (eps < 0.7)
    return 'Only an inelastic staple (bread, power) grows this little when it gets cheaper.';
  if (eps < 1.3) return 'Demand about keeps pace with the price cut — a typical good.';
  if (eps < 2.5)
    return 'It takes an elastic good — demand that outgrows its price cut — to grow the market this far.';
  return 'Only a new, cheap-enough-to-go-mainstream technology (computing, lighting, streaming) grows it this far.';
}

/**
 * The Phase-C "what-if" — BEYOND THE PAPER. A mirror of the main dashboard (same readout + cascade),
 * but the cascade runs the Jevons / output-expansion overlay (lib/engine/jevons.ts, verified in
 * gate0-jevons-extension.md) instead of the paper's fixed-output rules, with one added lever: how
 * much cheaper goods grow the market. The over-automation readout is unchanged — it's the paper's.
 */
export function WhatIf() {
  const p = DEFAULTS;
  const aNE = alphaNE({ ...p, tau: 0 }); // market automation (the paper's trap, unchanged)
  const aCO = alphaCO(p); // profit-optimum (the paper's, unchanged)
  const gap = aNE - aCO;
  const pct = (x: number) => Math.round(x * 100);

  // The lever IS the market-size outcome (index, 100 = before automation) — same units as the
  // Output panel and the break-even — so the dial, the cascade and the verdict all speak one
  // number. Under the hood it's still the price-elasticity of demand: at this fixed automation
  // level the price drop is fixed, so a market size maps 1:1 to an elasticity, which we back out
  // for the cascade and which names what kind of good it implies. Default 175 == old eps = 1.
  const [market, setMarket] = useState(175);
  const priceRatio = (p.w - aNE * (p.w - p.c)) / p.w; // ~0.571 — fixed by the paper's automation
  const eps = market > 100 ? Math.log(market / 100) / Math.log(1 / priceRatio) : 0;

  const path = useMemo(() => simulateJevons(p, aNE, eps), [p, aNE, eps]);
  const jobs = jevonsJobs(p, aNE, eps);
  const thrMarket = jevonsThreshold(p, aNE);
  const thrOpt = jevonsThreshold(p, aCO);

  // The break-even is pure arithmetic of the automation level: jobs = (1-alpha) * market, so
  // full employment needs the market to grow to 1/(1-alpha). The lever only decides whether
  // cheaper prices carry it that far.
  const autoShare = pct(aNE); // 61 — share of work done by AI
  const humanShare = pct(1 - aNE); // 39 — share still done by people
  const breakevenOut = Math.round(100 / (1 - aNE)); // 258 — market size that rehires everyone
  const breakevenMult = (1 / (1 - aNE)).toFixed(1); // 2.6×
  const optMult = (1 / (1 - aCO)).toFixed(1); // 1.5× — far lower bar at the optimum
  const outputNow = Math.round(market); // the lever value == where cheaper prices carry the market
  const creates = outputNow >= breakevenOut;
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
          <Link href="/pricing-power">Pricing power?</Link>
        </nav>
      </header>

      <div className={styles.body}>
        <WhatIfTabs active="jevons" />

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
          id="whatif-market"
          label="How big does the market grow? (100 = today)"
          symbol=""
          value={market}
          min={100}
          max={500}
          step={5}
          onChange={setMarket}
          format={(v) => `${Math.round(v)}`}
          hint={`break-even ${breakevenOut}`}
          citation={`How much bigger the market gets as cheaper prices pull in demand. Past the ${breakevenOut} break-even, automation adds jobs; below it, jobs fall. (Set by how price-sensitive demand is.)`}
        />
        <p className={styles.translate}>{describeMarket(eps)}</p>

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

        <JevonsTransition p={p} target={aNE} eps={eps} />

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
