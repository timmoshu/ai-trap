'use client';
import { useEffect, useState, type ReactNode } from 'react';
import styles from './MobileControls.module.css';

/**
 * Mobile-only controls drawer: a slide-up bottom sheet that floats over the charts, with the live
 * readout pinned at its top so you watch the over-automation gap respond as you drag a lever — no
 * scroll-back-and-forth. Hidden on desktop (the aside takes over there). Hosts the SAME
 * ControlsContent as desktop, so there is one control layout to maintain.
 */
export function MobileControls({ readout, children }: { readout: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  // Lock body scroll while the sheet is open; close on Escape.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(true)}
        aria-expanded={open}
      >
        ⚙ Adjust the model
      </button>

      <div
        className={`${styles.scrim} ${open ? styles.scrimOpen : ''}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <div
        className={`${styles.sheet} ${open ? styles.sheetOpen : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Model controls"
      >
        <div className={styles.head}>
          <span className={styles.handle} aria-hidden="true" />
          <button type="button" className={styles.done} onClick={() => setOpen(false)}>
            Done
          </button>
        </div>
        <div className={styles.readout}>{readout}</div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
