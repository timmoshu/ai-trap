import type { Metadata } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Mono, Newsreader } from 'next/font/google';
import '@/styles/globals.css';

const sans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans-loaded',
  display: 'swap',
});
const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono-loaded',
  display: 'swap',
});
const serif = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-serif-loaded',
  display: 'swap',
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: 'The AI Trap — a living model of the AI layoff trap',
  description:
    'A faithful, transparent simulator of "The AI Layoff Trap" (Falk & Tsoukalas). Watch competing firms over-automate past the point of maximum profit — and discover the tax that fixes it.',
  metadataBase: new URL('https://the-ai-trap.vercel.app'),
  openGraph: {
    title: 'The AI Trap',
    description:
      'Firms automate past the point of maximum profit — and the more competitors, the worse they overshoot. Play with the model.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
