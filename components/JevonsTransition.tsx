'use client';
import { useEffect, useRef, useState } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import {
  simulateJevonsTrough,
  troughFloor,
  troughCeiling,
  type Params,
  type JevonsTroughPoint,
} from '@/lib/engine';
import { Slider } from './Slider';
import ts from './TimeSeriesChart.module.css';
import styles from './WhatIf.module.css';

const INK = '#34342f';
const OPT = '#2f6f4f';
const TRAP = '#bd4b3b';
const GRID = '#eeede8';
const AXIS = '#6e6e66';
const PERIODS = 90;

/** Qualitative read of an adjustment speed, for the slider value. */
function speedWord(v: number): string {
  if (v < 0.12) return 'slow';
  if (v < 0.28) return 'moderate';
  if (v < 0.45) return 'fast';
  return 'very fast';
}

/** The intuitive payoff: how the speed race shapes the trough. */
function raceDescribe(ratio: number): string {
  if (ratio < 1.2) return 'The market keeps pace with automation — barely a dip.';
  if (ratio < 2) return 'Automation runs a little ahead — a shallow, short trough.';
  if (ratio < 3.5)
    return 'Automation outruns the market — a real trough opens up before the recovery.';
  return 'Automation far outruns the market — jobs crater toward the paper’s number before the rescue arrives.';
}

/** The trough chart: jobs over time, between the paper's floor and the Jevons long-run ceiling. */
function TroughChart({
  data,
  floor,
  ceiling,
}: {
  data: JevonsTroughPoint[];
  floor: number;
  ceiling: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<uPlot | null>(null);

  const xs = data.map((d) => d.t);
  const jobs = data.map((d) => d.jobs);
  const floorLine = new Array(xs.length).fill(floor);
  const ceilLine = new Array(xs.length).fill(ceiling);

  useEffect(() => {
    if (!wrapRef.current) return;
    const opts: uPlot.Options = {
      width: wrapRef.current.clientWidth,
      height: 280,
      padding: [14, 10, 4, 8],
      legend: { show: false },
      cursor: { show: true, x: true, y: false, points: { show: false } },
      scales: { x: { time: false } },
      axes: [
        {
          stroke: AXIS,
          grid: { stroke: GRID, width: 1 },
          ticks: { show: false },
          font: '11px ui-monospace, monospace',
          label: 'time →',
          labelSize: 22,
          labelGap: 2,
        },
        {
          stroke: AXIS,
          grid: { stroke: GRID, width: 1 },
          ticks: { stroke: GRID, width: 1 },
          font: '11px ui-monospace, monospace',
          size: 46,
          label: 'jobs (100 = before)',
          labelSize: 24,
        },
      ],
      series: [
        {},
        { stroke: INK, width: 2.5 },
        { stroke: TRAP, width: 1.25, dash: [4, 3] },
        { stroke: OPT, width: 1.5, dash: [5, 3] },
      ],
    };
    const u = new uPlot(
      opts,
      [xs, jobs.slice(), floorLine.slice(), ceilLine.slice()],
      wrapRef.current,
    );
    plotRef.current = u;
    const ro = new ResizeObserver(() => {
      if (wrapRef.current) u.setSize({ width: wrapRef.current.clientWidth, height: 280 });
    });
    ro.observe(wrapRef.current);
    return () => {
      ro.disconnect();
      u.destroy();
      plotRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const u = plotRef.current;
    if (!u) return;
    u.setData([xs, jobs, new Array(xs.length).fill(floor), new Array(xs.length).fill(ceiling)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, floor, ceiling]);

  return (
    <div className={ts.wrap}>
      <div
        ref={wrapRef}
        className={ts.plot}
        role="img"
        aria-label={`Jobs over time. Starts at 100, dips to a trough, recovers toward the long-run ${Math.round(ceiling)}. The paper's displacement floor is ${Math.round(floor)}.`}
      />
      <div className={ts.legend} aria-hidden="true">
        <span className={ts.key}>
          <i style={{ borderTopColor: INK }} /> jobs
        </span>
        <span className={ts.key}>
          <i style={{ borderTopColor: TRAP, borderTopStyle: 'dashed' }} /> paper’s floor
        </span>
        <span className={ts.key}>
          <i style={{ borderTopColor: OPT, borderTopStyle: 'dashed' }} /> Jevons long-run
        </span>
      </div>
    </div>
  );
}

/**
 * The "pace" what-if (Phase C, BEYOND THE PAPER). The long-run rescue isn't instant: automation cuts
 * jobs now, the bigger market arrives slowly. Two speed levers race; jobs dip into a trough between
 * the paper's displacement floor and the Jevons long-run, then recover. No scarring — the destination
 * is pace-proof; only the journey depends on speed. Engine: simulateJevonsTrough (lib/engine/jevons).
 */
export function JevonsTransition({ p, target, eps }: { p: Params; target: number; eps: number }) {
  const [autoSpeed, setAutoSpeed] = useState(0.35);
  const [demandSpeed, setDemandSpeed] = useState(0.1);

  const path = simulateJevonsTrough(p, target, eps, {
    automationSpeed: autoSpeed,
    demandGrowthSpeed: demandSpeed,
    periods: PERIODS,
  });
  const floor = troughFloor(target);
  const ceiling = troughCeiling(p, target, eps);
  const troughMin = Math.round(Math.min(...path.map((d) => d.jobs)));
  const ratio = autoSpeed / demandSpeed;

  return (
    <section className={styles.section}>
      <h2 className={styles.h2}>But how fast? The transition</h2>
      <p className={styles.lede}>
        The long-run rescue above isn’t instant. Automation cuts jobs <em>now</em>; the bigger
        market only arrives as prices fall and new uses catch on. If automation outruns the market,
        jobs crater first — toward the paper’s displacement number — and only climb back as the
        market grows into its cheaper price.
      </p>

      <div className={styles.speedRow}>
        <Slider
          id="trough-auto"
          label="Speed of automation"
          symbol=""
          value={autoSpeed}
          min={0.1}
          max={0.6}
          step={0.05}
          onChange={setAutoSpeed}
          format={speedWord}
        />
        <Slider
          id="trough-demand"
          label="Speed the market grows back"
          symbol=""
          value={demandSpeed}
          min={0.05}
          max={0.6}
          step={0.05}
          onChange={setDemandSpeed}
          format={speedWord}
        />
      </div>
      <p className={styles.translate}>{raceDescribe(ratio)}</p>

      <div className={styles.troughStat}>
        <span>
          Jobs fall to <strong>{troughMin}</strong>
        </span>
        <span className={styles.troughSep}>→</span>
        <span>
          recover to <strong>{Math.round(ceiling)}</strong>
        </span>
        <span className={styles.troughSep}>·</span>
        <span className={styles.troughFloor}>paper’s floor {Math.round(floor)}</span>
      </div>

      <TroughChart data={path} floor={floor} ceiling={ceiling} />

      <p className={styles.insight}>
        <strong>The paper and the Jevons rescue are the two ends of this one curve.</strong> The
        floor it dives toward is the paper’s pure-displacement number ({Math.round(floor)}); the
        level it climbs to is the Jevons long-run ({Math.round(ceiling)}). Pace decides how deep the
        trough goes and how long you spend near the bottom — the destination is the same either way.
        Rip the band-aid off fast and the very markets that end up <em>creating</em> jobs still
        crater first.
      </p>
    </section>
  );
}

export default JevonsTransition;
