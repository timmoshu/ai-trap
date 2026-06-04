'use client';
import { useEffect, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import type { JevonsPoint } from '@/lib/engine';
import styles from './DriverCharts.module.css';

const INK = '#34342f';
const OPT = '#2f6f4f';
const BASE = '#9a9a90';
const GRID = '#eeede8';
const AXIS = '#6e6e66';

type MetricKey = 'automation' | 'jobs' | 'spending' | 'output';
interface Metric {
  key: MetricKey;
  title: string;
  sub: string;
  unit: string;
  refColor: string;
  refLabel: string;
}
// The Jevons cascade, in causal order: automation -> output expands -> spending -> net jobs.
// (Beyond the paper: lib/engine/jevons.ts.) Each panel is indexed so 100 = before automation,
// except automation itself, whose dashed reference is the profit-optimum (the paper's αCO).
const METRICS: Metric[] = [
  {
    key: 'automation',
    title: 'Automation',
    sub: 'share of jobs done by AI',
    unit: '%',
    refColor: OPT,
    refLabel: 'optimum',
  },
  {
    key: 'output',
    title: 'Output',
    sub: 'cheaper goods grow the market',
    unit: '',
    refColor: BASE,
    refLabel: 'before',
  },
  {
    key: 'spending',
    title: 'Consumer spending',
    sub: 'vs. before automation (100)',
    unit: '',
    refColor: BASE,
    refLabel: 'before',
  },
  {
    key: 'jobs',
    title: 'Net jobs',
    sub: 'above 100 = automation adds jobs',
    unit: '',
    refColor: BASE,
    refLabel: 'before',
  },
];

function rangeFor(cur: number[], refVal: number, key: MetricKey): [number, number] {
  const all = [...cur, refVal];
  let lo = Math.min(...all);
  let hi = Math.max(...all);
  if (key === 'automation') lo = 0;
  const span = hi - lo || 1;
  return [lo - span * 0.08, hi + span * 0.14];
}

/**
 * The Jevons cascade, decomposed — the /what-if mirror of DriverCharts. Four small charts share a
 * time axis; each shows the path (solid ink) against a dashed reference: the profit-optimum (αCO)
 * for automation, and the before-automation baseline (100) for output, spending and net jobs. When
 * the elasticity is high enough, the "Net jobs" panel rises back above 100 — automation adds jobs.
 */
export function JevonsCharts({
  data,
  optAutomation,
}: {
  data: JevonsPoint[];
  optAutomation: number; // αCO * 100 — the optimum reference for the automation panel
}) {
  const els = useRef<(HTMLDivElement | null)[]>([]);
  const plots = useRef<(uPlot | null)[]>([]);
  const ranges = useRef<[number, number][]>([]);

  const xs = data.map((d) => d.t);
  const refOf = (m: Metric) => (m.key === 'automation' ? optAutomation : 100);
  const H = typeof window !== 'undefined' && window.innerWidth <= 680 ? 116 : 148;
  const last = data[data.length - 1];
  const sig = `${data.length}:${last.automation.toFixed(3)}:${last.jobs.toFixed(3)}:${last.spending.toFixed(3)}:${last.output.toFixed(3)}:${optAutomation.toFixed(3)}`;

  // create plots once
  useEffect(() => {
    METRICS.forEach((m, i) => {
      const el = els.current[i];
      if (!el) return;
      const cur = data.map((d) => d[m.key]);
      const ref = refOf(m);
      ranges.current[i] = rangeFor(cur, ref, m.key);
      const opts: uPlot.Options = {
        width: el.clientWidth,
        height: H,
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
        series: [{}, { stroke: INK, width: 2.5 }, { stroke: m.refColor, width: 1.5, dash: [4, 4] }],
      };
      const refLine = new Array(xs.length).fill(ref);
      plots.current[i] = new uPlot(opts, [xs, cur.slice(), refLine], el);
    });
    const ro = new ResizeObserver(() => {
      METRICS.forEach((_m, i) => {
        const el = els.current[i];
        const u = plots.current[i];
        if (el && u) u.setSize({ width: el.clientWidth, height: H });
      });
    });
    els.current.forEach((el) => el && ro.observe(el));
    return () => {
      ro.disconnect();
      plots.current.forEach((u) => u?.destroy());
      plots.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // elasticity changed (slider drag): rescale + redraw
  useEffect(() => {
    METRICS.forEach((m, i) => {
      const u = plots.current[i];
      if (!u) return;
      const cur = data.map((d) => d[m.key]);
      const ref = refOf(m);
      ranges.current[i] = rangeFor(cur, ref, m.key);
      u.setData([xs, cur, new Array(xs.length).fill(ref)]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  return (
    <div>
      <div className={styles.legend} aria-hidden="true">
        <span className={styles.lNow}>now</span>
        <span className={styles.lOpt}>reference</span>
        <span className={styles.axisHint}>time →</span>
      </div>
      <div className={styles.grid}>
        {METRICS.map((m, i) => {
          const lastVal = data[data.length - 1][m.key];
          const ref = refOf(m);
          return (
            <figure className={styles.cell} key={m.key}>
              <figcaption className={styles.head}>
                <span className={styles.title}>{m.title}</span>
                <span className={styles.sub}>{m.sub}</span>
                <span className={styles.now}>
                  {Math.round(lastVal)}
                  {m.unit}
                  <span className={styles.opt}>
                    {' '}
                    · {m.refLabel} {Math.round(ref)}
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
                aria-label={`${m.title}: settles at ${Math.round(lastVal)}${m.unit}; ${m.refLabel} ${Math.round(ref)}${m.unit}.`}
              />
            </figure>
          );
        })}
      </div>
    </div>
  );
}

export default JevonsCharts;
