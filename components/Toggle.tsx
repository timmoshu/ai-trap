'use client';
import styles from './Controls.module.css';

export function Toggle({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className={styles.toggleRow}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-desc` : undefined}
        className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className={styles.knob} />
      </button>
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div className={styles.toggleLabel} onClick={() => onChange(!checked)}>
        <span id={`${id}-label`}>{label}</span>
        {description && (
          <span id={`${id}-desc`} className={styles.toggleDesc}>
            {description}
          </span>
        )}
      </div>
    </div>
  );
}
