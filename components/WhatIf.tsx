'use client';
import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { DEFAULTS, alphaNE, alphaCO, jevonsJobs, jevonsThreshold } from '@/lib/engine';
import { Slider } from './Slider';
import { Footer } from './Footer';
import prose from './Prose.module.css';
import styles from './WhatIf.module.css';

const WhatIfChart = dynamic(() => import('./WhatIfChart'), { ssr: false });

/**
 * The Phase-C "what-if" — BEYOND THE PAPER. Relaxes the fixed-output assumption with the Jevons /
 * output-expansion overlay (lib/engine/jevons.ts, verified in gate0-jevons-extension.md). Walled off
 * on its own /what-if route, with an explicit "illustrative extension, not the authors' result" banner.
 */
export function WhatIf() {
  const [eps, setEps] = useState(1);
  const p = DEFAULTS;
  const aNE = alphaNE({ ...p, tau: 0 });
  const aCO = alphaCO(p);
  const jobs = jevonsJobs(p, aNE, eps);
  const thrMarket = jevonsThreshold(p, aNE);
  const thrOpt = jevonsThreshold(p, aCO);
  const creates = jobs >= 100;
  const pct = (x: number) => Math.round(x * 100);

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
          <strong>Beyond the paper.</strong> This page relaxes the paper&apos;s central assumption —
          that output can&apos;t grow — to explore the Jevons / Jones counter-argument. It is an{' '}
          <em>illustrative extension, not the authors&apos; result</em>: the paper deliberately
          holds output fixed and is silent on this channel.
        </div>

        <h1 className={styles.h1}>What if cheaper goods grow the market?</h1>
        <p className={styles.lede}>
          In the paper, output is fixed, so every automated job is a lost job. But if automation
          makes goods <em>cheaper</em>, demand can expand — and if it expands faster than the
          per-unit labor saving, automation ends up needing <em>more</em> workers, not fewer.
          Whether that happens turns on one number: how much cheaper goods grow the market.
        </p>

        <Slider
          id="whatif-eps"
          label="How much do cheaper goods grow the market?"
          symbol="ε"
          value={eps}
          min={0}
          max={4}
          step={0.05}
          onChange={setEps}
          format={(v) => v.toFixed(2)}
          citation="Price-elasticity of demand. Above ~1 = elastic (new cheap tech like computing or lighting, where lower prices unlock big new demand). Below 1 = inelastic (staples). ε = 0 is the paper's fixed-output world."
        />

        <div className={`${styles.verdict} ${creates ? styles.creates : styles.destroys}`}>
          <span className={styles.verdictLead}>
            At the market&apos;s {pct(aNE)}% automation, with ε = {eps.toFixed(2)}
          </span>
          <span className={styles.verdictBig}>
            {Math.round(jobs)}{' '}
            <span className={styles.verdictUnit}>jobs vs. 100 before automation</span>
          </span>
          <span className={styles.verdictTag}>
            {creates
              ? `automation CREATES net jobs here — past the ε > ${thrMarket.toFixed(2)} break-even`
              : `automation destroys net jobs here — break-even needs ε > ${thrMarket.toFixed(2)}`}
          </span>
        </div>

        <WhatIfChart p={p} eps={eps} aNE={aNE} aCO={aCO} />

        <p className={styles.insight}>
          <strong>The trap raises the bar.</strong> At the profit-optimal {pct(aCO)}% you&apos;d
          only need ε &gt; {thrOpt.toFixed(2)} to keep jobs whole; the market&apos;s overshoot to{' '}
          {pct(aNE)}% pushes the requirement to ε &gt; {thrMarket.toFixed(2)}. So over-automation
          doesn&apos;t just cost profit — it makes the Jevons rescue harder. (And cheaper AI cuts
          both ways: it deepens the displacement <em>and</em> lowers the elasticity bar.)
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
