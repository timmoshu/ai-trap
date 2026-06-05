import Link from 'next/link';
import styles from './WhatIfTabs.module.css';

/**
 * The menu of beyond-the-paper "what-if" explorations, shown prominently at the top of every what-if
 * page so the set is discoverable and you can switch between them. The current page is highlighted.
 * Add a new what-if here once and it appears on all of them.
 */
const TABS = [
  {
    key: 'jevons',
    href: '/what-if',
    label: 'Cheaper goods grow the market',
    sub: 'Jevons · output expansion',
  },
  {
    key: 'pricing',
    href: '/pricing-power',
    label: 'Firms steal market share',
    sub: 'Pricing power · first-mover',
  },
] as const;

export type WhatIfKey = (typeof TABS)[number]['key'];

export function WhatIfTabs({ active }: { active: WhatIfKey }) {
  return (
    <nav className={styles.wrap} aria-label="Beyond-the-paper what-if explorations">
      <span className={styles.eyebrow}>
        Beyond-the-paper what-ifs <span className={styles.count}>· {TABS.length}</span>
      </span>
      <div className={styles.row}>
        {TABS.map((t) => {
          const isActive = t.key === active;
          return (
            <Link
              key={t.key}
              href={t.href}
              aria-current={isActive ? 'page' : undefined}
              className={`${styles.tab} ${isActive ? styles.active : ''}`}
            >
              <span className={styles.label}>{t.label}</span>
              <span className={styles.sub}>{t.sub}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default WhatIfTabs;
