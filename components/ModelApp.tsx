'use client';
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  computeStatic,
  effectiveParams,
  realizedAlpha,
  alphaNE,
  simulateToTarget,
  steadyMetrics,
  DYNAMIC_DEFAULTS,
} from '@/lib/engine';
import { useScenario } from '@/lib/useScenario';
import { ViewToggle } from './ViewToggle';
import { ControlsContent } from './ControlsContent';
import { MobileControls } from './MobileControls';
import { Footer } from './Footer';
import { Slider } from './Slider';
import { NarrativePanel } from './NarrativePanel';
import { SECTORS, DEFAULT_SECTOR, getSector } from '@/lib/sectors';
import styles from './ModelApp.module.css';

const DriverCharts = dynamic(() => import('./DriverCharts'), { ssr: false });
const FirstMoverChart = dynamic(() => import('./FirstMoverChart'), { ssr: false });
const OvershootHill = dynamic(() => import('./OvershootHill'), { ssr: false });

function gapState(gap: number): { label: string; cls: string } {
  if (gap > 1e-6) return { label: 'the trap', cls: styles.trap };
  if (gap < -1e-6) return { label: 'reversed', cls: styles.reversed };
  return { label: 'the trap vanishes here', cls: styles.fix };
}

export function ModelApp() {
  const { scenario, update } = useScenario();
  const [copied, setCopied] = useState(false);
  const [makeReal, setMakeReal] = useState(false);
  const [sectorId, setSectorId] = useState(DEFAULT_SECTOR.id);

  const eff = useMemo(() => effectiveParams(scenario), [scenario]);
  const stat = useMemo(() => computeStatic(eff), [eff]);

  // The automation the model settles at under the active policy regime (free / tax / equity /
  // bargaining). The level levers (A = UBI, t = capital tax) live in `eff` and shape demand/profit
  // but never this target — that invariance IS the model's thesis.
  const target = useMemo(() => realizedAlpha(scenario), [scenario]);
  // Structural free-market automation, for the big-picture marker (independent of policy/tax).
  const alphaNEfree = useMemo(() => alphaNE({ ...eff, tau: 0 }), [eff]);

  // Realized over-automation gap: closes to ~0 under the tax or full bargaining, negative when η > 100%.
  const gap = target - stat.alphaCO;
  const ws = gapState(gap);

  const path = useMemo(
    () =>
      simulateToTarget(eff, target, {
        adjustmentSpeed: scenario.adjustmentSpeed,
        reabsorptionRate: scenario.reabsorptionRate,
        periods: DYNAMIC_DEFAULTS.periods,
      }),
    [eff, target, scenario.adjustmentSpeed, scenario.reabsorptionRate],
  );
  const optimum = useMemo(() => steadyMetrics(eff, stat.alphaCO), [eff, stat.alphaCO]);
  const settled = path[path.length - 1];

  // Debounced screen-reader summary (announces the settled result once, not on every drag tick).
  const [liveMsg, setLiveMsg] = useState('');
  const summary =
    `Automation ${(target * 100).toFixed(0)}%, optimal level ` +
    `${(stat.alphaCO * 100).toFixed(0)}% (${ws.label}). ${scenario.view === 'hill' ? 'Big-picture profit view.' : 'Over-time view.'} ` +
    `It settles at ${settled.unemployment.toFixed(0)}% net jobs displaced, consumer spending ` +
    `${settled.demandIndex.toFixed(0)} vs 100 before automation, corporate profits ${settled.profitIndex.toFixed(0)} vs 100.`;
  useEffect(() => {
    const id = setTimeout(() => setLiveMsg(summary), 500);
    return () => clearTimeout(id);
  }, [summary]);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  // Reused in the chart column and (on mobile) pinned at the top of the controls drawer, so the
  // over-automation gap updates live as you drag a lever.
  const renderReadout = () => (
    <div className={styles.readout}>
      <div className={styles.metric}>
        <span className={styles.mLabel}>
          {scenario.regime === 'free' ? 'Market automation' : 'Automation'}
        </span>
        <span className={`${styles.val} tabular`}>{(target * 100).toFixed(0)}%</span>
      </div>
      <div className={styles.metric}>
        <span className={styles.mLabel}>Optimal level</span>
        <span className={`${styles.val} tabular`}>{(stat.alphaCO * 100).toFixed(0)}%</span>
      </div>
      <div className={`${styles.gap} ${ws.cls}`}>
        <span className={styles.gapLabel}>Over-automation</span>
        <span className={`${styles.gapVal} tabular`}>{(gap * 100).toFixed(0)} pts</span>
        <span className={styles.gapState}>{ws.label}</span>
      </div>
    </div>
  );

  return (
    <div className={styles.app}>
      <header className={styles.top}>
        <Link href="/" className={styles.brand}>
          The AI Trap
        </Link>
        <nav className={styles.nav}>
          <Link href="/method">Method</Link>
          <Link href="/limitations">Limitations</Link>
          <button className={styles.shareBtn} onClick={share}>
            {copied ? 'Link copied ✓' : 'Share ⤴'}
          </button>
        </nav>
      </header>

      <div>
        <p className={`${styles.attribution} reveal`} style={{ animationDelay: '40ms' }}>
          An interactive model of the research paper{' '}
          <a href="https://arxiv.org/abs/2603.20617" target="_blank" rel="noopener noreferrer">
            “The AI Layoff Trap” — Falk &amp; Tsoukalas, 2026 ↗
          </a>
        </p>
        <h1 className={`${styles.frame} reveal`} style={{ animationDelay: '120ms' }}>
          Firms automate past the point of maximum <em>profit</em>.
        </h1>
        <p className={`${styles.subline} reveal`} style={{ animationDelay: '200ms' }}>
          In this model, each layoff shrinks the demand <em>every</em> firm sells into — but each
          firm bears only a fraction of that loss. So competing firms over-automate, and where wages
          are sticky, the more competitors there are, the worse they overshoot. See how it plays
          out, then find the fix.
        </p>
      </div>

      <div className={`${styles.grid} reveal`} style={{ animationDelay: '300ms' }}>
        <main className={styles.stage}>
          {renderReadout()}

          <div className={styles.viewRow}>
            <ViewToggle view={scenario.view} onChange={(v) => update({ view: v })} />
            {scenario.view === 'timeseries' && (
              <div className={styles.realRow}>
                <button
                  type="button"
                  className={`${styles.realToggle} ${makeReal ? styles.realOn : ''}`}
                  aria-pressed={makeReal}
                  onClick={() => setMakeReal((v) => !v)}
                >
                  {makeReal ? '✓ Make it real' : 'Make it real'}
                </button>
                {makeReal && (
                  <select
                    className={styles.sectorSelect}
                    value={sectorId}
                    onChange={(e) => setSectorId(e.target.value)}
                    aria-label="Sector for the plain-terms story"
                  >
                    {SECTORS.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          {scenario.view === 'timeseries' ? (
            <>
              <DriverCharts
                data={path}
                optimum={optimum}
                sector={makeReal ? getSector(sectorId) : undefined}
              />
              {makeReal && (
                <NarrativePanel
                  sectorId={sectorId}
                  neePct={target * 100}
                  coPct={stat.alphaCO * 100}
                  taxOn={scenario.regime === 'tax' && scenario.tau > 1e-9}
                />
              )}
              <p className={styles.unitsNote}>
                These are shares within one stylized sector using the paper&apos;s illustrative
                numbers — <strong>not national statistics</strong> (real unemployment is around 5%
                at &ldquo;full employment&rdquo;). What matters is the <em>gap</em> between the
                lines, not the level. <Link href="/method">What the numbers mean →</Link>
              </p>
              {scenario.regime === 'tax' && scenario.tau > 1e-9 && (
                <p className={styles.unitsNote}>
                  With the automation tax on, &ldquo;corporate profits&rdquo; shows{' '}
                  <strong>combined</strong> profit — the tax is rebated to the economy. Firms{' '}
                  <em>remit</em> it, so their own take-home is lower; the recovery you see is the
                  economy&apos;s combined gain, which is the level the tax targets.
                </p>
              )}
              <p className={styles.caption}>
                The cascade over time: automation rises, workers are displaced, consumer spending
                dips, and profits overshoot — settling <em>below</em> the efficient optimum
                (dashed). Turn on the tax and watch the lines move back. Destination faithful, path
                illustrative.
              </p>

              <h3 className={styles.linkHeading}>The race — why no firm can stop</h3>
              <p className={styles.linkIntro}>
                The same interpolation, from <em>one</em> firm&apos;s point of view: its profit if
                it automates <em>first</em> vs. if it <em>holds out</em>, as the other firms pile
                in.
              </p>
              <FirstMoverChart data={path} optimum={optimum} />
              <p className={styles.caption}>
                Move first and your profit jumps — above even what everyone-cooperating would earn
                (dashed). That prize is why every firm races in. But each firm&apos;s layoffs drain
                the <em>shared</em> demand, so as they all pile in the top line sinks <em>below</em>{' '}
                the dashed line — they&apos;ve automated into <em>less</em>. And &ldquo;hold
                out&rdquo; always trails &ldquo;move first&rdquo; by the same fixed amount, no
                matter how many rivals have gone — so no firm can afford to stop. That&apos;s the
                trap.
              </p>
            </>
          ) : (
            <>
              <OvershootHill
                params={eff}
                markers={{
                  alphaNE: alphaNEfree,
                  alphaCO: stat.alphaCO,
                  alphaSP: stat.alphaSP,
                  showSP: scenario.mu > 1e-3,
                }}
              />
              <div className={styles.hillControls}>
                <Slider
                  id="param-mu"
                  label="Priority on workers' wellbeing"
                  symbol="µ"
                  value={scenario.mu}
                  min={0}
                  max={0.99}
                  step={0.01}
                  onChange={(v) => update({ mu: v })}
                  format={(v) => v.toFixed(2)}
                  citation="0 = judge only by total efficiency; higher = weight workers more, which lowers the ideal amount of automation."
                />
              </div>
              <p className={styles.caption}>
                The dark line is every firm&apos;s profit if they <em>all</em> automate the same
                amount — it peaks at the optimum. The blue line is <em>one</em> firm&apos;s profit
                if its rivals hold there: it keeps climbing past the optimum, so each firm is
                individually tempted to over-automate. When they all give in, they overshoot — and
                the dark line shows they end up with <em>less</em>. (A profit tax scales these
                curves toward the 100 line and UBI leaves them untouched — but neither moves where
                they peak, which is why neither changes automation.)
              </p>
            </>
          )}
        </main>

        <aside className={styles.controls}>
          <ControlsContent scenario={scenario} update={update} optimumTax={stat.tauStarExact} />
        </aside>
      </div>

      <MobileControls readout={renderReadout()}>
        <ControlsContent
          scenario={scenario}
          update={update}
          optimumTax={stat.tauStarExact}
          compact
        />
      </MobileControls>

      <Footer />

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveMsg}
      </div>
    </div>
  );
}

export default ModelApp;
