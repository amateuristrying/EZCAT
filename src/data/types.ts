export type SectionType = 'QA' | 'DILR' | 'VARC';

export interface Option {
  label: string;
  text: string;
}

export interface Question {
  id: number;
  question_text: string;
  options: Option[];
  correct_answer: string;
  explanation?: string | null;
  section: SectionType;
  year?: number | null;
  slot?: number | null;
  /**
   * Derived helper flag: true if options array is empty (Type In The Answer),
   * false if options array is populated (Multiple Choice Question).
   */
  isTITA: boolean;
}

export interface DailySetCounts {
  VARC: number;
  DILR: number;
  QA: number;
}

export interface MockExamResult {
  year: number;
  slot: number;
  sections: {
    VARC: Question[];
    DILR: Question[];
    QA: Question[];
  };
  totalQuestions: number;
}

export interface IQuestionRepository {
  getDailyPracticeSet(counts: DailySetCounts): Promise<Question[]>;
  getQuestionsBySection(section: SectionType, limit?: number): Promise<Question[]>;
  getMockExam(year: number, slot: number): Promise<MockExamResult>;
}
