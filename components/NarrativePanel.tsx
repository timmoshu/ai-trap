'use client';
import Link from 'next/link';
import { getSector } from '@/lib/sectors';
import styles from './NarrativePanel.module.css';

/**
 * "In plain terms" — tells the cascade story for a chosen sector with the comparative numbers
 * wired live. Strictly mechanism + comparative: NO absolute job counts, dollars, or GDP. The
 * guardrail line is non-negotiable (this model cannot speak to net job loss).
 */
export function NarrativePanel({
  sectorId,
  neePct,
  coPct,
  taxOn,
}: {
  sectorId: string;
  neePct: number;
  coPct: number;
  taxOn: boolean;
}) {
  const s = getSector(sectorId);
  const nee = Math.round(neePct);
  const co = Math.round(coPct);
  const gap = nee - co;

  let body: React.ReactNode;
  if (gap < -0.5) {
    body = (
      <>
        Picture every <strong>{s.firm}</strong>. Here {s.workers} are re-hired at better pay faster
        than AI displaces them, so the usual trap <strong>reverses</strong>: firms automate{' '}
        <strong>{nee}%</strong> of {s.work}-handling tasks — <em>less</em> than the{' '}
        <strong>{co}%</strong> that would maximize their combined profit. The over-automation
        problem disappears.
      </>
    );
  } else if (gap <= 0.5) {
    body = taxOn ? (
      <>
        Picture every <strong>{s.firm}</strong>. With the automation tax on, they automate{' '}
        <strong>{nee}%</strong> of {s.work}-handling tasks — right at the <strong>{co}%</strong>{' '}
        that earns them the most <em>combined</em> profit. The gap closes: more {s.workers} keep
        their jobs <em>and</em> the firms are collectively better off. Same {s.work}, better
        outcome.
      </>
    ) : (
      <>
        Picture every <strong>{s.firm}</strong>. Here there&apos;s no trap — they automate{' '}
        <strong>{nee}%</strong> of {s.work}-handling tasks, already at the <strong>{co}%</strong>{' '}
        that earns the most combined profit. (Try adding competitors, or slowing how fast{' '}
        {s.workers} find new work, to open the gap.)
      </>
    );
  } else {
    body = (
      <>
        Picture every <strong>{s.firm}</strong>: each races to cut costs with AI. In this model they
        automate <strong>{nee}%</strong> of {s.work}-handling tasks — but the level that earns them
        the most <em>combined</em> profit is only <strong>{co}%</strong>. The same {s.work} still
        get done. Yet because each firm&apos;s layoffs shrink the spending its rivals depend on,
        they all end up <strong>less profitable</strong> than if they&apos;d held back — and{' '}
        {s.workers} lose pay. That <strong>{gap}-point</strong> gap is the trap. Turn on the
        automation tax to pull them back toward {co}%.
      </>
    );
  }

  return (
    <aside className={styles.panel} aria-label={`In plain terms: ${s.label}`}>
      <div className={styles.tag}>In plain terms</div>
      <p className={styles.body}>{body}</p>
      <p className={styles.guard}>
        The same {s.work} still get done — this is{' '}
        <strong>over-automation within one sector</strong>, not a forecast of net job loss or a
        shrinking economy. Output (supply) is held fixed: automation changes cost and who earns, not
        how much is produced. <Link href="/method">How this works →</Link>
      </p>
    </aside>
  );
}
