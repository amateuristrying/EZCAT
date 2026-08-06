/**
 * EZCAT — Static data layer.
 *
 * This is the single source of truth for reference data (colleges, CAT years,
 * percentile steps) and the sample practice questions. The `Question` shape is
 * intentionally close to what a backend would return, so swapping SAMPLE_QUESTIONS
 * for a fetched array later is a drop-in change.
 */

// ─── Colleges ────────────────────────────────────────────────────────────────

export interface College {
  id: string;
  part1: string;
  part2: string;
}

export const COLLEGES: College[] = [
  { id: 'iim_ahmedabad', part1: 'IIM', part2: 'Ahmedabad' },
  { id: 'iim_bangalore', part1: 'IIM', part2: 'Bangalore' },
  { id: 'iim_calcutta', part1: 'IIM', part2: 'Calcutta' },
  { id: 'iim_lucknow', part1: 'IIM', part2: 'Lucknow' },
  { id: 'iim_kozhikode', part1: 'IIM', part2: 'Kozhikode' },
  { id: 'iim_indore', part1: 'IIM', part2: 'Indore' },
  { id: 'fms_delhi', part1: 'FMS', part2: 'Delhi' },
  { id: 'spjimr_mumbai', part1: 'SPJIMR', part2: 'Mumbai' },
  { id: 'xlri_jamshedpur', part1: 'XLRI', part2: 'Jamshedpur' },
  { id: 'mdi_gurgaon', part1: 'MDI', part2: 'Gurgaon' },
  { id: 'jbims_mumbai', part1: 'JBIMS', part2: 'Mumbai' },
  { id: 'isb_hyderabad', part1: 'ISB', part2: 'Hyderabad' },
];

export const COLLEGE_METADATA: Record<string, { initials: string; color: string }> = {
  iim_ahmedabad: { initials: 'A', color: '#0B2C74' },
  iim_bangalore: { initials: 'B', color: '#0D7F3B' },
  iim_calcutta: { initials: 'C', color: '#8B261D' },
  iim_lucknow: { initials: 'L', color: '#1E5A34' },
  iim_kozhikode: { initials: 'K', color: '#0D47A1' },
  iim_indore: { initials: 'I', color: '#4A148C' },
  fms_delhi: { initials: 'FMS', color: '#B71C1C' },
  spjimr_mumbai: { initials: 'SPJ', color: '#E65100' },
  xlri_jamshedpur: { initials: 'XLR', color: '#0D3C61' },
  mdi_gurgaon: { initials: 'MDI', color: '#006064' },
  jbims_mumbai: { initials: 'JBI', color: '#212121' },
  isb_hyderabad: { initials: 'ISB', color: '#01579B' },
};

/** Human-readable "IIM Bangalore" for a college id. */
export function collegeLabel(id: string): string {
  const c = COLLEGES.find((x) => x.id === id);
  return c ? `${c.part1} ${c.part2}` : '';
}

// ─── CAT year ────────────────────────────────────────────────────────────────

export const YEAR_OPTIONS = [
  { id: 'cat2026', label: 'CAT 2026', icon: '📅' },
  { id: 'cat2027', label: 'CAT 2027', icon: '📅' },
  { id: 'cat2028', label: 'CAT 2028', icon: '📅' },
  { id: 'exploring', label: 'Just\nExploring', icon: '🧭' },
] as const;

/** "CAT 2027" for a year id (single-line). */
export function catYearLabel(id: string): string {
  const y = YEAR_OPTIONS.find((o) => o.id === id);
  if (!y) return 'CAT';
  return y.label.replace('\n', ' ');
}

/**
 * Approximate days until the CAT exam for a target year.
 * CAT is held in late November; we anchor to Nov 24.
 * Returns null when the target isn't a concrete year (e.g. "exploring").
 */
