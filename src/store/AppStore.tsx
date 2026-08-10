import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import {
  SAMPLE_QUESTIONS,
  DEFAULT_PERCENTILE_INDEX,
  PERCENTILE_STEPS,
  type SectionId,
} from '../constants/data';
import { getDailyPracticeSet, getTITAQuestion } from '../data/questionRepository';
import { UIQuestion, mapRepoQuestionToUIQuestion } from '../data/adapter';
import { DailySetCounts } from '../data/types';
import {
  UserProgressData,
  INITIAL_PROGRESS_DATA,
  MockAttempt,
  loadUserProgress,
  saveUserProgress,
  processAttempt,
  processMockAttempt,
  validateAttemptsAgainstDB,
} from '../storage/progressStorage';

// ─── Types ───────────────────────────────────────────────────────────────────

export type TabKey = 'home' | 'questions' | 'mocks' | 'coach';
export type Level = 'beginner' | 'intermediate' | 'advanced';

interface Profile {
  name: string;
  age: string;
  gradYear: string;
}

interface SectionProgress {
  total: number;
  answered: number;
}

interface AppStore {
  // Onboarding data
  profile: Profile;
  targetYear: string;
  percentile: string;
  colleges: string[];
  levels: Record<SectionId, Level | null>;

  // Runtime
  activeTab: TabKey;
  answers: Record<string, string>; // questionId → selected option key or TITA input
  dailyQuestions: UIQuestion[];
  isQuestionsLoading: boolean;

  // Persisted progress & streak
  userProgress: UserProgressData;
  isHydrated: boolean;

  // Derived
  progress: {
    total: number;
    answered: number;
    bySection: Record<SectionId, SectionProgress>;
  };

  // Setters & Actions
  setProfile: (p: Partial<Profile>) => void;
  setTargetYear: (id: string) => void;
  setPercentile: (p: string) => void;
  setColleges: (ids: string[]) => void;
  setLevel: (section: SectionId, level: Level) => void;
  setActiveTab: (tab: TabKey) => void;
  answerQuestion: (questionId: string, optionKeyOrText: string) => void;
  recordAnswerAttempt: (
    questionId: string,
    section: SectionId,
    isCorrect: boolean,
    userAnswer: string,
    rawId?: number
  ) => Promise<void>;
  recordMockAttempt: (mockAttempt: MockAttempt) => Promise<void>;
  loadDailyPracticeSet: (counts?: DailySetCounts) => Promise<UIQuestion[]>;
  reset: () => void;
}

const AppStoreContext = createContext<AppStore | null>(null);

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_PROFILE: Profile = { name: '', age: '', gradYear: '' };
const DEFAULT_TARGET_YEAR = 'cat2027';
const DEFAULT_PERCENTILE = PERCENTILE_STEPS[DEFAULT_PERCENTILE_INDEX];
const DEFAULT_COLLEGES = ['iim_bangalore'];
const DEFAULT_LEVELS: Record<SectionId, Level | null> = { varc: null, dilr: null, qa: null };
const DEFAULT_DAILY_COUNTS: DailySetCounts = { VARC: 2, DILR: 2, QA: 3 };

