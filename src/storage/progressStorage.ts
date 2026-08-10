import AsyncStorage from '@react-native-async-storage/async-storage';

export const PROGRESS_STORAGE_KEY = '@EZCAT_USER_PROGRESS_V1';

export interface QuestionAttempt {
  questionId: string;
  rawId: number;
  section: 'varc' | 'dilr' | 'qa';
  isCorrect: boolean;
  userAnswer: string;
  timestamp: string;
}

export interface SectionProgressDetail {
  answered: number;
  correct: number;
}

export interface DailyProgressRecord {
  date: string; // "YYYY-MM-DD"
  bySection: {
    varc: SectionProgressDetail;
    dilr: SectionProgressDetail;
    qa: SectionProgressDetail;
  };
}

export interface SectionScoreDetail {
  attempted: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  score: number;
  maxScore: number;
  accuracyPct: number;
}

export interface MockAttempt {
  id: string; // unique timestamp key e.g. "mock_17000000000"
  type: 'full' | 'sectional' | 'mini';
  title: string; // "CAT 2023 Slot 1 Mock"
  year?: number | null;
  slot?: number | null;
  section?: 'varc' | 'dilr' | 'qa' | null;
  timestamp: string; // ISO 8601 string
  timeTakenSec: number;
  totalQuestions: number;
  attemptedCount: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  totalScore: number;
  maxPossibleScore: number;
  accuracyPct: number;
  bySection: Record<'varc' | 'dilr' | 'qa', SectionScoreDetail>;
}

export interface CustomCollege {
  id: string;
  part1: string;
  part2: string;
}

export interface UserProgressData {
  version: number;
  currentStreak: number;
  lastActiveDate: string | null; // "YYYY-MM-DD"
  totalSolved: number;
  totalCorrect: number;
  attempts: Record<string, QuestionAttempt>;
  dailyProgress: Record<string, DailyProgressRecord>;
  mockAttempts: MockAttempt[];
  customColleges: CustomCollege[];
  bookmarkedQuestionIds: string[];
}

export const INITIAL_PROGRESS_DATA: UserProgressData = {
  version: 1,
  currentStreak: 0,
  lastActiveDate: null,
  totalSolved: 0,
  totalCorrect: 0,
  attempts: {},
  dailyProgress: {},
  mockAttempts: [],
  customColleges: [],
  bookmarkedQuestionIds: [],
};

/**
 * Format Date object to "YYYY-MM-DD" local date string
 */
export function getTodayDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate updated day-streak counter given last active date and today's date
 */
export function updateStreak(lastActiveDate: string | null, todayDate: string, currentStreak: number): number {
  if (!lastActiveDate) {
    return 1;
  }
  if (lastActiveDate === todayDate) {
    return currentStreak > 0 ? currentStreak : 1;
  }

  // Parse YYYY-MM-DD
  const last = new Date(lastActiveDate);
  const today = new Date(todayDate);
  const diffTime = today.getTime() - last.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

  if (diffDays === 1) {
    // Yesterday -> streak incremented
    return currentStreak + 1;
  } else if (diffDays > 1) {
    // Missed one or more days -> streak resets to 1
    return 1;
  }

  return currentStreak;
}

/**
 * Load user progress from AsyncStorage
 */
export async function loadUserProgress(): Promise<UserProgressData> {
  try {
    const raw = await AsyncStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) {
      return { ...INITIAL_PROGRESS_DATA };
    }
    const parsed = JSON.parse(raw);
    return {
      version: parsed.version || 1,
      currentStreak: typeof parsed.currentStreak === 'number' ? parsed.currentStreak : 0,
      lastActiveDate: parsed.lastActiveDate || null,
      totalSolved: typeof parsed.totalSolved === 'number' ? parsed.totalSolved : 0,
      totalCorrect: typeof parsed.totalCorrect === 'number' ? parsed.totalCorrect : 0,
      attempts: parsed.attempts || {},
      dailyProgress: parsed.dailyProgress || {},
      mockAttempts: Array.isArray(parsed.mockAttempts) ? parsed.mockAttempts : [],
      customColleges: Array.isArray(parsed.customColleges) ? parsed.customColleges : [],
      bookmarkedQuestionIds: Array.isArray(parsed.bookmarkedQuestionIds) ? parsed.bookmarkedQuestionIds : [],
    };
  } catch (err) {
    console.error('[ProgressStorage] Failed to load user progress:', err);
    return { ...INITIAL_PROGRESS_DATA };
  }
}

/**
 * Load stored custom colleges from user progress
 */
export async function loadCustomColleges(): Promise<CustomCollege[]> {
  const progress = await loadUserProgress();
  return progress.customColleges || [];
}

/**
 * Helper to save a custom college to user progress
 */
export async function saveCustomCollege(
  prevData: UserProgressData,
  college: CustomCollege
): Promise<UserProgressData> {
  const exists = (prevData.customColleges || []).some((c) => c.id === college.id);
  const updatedColleges = exists
    ? prevData.customColleges
    : [...(prevData.customColleges || []), college];

  const updatedData: UserProgressData = {
    ...prevData,
    customColleges: updatedColleges,
  };
  await saveUserProgress(updatedData);
  return updatedData;
}

/**
 * Helper to toggle a question bookmark in user progress
 */
