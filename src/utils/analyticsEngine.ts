import { QuestionAttempt, DailyProgressRecord } from '../storage/progressStorage';
import { SectionId } from '../constants/data';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SectionalAccuracy {
  total: number;
  correct: number;
  accuracyPct: number;
}

export interface TopicDiagnosticItem {
  topic: string;
  section: SectionId;
  pct: string; // e.g. "62%"
  accuracy: number; // 0..100
  total: number;
  correct: number;
}

export interface TopicDiagnostics {
  weak: TopicDiagnosticItem[];
  strong: TopicDiagnosticItem[];
  totalAttempts: number;
}

export interface PredictedPercentileResult {
  percentile: number; // e.g. 93.4
  formatted: string; // e.g. "93.4"
  deltaStr: string; // e.g. "↑ 3.2"
  progressRatio: number; // 0..1 for gauge/bars
}

export interface ConsistencyBar {
  dayLabel: string;
  height: number;
  count: number;
  active: boolean;
  dateStr: string;
}

export interface WeeklyConsistencyResult {
  bars: ConsistencyBar[];
  activeDaysCount: number;
  totalWeeklyAttempts: number;
}

// ─── Canonical CAT Topic Mapping ──────────────────────────────────────────────

const QA_TOPICS = ['Arithmetic', 'Algebra', 'Geometry', 'Number Systems'];
const DILR_TOPICS = ['Arrangements', 'Caselets', 'Charts & Graphs', 'Games & Tournaments'];
const VARC_TOPICS = ['Reading Comprehension', 'Para Jumbles', 'Para Summary', 'Odd One Out'];

/**
 * Resolve a specific CAT sub-topic from question ID or rawId
 */
export function getTopicForQuestion(attempt: QuestionAttempt): string {
  const qId = attempt.questionId.toLowerCase();
  const rawId = attempt.rawId || parseInt(qId.replace(/\D/g, ''), 10) || 0;

  if (qId.startsWith('qa-1') || rawId === 1) return 'Arithmetic';
  if (qId.startsWith('qa-2') || rawId === 2) return 'Number Systems';
  if (qId.startsWith('qa-3') || rawId === 3) return 'Arithmetic';
  if (qId.startsWith('varc-1') || rawId === 10) return 'Reading Comprehension';
  if (qId.startsWith('varc-2')) return 'Para Jumbles';
  if (qId.startsWith('dilr-1') || rawId === 9) return 'Arrangements';
  if (qId.startsWith('dilr-2')) return 'Caselets';

  const sec = attempt.section || 'qa';
  if (sec === 'qa') {
    return QA_TOPICS[Math.abs(rawId) % QA_TOPICS.length];
  } else if (sec === 'dilr') {
    return DILR_TOPICS[Math.abs(rawId) % DILR_TOPICS.length];
  } else {
    return VARC_TOPICS[Math.abs(rawId) % VARC_TOPICS.length];
  }
}

// ─── Analytics Functions ──────────────────────────────────────────────────────

/**
 * Calculate accuracy percentage by section ('varc', 'dilr', 'qa')
 */
export function calculateSectionalAccuracy(
  attempts: Record<string, QuestionAttempt>
): Record<SectionId, SectionalAccuracy> {
  const result: Record<SectionId, { total: number; correct: number }> = {
    varc: { total: 0, correct: 0 },
    dilr: { total: 0, correct: 0 },
    qa: { total: 0, correct: 0 },
  };

  for (const att of Object.values(attempts || {})) {
    if (!att || !att.section) continue;
    const sec = att.section as SectionId;
    if (result[sec]) {
      result[sec].total += 1;
      if (att.isCorrect) {
        result[sec].correct += 1;
      }
    }
  }

  return {
    varc: {
      total: result.varc.total,
      correct: result.varc.correct,
      accuracyPct: result.varc.total > 0 ? Math.round((result.varc.correct / result.varc.total) * 100) : 0,
    },
    dilr: {
      total: result.dilr.total,
      correct: result.dilr.correct,
      accuracyPct: result.dilr.total > 0 ? Math.round((result.dilr.correct / result.dilr.total) * 100) : 0,
    },
    qa: {
      total: result.qa.total,
      correct: result.qa.correct,
      accuracyPct: result.qa.total > 0 ? Math.round((result.qa.correct / result.qa.total) * 100) : 0,
    },
  };
}

/**
 * Get sorted weak (<70% accuracy) and strong (>=70% accuracy) topic diagnostics
 */
export function getTopicDiagnostics(
  attempts: Record<string, QuestionAttempt>
): TopicDiagnostics {
  const attemptList = Object.values(attempts || {});
  const totalAttempts = attemptList.length;

  if (totalAttempts === 0) {
    return { weak: [], strong: [], totalAttempts: 0 };
  }

  const topicStats: Record<string, { topic: string; section: SectionId; total: number; correct: number }> = {};

  for (const att of attemptList) {
    if (!att) continue;
    const topic = getTopicForQuestion(att);
    const sec = att.section as SectionId;

    if (!topicStats[topic]) {
      topicStats[topic] = { topic, section: sec, total: 0, correct: 0 };
    }
    topicStats[topic].total += 1;
    if (att.isCorrect) {
      topicStats[topic].correct += 1;
    }
  }

  const weak: TopicDiagnosticItem[] = [];
  const strong: TopicDiagnosticItem[] = [];

  for (const stat of Object.values(topicStats)) {
    const accuracy = Math.round((stat.correct / stat.total) * 100);
    const item: TopicDiagnosticItem = {
      topic: stat.topic,
      section: stat.section,
      pct: `${accuracy}%`,
      accuracy,
      total: stat.total,
      correct: stat.correct,
    };

    if (accuracy < 70) {
      weak.push(item);
    } else {
      strong.push(item);
    }
  }

  weak.sort((a, b) => a.accuracy - b.accuracy);
  strong.sort((a, b) => b.accuracy - a.accuracy);

  return { weak, strong, totalAttempts };
}

