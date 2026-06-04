'use client';
import { useEffect, useMemo, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { firmPnL, alphaNE, type Params } from '@/lib/engine';
import styles from './DriverCharts.module.css';

const INK = '#34342f';
const FIX = '#2f6f4f';
const TRAP = '#bd4b3b';
const GRID = '#eeede8';
const AXIS = '#6e6e66';

// Calm, distinct tones for the four P&L slices.
const C_WAGES = 'rgba(74,140,99,0.55)'; // wages saved — the upside (green)
const C_AI = 'rgba(46,110,142,0.50)'; // AI running cost (blue)
const C_TRANSFORM = 'rgba(192,138,62,0.58)'; // retooling — the convex brake (amber)
const C_DEMAND = 'rgba(189,75,59,0.42)'; // demand this firm loses (clay)
const C_TAX = 'rgba(107,111,142,0.55)'; // automation tax (slate)

/** Vertical dashed marker + label, drawn straight on the canvas (matches OvershootHill). */
function vline(u: uPlot, val: number, color: string, label: string) {
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
  ctx.font = `${10 * r}px ui-monospace, monospace`;
  ctx.fillText(label, x + 4 * r, top + 11 * r);
  ctx.restore();
}

interface Marks {
  co: number;
  ne: number;
}

/**
 * One firm's P&L as it dials its OWN automation (rivals held at zero), under the active per-task
 * tax. Two cells:
 *   1. "Why a firm stops" — the profit hump. It climbs while each step of automation saves more in
 *      wages than it adds in AI + retooling, then bends down when the convex retooling cost (k)
 *      overtakes the saving. The peak is the firm's stopping point αNE — to the RIGHT of the joint
 *      optimum αCO, which is the over-automation. Turn on the tax and the peak slides left toward αCO.
 *   2. "Where the profit goes" — the same thing opened up: wages saved (up) against AI, retooling,
 *      the demand this firm loses, and any tax (down). Their net is the hump from cell 1.
 *
 * The demand-lost slice is only this firm's 1/N share of the spending its layoffs destroy — the rest
 * lands on rivals, unpriced. That gap is exactly why the private peak overshoots the optimum.
 */
export function ProfitAnatomy({ params, alphaCO }: { params: Params; alphaCO: number }) {
  const humpEl = useRef<HTMLDivElement | null>(null);
  const breakEl = useRef<HTMLDivElement | null>(null);
  const humpPlot = useRef<uPlot | null>(null);
  const breakPlot = useRef<uPlot | null>(null);
  const humpRange = useRef<[number, number]>([0, 1]);
  const breakRange = useRef<[number, number]>([0, 1]);
  const marks = useRef<Marks>({ co: alphaCO, ne: alphaNE(params) });

  const taxOn = (params.tau ?? 0) > 1e-9;

  const series = useMemo(() => {
    const SC = 100 / (params.w * params.L); // index to points of the pre-automation wage bill
    const base = firmPnL(params, 0, 0);
    const xs: number[] = [];
    const profit: number[] = []; // cell 1: indexed profit (100 = before automation)
    const wagesTop: number[] = []; // cell 2 boundaries (stacked)
    const zero: number[] = [];
    const bAi: number[] = [];
    const bTransform: number[] = [];
    const bDemand: number[] = [];
    const bTax: number[] = [];
    const net: number[] = [];
    for (let i = 0; i <= 100; i++) {
      const a = i / 100;
      const p = firmPnL(params, a, 0);
      const wagesSaved = (base.wages - p.wages) * SC;
      const ai = (p.ai - base.ai) * SC;
      const transform = p.transform * SC;
      const demand = (base.revenue - p.revenue) * SC;
      const tax = p.tax * SC;
      const delta = (p.profit - base.profit) * SC;
      xs.push(a * 100);
      profit.push(100 + delta);
      wagesTop.push(wagesSaved);
      zero.push(0);
      bAi.push(-ai);
      bTransform.push(-ai - transform);
      bDemand.push(-ai - transform - demand);
      bTax.push(-ai - transform - demand - tax);
      net.push(delta);
    }
    return { xs, profit, wagesTop, zero, bAi, bTransform, bDemand, bTax, net };
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
    params.tau,
  ]);

  marks.current = { co: alphaCO, ne: alphaNE(params) };

  const pad = (lo: number, hi: number): [number, number] => {
    const span = hi - lo || 1;
    return [lo - span * 0.12, hi + span * 0.16];
  };
  humpRange.current = pad(Math.min(...series.profit, 100), Math.max(...series.profit, 100));
  breakRange.current = pad(Math.min(...series.bTax), Math.max(...series.wagesTop));

  const sig =
    series.net[series.net.length - 1].toFixed(3) +
    ':' +
    marks.current.ne.toFixed(4) +
    ':' +
    marks.current.co.toFixed(4) +
    ':' +
    (taxOn ? '1' : '0');

  const H = typeof window !== 'undefined' && window.innerWidth <= 680 ? 168 : 220;

  useEffect(() => {
    if (!humpEl.current || !breakEl.current) return;

    const axisX: uPlot.Axis = {
      stroke: AXIS,
      grid: { stroke: GRID, width: 1 },
      ticks: { show: false },
      font: '10px ui-monospace, monospace',
      label: 'this firm’s automation %',
      labelSize: 22,
      labelGap: 2,
      space: 60,
    };
    const axisY: uPlot.Axis = {
      stroke: AXIS,
      grid: { stroke: GRID, width: 1 },
      ticks: { show: false },
      font: '10px ui-monospace, monospace',
      size: 38,
      space: 28,
    };

    humpPlot.current = new uPlot(
      {
        width: humpEl.current.clientWidth,
        height: H,
        padding: [12, 10, 2, 4],
        legend: { show: false },
        cursor: { show: true, x: true, y: false, points: { show: false } },
        scales: { x: { time: false }, y: { range: () => humpRange.current } },
        axes: [axisX, axisY],
        series: [{}, { stroke: INK, width: 2.5 }],
        hooks: {
          draw: [
            (u) => {
              vline(u, marks.current.co * 100, FIX, 'optimum');
              vline(u, marks.current.ne * 100, TRAP, 'firms stop');
            },
          ],
        },
      },
      [series.xs, series.profit.slice()],
      humpEl.current,
    );

    breakPlot.current = new uPlot(
      {
        width: breakEl.current.clientWidth,
        height: H,
        padding: [12, 10, 2, 4],
        legend: { show: false },
        cursor: { show: true, x: true, y: false, points: { show: false } },
        scales: { x: { time: false }, y: { range: () => breakRange.current } },
        axes: [axisX, axisY],
        // 1 wagesTop, 2 zero, 3 bAi, 4 bTransform, 5 bDemand, 6 bTax, 7 net
        series: [
          {},
          { stroke: 'transparent', width: 0 },
          { stroke: 'transparent', width: 0 },
          { stroke: 'transparent', width: 0 },
          { stroke: 'transparent', width: 0 },
          { stroke: 'transparent', width: 0 },
          { stroke: 'transparent', width: 0 },
          { stroke: INK, width: 2 },
        ],
        bands: [
          { series: [1, 2], fill: C_WAGES },
          { series: [2, 3], fill: C_AI },
          { series: [3, 4], fill: C_TRANSFORM },
          { series: [4, 5], fill: C_DEMAND },
          { series: [5, 6], fill: C_TAX },
        ],
        hooks: {
          draw: [
            (u) => {
              vline(u, marks.current.ne * 100, TRAP, 'firms stop');
            },
          ],
        },
      },
      [
        series.xs,
        series.wagesTop.slice(),
        series.zero.slice(),
        series.bAi.slice(),
        series.bTransform.slice(),
        series.bDemand.slice(),
        series.bTax.slice(),
        series.net.slice(),
      ],
      breakEl.current,
    );

    const remeasure = () => {
      if (humpEl.current && humpPlot.current)
        humpPlot.current.setSize({ width: humpEl.current.clientWidth, height: H });
      if (breakEl.current && breakPlot.current)
        breakPlot.current.setSize({ width: breakEl.current.clientWidth, height: H });
    };
    const ro = new ResizeObserver(remeasure);
    ro.observe(humpEl.current);
    ro.observe(breakEl.current);

    // The charts mount inside a collapsed <details> (clientWidth 0), and the ResizeObserver does
    // not reliably fire on the display:none -> visible transition. Re-measure on the accordion's
    // toggle so the plots fill their cells the first time it is opened.
    const details = humpEl.current.closest('details');
    const onToggle = () => requestAnimationFrame(remeasure);
    details?.addEventListener('toggle', onToggle);

    return () => {
      ro.disconnect();
      details?.removeEventListener('toggle', onToggle);
      humpPlot.current?.destroy();
      breakPlot.current?.destroy();
      humpPlot.current = null;
      breakPlot.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    humpPlot.current?.setData([series.xs, series.profit]);
    breakPlot.current?.setData([
      series.xs,
      series.wagesTop,
      series.zero,
      series.bAi,
      series.bTransform,
      series.bDemand,
      series.bTax,
      series.net,
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  const peakProfit = Math.round(series.profit[Math.round(marks.current.ne * 100)] ?? 100);

  return (
    <div className={styles.grid}>
      <figure className={styles.cell}>
        <figcaption className={styles.head}>
          <span className={styles.title}>Why a firm stops automating</span>
          <span className={styles.sub}>
            its own profit vs. before automation (100), as it automates more
          </span>
          <span className={styles.legendRow} aria-hidden="true">
            <span className={styles.legendItem}>
              <i style={{ background: INK }} /> this firm’s profit
            </span>
            <span className={styles.legendItem}>
              <i style={{ background: FIX }} /> optimum
            </span>
            <span className={styles.legendItem}>
              <i style={{ background: TRAP }} /> where firms stop
            </span>
          </span>
        </figcaption>
        <div
          ref={humpEl}
          className={styles.plot}
          role="img"
          aria-label={`One firm's profit, indexed to 100 before automation, as it raises its own automation. It peaks near ${peakProfit} at automation ${Math.round(
            marks.current.ne * 100,
          )}% — the firm's stopping point — which is past the joint optimum at ${Math.round(
            marks.current.co * 100,
          )}%. Beyond the peak, rising retooling cost makes more automation lower profit.`}
        />
      </figure>

      <figure className={styles.cell}>
        <figcaption className={styles.head}>
          <span className={styles.title}>Where the profit goes</span>
          <span className={styles.sub}>
            wages saved, minus what automation costs (points vs. before)
          </span>
          <span className={styles.legendRow} aria-hidden="true">
            <span className={styles.legendItem}>
              <i style={{ background: C_WAGES }} /> wages saved
            </span>
            <span className={styles.legendItem}>
              <i style={{ background: C_AI }} /> AI cost
            </span>
            <span className={styles.legendItem}>
              <i style={{ background: C_TRANSFORM }} /> retooling
            </span>
            <span className={styles.legendItem}>
              <i style={{ background: C_DEMAND }} /> demand it loses
            </span>
            {taxOn && (
              <span className={styles.legendItem}>
                <i style={{ background: C_TAX }} /> tax
              </span>
            )}
            <span className={styles.legendItem}>
              <i style={{ background: INK }} /> net
            </span>
          </span>
        </figcaption>
        <div
          ref={breakEl}
          className={styles.plot}
          role="img"
          aria-label={
            'The same profit, decomposed. Wages saved rise in a straight line with automation; below the line sit the costs — AI running cost, retooling (which grows ever steeper), the demand this firm loses (only its small one-in-N share), and any tax. The net of all of them is the profit curve, which peaks where the rising retooling cost starts to outweigh the next bit of wage saving.'
          }
        />
      </figure>
    </div>
  );
}

export default ProfitAnatomy;
