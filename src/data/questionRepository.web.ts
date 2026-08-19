import { IQuestionRepository, Question, SectionType, DailySetCounts, MockExamResult } from './types';
import { webQuestionRepository } from './webDatabase';

/**
 * Web Question Repository
 * Loads JSON question data in memory without bundling native SQLite binary or wasm dependencies.
 */
export const questionRepository: IQuestionRepository = webQuestionRepository;

// Helper export functions
export const getDailyPracticeSet = (counts: DailySetCounts) => questionRepository.getDailyPracticeSet(counts);
export const getQuestionsBySection = (section: SectionType, limit?: number) => questionRepository.getQuestionsBySection(section, limit);
export const getMockExam = (year: number, slot: number) => questionRepository.getMockExam(year, slot);
export const getTITAQuestion = (section?: SectionType) => questionRepository.getTITAQuestion(section);
export const getSimilarQuestion = (section: SectionType, excludeId?: number | string) => questionRepository.getSimilarQuestion(section, excludeId);

export * from './types';
