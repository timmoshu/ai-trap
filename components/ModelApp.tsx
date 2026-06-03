'use client';
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  computeStatic,
  effectiveParams,
  simulateToTarget,
  steadyMetrics,
  DYNAMIC_DEFAULTS,
} from '@/lib/engine';
import { useScenario } from '@/lib/useScenario';
import { ParameterPanel } from './ParameterPanel';
import { Toggle } from './Toggle';
import { TaxControl } from './TaxControl';
import { ViewToggle } from './ViewToggle';
import { PolicyPanel } from './PolicyPanel';
import { Footer } from './Footer';
import { Slider } from './Slider';
import { NarrativePanel } from './NarrativePanel';
import { SECTORS, DEFAULT_SECTOR, getSector } from '@/lib/sectors';
import styles from './ModelApp.module.css';
import panel from './Panel.module.css';

const DriverCharts = dynamic(() => import('./DriverCharts'), { ssr: false });
const OvershootHill = dynamic(() => import('./OvershootHill'), { ssr: false });

function gapState(gap: number): { label: string; cls: string } {
  if (gap > 1e-6) return { label: 'the trap', cls: styles.trap };
  if (gap < -1e-6) return { label: 'reversed — under-automation', cls: styles.reversed };
  return { label: 'the trap vanishes here', cls: styles.fix };
}

export function ModelApp() {
  const { scenario, update } = useScenario();
  const [copied, setCopied] = useState(false);
  const [makeReal, setMakeReal] = useState(false);
  const [sectorId, setSectorId] = useState(DEFAULT_SECTOR.id);

  const eff = useMemo(() => effectiveParams(scenario), [scenario]);
  const stat = useMemo(() => computeStatic(eff), [eff]);
  // Realized over-automation gap: closes to ~0 under the tax, negative when re-hiring > 100%.
  const gap = stat.alphaNE - stat.alphaCO;
  const ws = gapState(gap);

  const path = useMemo(
    () =>
      simulateToTarget(eff, stat.alphaNE, {
        adjustmentSpeed: scenario.adjustmentSpeed,
        reabsorptionRate: scenario.reabsorptionRate,
        periods: DYNAMIC_DEFAULTS.periods,
      }),
    [eff, stat.alphaNE, scenario.adjustmentSpeed, scenario.reabsorptionRate],
  );
  const optimum = useMemo(() => steadyMetrics(eff, stat.alphaCO), [eff, stat.alphaCO]);
  const settled = path[path.length - 1];

  // Debounced screen-reader summary (announces the settled result once, not on every drag tick).
  const [liveMsg, setLiveMsg] = useState('');
  const summary =
    `Free-market automation ${(stat.alphaNE * 100).toFixed(0)}%, efficient level ` +
    `${(stat.alphaCO * 100).toFixed(0)}% (${ws.label}). ${scenario.view === 'hill' ? 'Big-picture profit view.' : 'Over-time view.'} ` +
    `It settles at ${settled.unemployment.toFixed(0)}% unemployment, consumer spending ` +
    `${settled.demandIndex.toFixed(0)} vs 100, corporate profits ${settled.profitIndex.toFixed(0)}% of the best achievable.`;
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
          <div className={styles.readout}>
            <div className={styles.metric}>
              <span className={styles.mLabel}>Automation — free market</span>
              <span className={`${styles.val} tabular`}>{(stat.alphaNE * 100).toFixed(0)}%</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.mLabel}>Most profitable level</span>
              <span className={`${styles.val} tabular`}>{(stat.alphaCO * 100).toFixed(0)}%</span>
            </div>
            <div className={`${styles.metric} ${styles.wedge} ${ws.cls}`}>
              <span className={styles.mLabel}>Over-automation</span>
              <span className={`${styles.val} tabular`}>{(gap * 100).toFixed(0)} pts</span>
              <span className={styles.wedgeState}>{ws.label}</span>
            </div>
          </div>

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
                  neePct={stat.alphaNE * 100}
                  coPct={stat.alphaCO * 100}
                  taxOn={scenario.tau > 1e-9}
                />
              )}
              <p className={styles.unitsNote}>
                These are shares within one stylized sector using the paper&apos;s illustrative
                numbers — <strong>not national statistics</strong> (real unemployment is around 5%
                at &ldquo;full employment&rdquo;). What matters is the <em>gap</em> between the
                lines, not the level. <Link href="/method">What the numbers mean →</Link>
              </p>
              <p className={styles.caption}>
                The cascade over time: automation rises, workers are displaced, consumer spending
                dips, and profits overshoot — settling <em>below</em> the efficient optimum
                (dashed). Turn on the tax and watch the lines move back. Destination faithful, path
                illustrative.
              </p>
            </>
          ) : (
            <>
              <OvershootHill
                params={eff}
                markers={{
                  alphaNE: stat.alphaNE,
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
                Total profit peaks at the level that&apos;s best for the economy; the free market
                pushes past that peak and ends up with <em>less</em> profit. That overshoot is the
                trap.
              </p>
            </>
          )}
        </main>

        <aside className={styles.controls}>
          <ParameterPanel scenario={scenario} update={update} />

          <section className={panel.panel}>
            <h2 className={panel.title}>Levers &amp; off-switches</h2>
            <Toggle
              id="toggle-wage"
              label="Sticky wages (can't fall)"
              description={
                scenario.wageRigid
                  ? 'On: lost jobs mean lost spending, so the trap is live. Turn off to let wages adjust.'
                  : 'Off: wages adjust freely, so there is no demand shortfall — the trap disappears.'
              }
              checked={scenario.wageRigid}
              onChange={(v) => update({ wageRigid: v })}
            />
            <TaxControl
              tau={scenario.tau}
              optimumTax={stat.tauStarExact}
              onChange={(v) => update({ tau: v })}
            />
          </section>

          <details className={styles.advanced}>
            <summary>Advanced — speed of the transition (illustrative)</summary>
            <div className={styles.advancedBody}>
              <Slider
                id="dyn-speed"
                label="How fast firms automate"
                symbol="σ"
                value={scenario.adjustmentSpeed}
                min={0.02}
                max={1}
                step={0.01}
                onChange={(v) => update({ adjustmentSpeed: v })}
                format={(v) => v.toFixed(2)}
                illustrative
                citation="Pace of the change only — the end point (the paper's equilibrium) is unchanged."
              />
              <Slider
                id="dyn-reab"
                label="How fast laid-off workers are re-hired"
                symbol="ρ"
                value={scenario.reabsorptionRate}
                min={0.02}
                max={1}
                step={0.01}
                onChange={(v) => update({ reabsorptionRate: v })}
                format={(v) => v.toFixed(2)}
                illustrative
                citation="Pace of re-hiring only — slower re-hiring deepens the dip but the end point is unchanged."
              />
            </div>
          </details>
        </aside>
      </div>

      <section className={`${panel.panel} ${styles.fullRow}`}>
        <PolicyPanel base={{ ...eff, tau: 0 }} />
      </section>

      <Footer />

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveMsg}
      </div>
    </div>
  );
}

export default ModelApp;
