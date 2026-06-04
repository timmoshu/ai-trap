'use client';
import { useEffect, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import type { DynamicPoint } from '@/lib/engine';
import styles from './DriverCharts.module.css';

const INK = '#34342f';
const ACCENT = '#2e6e8e';
const OPT = '#2f6f4f';
const GRID = '#eeede8';
const AXIS = '#6e6e66';

/**
 * "The race to automate" — the first-mover story over the same interpolation. As rivals pile in
 * (their automation ramps along the x-axis), we show ONE firm's profit if it moved first (ink) vs.
 * if it held out (blue), against the flat "if everyone cooperated" reference (green dashed). Three
 * reads: moving first spikes profit (the prize everyone races for); the race then erodes it BELOW
 * the cooperative line (the tragedy); and "move" always beats "hold out" by the same fixed amount,
 * whatever rivals do (the dominant strategy that means no firm can stop).
 */
export function FirstMoverChart({
  data,
  optimum,
}: {
  data: DynamicPoint[];
  optimum: DynamicPoint;
}) {
  const el = useRef<HTMLDivElement | null>(null);
  const plot = useRef<uPlot | null>(null);

  const xs = data.map((d) => d.t);
  const mover = data.map((d) => d.profitMover);
  const hold = data.map((d) => d.profitHoldout);
  const coopVal = optimum.profitIndex;
  const coop = new Array(xs.length).fill(coopVal);
  const H = typeof window !== 'undefined' && window.innerWidth <= 680 ? 168 : 220;

  const rangeRef = useRef<[number, number]>([0, 1]);
  const computeRange = (): [number, number] => {
    const all = [...mover, ...hold, coopVal];
    const lo = Math.min(...all);
    const hi = Math.max(...all);
    const span = hi - lo || 1;
    return [lo - span * 0.1, hi + span * 0.16];
  };
  rangeRef.current = computeRange();

  const last = data[data.length - 1];
  const sig =
    data.length +
    ':' +
    last.profitMover.toFixed(2) +
    ':' +
    last.profitHoldout.toFixed(2) +
    ':' +
    coopVal.toFixed(2);

  useEffect(() => {
    if (!el.current) return;
    const opts: uPlot.Options = {
      width: el.current.clientWidth,
      height: H,
      padding: [12, 10, 2, 4],
      legend: { show: false },
      cursor: { show: true, x: true, y: false, points: { show: false } },
      scales: { x: { time: false }, y: { range: () => rangeRef.current } },
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
        { stroke: ACCENT, width: 2 },
        { stroke: OPT, width: 1.5, dash: [4, 4] },
      ],
    };
    plot.current = new uPlot(opts, [xs, mover.slice(), hold.slice(), coop.slice()], el.current);
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
    const u = plot.current;
    if (!u) return;
    u.setData([xs, mover, hold, new Array(xs.length).fill(coopVal)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  return (
    <figure className={styles.cell}>
      <figcaption className={styles.head}>
        <span className={styles.title}>The race to automate</span>
        <span className={styles.sub}>
          your profit if you move first vs. hold out, as rivals pile in
        </span>
        <span className={styles.legendRow} aria-hidden="true">
          <span className={styles.legendItem}>
            <i style={{ background: INK }} /> move first
          </span>
          <span className={styles.legendItem}>
            <i style={{ background: ACCENT }} /> hold out
          </span>
          <span className={styles.legendItem}>
            <i style={{ background: OPT }} /> if all cooperate
          </span>
        </span>
      </figcaption>
      <div
        ref={el}
        className={styles.plot}
        role="img"
        aria-label={`Profit over the automation race, indexed to 100 before automation. Moving first starts at ${Math.round(
          data[0].profitMover,
        )} and erodes to ${Math.round(last.profitMover)} as rivals pile in; holding out falls to ${Math.round(
          last.profitHoldout,
        )}; cooperating at the optimum would give ${Math.round(coopVal)}.`}
      />
    </figure>
  );
}

export default FirstMoverChart;
