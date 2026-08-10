-- EZCAT Database Schema
-- Stage 3 Shipped Schema for EZCAT Question Engine
-- Target Database: SQLite 3

-- -----------------------------------------------------------------------------
-- 1. Metadata Table
-- Key-value store for application runtime sanity checks (e.g. build_date,
-- source_row_count, schema_version).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS _meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- -----------------------------------------------------------------------------
-- 2. Questions Table
-- Main storage for shipped question content.
-- Source provenance, raw IDs, and internal source_type columns are deliberately
-- omitted per Stage 3 spec (§8). source_type is derivable from (year IS NOT NULL).
-- MCQ vs TITA is derivable from (options IS NOT NULL AND json_array_length(options) > 0).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY,                   -- Plain rowid alias; no prefixed internal question_id
    question_text TEXT NOT NULL,
    options TEXT,                             -- JSON array: [{"label":"A","text":"..."}] or [] for TITA
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    section TEXT NOT NULL CHECK (section IN ('QA', 'DILR', 'VARC')),
    year INTEGER,                             -- PYQs only; NULL for practice questions
    slot INTEGER,                             -- PYQs only; NULL for practice questions
    CHECK (options IS NULL OR json_valid(options))
);

-- -----------------------------------------------------------------------------
-- 3. Indices
-- -----------------------------------------------------------------------------

-- Index on section: Powers daily practice mode and topic/section filtering (e.g. SELECT * FROM questions WHERE section = 'QA')
CREATE INDEX IF NOT EXISTS idx_questions_section ON questions(section);

-- Index on (year, slot): Powers full mock exam assembly for a specific exam sitting (e.g. SELECT * FROM questions WHERE year = 2022 AND slot = 1)
CREATE INDEX IF NOT EXISTS idx_questions_year_slot ON questions(year, slot);

-- Composite index on (year, slot, section): Powers section-by-section mock exam navigation (e.g. loading VARC section of CAT 2022 Slot 1)
CREATE INDEX IF NOT EXISTS idx_questions_year_slot_section ON questions(year, slot, section);
