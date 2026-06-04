import type { Metadata } from 'next';
import { ContentPage, proseStyles as s } from '@/components/ContentPage';

export const metadata: Metadata = {
  title: 'Limitations — The AI Trap',
  description:
    'The strongest objections to this model — and our honest answers. Scope, assumptions, another view, and what the model is silent on.',
};

const OBJECTIONS: { q: string; tag: string; a: React.ReactNode }[] = [
  {
    q: 'Isn’t animating a static model dishonest?',
    tag: 'fair',
    a: (
      <>
        The underlying paper has no time. Our animation&rsquo;s{' '}
        <strong>steady state is the paper&rsquo;s exact equilibrium</strong>; the path between
        states is explicitly labeled illustrative. Any future real-data overlay is a separate
        accounting layer — a directional sign check, never validation and never a forecast.
      </>
    ),
  },
  {
    q: 'The result is baked in by assuming sticky wages.',
    tag: 'fair',
    a: (
      <>
        Correct that it depends on wage rigidity — so we made it a first-class off-switch. Turn on
        flexible wages and the demand externality, and the over-automation wedge, vanish. We hand
        you the switch that turns the result off.
      </>
    ),
  },
  {
    q: 'It ignores that automation raises productivity and creates new jobs.',
    tag: 'scope',
    a: (
      <>
        Deliberately. This model isolates a single demand-spillover channel and is{' '}
        <strong>silent on whether automation is net-good</strong>. It omits the productivity and
        new-task (reinstatement) effects of Acemoglu &amp; Restrepo (2018, 2019); with those, the
        net effect can be positive. We are not making that call here.
      </>
    ),
  },
  {
    q: 'You’re equating AI exposure with layoffs.',
    tag: 'fair',
    a: (
      <>
        We are not. The current tool does not ingest exposure data at all — α is a parameter you set
        directly, never inferred from layoffs. The planned personal layer will keep exposure (an
        upper bound on task overlap) separate from any realized-layoff rate via a low-default,
        user-controlled haircut.
      </>
    ),
  },
  {
    q: 'Why would more competition make automation worse?',
    tag: 'within-model',
    a: (
      <>
        It&rsquo;s an atomistic externality — think of N firms drawing down a shared pool of demand,
        each ignoring the share of the loss it imposes on the others. With more firms, each
        internalizes less of the harm. The wedge is exactly zero at N = 1 (a monopoly is efficient
        here) and grows with N. Robust within the model&rsquo;s assumptions.
      </>
    ),
  },
  {
    q: 'A central bank would offset the demand shortfall.',
    tag: 'partly',
    a: (
      <>
        The model assumes no monetary offset. If you believe policy fully stabilizes demand, set
        reabsorption (η) high to approximate that — and watch the externality shrink toward zero.
      </>
    ),
  },
  {
    q: 'This is just advocacy for a robot tax.',
    tag: 'partly',
    a: (
      <>
        The tax is <strong>off by default</strong> and never auto-applied; you discover it. We
        concede the circularity openly: a Pigouvian tax is the textbook fix for a problem the model
        <em> defines</em> as a Pigouvian externality. We also show that a policy raising
        reabsorption (η) would shrink the externality through the same channel — the tax is not the
        only lever.
      </>
    ),
  },
  {
    q: 'It’s an unrefereed preprint.',
    tag: 'fair',
    a: (
      <>
        It is — arXiv:2603.20617, not yet peer-reviewed, and we say so plainly. Our job is to
        simulate it <em>faithfully</em> and transparently, treating its claims as hypotheses you can
        inspect, not as settled fact. The equations are on the <a href="/method">method page</a> for
        you to check.
      </>
    ),
  },
];

export default function LimitationsPage() {
  return (
    <ContentPage
      title="Limitations & self-critique"
      lede="We state the scope and the strongest objections ourselves, before anyone else does. This is the credibility of the tool, not a disclaimer buried in a footer."
    >
      <h2>What this model does — and does not — claim</h2>
      <p>
        It asks <strong>one narrow question</strong>: given that automation happens and creates a
        demand spillover, do competing firms automate more than is collectively optimal? Within its
        world, the answer — and the corrective tax — are exact.
      </p>
      <p>
        It does <strong>not</strong> claim automation is bad for the economy. It assumes a
        demand-constrained, sticky-wage world with no central-bank offset. Change those assumptions
        with the off-switches and the result shrinks or disappears — by design.
      </p>

      <h2>Objections we take seriously</h2>
      {OBJECTIONS.map((o) => (
        <details key={o.q} className={s.qa}>
          <summary>
            {o.q}
            <span className={s.legit}>{o.tag}</span>
          </summary>
          <div className={s.answer}>{o.a}</div>
        </details>
      ))}

      <h2>Another view: Chad Jones</h2>
      <p>
        The strongest good-faith counter is the <strong>weak-links / reinstatement</strong> view
        associated with{' '}
        <a
          href="https://www.youtube.com/watch?v=xBpGn3BDcOY"
          target="_blank"
          rel="noopener noreferrer"
        >
          Chad Jones
        </a>
        : over a long enough horizon, displaced labor reallocates into new and complementary tasks,
        reabsorption rises (η ≥ 1), and the trap dissolves — or reverses into under-automation. In
        this tool that corresponds to pushing the reabsorption slider to 1 and beyond, where the
        wedge hits zero and then flips sign.
      </p>
      <p>
        We present our result as a <strong>transitional friction</strong>, not a refutation of that
        long-run reallocation. The model does not adjudicate which force wins; it shows you the dial
        between them and lets you decide where you think the world sits. You can also explore the
        output-expansion (Jevons) side of that argument in the <a href="/what-if">what-if</a> — an
        illustrative extension that relaxes the paper&apos;s fixed-output assumption.
      </p>

      <h2>Where this sits</h2>
      <p>
        This complements, and does not replace, richer macro-labor models. Its strength is
        transparency: closed-form equations you can read, defaults with citations, assumptions you
        can switch off, and a reference implementation you can check. The safest one-line framing is
        a Pigouvian-tax response to an aggregate-demand externality, built on the Acemoglu–Restrepo
        task model, in the robot-tax tradition of Guerreiro–Rebelo–Teles and Costinot–Werning.
      </p>

      <div className={s.callout}>
        Found something wrong? That is the point of publishing the math. See the{' '}
        <a href="/method">equations</a>, then tell us where it breaks.
      </div>
    </ContentPage>
  );
}
