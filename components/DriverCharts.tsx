'use client';
import { useEffect, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import type { DynamicPoint } from '@/lib/engine';
import type { Sector } from '@/lib/sectors';
import styles from './DriverCharts.module.css';

const INK = '#34342f';
const OPT = '#2f6f4f';
const GRID = '#eeede8';
const AXIS = '#6e6e66';

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
    title: 'Net jobs displaced',
    sub: "share of this sector's jobs lost, net of re-hiring",
    unit: '%',
  },
  { key: 'demandIndex', title: 'Consumer spending', sub: 'vs. before automation (100)', unit: '' },
  {
    key: 'profitIndex',
    title: 'Corporate profits',
    sub: 'vs. before automation (100)',
    unit: '',
  },
];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Sector "Make it real" flavor for a panel's heading — nouns only, never data. */
function metricLabel(m: Metric, sector?: Sector): { title: string; sub: string } {
  if (!sector) return { title: m.title, sub: m.sub };
  switch (m.key) {
    case 'automation':
      return { title: 'Automation', sub: `share of ${sector.work} now handled by AI` };
    case 'unemployment':
      return {
        title: `Net ${sector.workers} displaced`,
        sub: `share of ${sector.workers} who lose work, net of re-hiring`,
      };
    case 'demandIndex':
      return { title: 'Consumer spending', sub: 'vs. before automation (100)' };
    case 'profitIndex':
      return {
        title: 'Corporate profits',
        sub: `per ${sector.firm}, vs. before automation (100)`,
      };
  }
}

function rangeFor(cur: number[], refVal: number, key: MetricKey): [number, number] {
  const all = [...cur, refVal];
  let lo = Math.min(...all);
  let hi = Math.max(...all);
  if (key === 'automation' || key === 'unemployment') lo = 0;
  const span = hi - lo || 1;
  return [lo - span * 0.08, hi + span * 0.14];
}

/**
 * The cascade, decomposed. Four small charts share a time axis. Each shows the current path
 * (solid ink) against the efficient-optimum outcome (dashed green) — the gap between them is the
 * cost of over-automation, and interventions visibly move the solid line toward the dashed one.
 */
export function DriverCharts({
  data,
  optimum,
  sector,
}: {
  data: DynamicPoint[];
  optimum: DynamicPoint;
  sector?: Sector;
}) {
  const els = useRef<(HTMLDivElement | null)[]>([]);
  const plots = useRef<(uPlot | null)[]>([]);
  const ranges = useRef<[number, number][]>([]);
  const raf = useRef<number | null>(null);

  const xs = data.map((d) => d.t);
  // shorter charts on phones so more of the cascade fits on one screen
  const H = typeof window !== 'undefined' && window.innerWidth <= 680 ? 116 : 148;
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
        series: [{}, { stroke: INK, width: 2.5 }, { stroke: OPT, width: 1.5, dash: [4, 4] }],
      };
      const refLine = new Array(xs.length).fill(optimum[m.key]);
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
          const { title, sub } = metricLabel(m, sector);
          return (
            <figure className={styles.cell} key={m.key}>
              <figcaption className={styles.head}>
                <span className={styles.title}>{title}</span>
                <span className={styles.sub}>{sub}</span>
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
                aria-label={`${title}: settles at ${Math.round(last)}${m.unit}; efficient optimum ${Math.round(opt)}${m.unit}.`}
              />
            </figure>
          );
        })}
      </div>
    </div>
  );
}

export default DriverCharts;