// ─── Provider ────────────────────────────────────────────────────────────────

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<Profile>(DEFAULT_PROFILE);
  const [targetYear, setTargetYear] = useState(DEFAULT_TARGET_YEAR);
  const [percentile, setPercentile] = useState(DEFAULT_PERCENTILE);
  const [colleges, setColleges] = useState<string[]>(DEFAULT_COLLEGES);
  const [levels, setLevels] = useState<Record<SectionId, Level | null>>(DEFAULT_LEVELS);
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [dailyQuestions, setDailyQuestions] = useState<UIQuestion[]>([]);
  const [isQuestionsLoading, setIsQuestionsLoading] = useState(false);

  const [userProgress, setUserProgress] = useState<UserProgressData>(INITIAL_PROGRESS_DATA);
  const [isHydrated, setIsHydrated] = useState(false);

  // 1. Hydrate user progress from AsyncStorage on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const loaded = await loadUserProgress();
      if (isMounted) {
        setUserProgress(loaded);
        // Hydrate answers map from stored attempts
        const restoredAnswers: Record<string, string> = {};
        for (const [qId, att] of Object.entries(loaded.attempts || {})) {
          if (att && att.userAnswer != null) {
            restoredAnswers[qId] = att.userAnswer;
          }
        }
        setAnswers(restoredAnswers);
        setIsHydrated(true);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const setProfile = useCallback((p: Partial<Profile>) => {
    setProfileState((prev) => ({ ...prev, ...p }));
  }, []);

  const setLevel = useCallback((section: SectionId, level: Level) => {
    setLevels((prev) => ({ ...prev, [section]: level }));
  }, []);

  const answerQuestion = useCallback((questionId: string, optionKeyOrText: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionKeyOrText }));
  }, []);

  // Action to record answer attempt & persist to AsyncStorage with rebuild-safety
  const recordAnswerAttempt = useCallback(
    async (
      questionId: string,
      section: SectionId,
      isCorrect: boolean,
      userAnswer: string,
      rawId?: number
    ) => {
      setAnswers((prev) => ({ ...prev, [questionId]: userAnswer }));

      setUserProgress((prev) => {
        const nextProgress = processAttempt(prev, {
          questionId,
          rawId,
          section,
          isCorrect,
          userAnswer,
        });
        saveUserProgress(nextProgress);
        return nextProgress;
      });
    },
    []
  );

  // Action to record completed mock attempt & persist to AsyncStorage
  const recordMockAttempt = useCallback(async (mockAttempt: MockAttempt) => {
    setUserProgress((prev) => {
      const nextProgress = processMockAttempt(prev, mockAttempt);
      saveUserProgress(nextProgress);
      return nextProgress;
    });
  }, []);

  const loadDailyPracticeSet = useCallback(
    async (counts: DailySetCounts = DEFAULT_DAILY_COUNTS): Promise<UIQuestion[]> => {
      setIsQuestionsLoading(true);
      try {
        const repoQuestions = await getDailyPracticeSet(counts);
        let mapped = repoQuestions.map(mapRepoQuestionToUIQuestion);

        // Ensure TITA representation in the daily practice set
        const hasTITA = mapped.some((q) => q.isTITA);
        if (!hasTITA) {
          const titaMatch = await getTITAQuestion('QA');
          if (titaMatch) {
            const titaUI = mapRepoQuestionToUIQuestion(titaMatch);
            const firstQAIdx = mapped.findIndex((q) => q.section === 'qa');
            if (firstQAIdx !== -1) {
              mapped[firstQAIdx] = titaUI;
            } else {
              mapped.unshift(titaUI);
            }
          }
        }

        // Rebuild-Safety: Validate stored attempts against the active database IDs
        const validIdsSet = new Set(mapped.map((q) => q.id));
        const { validAttempts } = validateAttemptsAgainstDB(userProgress.attempts, validIdsSet);

        // Synchronize in-memory answers map with validated active attempts
        setAnswers((prev) => {
          const next = { ...prev };
          for (const [qId, att] of Object.entries(validAttempts)) {
            next[qId] = att.userAnswer;
          }
          return next;
        });

        setDailyQuestions(mapped);
        setIsQuestionsLoading(false);
        return mapped;
      } catch (err) {
        console.error('Failed to load daily practice set from repository:', err);
        setIsQuestionsLoading(false);
        return [];
      }
    },
    [userProgress.attempts]
  );

  const reset = useCallback(() => {
    setProfileState(DEFAULT_PROFILE);
    setTargetYear(DEFAULT_TARGET_YEAR);
    setPercentile(DEFAULT_PERCENTILE);
    setColleges(DEFAULT_COLLEGES);
    setLevels(DEFAULT_LEVELS);
    setActiveTab('home');
    setAnswers({});
    setDailyQuestions([]);
  }, []);

  // Derived progress calculated dynamically from loaded dailyQuestions
  const progress = useMemo(() => {
    const bySection: Record<SectionId, SectionProgress> = {
      varc: { total: 0, answered: 0 },
      dilr: { total: 0, answered: 0 },
      qa: { total: 0, answered: 0 },
    };
    let total = 0;
    let answered = 0;

    const questionsToUse =
      dailyQuestions.length > 0
        ? dailyQuestions
        : SAMPLE_QUESTIONS.map((q) => ({ id: q.id, section: q.section }));

    for (const q of questionsToUse) {
      const sec = q.section as SectionId;
      if (bySection[sec]) {
        bySection[sec].total += 1;
        total += 1;
        if (answers[q.id] != null) {
          bySection[sec].answered += 1;
          answered += 1;
        }
      }
    }
    return { total, answered, bySection };
  }, [dailyQuestions, answers]);

  const value = useMemo<AppStore>(
    () => ({
      profile,
      targetYear,
      percentile,
      colleges,
      levels,
      activeTab,
      answers,
      dailyQuestions,
      isQuestionsLoading,
      userProgress,
      isHydrated,
      progress,
      setProfile,
      setTargetYear,
      setPercentile,
      setColleges,
      setLevel,
      setActiveTab,
      answerQuestion,
      recordAnswerAttempt,
      recordMockAttempt,
      loadDailyPracticeSet,
      reset,
    }),
    [
      profile,
      targetYear,
      percentile,
      colleges,
      levels,
      activeTab,
      answers,
      dailyQuestions,
      isQuestionsLoading,
      userProgress,
      isHydrated,
      progress,
      setProfile,
      setLevel,
      answerQuestion,
      recordAnswerAttempt,
      recordMockAttempt,
      loadDailyPracticeSet,
      reset,
    ]
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAppStore(): AppStore {
  const ctx = useContext(AppStoreContext);
  if (!ctx) {
    throw new Error('useAppStore must be used within an AppStoreProvider');
  }
  return ctx;
}
