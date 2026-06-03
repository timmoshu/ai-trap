# The AI Trap

A free, transparent, browser-based simulator of **"The AI Layoff Trap"** (Falk & Tsoukalas, [arXiv:2603.20617](https://arxiv.org/abs/2603.20617)): competing firms automate **past the point of maximum profit**, because each layoff shrinks the demand every firm sells into while each firm bears only a fraction of the loss. Play with the model, watch the trap unfold over time, and discover the Pigouvian tax that fixes it.

> **Faithfully simulate published research, don't invent economics.** The engine is a verified port of the paper's closed-form model; the time-animation's steady state equals the paper's exact equilibrium ("destination faithful, path illustrative"). Every load-bearing assumption is a visible off-switch, and the limitations are stated up front.

## Status

**Phase A (the hero living model) — built & verified.** Phases B (personal occupation layer) and C (calibrated grounding layer) are gated fast-follows; see `_bmad-output/planning-artifacts/`.

## Run

```bash
npm install
npm run dev            # http://localhost:3000
# or: npm run build && npm run start
```

## Develop

```bash
npm run ci             # banned-words + tsc + eslint + prettier + vitest (the full gate)
npm run test           # vitest only
npm run fixture        # regenerate the engine parity fixture from the Python reference (needs python3)
```

## How it stays honest

- **`engine/layoff_trap.py`** is the independently-verified reference (Gate 0). The production engine (`lib/engine/`) is a pure-TypeScript port, **parity-tested** against a golden fixture across the parameter grid (`lib/engine/parity.test.ts`), plus a **dynamic steady-state invariant** test.
- A **banned-words CI gate** keeps over-claiming language out of the product.
- `/method` shows every equation and cited default; `/limitations` states the scope, the strongest objections with honest answers, and the named opposing view (Chad Jones).

## Stack

Next.js (App Router, TypeScript) on Vercel, **static-first**, deliberately dependency-light: the live engine runs entirely client-side; charts use uPlot; styling is CSS Modules over a design-token sheet; one serverless function (the share-card OG image) arrives with Phase B. See `_bmad-output/planning-artifacts/architecture.md`.

## Structure

```
app/            routes: / (model), /method, /limitations
lib/engine/     verified model: static equations, numeric tax solver, dynamic integrator, scenario-URL
components/     chart wrappers, sliders, panels, pages
engine/         layoff_trap.py (reference) + emit_fixture.py
styles/         global design tokens (Calm Instrument)
_bmad-output/   planning artifacts (brief, PRD, architecture, epics, UX spec)
```

Built solo with Claude Code, in the open.
