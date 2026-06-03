import Link from 'next/link';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.line}>
        <span>
          Faithfully simulates Falk &amp; Tsoukalas,{' '}
          <a href="https://arxiv.org/abs/2603.20617" target="_blank" rel="noreferrer">
            &ldquo;The AI Layoff Trap&rdquo;
          </a>{' '}
          — an unrefereed preprint. Destination faithful, path illustrative.
        </span>
      </div>
      <div className={styles.links}>
        <Link href="/method">Method &amp; equations</Link>
        <Link href="/limitations">Limitations</Link>
        <span className={styles.tag}>you can check the math</span>
      </div>
    </footer>
  );
}