/**
 * Calculate dynamic readiness score (10% to 99%)
 */
export function calculateReadinessScore(
  attempts: Record<string, QuestionAttempt>,
  onboardingLevels?: Record<string, string | null>
): number {
  const attemptList = Object.values(attempts || {});
  const total = attemptList.length;

  if (total === 0) {
    // Baseline score derived from onboarding level if set, or default 50
    if (onboardingLevels) {
      const vals = Object.values(onboardingLevels).filter(Boolean);
      if (vals.includes('advanced')) return 65;
      if (vals.includes('intermediate')) return 55;
    }
    return 50;
  }

  const correct = attemptList.filter((a) => a.isCorrect).length;
  const accRatio = correct / total;
  const volumeFactor = Math.min(1.0, total / 40);

  // Score combining accuracy (70% weight) and practice consistency volume (30% weight)
  const score = Math.round(accRatio * 65 + volumeFactor * 30 + 5);
  return Math.min(99, Math.max(10, score));
}

/**
 * Calculate predicted percentile projection (e.g. 93.4)
 */
export function calculatePredictedPercentile(
  attempts: Record<string, QuestionAttempt>,
  targetGoalStr?: string
): PredictedPercentileResult {
  const attemptList = Object.values(attempts || {});
  const total = attemptList.length;

  // Extract baseline goal (e.g. "99+" -> 99.0)
  const goalMatch = (targetGoalStr || '95+').match(/([\d.]+)/);
  const targetGoalNum = goalMatch ? parseFloat(goalMatch[1]) : 95.0;

  if (total === 0) {
    const basePct = Math.min(95.0, Math.max(75.0, targetGoalNum - 5.0));
    return {
      percentile: basePct,
      formatted: basePct.toFixed(1),
      deltaStr: '↑ 0.0',
      progressRatio: Math.min(1.0, basePct / 100),
    };
  }

  const correct = attemptList.filter((a) => a.isCorrect).length;
  const accRatio = correct / total;
  const volumeBonus = Math.min(4.0, total * 0.2);

  // Percentile formula: 75.0 base + accuracy * 20 + volume bonus up to 4.0
  const rawPct = Math.min(99.9, Math.max(50.0, 75.0 + accRatio * 20.0 + volumeBonus));
  const rounded = Math.round(rawPct * 10) / 10;
  const delta = Math.round((rounded - 90.0) * 10) / 10;
  const deltaStr = delta >= 0 ? `↑ ${delta.toFixed(1)}` : `↓ ${Math.abs(delta).toFixed(1)}`;

  return {
    percentile: rounded,
    formatted: rounded.toFixed(1),
    deltaStr,
    progressRatio: Math.min(1.0, rounded / 100),
  };
}

/**
 * Calculate weekly consistency bar heights and active days count for the past 7 days
 */
export function getWeeklyConsistency(
  attempts: Record<string, QuestionAttempt>,
  dailyProgress?: Record<string, DailyProgressRecord>
): WeeklyConsistencyResult {
  const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const today = new Date();
  const bars: ConsistencyBar[] = [];
  let activeDaysCount = 0;
  let totalWeeklyAttempts = 0;

  // Calculate dates for past 7 days (ending today)
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);

    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yr}-${mo}-${da}`;

    // Get day of week index (0=Sun, 1=Mon, ..., 6=Sat)
    const dayOfWeek = d.getDay();
    // Map to Mon-indexed (0=Mon, 1=Tue, ..., 6=Sun)
    const labelIdx = (dayOfWeek + 6) % 7;
    const dayLabel = DAY_LABELS[labelIdx];

    let count = 0;

    // Check dailyProgress first
    if (dailyProgress && dailyProgress[dateStr]) {
      const dp = dailyProgress[dateStr].bySection;
      count = dp.varc.answered + dp.dilr.answered + dp.qa.answered;
    } else {
      // Fallback: check attempt timestamps
      for (const att of Object.values(attempts || {})) {
        if (att && att.timestamp && att.timestamp.startsWith(dateStr)) {
          count++;
        }
      }
    }

    const active = count > 0;
    if (active) activeDaysCount++;
    totalWeeklyAttempts += count;

    // Bar height bounded between 8px (inactive) and 32px
    const height = active ? Math.min(32, 14 + count * 4) : 8;

    bars.push({
      dayLabel,
      height,
      count,
      active,
      dateStr,
    });
  }

  return {
    bars,
    activeDaysCount,
    totalWeeklyAttempts,
  };
}
