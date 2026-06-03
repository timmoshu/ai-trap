'use client';
import { useEffect, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import type { DynamicPoint } from '@/lib/engine';
import type { Sector } from '@/lib/sectors';
import styles from './DriverCharts.module.css';

const INK = '#34342f';
const OPT = '#2f6f4f';
const ACCENT = '#2e6e8e';
const GRID = '#eeede8';
const AXIS = '#6e6e66';

interface Line {
  name: string;
  color: string;
  vals: number[];
}
interface Panel {
  title: string;
  sub: string;
  lines: Line[];
  ref: number | null; // optional dashed optimum reference
  zero: boolean; // anchor the y-axis at 0 (for "from-zero" saving/loss quantities)
  aria: string;
}

function rangeFor(all: number[], zero: boolean): [number, number] {
  let lo = Math.min(...all);
  const hi = Math.max(...all);
  if (zero && lo > 0) lo = 0; // anchor "loss/saving" panels at zero so the gap reads honestly
  const span = hi - lo || 1;
  return [lo - span * 0.08, hi + span * 0.14];
}

/**
 * The two LINKAGE panels that connect the cascade, given the model's assumptions:
 *  - "What each firm pays": the cost saving that makes a firm automate in the first place.
 *  - "Cost saved vs. demand lost": the two forces that net into profit — automation cuts cost, but
 *    the lost demand cuts revenue. Their gap is the profit change; it is widest at the optimum and
 *    shrinks as firms over-automate. This is why level policies (UBI / profit tax) change neither.
 */
export function LinkagePanels({
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

  const xs = data.map((d) => d.t);
  const work = sector ? sector.work : 'the work';

  const panels: Panel[] = [
    {
      title: 'What each firm pays',
      sub: `cost to handle ${work}, vs. before automation (100)`,
      lines: [{ name: 'cost per firm', color: INK, vals: data.map((d) => d.costIndex) }],
      ref: optimum.costIndex,
      zero: false,
      aria: `Each firm's cost, indexed to 100 before automation; it falls to ${Math.round(
        data[data.length - 1].costIndex,
      )} as AI replaces wages. This cost saving is why firms automate.`,
    },
    {
      title: 'Cost saved vs. demand lost',
      sub: 'the gap between them is the profit change',
      lines: [
        { name: 'cost saved', color: INK, vals: data.map((d) => d.costSaved) },
        { name: 'demand lost', color: ACCENT, vals: data.map((d) => d.demandLost) },
      ],
      ref: null,
      zero: true,
      aria: `Cost saved versus demand lost, in points of the baseline wage bill. The cost saving (${Math.round(
        data[data.length - 1].costSaved,
      )}) minus the demand lost (${Math.round(
        data[data.length - 1].demandLost,
      )}) is the profit change — positive but shrinking as firms over-automate past the optimum.`,
    },
  ];

  const sig =
    data.length +
    ':' +
    data[data.length - 1].costIndex.toFixed(3) +
    ':' +
    data[data.length - 1].costSaved.toFixed(3) +
    ':' +
    data[data.length - 1].demandIndex.toFixed(3) +
    ':' +
    optimum.costIndex.toFixed(3);

  // create once
  useEffect(() => {
    panels.forEach((panel, i) => {
      const el = els.current[i];
      if (!el) return;
      const lineData = panel.lines.map((l) => l.vals.slice());
      const refData = panel.ref != null ? new Array(xs.length).fill(panel.ref) : null;
      const all = [...lineData.flat(), ...(panel.ref != null ? [panel.ref] : [])];
      ranges.current[i] = rangeFor(all, panel.zero);
      const series: uPlot.Series[] = [
        {},
        ...panel.lines.map((l) => ({ stroke: l.color, width: 2.5 })),
      ];
      const seriesData: (number[] | null[])[] = [xs, ...lineData];
      if (refData) {
        series.push({ stroke: OPT, width: 1.5, dash: [4, 4] });
        seriesData.push(refData);
      }
      const opts: uPlot.Options = {
        width: el.clientWidth,
        height: 150,
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
        series,
      };
      plots.current[i] = new uPlot(opts, seriesData as uPlot.AlignedData, el);
    });
    const ro = new ResizeObserver(() => {
      panels.forEach((_p, i) => {
        const el = els.current[i];
        const u = plots.current[i];
        if (el && u) u.setSize({ width: el.clientWidth, height: 150 });
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

  // update on data change
  useEffect(() => {
    panels.forEach((panel, i) => {
      const u = plots.current[i];
      if (!u) return;
      const lineData = panel.lines.map((l) => l.vals.slice());
      const refData = panel.ref != null ? new Array(xs.length).fill(panel.ref) : null;
      const all = [...lineData.flat(), ...(panel.ref != null ? [panel.ref] : [])];
      ranges.current[i] = rangeFor(all, panel.zero);
      const seriesData: (number[] | null[])[] = [xs, ...lineData];
      if (refData) seriesData.push(refData);
      u.setData(seriesData as uPlot.AlignedData);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  return (
    <div className={styles.grid}>
      {panels.map((panel, i) => (
        <figure className={styles.cell} key={panel.title}>
          <figcaption className={styles.head}>
            <span className={styles.title}>{panel.title}</span>
            <span className={styles.sub}>{panel.sub}</span>
            <span className={styles.legendRow} aria-hidden="true">
              {panel.lines.map((l) => (
                <span className={styles.legendItem} key={l.name}>
                  <i style={{ background: l.color }} /> {l.name}
                </span>
              ))}
              {panel.ref != null && (
                <span className={styles.legendItem}>
                  <i style={{ background: OPT }} /> optimum
                </span>
              )}
            </span>
          </figcaption>
          <div
            ref={(el) => {
              els.current[i] = el;
            }}
            className={styles.plot}
            role="img"
            aria-label={panel.aria}
          />
        </figure>
      ))}
    </div>
  );
}

export default LinkagePanels;
