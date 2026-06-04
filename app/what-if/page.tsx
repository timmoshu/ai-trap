import type { Metadata } from 'next';
import { WhatIf } from '@/components/WhatIf';

export const metadata: Metadata = {
  title: 'What if? — The AI Trap',
  description:
    "Beyond the paper: if automation makes goods cheaper and demand expands (the Jevons / Jones effect), automation can need more workers, not fewer. An illustrative extension exploring when output growth outpaces displacement — not the authors' result.",
};

export default function WhatIfPage() {
  return <WhatIf />;
}