export function daysLeftForYear(id: string): number | null {
  const m = id.match(/(\d{4})/);
  if (!m) return null;
  const year = parseInt(m[1], 10);
  const exam = new Date(year, 10, 24); // month is 0-indexed → 10 = November
  const today = new Date();
  const diff = Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

// ─── Percentile ──────────────────────────────────────────────────────────────

export const PERCENTILE_STEPS = ['80+', '85+', '90+', '95+', '99+', '99.5+', '99.9+'];
export const DEFAULT_PERCENTILE_INDEX = 3;

// ─── Sections ────────────────────────────────────────────────────────────────

export type SectionId = 'varc' | 'dilr' | 'qa';

export const SECTION_LABEL: Record<SectionId, string> = {
  varc: 'VARC',
  dilr: 'DILR',
  qa: 'QA',
};

// ─── Practice questions ──────────────────────────────────────────────────────

export interface Question {
  id: string;
  section: SectionId;
  /** Optional reading passage / context shown above the prompt. */
  passage?: string;
  /** Optional labelled statements (e.g. data-sufficiency A/B). */
  statements?: { key: string; text: string }[];
  prompt: string;
  options: { key: string; text: string }[];
  correctKey: string;
  hint?: string;
}

/**
 * Sample question bank. Replace with a backend fetch once the questions
 * database is ready — the rest of the app reads only from this shape.
 */
export const SAMPLE_QUESTIONS: Question[] = [
  {
    id: 'qa-1',
    section: 'qa',
    prompt:
      "ABC Corporation is required to maintain at least 400 Kilolitres of water at all times in its factory, in order to meet safety and regulatory requirements. ABC is considering the suitability of a spherical tank with uniform wall thickness for the purpose. The outer diameter of the tank is 10 meters. Is the tank capacity adequate to meet ABC's requirements?",
    statements: [
      { key: 'A', text: 'The inner diameter of the tank is at least 8 meters.' },
      {
        key: 'B',
        text: 'The tank weighs 30,000 kg when empty, and is made of a material with density of 3 gm/cc.',
      },
    ],
    options: [
      { key: 'A', text: 'The question can be answered using A alone but not using B alone.' },
      { key: 'B', text: 'The question can be answered using B alone but not using A alone.' },
      {
        key: 'C',
        text: 'The question can be answered using A and B together, but not using either A or B alone.',
      },
      { key: 'D', text: 'The question cannot be answered even using A and B together.' },
      { key: 'E', text: 'None of these' },
    ],
    correctKey: 'B',
    hint: 'Volume of a sphere is (4/3)πr³. 400 KL = 400 m³. Check which statement pins down the inner radius.',
  },
  {
    id: 'qa-2',
    section: 'qa',
    prompt:
      'If the sum of three consecutive even integers is 96, what is the value of the largest integer?',
    options: [
      { key: 'A', text: '30' },
      { key: 'B', text: '32' },
      { key: 'C', text: '34' },
      { key: 'D', text: '36' },
    ],
    correctKey: 'C',
    hint: 'Let the integers be n, n+2, n+4. Their sum is 3n + 6.',
  },
  {
    id: 'qa-3',
    section: 'qa',
    prompt:
      'A shopkeeper marks up an item by 40% and then offers a discount of 25%. What is his net profit percentage?',
    options: [
      { key: 'A', text: '5%' },
      { key: 'B', text: '10%' },
      { key: 'C', text: '15%' },
      { key: 'D', text: '20%' },
    ],
    correctKey: 'A',
    hint: 'Net factor = 1.40 × 0.75.',
  },
  {
    id: 'varc-1',
    section: 'varc',
    passage:
      'Language is not merely a tool for communication; it shapes the very way we perceive reality. The words available to us delimit the thoughts we can readily form, and cultures with richer vocabularies for a domain tend to notice finer distinctions within it.',
    prompt: 'Which of the following best captures the main idea of the passage?',
    options: [
      { key: 'A', text: 'Communication is impossible without a shared language.' },
      { key: 'B', text: 'Language influences how we perceive and think about the world.' },
      { key: 'C', text: 'Some cultures are superior because they have larger vocabularies.' },
      { key: 'D', text: 'Vocabulary size is the only measure of a language.' },
    ],
    correctKey: 'B',
    hint: 'Focus on the relationship the author draws between words and perception.',
  },
  {
    id: 'varc-2',
    section: 'varc',
    prompt: 'Choose the option that best arranges the sentences into a coherent paragraph.',
    options: [
      { key: 'A', text: 'The results were surprising. We ran the experiment. We designed a hypothesis.' },
      { key: 'B', text: 'We designed a hypothesis. We ran the experiment. The results were surprising.' },
      { key: 'C', text: 'We ran the experiment. We designed a hypothesis. The results were surprising.' },
      { key: 'D', text: 'The results were surprising. We designed a hypothesis. We ran the experiment.' },
    ],
    correctKey: 'B',
    hint: 'Think about the natural chronological order of doing research.',
  },
  {
    id: 'dilr-1',
    section: 'dilr',
    passage:
      'Four friends — P, Q, R and S — finished a race. P finished before Q. R finished after S but before P. No two friends finished at the same time.',
    prompt: 'Who finished the race first?',
    options: [
      { key: 'A', text: 'P' },
      { key: 'B', text: 'Q' },
      { key: 'C', text: 'R' },
      { key: 'D', text: 'S' },
    ],
    correctKey: 'D',
    hint: 'Order the constraints: S before R, R before P, P before Q.',
  },
  {
    id: 'dilr-2',
    section: 'dilr',
    passage:
      'A shop sold 120 items on Monday. Sales increased by 25% on Tuesday and then fell by 20% on Wednesday.',
    prompt: 'How many items were sold on Wednesday?',
    options: [
      { key: 'A', text: '108' },
      { key: 'B', text: '120' },
      { key: 'C', text: '150' },
      { key: 'D', text: '96' },
    ],
    correctKey: 'B',
    hint: 'Monday → ×1.25 → Tuesday → ×0.80 → Wednesday.',
  },
];
