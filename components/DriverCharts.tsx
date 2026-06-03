'use client';
import { useEffect, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import type { DynamicPoint } from '@/lib/engine';
import styles from './DriverCharts.module.css';

const INK = '#34342f';
const OPT = '#2f6f4f';
const GRID = '#eeede8';
const AXIS = '#6e6e66';
const PLAY_MS = 2600;

type MetricKey = 'unemployment' | 'demandIndex' | 'profitIndex' | 'automation';
interface Metric {
  key: MetricKey;
  title: string;
  sub: string;
  unit: string;
}
// Ordered as the causal cascade: automation (cause) -> displacement -> spending -> profits (effect).
const METRICS: Metric[] = [
  {
    key: 'automation',
    title: 'Automation',
    sub: "share of this sector's jobs done by AI",
    unit: '%',
  },
  {
    key: 'unemployment',
    title: 'Workers displaced',
    sub: "share of this sector's jobs lost, after re-hiring",
    unit: '%',
  },
  { key: 'demandIndex', title: 'Consumer spending', sub: 'vs. before automation (100)', unit: '' },
  {
    key: 'profitIndex',
    title: 'Corporate profits',
    sub: '% of the most they could earn',
    unit: '',
  },
];

const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function rangeFor(cur: number[], refVal: number, key: MetricKey): [number, number] {
  const all = [...cur, refVal];
  let lo = Math.min(...all);
  let hi = Math.max(...all);
  if (key === 'automation' || key === 'unemployment') lo = 0;
  const span = hi - lo || 1;
  return [lo - span * 0.08, hi + span * 0.14];
}

/**
 * The cascade, decomposed. Four small charts share a time axis and a playhead that replays the
 * trajectory so the feedback is visible. Each shows the current path (solid ink) against the
 * efficient-optimum outcome (dashed green) — the gap between them is the cost of over-automation,
 * and interventions visibly move the solid line toward the dashed one.
 */
export function DriverCharts({
  data,
  optimum,
  replayKey,
}: {
  data: DynamicPoint[];
  optimum: DynamicPoint;
  replayKey: number;
}) {
  const els = useRef<(HTMLDivElement | null)[]>([]);
  const plots = useRef<(uPlot | null)[]>([]);
  const ranges = useRef<[number, number][]>([]);
  const raf = useRef<number | null>(null);

  const xs = data.map((d) => d.t);
  const sig =
    data.length +
    ':' +
    data[data.length - 1].automation.toFixed(3) +
    ':' +
    data[data.length - 1].demandIndex.toFixed(3) +
    ':' +
    data[data.length - 1].profitIndex.toFixed(3) +
    ':' +
    data[data.length - 1].unemployment.toFixed(3);

  // create plots once
  useEffect(() => {
    METRICS.forEach((m, i) => {
      const el = els.current[i];
      if (!el) return;
      const cur = data.map((d) => d[m.key]);
      ranges.current[i] = rangeFor(cur, optimum[m.key], m.key);
      const opts: uPlot.Options = {
        width: el.clientWidth,
        height: 148,
        padding: [10, 8, 2, 4],
        legend: { show: false },
        cursor: { show: true, x: true, y: false, points: { show: false } },
        scales: { x: { time: false }, y: { range: () => ranges.current[i] ?? [0, 1] } },
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
            size: 32,
            space: 30,
          },
        ],
        series: [{}, { stroke: INK, width: 2.5 }, { stroke: OPT, width: 1.5, dash: [4, 4] }],
      };
      const refLine = new Array(xs.length).fill(optimum[m.key]);
      plots.current[i] = new uPlot(opts, [xs, cur.slice(), refLine], el);
    });
    const ro = new ResizeObserver(() => {
      METRICS.forEach((_m, i) => {
        const el = els.current[i];
        const u = plots.current[i];
        if (el && u) u.setSize({ width: el.clientWidth, height: 148 });
      });
    });
    els.current.forEach((el) => el && ro.observe(el));
    return () => {
      ro.disconnect();
      if (raf.current) cancelAnimationFrame(raf.current);
      plots.current.forEach((u) => u?.destroy());
      plots.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // scenario changed (slider drag): update ranges + reference, show full curve (responsive)
  useEffect(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    METRICS.forEach((m, i) => {
      const u = plots.current[i];
      if (!u) return;
      const cur = data.map((d) => d[m.key]);
      ranges.current[i] = rangeFor(cur, optimum[m.key], m.key);
      u.setData([xs, cur, new Array(xs.length).fill(optimum[m.key])]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  // replay the cascade (mount, Replay button, interventions): progressive reveal
  useEffect(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    const N = xs.length;
    const reveal = (prog: number) => {
      const n = Math.max(1, Math.floor(prog * (N - 1)) + 1);
      METRICS.forEach((m, i) => {
        const u = plots.current[i];
        if (!u) return;
        const cur = data.map((d, idx) => (idx < n ? d[m.key] : null));
        u.setData([xs, cur, new Array(N).fill(optimum[m.key])]);
      });
    };
    if (reduced()) {
      reveal(1);
      return;
    }
    let start: number | null = null;
    const tick = (ts: number) => {
      if (start === null) start = ts;
      const prog = Math.min(1, (ts - start) / PLAY_MS);
      reveal(prog);
      raf.current = prog < 1 ? requestAnimationFrame(tick) : null;
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replayKey]);

  return (
    <div>
      <div className={styles.legend} aria-hidden="true">
        <span className={styles.lNow}>now</span>
        <span className={styles.lOpt}>efficient optimum</span>
        <span className={styles.axisHint}>time →</span>
      </div>
      <div className={styles.grid}>
        {METRICS.map((m, i) => {
          const last = data[data.length - 1][m.key];
          const opt = optimum[m.key];
          return (
            <figure className={styles.cell} key={m.key}>
              <figcaption className={styles.head}>
                <span className={styles.title}>{m.title}</span>
                <span className={styles.sub}>{m.sub}</span>
                <span className={styles.now}>
                  {Math.round(last)}
                  {m.unit}
                  <span className={styles.opt}>
                    {' '}
                    · optimum {Math.round(opt)}
                    {m.unit}
                  </span>
                </span>
              </figcaption>
              <div
                ref={(el) => {
                  els.current[i] = el;
                }}
                className={styles.plot}
                role="img"
                aria-label={`${m.title}: settles at ${Math.round(last)}${m.unit}; efficient optimum ${Math.round(opt)}${m.unit}.`}
              />
            </figure>
          );
        })}
      </div>
    </div>
  );
}

export default DriverCharts;
