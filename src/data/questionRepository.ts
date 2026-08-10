import { Platform } from 'react-native';
import { IQuestionRepository, Question, SectionType, DailySetCounts, MockExamResult } from './types';
import { webQuestionRepository } from './webDatabase';
import { nativeQuestionRepository } from './nativeDatabase';

/**
 * Platform-aware question repository implementation.
 * Uses WebQuestionRepository (in-memory JSON) on Web
 * and NativeQuestionRepository (expo-sqlite) on iOS/Android.
 */
class QuestionRepository implements IQuestionRepository {
  private get activeRepository(): IQuestionRepository {
    if (Platform.OS === 'web') {
      return webQuestionRepository;
    }
    return nativeQuestionRepository;
  }

  async getDailyPracticeSet(counts: DailySetCounts): Promise<Question[]> {
    return this.activeRepository.getDailyPracticeSet(counts);
  }

  async getQuestionsBySection(section: SectionType, limit: number = 20): Promise<Question[]> {
    return this.activeRepository.getQuestionsBySection(section, limit);
  }

  async getMockExam(year: number, slot: number): Promise<MockExamResult> {
    return this.activeRepository.getMockExam(year, slot);
  }
}

export const questionRepository = new QuestionRepository();

// Helper export functions matching task requirements
export const getDailyPracticeSet = (counts: DailySetCounts) => questionRepository.getDailyPracticeSet(counts);
export const getQuestionsBySection = (section: SectionType, limit?: number) => questionRepository.getQuestionsBySection(section, limit);
export const getMockExam = (year: number, slot: number) => questionRepository.getMockExam(year, slot);

export * from './types';