export async function toggleBookmarkStorage(
  prevData: UserProgressData,
  questionId: string
): Promise<UserProgressData> {
  const currentBookmarks = prevData.bookmarkedQuestionIds || [];
  const exists = currentBookmarks.includes(questionId);
  const updatedBookmarks = exists
    ? currentBookmarks.filter((id) => id !== questionId)
    : [...currentBookmarks, questionId];

  const updatedData: UserProgressData = {
    ...prevData,
    bookmarkedQuestionIds: updatedBookmarks,
  };
  await saveUserProgress(updatedData);
  return updatedData;
}

/**
 * Save user progress to AsyncStorage
 */
export async function saveUserProgress(data: UserProgressData): Promise<boolean> {
  try {
    const json = JSON.stringify(data);
    await AsyncStorage.setItem(PROGRESS_STORAGE_KEY, json);
    return true;
  } catch (err) {
    console.error('[ProgressStorage] Failed to save user progress:', err);
    return false;
  }
}

/**
 * Clear all user progress from AsyncStorage
 */
export async function clearUserProgress(): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(PROGRESS_STORAGE_KEY);
    return true;
  } catch (err) {
    console.error('[ProgressStorage] Failed to clear user progress:', err);
    return false;
  }
}

/**
 * Record a new question attempt and return the updated UserProgressData.
 */
export function processAttempt(
  prevData: UserProgressData,
  attempt: {
    questionId: string;
    rawId?: number;
    section: 'varc' | 'dilr' | 'qa';
    isCorrect: boolean;
    userAnswer: string;
  }
): UserProgressData {
  const today = getTodayDateString();
  const isFirstAttemptForQ = !prevData.attempts[attempt.questionId];

  // Update streak
  const newStreak = updateStreak(prevData.lastActiveDate, today, prevData.currentStreak);

  const fallbackRawId = parseInt(attempt.questionId, 10) || 0;
  const rawIdVal = attempt.rawId ?? fallbackRawId;

  // Update attempt record
  const newAttempts = {
    ...prevData.attempts,
    [attempt.questionId]: {
      questionId: attempt.questionId,
      rawId: rawIdVal,
      section: attempt.section,
      isCorrect: attempt.isCorrect,
      userAnswer: attempt.userAnswer,
      timestamp: new Date().toISOString(),
    },
  };

  // Update daily progress for today
  const existingDaily = prevData.dailyProgress[today] || {
    date: today,
    bySection: {
      varc: { answered: 0, correct: 0 },
      dilr: { answered: 0, correct: 0 },
      qa: { answered: 0, correct: 0 },
    },
  };

  const sec = attempt.section;
  const currentSecStats = existingDaily.bySection[sec] || { answered: 0, correct: 0 };
  const updatedSecStats = {
    answered: currentSecStats.answered + (isFirstAttemptForQ ? 1 : 0),
    correct: currentSecStats.correct + (attempt.isCorrect ? 1 : 0),
  };

  const updatedDaily: DailyProgressRecord = {
    date: today,
    bySection: {
      ...existingDaily.bySection,
      [sec]: updatedSecStats,
    },
  };

  return {
    ...prevData,
    currentStreak: newStreak,
    lastActiveDate: today,
    totalSolved: prevData.totalSolved + (isFirstAttemptForQ ? 1 : 0),
    totalCorrect: prevData.totalCorrect + (attempt.isCorrect ? 1 : 0),
    attempts: newAttempts,
    dailyProgress: {
      ...prevData.dailyProgress,
      [today]: updatedDaily,
    },
  };
}

/**
 * Record a completed mock attempt and return updated UserProgressData.
 */
export function processMockAttempt(prevData: UserProgressData, mockAttempt: MockAttempt): UserProgressData {
  const today = getTodayDateString();
  const newStreak = updateStreak(prevData.lastActiveDate, today, prevData.currentStreak);
  const updatedMocks = [mockAttempt, ...(prevData.mockAttempts || [])];

  return {
    ...prevData,
    currentStreak: newStreak,
    lastActiveDate: today,
    totalSolved: prevData.totalSolved + mockAttempt.attemptedCount,
    totalCorrect: prevData.totalCorrect + mockAttempt.correctCount,
    mockAttempts: updatedMocks,
  };
}

/**
 * Rebuild-Safety Helper:
 * Validates stored question attempts against a list of valid question IDs in the database.
 * Missing/stale question IDs are removed from active UI attempt mapping (logged as warnings)
 * while historical aggregate stats (streak, totalSolved, dailyProgress, mockAttempts) are preserved intact.
 */
export function validateAttemptsAgainstDB(
  storedAttempts: Record<string, QuestionAttempt>,
  validIdsSet: Set<string>
): { validAttempts: Record<string, QuestionAttempt>; staleIds: string[] } {
  const validAttempts: Record<string, QuestionAttempt> = {};
  const staleIds: string[] = [];

  for (const [qId, attempt] of Object.entries(storedAttempts || {})) {
    if (validIdsSet.has(qId)) {
      validAttempts[qId] = attempt;
    } else {
      staleIds.push(qId);
      console.warn(
        `[ProgressStorage] Rebuild-Safety Warning: Stale question ID '${qId}' found in stored attempts (not in active DB). Omitted from live solver state.`
      );
    }
  }

  return { validAttempts, staleIds };
}
