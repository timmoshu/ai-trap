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

/** HOW FAR — names how much price sways customers (the eventual share a cost edge wins). Magnitude, not speed. */
function describeReach(beta: number): string {
  if (beta < 0.05)
    return "The paper's world — price doesn't sway customers at all, so cutting costs wins no extra sales.";
  if (beta < 0.8)
    return 'Price barely sways customers — most stay put even when a rival is cheaper.';
  if (beta < 1.8)
    return 'A cheaper price pulls a meaningful slice of the market your way — a normally competitive market.';
  if (beta < 3)
    return 'Customers strongly favor the cheapest firm — a price-driven commodity market.';
  return 'The cheapest firm ends up with almost the whole market — winner-take-most.';
}

/** HOW FAST — names how quickly customers migrate (the pace of the race). Speed, not magnitude. */
function describePace(switchSpeed: number): string {
  if (switchSpeed < 0.06)
    return 'Customers are slow to move — habits, contracts, inertia. The first mover barely cashes in before rivals catch up.';
  if (switchSpeed < 0.2) return 'Customers drift over gradually — a slow migration.';
  if (switchSpeed < 0.45) return 'Customers switch fairly quickly once a rival is cheaper.';
  return 'Customers jump to the cheapest firm almost at once.';
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

  // Two SEPARATE customer dials, both on a 0–100 feel:
  //  - reach (HOW FAR): the logit share-response beta = reach / 20 (0 = locked-in = the paper). Sets the
  //    equilibrium automation, the profit readout, and the windfall's HEIGHT.
  //  - pace (HOW FAST): customer-migration speed switchSpeed = pace / 100. Sets only how fast the race
  //    plays out — the windfall's shape — never the equilibrium.
  const [reach, setReach] = useState(30);
  const [pace, setPace] = useState(15);
  const beta = reach / 20;
  const switchSpeed = pace / 100;

  const aStar = useMemo(() => symmetricNash(p, beta), [p, beta]);
  const race = useMemo(() => simulatePricingRace(p, beta, switchSpeed), [p, beta, switchSpeed]);
  const idx = profitIndex(p, aStar);
  const paperIdx = profitIndex(p, aNEpaper); // ~103 — the paper still nets a gain
  const optIdx = profitIndex(p, aCO); // ~106 — the social optimum
  const breakevenBeta = profitBreakevenBeta(p);
  const breakevenReach = breakevenBeta != null ? Math.round(breakevenBeta * 20) : null;

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

        <p className={pp.dialsIntro}>
          Two <em>different</em> things drive the race — keep them apart: <strong>how far</strong>{' '}
          customers will move (the size of the prize) and <strong>how fast</strong> they move (the
          pace). Only the pace reshapes the race below; the final tally is set by how far.
        </p>
        <div className={pp.dials}>
          <Slider
            id="pp-reach"
            label="① How far do customers move to the cheapest firm?"
            symbol=""
            value={reach}
            min={0}
            max={100}
            step={2}
            onChange={setReach}
            format={(v) => (v <= 1 ? 'not at all' : `${Math.round(v)}`)}
            hint={breakevenReach != null ? `AI stops paying past ${breakevenReach}` : ''}
            citation="How much price sways customers — the share a cost edge eventually wins. 0 = price doesn't move them (the paper's world); higher = the cheapest firm takes more of the market. This is the pricing-power magnitude; it sets the equilibrium. Illustrative — no empirical value."
          />
          <p className={styles.translate}>{describeReach(beta)}</p>

          <Slider
            id="pp-pace"
            label="② How fast do customers switch?"
            symbol=""
            value={pace}
            min={2}
            max={100}
            step={2}
            onChange={setPace}
            format={(v) => `${Math.round(v)}`}
            hint="shapes the race, not the tally"
            citation="How quickly customers migrate to whoever undercuts. Slow = sticky habits and contracts; fast = they jump almost at once. This changes how the race plays out over time — the windfall's size and timing — but never the final equilibrium."
          />
          <p className={styles.translate}>{describePace(switchSpeed)}</p>
        </div>

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
