'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  DEFAULTS,
  alphaNE,
  alphaCO,
  symmetricNash,
  profitIndex,
  profitBreakevenBeta,
  simulatePricingRace,
} from '@/lib/engine';
import { Slider } from './Slider';
import { WhatIfTabs } from './WhatIfTabs';
import { Footer } from './Footer';
import prose from './Prose.module.css';
import model from './ModelApp.module.css';
import styles from './WhatIf.module.css';
import pp from './PricingPower.module.css';

const PricingRaceChart = dynamic(() => import('./PricingRaceChart'), { ssr: false });

/** Names what kind of market a given switching ease implies, so the dial reads as a belief, not a number. */
function describeSwitching(beta: number): string {
  if (beta < 0.05)
    return "That's the paper's world — customers are locked in, so cutting costs wins you no extra sales.";
  if (beta < 0.8) return 'Customers barely switch — a sticky market (your bank, your insurer).';
  if (beta < 1.8)
    return 'Cut your price and customers move to you — a normally competitive market.';
  if (beta < 3)
    return 'Customers chase the cheapest provider hard — a price-driven commodity market.';
  return 'The cheapest firm takes almost everything — a winner-take-most market.';
}

/**
 * "What if firms could steal market share?" — BEYOND THE PAPER. Composes the paper's demand
 * externality with the technology-adoption timing game (Fudenberg & Tirole 1985). The paper gives
 * every firm a fixed 1/N slice at one price, so automating wins no extra sales and the race is flat.
 * Relax that — let an early automator undercut and capture share — and automating also steals
 * customers. The headline: past a little pricing power, the share race leaves the whole industry LESS
 * profitable than never automating. Engine + verification: lib/engine/pricing.ts,
 * _bmad-output/planning-artifacts/gate0-pricing-power-extension.md.
 */
