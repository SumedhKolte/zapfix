// Fixed-price common issues per Quick Category.
// Prices in paise to match the jobs.escrow_amount / paid_amount columns.

export type FixedIssue = {
  key: string;          // stable identifier persisted to jobs.fixed_issue_key
  title: string;
  description: string;
  icon: string;         // Ionicons name
  pricePaise: number;
};

export type CategoryCatalog = {
  category: string;     // matches the label used on the home screen
  issues: FixedIssue[];
};

const rupees = (r: number) => r * 100;

export const CATEGORY_CATALOG: Record<string, CategoryCatalog> = {
  'AC Repair': {
    category: 'AC Repair',
    issues: [
      { key: 'ac_gas_refill',     title: 'Gas refill (1.5T split)', description: 'Top-up coolant when AC is not cooling', icon: 'snow',         pricePaise: rupees(2499) },
      { key: 'ac_service',        title: 'General service',         description: 'Deep cleaning of filter & coils',       icon: 'sparkles',     pricePaise: rupees(499) },
      { key: 'ac_water_leak',     title: 'Water leakage fix',       description: 'Indoor unit dripping water',            icon: 'water',        pricePaise: rupees(399) },
      { key: 'ac_remote',         title: 'Remote not working',      description: 'Replace or re-pair the remote',         icon: 'radio',        pricePaise: rupees(299) },
    ],
  },
  'Electrical': {
    category: 'Electrical',
    issues: [
      { key: 'elec_switchboard',  title: 'Switchboard repair',      description: 'Loose, sparking, or dead switches',     icon: 'apps',         pricePaise: rupees(249) },
      { key: 'elec_short_circuit',title: 'Short circuit fix',       description: 'Tripping MCB or burnt smell',           icon: 'flash',        pricePaise: rupees(499) },
      { key: 'elec_fan_install',  title: 'Fan installation',        description: 'Mount and wire a ceiling/wall fan',     icon: 'sync',         pricePaise: rupees(349) },
      { key: 'elec_mcb',          title: 'MCB / fuse replacement',  description: 'Replace tripped MCB or blown fuse',     icon: 'pulse',        pricePaise: rupees(299) },
    ],
  },
  'Plumbing': {
    category: 'Plumbing',
    issues: [
      { key: 'plumb_tap_leak',    title: 'Tap leakage',             description: 'Dripping kitchen or bathroom tap',      icon: 'water-outline',pricePaise: rupees(249) },
      { key: 'plumb_drain',       title: 'Drain unclogging',        description: 'Slow or blocked sink/floor drain',      icon: 'arrow-down',   pricePaise: rupees(399) },
      { key: 'plumb_flush',       title: 'Flush tank repair',       description: 'Continuous water, weak flush',          icon: 'refresh',      pricePaise: rupees(499) },
      { key: 'plumb_pipe',        title: 'Pipe fitting',            description: 'Replace or fit a leaking pipe',         icon: 'git-branch',   pricePaise: rupees(599) },
    ],
  },
  'Washing': {
    category: 'Washing',
    issues: [
      { key: 'wash_drum',         title: 'Drum not spinning',       description: 'Motor or belt issue',                   icon: 'sync',         pricePaise: rupees(599) },
      { key: 'wash_drain',        title: 'Water not draining',      description: 'Drain pump or hose blocked',            icon: 'water',        pricePaise: rupees(449) },
      { key: 'wash_service',      title: 'Full service',            description: 'Deep clean, descale, inspect',          icon: 'sparkles',     pricePaise: rupees(699) },
    ],
  },
  'Refrigerator': {
    category: 'Refrigerator',
    issues: [
      { key: 'fridge_not_cooling',title: 'Not cooling',             description: 'Compressor or gas inspection',          icon: 'snow',         pricePaise: rupees(799) },
      { key: 'fridge_seal',       title: 'Door seal replacement',   description: 'Loose or worn rubber gasket',           icon: 'magnet',       pricePaise: rupees(399) },
      { key: 'fridge_noise',      title: 'Excess noise',            description: 'Fan or compressor diagnosis',           icon: 'volume-high',  pricePaise: rupees(499) },
    ],
  },
  'Geyser': {
    category: 'Geyser',
    issues: [
      { key: 'geyser_element',    title: 'Element replacement',     description: 'Heating element burnt out',             icon: 'flame',        pricePaise: rupees(699) },
      { key: 'geyser_no_hot',     title: 'No hot water diagnosis',  description: 'On-site fault identification',          icon: 'thermometer',  pricePaise: rupees(299) },
      { key: 'geyser_install',    title: 'Installation',            description: 'Mount and connect a new geyser',        icon: 'construct',    pricePaise: rupees(799) },
    ],
  },
};

export const getCategoryCatalog = (category: string): CategoryCatalog | null =>
  CATEGORY_CATALOG[category] ?? null;

export const findFixedIssue = (key: string): { category: string; issue: FixedIssue } | null => {
  for (const cat of Object.values(CATEGORY_CATALOG)) {
    const match = cat.issues.find((i) => i.key === key);
    if (match) return { category: cat.category, issue: match };
  }
  return null;
};
