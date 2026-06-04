'use client';
import { useEffect, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { jevonsJobs, type Params } from '@/lib/engine';
import styles from './TimeSeriesChart.module.css';

const C = {
  line: '#34342f',
  opt: '#2f6f4f',
  market: '#bd4b3b',
  base: '#6e6e66',
  grid: '#eeede8',
  axis: '#6e6e66',
};

/**
 * Jevons what-if chart: employment (100 = before automation) vs. automation rate, at the chosen
 * price-elasticity. The curve sinks below 100 (net job loss) when expansion can't outpace the
 * per-unit labor saving, and rises above it when it can. Markers show where the optimum (αCO) and
 * the market's over-automation (αNE) sit, and the dashed 100 line is break-even.
 */
export function WhatIfChart({
  p,
  eps,
  aNE,
  aCO,
  height = 300,
}: {
  p: Params;
  eps: number;
  aNE: number;
  aCO: number;
  height?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<uPlot | null>(null);
  const markRef = useRef({ aNE, aCO });
  markRef.current = { aNE, aCO };

  const xs = Array.from({ length: 101 }, (_, i) => i / 100);
  const ys = xs.map((a) => jevonsJobs(p, a, eps));
  const baseLine = new Array(xs.length).fill(100);

  useEffect(() => {
    if (!wrapRef.current) return;
    const vline = (u: uPlot, val: number, color: string, label: string) => {
      if (val == null || !isFinite(val)) return;
      const x = u.valToPos(val, 'x', true);
      const { top, height: h } = u.bbox;
      const r = window.devicePixelRatio || 1;
      const ctx = u.ctx;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1, Math.round(r));
      ctx.setLineDash([4 * r, 3 * r]);
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, top + h);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = color;
      ctx.font = `${11 * r}px ui-monospace, monospace`;
      ctx.fillText(label, x + 4 * r, top + 12 * r);
      ctx.restore();
    };
    const opts: uPlot.Options = {
      width: wrapRef.current.clientWidth,
      height,
      padding: [12, 12, 4, 8],
      legend: { show: false },
      cursor: { show: true, x: true, y: false, points: { show: false } },
      scales: { x: { time: false, range: [0, 1] } },
      axes: [
        {
          stroke: C.axis,
          grid: { stroke: C.grid, width: 1 },
          ticks: { stroke: C.grid, width: 1 },
          font: '11px ui-monospace, monospace',
          label: 'automation rate α',
          labelSize: 24,
          labelGap: 4,
        },
        {
          stroke: C.axis,
          grid: { stroke: C.grid, width: 1 },
          ticks: { stroke: C.grid, width: 1 },
          font: '11px ui-monospace, monospace',
          size: 50,
          label: 'jobs vs. before automation (100)',
          labelSize: 24,
        },
      ],
      series: [{}, { stroke: C.line, width: 2.5 }, { stroke: C.base, width: 1, dash: [3, 3] }],
      hooks: {
        draw: [
          (u) => {
            vline(u, markRef.current.aCO, C.opt, 'optimum');
            vline(u, markRef.current.aNE, C.market, 'market');
          },
        ],
      },
    };
    const u = new uPlot(opts, [xs, ys.slice(), baseLine.slice()], wrapRef.current);
    plotRef.current = u;
    const ro = new ResizeObserver(() => {
      if (wrapRef.current) u.setSize({ width: wrapRef.current.clientWidth, height });
    });
    ro.observe(wrapRef.current);
    return () => {
      ro.disconnect();
      u.destroy();
      plotRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  useEffect(() => {
    const u = plotRef.current;
    if (!u) return;
    u.setData([xs, ys, baseLine]);
    u.redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eps, aNE, aCO]);

  return (
    <div className={styles.wrap}>
      <div
        ref={wrapRef}
        className={styles.plot}
        role="img"
        aria-label={`Employment versus automation at price-elasticity ${eps.toFixed(2)}. 100 is pre-automation. The dashed line is break-even; the optimum and market automation levels are marked.`}
      />
      <div className={styles.legend} aria-hidden="true">
        <span className={styles.key}>
          <i style={{ borderTopColor: C.line }} /> jobs
        </span>
        <span className={styles.key}>
          <i style={{ borderTopColor: C.base, borderTopStyle: 'dashed' }} /> break-even (100)
        </span>
        <span className={styles.key}>
          <i style={{ borderTopColor: C.opt, borderTopStyle: 'dashed' }} /> optimum
        </span>
        <span className={styles.key}>
          <i style={{ borderTopColor: C.market, borderTopStyle: 'dashed' }} /> market
        </span>
      </div>
    </div>
  );
}

export default WhatIfChart;
