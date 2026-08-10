import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import { Question, SectionType, DailySetCounts, MockExamResult, IQuestionRepository } from './types';

let dbInstance: SQLite.SQLiteDatabase | null = null;

async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;

  const dbName = 'cat_questions.db';
  const dbDir = `${FileSystem.documentDirectory}SQLite`;
  const dbPath = `${dbDir}/${dbName}`;

  try {
    const folderInfo = await FileSystem.getInfoAsync(dbDir);
    if (!folderInfo.exists) {
      await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
    }

    const fileInfo = await FileSystem.getInfoAsync(dbPath);
    if (!fileInfo.exists) {
      const asset = Asset.fromModule(require('../../assets/cat_questions.db'));
      await asset.downloadAsync();
      await FileSystem.copyAsync({
        from: asset.localUri || asset.uri,
        to: dbPath,
      });
    }

    dbInstance = SQLite.openDatabaseSync(dbName);
    return dbInstance;
  } catch (err) {
    console.error('Failed to initialize native SQLite database, falling back to openDatabaseSync:', err);
    dbInstance = SQLite.openDatabaseSync(dbName);
    return dbInstance;
  }
}

function mapRowToQuestion(row: any): Question {
  let options: any[] = [];
  if (row.options) {
    try {
      options = typeof row.options === 'string' ? JSON.parse(row.options) : row.options;
    } catch (e) {
      options = [];
    }
  }

  return {
    id: row.id,
    question_text: row.question_text,
    options: options,
    correct_answer: row.correct_answer,
    explanation: row.explanation || null,
    section: row.section as SectionType,
    year: row.year ?? null,
    slot: row.slot ?? null,
    isTITA: options.length === 0,
  };
}

export class NativeQuestionRepository implements IQuestionRepository {
  async getDailyPracticeSet(counts: DailySetCounts): Promise<Question[]> {
    const db = await getDatabase();
    const result: Question[] = [];

    const sections: SectionType[] = ['VARC', 'DILR', 'QA'];
    for (const sec of sections) {
      const needed = counts[sec] || 0;
      if (needed <= 0) continue;

      const rows = await db.getAllAsync(
        'SELECT * FROM questions WHERE section = ? ORDER BY RANDOM() LIMIT ?',
        [sec, needed]
      );
      const mapped = rows.map(mapRowToQuestion);
      result.push(...mapped);
    }

    return result;
  }

  async getQuestionsBySection(section: SectionType, limit: number = 20): Promise<Question[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync(
      'SELECT * FROM questions WHERE section = ? ORDER BY RANDOM() LIMIT ?',
      [section, limit]
    );
    return rows.map(mapRowToQuestion);
  }

  async getMockExam(year: number, slot: number): Promise<MockExamResult> {
    const db = await getDatabase();
    const rows = await db.getAllAsync(
      'SELECT * FROM questions WHERE year = ? AND slot = ? ORDER BY id',
      [year, slot]
    );

    const varc: Question[] = [];
    const dilr: Question[] = [];
    const qa: Question[] = [];

    for (const row of rows) {
      const item = mapRowToQuestion(row);
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
      totalQuestions: rows.length,
    };
  }

  async getTITAQuestion(section?: SectionType): Promise<Question | null> {
    const db = await getDatabase();
    let rows: any[] = [];
    if (section) {
      rows = await db.getAllAsync(
        'SELECT * FROM questions WHERE section = ? AND json_array_length(options) = 0 ORDER BY RANDOM() LIMIT 1',
        [section]
      );
    } else {
      rows = await db.getAllAsync(
        'SELECT * FROM questions WHERE json_array_length(options) = 0 ORDER BY RANDOM() LIMIT 1'
      );
    }

    if (rows.length === 0) return null;
    return mapRowToQuestion(rows[0]);
  }
}

export const nativeQuestionRepository = new NativeQuestionRepository();
