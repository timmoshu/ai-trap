'use client';
import type { Scenario } from '@/lib/engine';
import { ParameterPanel } from './ParameterPanel';
import { Toggle } from './Toggle';
import { PolicyControls } from './PolicyControls';
import { Slider } from './Slider';
import styles from './ModelApp.module.css';
import panel from './Panel.module.css';

/**
 * The full set of model controls, shared verbatim between the desktop aside and the mobile drawer
 * (so there is one control layout to maintain, not two). Both mount points read the same scenario
 * and call the same update, so they stay in sync.
 */
export function ControlsContent({
  scenario,
  update,
  optimumTax,
}: {
  scenario: Scenario;
  update: (patch: Partial<Scenario>) => void;
  optimumTax: number;
}) {
  return (
    <>
      <ParameterPanel scenario={scenario} update={update} />

      <section className={panel.panel}>
        <h2 className={panel.title}>Assumption you can switch off</h2>
        <Toggle
          id="toggle-wage"
          label="Sticky wages (pay can't fall)"
          description={
            scenario.wageRigid
              ? "On: pay can't fall, so a laid-off worker can't re-price into a new job — they stay unemployed, and their lost wages are lost spending for everyone. That demand hole is the trap. Turn it off to see it vanish."
              : 'Off: wages adjust until displaced workers are re-absorbed into other work, so their income returns and the demand hole closes. This is the idealized full-reabsorption case (η = 100%) — re-hiring at lower pay restores only part of it, which is what the η slider sets.'
          }
          checked={scenario.wageRigid}
          onChange={(v) => update({ wageRigid: v })}
        />
      </section>

      <PolicyControls scenario={scenario} update={update} optimumTax={optimumTax} />

      <details className={styles.advanced}>
        <summary>Advanced — speed of the transition (illustrative)</summary>
        <div className={styles.advancedBody}>
          <Slider
            id="dyn-speed"
            label="How fast firms automate"
            symbol="σ"
            value={scenario.adjustmentSpeed}
            min={0.02}
            max={1}
            step={0.01}
            onChange={(v) => update({ adjustmentSpeed: v })}
            format={(v) => v.toFixed(2)}
            illustrative
            citation="Pace of the change only — the end point (the paper's equilibrium) is unchanged."
          />
          <Slider
            id="dyn-reab"
            label="How fast laid-off workers are re-hired"
            symbol="ρ"
            value={scenario.reabsorptionRate}
            min={0.02}
            max={1}
            step={0.01}
            onChange={(v) => update({ reabsorptionRate: v })}
            format={(v) => v.toFixed(2)}
            illustrative
            citation="Pace of re-hiring only — slower re-hiring deepens the dip but the end point is unchanged."
          />
        </div>
      </details>
    </>
  );
}
