import { Question as RepoQuestion, SectionType } from './types';
import { SectionId } from '../constants/data';

export interface UIQuestionOption {
  key: string;
  text: string;
}

export interface UIQuestion {
  id: string;
  rawId: number;
  prompt: string;
  options: UIQuestionOption[];
  correctKey: string;
  rawCorrectAnswer: string;
  explanation?: string | null;
  section: SectionId; // 'qa' | 'dilr' | 'varc'
  isTITA: boolean;
  passage?: string | null;
  hint?: string | null;
  statements?: Array<{ key: string; text: string }>;
}

/**
 * Extract clean option key ('A', 'B', 'C', 'D') from correct_answer string or fallback.
 */
export function extractCorrectKey(correctAnswer: string, options: UIQuestionOption[]): string {
  if (!correctAnswer) return '';
  const trimmed = correctAnswer.trim();

  // 1. Direct label match (e.g. "A", "B", "C", "D")
  const matchedOpt = options.find((opt) => opt.key.toUpperCase() === trimmed.toUpperCase());
  if (matchedOpt) return matchedOpt.key;

  // 2. Prefix match (e.g. "C) 10.4%", "B. 91", "Choice A")
  for (const opt of options) {
    const k = opt.key.toUpperCase();
    const tu = trimmed.toUpperCase();
    if (
      tu.startsWith(`${k})`) ||
      tu.startsWith(`${k}.`) ||
      tu.startsWith(`${k} -`) ||
      tu.startsWith(`${k}:`) ||
      tu.startsWith(`CHOICE ${k}`)
    ) {
      return opt.key;
    }
  }

  // 3. Normalized option text match after stripping option prefix like "(A) "
  const normCorr = normalizeString(trimmed);
  if (normCorr) {
    for (const opt of options) {
      const normOpt = normalizeString(opt.text);
      if (normOpt && normOpt === normCorr) {
        return opt.key;
      }
    }
  }

  // Fallback: return original trimmed string
  return trimmed;
}

/**
 * Helper to strip non-alphanumeric characters for robust string comparisons.
 */
function normalizeString(str: string): string {
  const cleaned = (str || '')
    .replace(/^(choice\s+)?[a-d][\.\):\-]\s*/i, '')
    .replace(/^\([a-d]\)\s*/i, '');
  return cleaned.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

/**
 * Robust TITA answer checker based on empirical cat_questions.db analysis.
 * Handles plain numbers ("380"), unit suffixes ("1120 litres", "40 days", "53%"),
 * currency prefixes ("Rs. 6,000", "$ 100"), ratios ("7:3"), and normalized text.
 */
export function checkTITACorrect(userAnswer: string, correctAnswer: string): boolean {
  if (!userAnswer || !correctAnswer) return false;

  const uStr = userAnswer.trim().toLowerCase().replace(/,/g, '');
  const cStr = correctAnswer.trim().toLowerCase().replace(/,/g, '');

  // 1. Exact normalized string match
  if (uStr === cStr) return true;

  // 2. Stripped non-alphanumeric match (handles punctuation/spaces)
  const normUser = normalizeString(uStr);
  const normCorr = normalizeString(cStr);
  if (normUser && normCorr && normUser === normCorr) return true;

  // 3. Numeric extraction & comparison
  // Extract numerical values (digits and optional decimal/minus)
  const userNumMatch = uStr.match(/-?\d+(\.\d+)?/);
  const corrNumMatch = cStr.match(/-?\d+(\.\d+)?/);

  if (userNumMatch && corrNumMatch) {
    const userVal = parseFloat(userNumMatch[0]);
    const corrVal = parseFloat(corrNumMatch[0]);

    if (!isNaN(userVal) && !isNaN(corrVal) && Math.abs(userVal - corrVal) < 1e-5) {
      return true;
    }
  }

  return false;
}

/**
 * Check whether selected option key or answer matches the correct MCQ answer.
 */
export function checkMCQCorrect(selectedKey: string, correctAnswer: string, options: UIQuestionOption[]): boolean {
  if (!selectedKey) return false;
  const targetKey = extractCorrectKey(correctAnswer, options);
  if (selectedKey.toUpperCase() === targetKey.toUpperCase()) return true;

  // Secondary check against option text
  const selectedOpt = options.find((opt) => opt.key.toUpperCase() === selectedKey.toUpperCase());
  if (selectedOpt) {
    return normalizeString(selectedOpt.text) === normalizeString(correctAnswer);
  }

  return false;
}

/**
 * Map repository Question into UIQuestion adapter shape.
 */
export function mapRepoQuestionToUIQuestion(repoQ: RepoQuestion): UIQuestion {
  const isTITA = repoQ.isTITA || !repoQ.options || repoQ.options.length === 0;
  const options: UIQuestionOption[] = (repoQ.options || []).map((opt) => ({
    key: opt.label,
    text: opt.text,
  }));

  const sectionId = (repoQ.section || 'QA').toLowerCase() as SectionId;
  const correctKey = isTITA ? repoQ.correct_answer : extractCorrectKey(repoQ.correct_answer, options);

  // Generate a helpful hint snippet from explanation if available
  let hintSnippet: string | null = null;
  if (repoQ.explanation) {
    const lines = repoQ.explanation.split('\n').map((l) => l.trim()).filter(Boolean);
    hintSnippet = lines[0] || repoQ.explanation.slice(0, 140);
  }

  return {
    id: String(repoQ.id),
    rawId: repoQ.id,
    prompt: repoQ.question_text,
    options,
    correctKey,
    rawCorrectAnswer: repoQ.correct_answer,
    explanation: repoQ.explanation || null,
    section: sectionId,
    isTITA,
    passage: null,
    hint: hintSnippet,
  };
}
