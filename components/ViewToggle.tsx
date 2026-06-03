'use client';
import type { View } from '@/lib/engine';
import styles from './Controls.module.css';

const OPTIONS: { value: View; label: string }[] = [
  { value: 'timeseries', label: 'Over time' },
  { value: 'hill', label: 'The big picture' },
];

export function ViewToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <div className={styles.seg} role="group" aria-label="Chart view">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={view === o.value}
          className={`${styles.segBtn} ${view === o.value ? styles.segActive : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