export function PricingPower() {
  const p = DEFAULTS;
  const aNEpaper = alphaNE({ ...p, tau: 0 }); // the paper's trap (no share competition), unchanged
  const aCO = alphaCO(p); // the profit-optimum, unchanged by pricing power
  const pct = (x: number) => Math.round(x * 100);

  // The dial is "ease of switching" on a 0–100 feel; under the hood it is the logit share-response
  // beta (0 = locked-in = the paper). beta = ease / 20, so the 0–100 slider spans beta 0–5.
  const [ease, setEase] = useState(30);
  const beta = ease / 20;

  const aStar = useMemo(() => symmetricNash(p, beta), [p, beta]);
  const race = useMemo(() => simulatePricingRace(p, beta), [p, beta]);
  const idx = profitIndex(p, aStar);
  const paperIdx = profitIndex(p, aNEpaper); // ~103 — the paper still nets a gain
  const optIdx = profitIndex(p, aCO); // ~106 — the social optimum
  const breakevenBeta = profitBreakevenBeta(p);
  const breakevenEase = breakevenBeta != null ? Math.round(breakevenBeta * 20) : null;

  const pays = idx >= 100;

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
          <Link href="/what-if">What if?</Link>
        </nav>
      </header>

      <div className={styles.body}>
        <WhatIfTabs active="pricing" />

        <div className={styles.banner}>
          <strong>Beyond the paper.</strong> The paper gives every firm a fixed slice of the market
          at one price, so automating to cut costs wins no extra sales — the race is flat. Here we
          relax that and let an early automator <em>undercut and steal customers</em>, the way the
          standard technology-adoption game does (Fudenberg &amp; Tirole, 1985). It is an{' '}
          <em>illustrative extension, not the authors&apos; result</em>.
        </div>

        <h1 className={styles.h1}>What if firms could steal market share?</h1>
        <p className={styles.lede}>
          In the paper, automating only cuts your costs. Let it also <em>win you customers</em> and
          a new motive appears: move first, undercut, take the market. Every firm feels it — so they
          all automate harder. Drag the dial and watch where the chase for share leaves everyone.
        </p>

        <div className={model.readout}>
          <div className={model.metric}>
            <span className={model.mLabel}>Automation now</span>
            <span className={`${model.val} tabular`}>{pct(aStar)}%</span>
          </div>
          <div className={model.metric}>
            <span className={model.mLabel}>Paper&apos;s trap</span>
            <span className={`${model.val} tabular`}>{pct(aNEpaper)}%</span>
          </div>
          <div className={`${model.gap} ${pays ? '' : model.trap}`}>
            <span className={model.gapLabel}>Industry profit</span>
            <span className={`${model.gapVal} tabular`}>{Math.round(idx)}</span>
            <span className={model.gapState}>{pays ? 'still pays' : 'lose-lose'}</span>
          </div>
        </div>

        <Slider
          id="pp-switch"
          label="How easily do customers switch to the cheaper firm?"
          symbol=""
          value={ease}
          min={0}
          max={100}
          step={2}
          onChange={setEase}
          format={(v) => (v <= 1 ? 'locked in' : `${Math.round(v)}`)}
          hint={breakevenEase != null ? `AI stops paying past ${breakevenEase}` : ''}
          citation="How readily customers move to whoever automates first and undercuts. 0 = locked in (the paper's world); higher = the cheapest firm takes more of the market. Illustrative — there is no empirical value for this dial."
        />
        <p className={styles.translate}>{describeSwitching(beta)}</p>

        <div className={`${styles.verdict} ${pays ? styles.creates : styles.destroys}`}>
          <span className={styles.verdictLead}>
            Each firm races to automate first and grab its rivals&apos; customers. But every firm
            can do it — so in the end no one is bigger, everyone has automated more, and the share
            they chased cancels out. What&apos;s left is the bill.
          </span>
          <span className={styles.verdictBig}>
            {Math.round(idx)}{' '}
            <span className={styles.verdictUnit}>profit for every 100 before AI</span>
          </span>
          <span className={styles.verdictTag}>
            {pays
              ? `Even with the share race, the industry still nets a gain (the paper alone gives ${Math.round(paperIdx)}).`
              : `Below the 100 it started at — the race for share leaves the whole industry LESS profitable than if AI had never arrived.`}
          </span>
        </div>

        <PricingRaceChart data={race.path} />

        <div className={pp.stats}>
          <div className={pp.stat}>
            <span className={pp.statVal}>{Math.round(race.peakLeader)}</span>
            <span className={pp.statLabel}>the first mover&apos;s peak, while it&apos;s alone</span>
          </div>
          <div className={pp.stat}>
            <span className={`${pp.statVal} ${pp.dim}`}>{Math.round(race.settle)}</span>
            <span className={pp.statLabel}>where everyone settles, once rivals catch up</span>
          </div>
          <div className={pp.stat}>
            <span className={`${pp.statVal} ${pp.bad}`}>{Math.round(race.laggard)}</span>
            <span className={pp.statLabel}>the holdout that never automates</span>
          </div>
        </div>
        <p className={styles.insight}>
          <strong>The lose-lose falls unevenly.</strong> The firm that moves first banks a real
          windfall while it&apos;s the only one automated — then rivals catch up and the whole
          industry drifts below where it started. The firm that <em>waits</em> is punished hardest:
          undercut on price and starved of customers. That fear of being the holdout is exactly what
          makes everyone race — and why they all end up worse.
        </p>

        <div className={styles.section}>
          <h2 className={styles.h2}>Why not just wait and fast-follow?</h2>
          <p className={styles.insight}>
            Because at these defaults AI is far cheaper than a worker, the savings you give up by
            waiting dwarf any discount from transforming later — so adopting now always wins, and it
            is a pure race. Fast-following only becomes the smart move when <em>all</em> of these
            are true: AI is barely cheaper than labor (so the per-period savings are small), the
            transformation is a big lumpy investment whose cost is falling fast, and customers
            don&apos;t switch much (so ceding the lead is cheap). The more dramatic AI&apos;s cost
            advantage, the less anyone can afford to wait. (This is the preemption logic of
            Fudenberg &amp; Tirole, 1985; the waiting game is Hoppe, 2000.)
          </p>
        </div>

        <p className={styles.caveat}>
          This bolts a standard technology-adoption timing game (Fudenberg &amp; Tirole, 1985) onto
          the paper&apos;s demand externality — neither author did this composition, and the
          switching dial has no empirical value. The social optimum ({pct(aCO)}%, profit{' '}
          {Math.round(optIdx)}) doesn&apos;t move; only the private race inflates. See the{' '}
          <Link href="/method">math</Link> and <Link href="/limitations">limitations</Link>.
        </p>
      </div>

      <Footer />
    </div>
  );
}

export default PricingPower;
