/**
 * Sector presets for the "Make it real" relatability mode.
 *
 * IMPORTANT: these are NARRATIVE FLAVOR ONLY — a set of nouns to make the mechanism concrete.
 * They carry NO data (no headcount, no wage, no automation rate). The model's automation level is
 * always the user's slider; a sector never infers it. This is deliberate: it keeps the tool away
 * from any "AI will destroy N jobs" claim, which this single-sector model cannot support.
 */
export interface Sector {
  id: string;
  label: string;
  firm: string; // "every call center"
  workers: string; // "agents lose pay"
  work: string; // "customer calls still get handled"
}

export const SECTORS: Sector[] = [
  {
    id: 'callcenter',
    label: 'Call centers',
    firm: 'call center',
    workers: 'agents',
    work: 'customer calls',
  },
  {
    id: 'trucking',
    label: 'Trucking',
    firm: 'trucking firm',
    workers: 'drivers',
    work: 'deliveries',
  },
  {
    id: 'retail',
    label: 'Retail checkout',
    firm: 'retailer',
    workers: 'cashiers',
    work: 'checkouts',
  },
  {
    id: 'bookkeeping',
    label: 'Bookkeeping',
    firm: 'accounting firm',
    workers: 'bookkeepers',
    work: 'the books',
  },
  {
    id: 'legal',
    label: 'Legal support',
    firm: 'law firm',
    workers: 'paralegals',
    work: 'document review',
  },
  { id: 'fastfood', label: 'Fast food', firm: 'restaurant', workers: 'crew', work: 'orders' },
  {
    id: 'warehouse',
    label: 'Warehousing',
    firm: 'warehouse',
    workers: 'pickers',
    work: 'orders shipped',
  },
  {
    id: 'support',
    label: 'Software support',
    firm: 'software company',
    workers: 'support reps',
    work: 'support tickets',
  },
];

export const DEFAULT_SECTOR = SECTORS[0];

export const getSector = (id: string): Sector => SECTORS.find((s) => s.id === id) ?? DEFAULT_SECTOR;
