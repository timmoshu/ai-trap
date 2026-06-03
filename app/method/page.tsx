import type { Metadata } from 'next';
import { ContentPage, proseStyles as s } from '@/components/ContentPage';
import { PARAM_META, DEFAULTS } from '@/lib/engine';

export const metadata: Metadata = {
  title: 'Method — The AI Trap',
  description:
    'The exact equations behind The AI Trap, every default with its citation, and how the dynamic layer relates to the static paper.',
};

const EQUATIONS: { tex: string; note: string }[] = [
  { tex: 's = w − c', note: 'cost saving from automating a task' },
  { tex: 'ℓ = λ(1 − η)·w', note: 'master externality parameter (negative when η > 1)' },
  { tex: 'D = A + λwL·N·[1 − (1 − η)·ᾱ]', note: 'aggregate demand — Eq (2)' },
  { tex: 'Revᵢ = A/N + λwL − ℓ·L·ᾱ', note: 'firm revenue — Eq (4)' },
  {
    tex: 'α(NE) = clip( (s − τ − ℓ/N) / k , 0, 1 )',
    note: 'Nash (private) automation, with tax τ — Prop 1(i)',
  },
  {
    tex: 'α(CO) = clip( (s − ℓ) / k , 0, 1 )',
    note: 'cooperative / efficient optimum — Prop 1(ii)',
  },
  { tex: 'α(NE) − α(CO) = ℓ(1 − 1/N) / k', note: 'the over-automation wedge — Prop 1(iii)' },
  { tex: 'τ* = ℓ(1 − 1/N)', note: 'Pigouvian tax that restores the optimum — Prop 5(i)' },
  { tex: 'α(SP) = (s − ℓ)/k − µℓ / [λ(1 − µ)k]', note: 'µ-weighted social planner — Prop 2(i)' },
  {
    tex: 'loss = (1 − µ)·(NLk/2)·(α(NE) − α(SP))²',
    note: 'welfare loss, quadratic in the wedge — Prop 2(ii)',
  },
  { tex: 'N* = ℓ / s', note: 'no automation if N ≤ N*' },
];

export default function MethodPage() {
  return (
    <ContentPage
      title="Method"
      lede="You can check the math. Below are the exact equations this tool computes, the source of every default, and an honest account of how the time-animation relates to the static paper."
    >
      <p>
        The engine is a faithful implementation of{' '}
        <a href="https://arxiv.org/abs/2603.20617" target="_blank" rel="noreferrer">
          Falk &amp; Tsoukalas, &ldquo;The AI Layoff Trap&rdquo; (arXiv:2603.20617)
        </a>
        . It models <strong>N symmetric firms</strong> in a single sector, each choosing an
        automation rate α ∈ [0, 1] that is simultaneously its layoff fraction. Tasks [0, α] are done
        by AI at cost c; tasks (α, 1] by humans at wage w. Every formula below was independently
        re-derived and cross-checked against the source, and the production engine is tested for
        numerical equality against the verified reference across a broad parameter grid (the values
        used in the paper&rsquo;s figures plus a wide sweep).
      </p>

      <h2>The equations</h2>
      {EQUATIONS.map((e) => (
        <div key={e.tex} className={s.eqn}>
          <b>{e.tex}</b>
          <div className={s.eqnNote}>{e.note}</div>
        </div>
      ))}

      <h2>Parameters &amp; defaults</h2>
      <p>
        These defaults are the{' '}
        <strong>authors&rsquo; illustrative figure values — not empirical estimates</strong>. Treat
        them as a starting point for exploration, not a measurement of the world.
      </p>
      <table className={s.table}>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Meaning</th>
            <th>Default</th>
            <th>Source / note</th>
          </tr>
        </thead>
        <tbody>
          {PARAM_META.map((m) => (
            <tr key={m.key}>
              <td>
                <code>{m.symbol}</code>
              </td>
              <td>{m.label}</td>
              <td>
                <code>{String(DEFAULTS[m.key])}</code>
              </td>
              <td>{m.citation}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>The dynamic layer: destination faithful, path illustrative</h2>
      <p>
        The paper is <strong>static</strong> — a one-shot equilibrium with no time. The animated
        time-series is our stylized stock-flow wrapper. Its{' '}
        <strong>steady state equals the paper&rsquo;s exact equilibrium</strong>; the transition
        between states is illustrative. It is stable by construction: the equilibrium automation
        rate is independent of the demand level (demand cancels from the firm&rsquo;s decision —
        which is also why raising autonomous demand, like a UBI, does not change automation here),
        so there is no runaway spiral, only an honest transient dip-and-recover as automation races
        reabsorption. We never present a transient dip as the paper&rsquo;s prediction.
      </p>

      <h2>Two modeling choices worth stating</h2>
      <p>
        <strong>Flexible wages.</strong> The &ldquo;sticky wages&rdquo; off-switch, when turned off,
        models a world where wages adjust so there is no demand shortfall — we represent that as
        full reabsorption (η = 1), which sends the externality, and the over-automation wedge, to
        zero. If you believe wages clear the market, the result here vanishes, and the tool shows
        you exactly that.
      </p>
      <p>
        <strong>Corner cases.</strong> The clean tax τ* = ℓ(1 − 1/N) restores the optimum only in
        the interior regime. When automation is capped at 1, the tool solves for the
        optimum-restoring tax numerically, so the &ldquo;set optimum-restoring tax&rdquo; control is
        correct at the boundaries too.
      </p>

      <h2>What the numbers mean (and don&rsquo;t)</h2>
      <p>
        The model is <strong>stylized and normalized</strong>: a single sector of N firms, the wage
        set to 1, and the authors&rsquo; illustrative parameters. The on-screen figures are
        therefore <strong>shares within that sector</strong>, not national statistics.
        &ldquo;Workers displaced&rdquo; is the share of this sector&rsquo;s jobs automated and not
        re-hired — <em>not</em> the unemployment rate (which sits near 5% at &ldquo;full
        employment&rdquo;). &ldquo;Corporate profits&rdquo; are a share of the most the sector could
        earn. Read the <strong>gap between the free market and the efficient level</strong> — its
        direction and relative size — as the result, not the absolute levels. Calibrating to
        real-world magnitudes is deliberately out of scope for this hero model; that is the job of a
        separate grounding layer, and even then only as a directional sign check, never a forecast.
      </p>

      <div className={s.callout}>
        For the strongest objections to this model — and our honest answers — see the{' '}
        <a href="/limitations">limitations page</a>. For what each policy does in this model, use
        the Policies panel on the <a href="/">model</a> itself.
      </div>
    </ContentPage>
  );
}
