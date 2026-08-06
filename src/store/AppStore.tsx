import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import {
  SAMPLE_QUESTIONS,
  DEFAULT_PERCENTILE_INDEX,
  PERCENTILE_STEPS,
  type SectionId,
} from '../constants/data';

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
  answers: Record<string, string>; // questionId → selected option key

  // Derived
  progress: {
    total: number;
    answered: number;
    bySection: Record<SectionId, SectionProgress>;
  };

  // Setters
  setProfile: (p: Partial<Profile>) => void;
  setTargetYear: (id: string) => void;
  setPercentile: (p: string) => void;
  setColleges: (ids: string[]) => void;
  setLevel: (section: SectionId, level: Level) => void;
  setActiveTab: (tab: TabKey) => void;
  answerQuestion: (questionId: string, optionKey: string) => void;
  reset: () => void;
}

const AppStoreContext = createContext<AppStore | null>(null);

// ─── Defaults ────────────────────────────────────────────────────────────────
// Sensible demo defaults so /home looks complete even before onboarding.

const DEFAULT_PROFILE: Profile = { name: '', age: '', gradYear: '' };
const DEFAULT_TARGET_YEAR = 'cat2027';
const DEFAULT_PERCENTILE = PERCENTILE_STEPS[DEFAULT_PERCENTILE_INDEX];
const DEFAULT_COLLEGES = ['iim_bangalore'];
const DEFAULT_LEVELS: Record<SectionId, Level | null> = { varc: null, dilr: null, qa: null };

// ─── Provider ────────────────────────────────────────────────────────────────

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<Profile>(DEFAULT_PROFILE);
  const [targetYear, setTargetYear] = useState(DEFAULT_TARGET_YEAR);
  const [percentile, setPercentile] = useState(DEFAULT_PERCENTILE);
  const [colleges, setColleges] = useState<string[]>(DEFAULT_COLLEGES);
  const [levels, setLevels] = useState<Record<SectionId, Level | null>>(DEFAULT_LEVELS);
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const setProfile = useCallback((p: Partial<Profile>) => {
    setProfileState((prev) => ({ ...prev, ...p }));
  }, []);

  const setLevel = useCallback((section: SectionId, level: Level) => {
    setLevels((prev) => ({ ...prev, [section]: level }));
  }, []);

  const answerQuestion = useCallback((questionId: string, optionKey: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionKey }));
  }, []);

  const reset = useCallback(() => {
    setProfileState(DEFAULT_PROFILE);
    setTargetYear(DEFAULT_TARGET_YEAR);
    setPercentile(DEFAULT_PERCENTILE);
    setColleges(DEFAULT_COLLEGES);
    setLevels(DEFAULT_LEVELS);
    setActiveTab('home');
    setAnswers({});
  }, []);

  // Derived progress from the question bank + answers.
  const progress = useMemo(() => {
    const bySection: Record<SectionId, SectionProgress> = {
      varc: { total: 0, answered: 0 },
      dilr: { total: 0, answered: 0 },
      qa: { total: 0, answered: 0 },
    };
    let total = 0;
    let answered = 0;
    for (const q of SAMPLE_QUESTIONS) {
      bySection[q.section].total += 1;
      total += 1;
      if (answers[q.id] != null) {
        bySection[q.section].answered += 1;
        answered += 1;
      }
    }
    return { total, answered, bySection };
  }, [answers]);

  const value = useMemo<AppStore>(
    () => ({
      profile,
      targetYear,
      percentile,
      colleges,
      levels,
      activeTab,
      answers,
      progress,
      setProfile,
      setTargetYear,
      setPercentile,
      setColleges,
      setLevel,
      setActiveTab,
      answerQuestion,
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
      progress,
      setProfile,
      setLevel,
      answerQuestion,
      reset,
    ],
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
