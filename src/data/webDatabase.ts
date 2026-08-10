import { Question, SectionType, DailySetCounts, MockExamResult, IQuestionRepository } from './types';

// Require asset bundle for web in-memory operations
const rawQuestions = require('../../assets/cat_questions.json');

/**
 * Fisher-Yates array shuffle helper
 */
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function mapToQuestion(raw: any): Question {
  const options = Array.isArray(raw.options) ? raw.options : [];
  return {
    id: raw.id,
    question_text: raw.question_text,
    options: options,
    correct_answer: raw.correct_answer,
    explanation: raw.explanation || null,
    section: raw.section as SectionType,
    year: raw.year ?? null,
    slot: raw.slot ?? null,
    isTITA: options.length === 0,
  };
}

export class WebQuestionRepository implements IQuestionRepository {
  private questions: any[];

  constructor() {
    this.questions = Array.isArray(rawQuestions) ? rawQuestions : [];
  }

  async getDailyPracticeSet(counts: DailySetCounts): Promise<Question[]> {
    const result: Question[] = [];

    const sections: SectionType[] = ['VARC', 'DILR', 'QA'];
    for (const sec of sections) {
      const needed = counts[sec] || 0;
      if (needed <= 0) continue;

      const matching = this.questions.filter((q) => q.section === sec);
      const shuffled = shuffleArray(matching);
      const selected = shuffled.slice(0, needed).map(mapToQuestion);
      result.push(...selected);
    }

    return result;
  }

  async getQuestionsBySection(section: SectionType, limit: number = 20): Promise<Question[]> {
    const matching = this.questions.filter((q) => q.section === section);
    const shuffled = shuffleArray(matching);
    return shuffled.slice(0, limit).map(mapToQuestion);
  }

  async getMockExam(year: number, slot: number): Promise<MockExamResult> {
    const matching = this.questions.filter((q) => q.year === year && q.slot === slot);

    const varc: Question[] = [];
    const dilr: Question[] = [];
    const qa: Question[] = [];

    for (const q of matching) {
      const item = mapToQuestion(q);
      if (item.section === 'VARC') varc.push(item);
      else if (item.section === 'DILR') dilr.push(item);
      else if (item.section === 'QA') qa.push(item);
    }

    return {
      year,
      slot,
      sections: {
        VARC: varc,
        DILR: dilr,
        QA: qa,
      },
      totalQuestions: matching.length,
    };
  }

  async getTITAQuestion(section?: SectionType): Promise<Question | null> {
    const matching = this.questions.filter((q) => {
      const isTITA = !q.options || q.options.length === 0;
      if (!isTITA) return false;
      if (section && q.section !== section) return false;
      return true;
    });

    if (matching.length === 0) return null;
    const picked = matching[Math.floor(Math.random() * matching.length)];
    return mapToQuestion(picked);
  }
}

export const webQuestionRepository = new WebQuestionRepository();
