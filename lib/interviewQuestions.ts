// Interview question bank used by the AI skill assessment.
// Questions are organised by trade. The interview screen picks a balanced
// subset based on the pro's selected skills (catalog_skills.trade), so
// the same code works for any catalog without UI hardcoding.

export type MCQOption = {
  id: string;
  text: string;
};

export type MCQQuestion = {
  id: string;
  trade: string;
  prompt: string;
  options: MCQOption[];
  correctOptionId: string;
  explanation?: string;
};

export const QUESTION_BANK: MCQQuestion[] = [
  // ── Electrical ──────────────────────────────────────────────────────────
  {
    id: 'e1',
    trade: 'electrical',
    prompt: 'A ceiling fan is humming but not spinning. What is the most likely fault?',
    options: [
      { id: 'a', text: 'Burnt-out winding' },
      { id: 'b', text: 'Faulty capacitor' },
      { id: 'c', text: 'Loose blade screws' },
      { id: 'd', text: 'Low voltage from the supply' },
    ],
    correctOptionId: 'b',
    explanation: 'A humming fan that does not start almost always points to a failed starting capacitor.',
  },
  {
    id: 'e2',
    trade: 'electrical',
    prompt: 'Which protective device trips on a current imbalance between live and neutral?',
    options: [
      { id: 'a', text: 'MCB' },
      { id: 'b', text: 'Fuse' },
      { id: 'c', text: 'RCCB / ELCB' },
      { id: 'd', text: 'Isolator' },
    ],
    correctOptionId: 'c',
    explanation: 'An RCCB / ELCB compares live and neutral currents and trips on any leakage to earth.',
  },
  {
    id: 'e3',
    trade: 'electrical',
    prompt: 'For a 5 kW domestic load, which cable size is most appropriate?',
    options: [
      { id: 'a', text: '0.75 sq mm' },
      { id: 'b', text: '1.5 sq mm' },
      { id: 'c', text: '4 sq mm' },
      { id: 'd', text: '16 sq mm' },
    ],
    correctOptionId: 'c',
    explanation: '5 kW at 230 V draws ~22 A; 4 sq mm copper safely handles this with margin.',
  },

  // ── AC / Refrigeration ──────────────────────────────────────────────────
  {
    id: 'a1',
    trade: 'ac',
    prompt: 'An AC blows air but does not cool. The outdoor unit is running. What is the first thing to check?',
    options: [
      { id: 'a', text: 'Indoor blower motor' },
      { id: 'b', text: 'Refrigerant pressure' },
      { id: 'c', text: 'Remote batteries' },
      { id: 'd', text: 'Drain pipe' },
    ],
    correctOptionId: 'b',
    explanation: 'Compressor running but no cooling = check refrigerant charge / pressure first.',
  },
  {
    id: 'a2',
    trade: 'ac',
    prompt: 'Which refrigerant is most commonly used in modern split ACs sold in India?',
    options: [
      { id: 'a', text: 'R-22' },
      { id: 'b', text: 'R-410A' },
      { id: 'c', text: 'R-32' },
      { id: 'd', text: 'R-134a' },
    ],
    correctOptionId: 'c',
    explanation: 'R-32 has overtaken R-410A in new Indian split units because of better efficiency and lower GWP.',
  },
  {
    id: 'a3',
    trade: 'ac',
    prompt: 'An AC is icing up on the indoor coil. Most likely cause?',
    options: [
      { id: 'a', text: 'Overcharged refrigerant' },
      { id: 'b', text: 'Dirty filter / low airflow' },
      { id: 'c', text: 'Faulty remote' },
      { id: 'd', text: 'High ambient temperature' },
    ],
    correctOptionId: 'b',
    explanation: 'Restricted airflow drops coil temperature below 0°C and causes icing. Always clean filters first.',
  },

  // ── Plumbing ────────────────────────────────────────────────────────────
  {
    id: 'p1',
    trade: 'plumbing',
    prompt: 'A tap is dripping even when fully closed. Which part should be replaced first?',
    options: [
      { id: 'a', text: 'Spout' },
      { id: 'b', text: 'Washer / cartridge' },
      { id: 'c', text: 'Water meter' },
      { id: 'd', text: 'Stop valve' },
    ],
    correctOptionId: 'b',
    explanation: 'A worn washer (or ceramic cartridge in modern taps) is the standard fix for a dripping tap.',
  },
  {
    id: 'p2',
    trade: 'plumbing',
    prompt: 'A blocked drain in a kitchen sink is best cleared first with…',
    options: [
      { id: 'a', text: 'Strong acid down the drain' },
      { id: 'b', text: 'A plunger and hot water' },
      { id: 'c', text: 'A hammer on the trap' },
      { id: 'd', text: 'Opening the main water valve' },
    ],
    correctOptionId: 'b',
    explanation: 'Always start with mechanical methods (plunger / drain snake + hot water) before harsh chemicals.',
  },
  {
    id: 'p3',
    trade: 'plumbing',
    prompt: 'Which fitting is used to join two pipes that need to be disconnected later?',
    options: [
      { id: 'a', text: 'Elbow' },
      { id: 'b', text: 'Tee' },
      { id: 'c', text: 'Union' },
      { id: 'd', text: 'Reducer' },
    ],
    correctOptionId: 'c',
    explanation: 'A union has a removable nut that lets you detach pipes without cutting them.',
  },

  // ── Washing Machine ─────────────────────────────────────────────────────
  {
    id: 'w1',
    trade: 'appliance',
    prompt: 'A front-load washing machine drum will not spin during the spin cycle. First thing to check?',
    options: [
      { id: 'a', text: 'Door latch / safety switch' },
      { id: 'b', text: 'Drum bearing' },
      { id: 'c', text: 'Motor brushes' },
      { id: 'd', text: 'Detergent drawer' },
    ],
    correctOptionId: 'a',
    explanation: 'Front-loaders refuse to spin unless the door switch confirms the door is shut.',
  },
  {
    id: 'w2',
    trade: 'appliance',
    prompt: 'A fridge is cold in the freezer but warm in the lower section. Most likely cause?',
    options: [
      { id: 'a', text: 'Door gasket leak' },
      { id: 'b', text: 'Blocked vent / fan failure between sections' },
      { id: 'c', text: 'Bulb has fused' },
      { id: 'd', text: 'Compressor relay' },
    ],
    correctOptionId: 'b',
    explanation: 'On frost-free fridges, cold from the freezer is blown into the fresh-food compartment by a fan. A blocked vent or failed fan is the usual cause.',
  },
  {
    id: 'w3',
    trade: 'appliance',
    prompt: 'A microwave runs but does not heat. Safest first check?',
    options: [
      { id: 'a', text: 'Replace the magnetron immediately' },
      { id: 'b', text: 'Discharge the high-voltage capacitor before testing further' },
      { id: 'c', text: 'Replace the turntable motor' },
      { id: 'd', text: 'Run it with the door open' },
    ],
    correctOptionId: 'b',
    explanation: 'Microwave HV capacitors can hold a lethal charge after unplugging. Always discharge first.',
  },

  // ── General / Safety ────────────────────────────────────────────────────
  {
    id: 'g1',
    trade: 'general',
    prompt: 'Before working on any wiring at a customer\'s home, the first safety step is…',
    options: [
      { id: 'a', text: 'Switch off the relevant MCB and verify with a tester' },
      { id: 'b', text: 'Wear gloves and start working' },
      { id: 'c', text: 'Tell the customer to leave the room' },
      { id: 'd', text: 'Photograph the panel' },
    ],
    correctOptionId: 'a',
    explanation: 'Isolate the circuit at the MCB and confirm dead with a tested tester — never assume.',
  },
  {
    id: 'g2',
    trade: 'general',
    prompt: 'A customer disputes the AI diagnosis on arrival. The correct response is…',
    options: [
      { id: 'a', text: 'Insist the AI is right and proceed' },
      { id: 'b', text: 'Inspect, explain in plain language, and update the diagnosis in the app' },
      { id: 'c', text: 'Refuse the job' },
      { id: 'd', text: 'Charge a higher fee for the conflict' },
    ],
    correctOptionId: 'b',
    explanation: 'Trust is built by transparent inspection and clear updates — the platform records the correction for future training.',
  },
  {
    id: 'g3',
    trade: 'general',
    prompt: 'You arrive but the customer is not at home. What should you do?',
    options: [
      { id: 'a', text: 'Leave immediately and decline the job' },
      { id: 'b', text: 'Wait the standard grace period, contact the customer, and update status in the app' },
      { id: 'c', text: 'Force entry to start the job' },
      { id: 'd', text: 'Mark the job complete' },
    ],
    correctOptionId: 'b',
    explanation: 'Wait the grace period, attempt contact, and log the no-show via the app for support to resolve.',
  },
];

// Map catalog_skills.trade → bucket used in the bank. Falls back to 'general'.
const TRADE_MAP: Record<string, string> = {
  electrical: 'electrical',
  electrician: 'electrical',
  power: 'electrical',
  ac: 'ac',
  hvac: 'ac',
  refrigeration: 'ac',
  cooling: 'ac',
  plumbing: 'plumbing',
  plumber: 'plumbing',
  appliance: 'appliance',
  appliances: 'appliance',
  whitegoods: 'appliance',
  washing: 'appliance',
  refrigerator: 'appliance',
};

const normaliseTrade = (raw: string) => TRADE_MAP[raw.toLowerCase().trim()] ?? raw.toLowerCase().trim();

export const selectInterviewQuestions = (
  selectedTrades: string[],
  count = 5
): MCQQuestion[] => {
  const buckets = new Set(selectedTrades.map(normaliseTrade));
  // Always sprinkle in general/safety questions.
  buckets.add('general');

  const eligible = QUESTION_BANK.filter((q) => buckets.has(q.trade));
  const pool = eligible.length > 0 ? eligible : QUESTION_BANK;

  // Shuffle deterministically-ish using a Fisher–Yates with Math.random.
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
};
