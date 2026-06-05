import type { Metadata } from 'next';
import { PricingPower } from '@/components/PricingPower';

export const metadata: Metadata = {
  title: 'Pricing power? — The AI Trap',
  description:
    "Beyond the paper: if an early automator can undercut rivals and steal market share, firms automate even harder — and past a little pricing power the share race leaves the whole industry less profitable than never automating. An illustrative extension (composing Fudenberg & Tirole 1985 with the paper) — not the authors' result.",
};

export default function PricingPowerPage() {
  return <PricingPower />;
}
