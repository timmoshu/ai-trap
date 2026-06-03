import Link from 'next/link';
import { Footer } from './Footer';
import styles from './Prose.module.css';

export function ContentPage({
  title,
  lede,
  children,
}: {
  title: string;
  lede?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <Link href="/" className={styles.brand}>
          The AI Trap
        </Link>
        <nav className={styles.nav}>
          <Link href="/">Model</Link>
          <Link href="/method">Method</Link>
          <Link href="/limitations">Limitations</Link>
        </nav>
      </header>
      <article className={styles.prose}>
        <h1>{title}</h1>
        {lede && <p className={styles.lede}>{lede}</p>}
        {children}
      </article>
      <Footer />
    </div>
  );
}

export { styles as proseStyles };
