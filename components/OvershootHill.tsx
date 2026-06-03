'use client';
import { useEffect, useMemo, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { profitPerFirm, profitPerFirmUnilateral, type Params } from '@/lib/engine';
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
 * Companion overshoot hill (FR-1.6), indexed to 100 = before automation (consistent with the
 * time-series profit panel; robust to the model's negative profit *levels*). Two curves:
 *  - "all firms": per-firm profit if everyone automates the same amount — peaks at the optimum αCO.
 *  - "one firm": one firm's profit if its rivals hold at the optimum — peaks at αNE, to the right.
 * The second curve is the engine of the trap: each firm is individually tempted past the optimum.
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

  const { xs, ysAll, ysOne } = useMemo(() => {
    const xs = Array.from({ length: 101 }, (_, i) => i / 100);
    const baseDemand = params.A + params.lambda * params.w * params.L * params.N;
    const scale = baseDemand / params.N; // per-firm baseline revenue (always positive)
    const pi0 = profitPerFirm(params, 0);
    const afterTax = 1 - (params.t ?? 0); // capital/profit tax scales the displayed profit change
    const idx = (profit: number) => 100 + ((afterTax * (profit - pi0)) / scale) * 100;
    return {
      xs,
      ysAll: xs.map((a) => idx(profitPerFirm(params, a))),
      ysOne: xs.map((a) => idx(profitPerFirmUnilateral(params, a, markers.alphaCO))),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    params.N,
    params.c,
    params.w,
    params.k,
    params.lambda,
    params.eta,
    params.A,
    params.L,
    markers.alphaCO,
  ]);

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
          label: 'profit vs. before automation (100)',
          labelSize: 24,
        },
      ],
      series: [
        {},
        { label: 'all firms', stroke: C.line, width: 2.5 },
        { label: 'one firm', stroke: C.accent, width: 2 },
      ],
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

    const u = new uPlot(opts, [xs, ysAll, ysOne], wrapRef.current);
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
    u.setData([xs, ysAll, ysOne]);
    u.redraw();
  }, [xs, ysAll, ysOne, markers.alphaNE, markers.alphaCO, markers.alphaSP, markers.showSP]);

  const r = (n: number) => n.toFixed(2);
  const label =
    `Profit versus automation, indexed to 100 before automation. The all-firms curve peaks at the ` +
    `optimum α ${r(markers.alphaCO)}; a single firm's profit keeps rising to α ${r(markers.alphaNE)}, ` +
    `so each firm is individually tempted to over-automate past the optimum` +
    `${markers.showSP ? `; planner optimum at α ${r(markers.alphaSP)}` : ''}.`;

  return (
    <div className={styles.wrap}>
      <div ref={wrapRef} className={styles.plot} role="img" aria-label={label} />
      <div className={styles.legend} aria-hidden="true">
        <span className={styles.key}>
          <i style={{ borderTopColor: C.line, borderTopStyle: 'solid' }} /> all firms automate the
          same
        </span>
        <span className={styles.key}>
          <i style={{ borderTopColor: C.accent, borderTopStyle: 'solid' }} /> one firm (rivals at
          optimum)
        </span>
        <span className={styles.key}>
          <i style={{ borderTopColor: C.fix, borderTopStyle: 'dashed' }} /> optimum
        </span>
        <span className={styles.key}>
          <i style={{ borderTopColor: C.trap, borderTopStyle: 'dashed' }} /> free market
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
