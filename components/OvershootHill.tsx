'use client';
import { useEffect, useMemo, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { aggregateProfit, type Params } from '@/lib/engine';
import styles from './TimeSeriesChart.module.css';

export interface HillMarkers {
  alphaNE: number;
  alphaCO: number;
  alphaSP: number;
  showSP: boolean;
}

const C = {
  line: '#5b5b54',
  trap: '#bd4b3b',
  fix: '#2f6f4f',
  accent: '#2e6e8e',
  grid: '#eeede8',
  axis: '#6e6e66',
};

/**
 * Companion overshoot hill (FR-1.6): aggregate profit vs. automation. Profit peaks at alphaCO
 * (the optimum); the free market plays alphaNE > alphaCO and overshoots into LOWER profit.
 */
export function OvershootHill({
  params,
  markers,
  height = 360,
}: {
  params: Params;
  markers: HillMarkers;
  height?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<uPlot | null>(null);
  const markersRef = useRef<HillMarkers>(markers);
  markersRef.current = markers;

  const { xs, ys } = useMemo(() => {
    const xs = Array.from({ length: 101 }, (_, i) => i / 100);
    return { xs, ys: xs.map((a) => aggregateProfit(params, a)) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.N, params.c, params.w, params.k, params.lambda, params.eta, params.A, params.L]);

  useEffect(() => {
    if (!wrapRef.current) return;

    const vline = (u: uPlot, val: number, color: string, label: string) => {
      if (val == null || !isFinite(val)) return;
      const x = u.valToPos(val, 'x', true);
      const { top, height: h } = u.bbox;
      const ctx = u.ctx;
      const r = window.devicePixelRatio || 1;
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
          size: 48,
          label: 'aggregate profit',
          labelSize: 24,
        },
      ],
      series: [{}, { label: 'profit', stroke: C.line, width: 2.5 }],
      hooks: {
        draw: [
          (u) => {
            const m = markersRef.current;
            vline(u, m.alphaCO, C.fix, 'optimum α(CO)');
            vline(u, m.alphaNE, C.trap, 'free market α(NE)');
            if (m.showSP) vline(u, m.alphaSP, C.accent, 'planner α(SP)');
          },
        ],
      },
    };

    const u = new uPlot(opts, [xs, ys], wrapRef.current);
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

  // redraw curve + markers on change without recreating the plot
  useEffect(() => {
    const u = plotRef.current;
    if (!u) return;
    u.setData([xs, ys]);
    u.redraw();
  }, [xs, ys, markers.alphaNE, markers.alphaCO, markers.alphaSP, markers.showSP]);

  const r = (n: number) => n.toFixed(2);
  const label =
    `Aggregate profit versus automation rate. Profit peaks at the optimum automation ` +
    `α ${r(markers.alphaCO)}; the free market plays α ${r(markers.alphaNE)}, ` +
    `${markers.alphaNE > markers.alphaCO ? 'right of the peak, earning lower profit' : 'at or left of the peak'}` +
    `${markers.showSP ? `; planner optimum at α ${r(markers.alphaSP)}` : ''}.`;

  return (
    <div className={styles.wrap}>
      <div ref={wrapRef} className={styles.plot} role="img" aria-label={label} />
      <div className={styles.legend} aria-hidden="true">
        <span className={styles.key}>
          <i style={{ borderTopColor: C.fix, borderTopStyle: 'dashed' }} /> optimum
        </span>
        <span className={styles.key}>
          <i style={{ borderTopColor: C.trap, borderTopStyle: 'dashed' }} /> free market (overshoot)
        </span>
        {markers.showSP && (
          <span className={styles.key}>
            <i style={{ borderTopColor: C.accent, borderTopStyle: 'dashed' }} /> planner
          </span>
        )}
      </div>
    </div>
  );
}

export default OvershootHill;
