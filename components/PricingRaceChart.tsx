'use client';
import { useEffect, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import type { PricingRacePoint } from '@/lib/engine';
import styles from './PricingRaceChart.module.css';

const INK = '#34342f';
const TRAP = '#b4533a'; // the follower / pack (undercut)
const BASE = '#9a9a90';
const GRID = '#eeede8';
const AXIS = '#6e6e66';

/**
 * The share race over time (beyond the paper) — one first mover vs. the field, each firm's profit
 * indexed to before-automation = 100 (the dashed baseline). Everyone starts whole at 100; as the first
 * mover (ink) ramps automation it builds a windfall while customers migrate to it, then drifts down as
 * the field (red) catches up. Both settle BELOW 100 — the industry ends worse than if no one had
 * automated. Engine: simulatePricingRace in lib/engine/pricing.ts.
 */
export function PricingRaceChart({ data }: { data: PricingRacePoint[] }) {
  const el = useRef<HTMLDivElement | null>(null);
  const plot = useRef<uPlot | null>(null);
  const range = useRef<[number, number]>([0, 1]);

  const xs = data.map((d) => d.t);
  const H = typeof window !== 'undefined' && window.innerWidth <= 680 ? 200 : 240;
  const last = data[data.length - 1];
  const sig = `${data.length}:${data[0].leader.toFixed(2)}:${last.leader.toFixed(2)}:${last.follower.toFixed(2)}`;

  const rangeFor = (): [number, number] => {
    const all = data.flatMap((d) => [d.leader, d.follower]).concat(100);
    const lo = Math.min(...all);
    const hi = Math.max(...all);
    const span = hi - lo || 1;
    return [lo - span * 0.1, hi + span * 0.12];
  };

  useEffect(() => {
    if (!el.current) return;
    range.current = rangeFor();
    const lead = data.map((d) => d.leader);
    const foll = data.map((d) => d.follower);
    const baseline = new Array(xs.length).fill(100);
    const opts: uPlot.Options = {
      width: el.current.clientWidth,
      height: H,
      padding: [12, 10, 4, 6],
      legend: { show: false },
      cursor: { show: true, x: true, y: false, points: { show: false } },
      scales: { x: { time: false }, y: { range: () => range.current } },
      axes: [
        {
          stroke: AXIS,
          grid: { stroke: GRID, width: 1 },
          ticks: { show: false },
          font: '10px ui-monospace, monospace',
          space: 70,
        },
        {
          stroke: AXIS,
          grid: { stroke: GRID, width: 1 },
          ticks: { show: false },
          font: '10px ui-monospace, monospace',
          size: 34,
          space: 30,
        },
      ],
      series: [
        {},
        { stroke: INK, width: 2.5 },
        { stroke: TRAP, width: 2 },
        { stroke: BASE, width: 1.5, dash: [4, 4] },
      ],
    };
    plot.current = new uPlot(opts, [xs, lead, foll, baseline], el.current);
    const ro = new ResizeObserver(() => {
      if (el.current && plot.current)
        plot.current.setSize({ width: el.current.clientWidth, height: H });
    });
    ro.observe(el.current);
    return () => {
      ro.disconnect();
      plot.current?.destroy();
      plot.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!plot.current) return;
    range.current = rangeFor();
    plot.current.setData([
      xs,
      data.map((d) => d.leader),
      data.map((d) => d.follower),
      new Array(xs.length).fill(100),
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  return (
    <figure className={styles.wrap}>
      <figcaption className={styles.legend} aria-hidden="true">
        <span className={styles.lLeader}>first mover</span>
        <span className={styles.lField}>the field</span>
        <span className={styles.lBase}>never automate (100)</span>
        <span className={styles.axisHint}>time →</span>
      </figcaption>
      <div
        ref={el}
        className={styles.plot}
        role="img"
        aria-label={`Profit over time, indexed to 100 before automation. The first mover peaks near ${Math.round(
          Math.max(...data.map((d) => d.leader)),
        )} then drifts to ${Math.round(last.leader)}; the field settles near ${Math.round(
          last.follower,
        )}. Both end below the 100 baseline.`}
      />
    </figure>
  );
}

export default PricingRaceChart;
