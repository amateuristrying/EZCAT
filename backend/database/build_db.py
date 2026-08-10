#!/usr/bin/env python3
"""
EZCAT Database Compiler — Stage 3 Database Builder
Location: backend/database/build_db.py

Reads canonical question records from backend/dataset/ (excluding _flagged/)
and compiles them into a SQLite database matching backend/database/schema.sql.
Automatically syncs assets/cat_questions.db and exports assets/cat_questions.json.
"""

import os
import sys
import json
import glob
import sqlite3
import shutil
from datetime import datetime, timezone

def infer_section(record):
    """
    Infer section ('QA', 'DILR', 'VARC') for canonical records where
    section is None or unspecified, using topic and source metadata hints.
    """
    sec = record.get("section")
    if sec in ("QA", "DILR", "VARC"):
        return sec

    topic = (record.get("topic") or "").lower()
    prov = record.get("provenance") or {}
    orig_file = (prov.get("original_file") or "").lower()
    q_id = (record.get("question_id") or "").lower()
    q_text = (record.get("question_text") or "").lower()

    combined = f"{topic} {orig_file} {q_id} {q_text[:100]}"

    # Explicit DILR terms
    if any(k in combined for k in [
        "dilr", "lrdi", "reasoning", "data interpretation", "logical",
        "puzzle", "chart", "arrangement", "matrix", "grid", "game",
        "tournament", "venn", "caselet"
    ]):
        return "DILR"

    # Explicit VARC terms
    if any(k in combined for k in [
        "varc", "reading", "comprehension", "verbal", "para",
        "jumble", "summary", "odd one out", "rc"
    ]):
        return "VARC"

    # Quantitative Aptitude terms
    if any(k in combined for k in [
        "quant", "math", "algebra", "arithmetic", "geometry", "number",
        "profit", "time", "ratio", "logarithm", "equation", "permutation",
        "probability", "trigonometry", "function", "sequence", "series",
        "progression", "set theory", "races", "mixture", "alligation",
        "interest", "speed", "work", "train", "hcf", "lcm", "triangle",
        "circle", "rectangle", "percent", "ratios", "pipe", "boat",
        "average", "partner", "variation", "area", "cost", "price",
        "mean", "root", "polynomial", "fraction", "modulus", "inequality",
        "integers", "prime", "sum", "subsets", "cubes", "quadrilateral"
    ]):
        return "QA"

    # Fallback to source directory hints
    if "01_quant" in orig_file or "quant" in orig_file or "08_bodheeprep" in orig_file:
        return "QA"
    if "02_dilr" in orig_file or "dilr" in orig_file:
        return "DILR"
    if "03_varc" in orig_file or "varc" in orig_file:
        return "VARC"

    return None

def build_database():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.normpath(os.path.join(base_dir, "..", ".."))
    schema_path = os.path.join(base_dir, "schema.sql")
    db_path = os.path.join(base_dir, "cat_questions.db")
    dataset_dir = os.path.normpath(os.path.join(base_dir, "..", "dataset"))

    assets_dir = os.path.join(project_root, "assets")
    assets_db_path = os.path.join(assets_dir, "cat_questions.db")
    assets_json_path = os.path.join(assets_dir, "cat_questions.json")

    print(f"=== EZCAT Database Compiler ===")
    print(f"Schema Path:  {schema_path}")
    print(f"Target DB:    {db_path}")
    print(f"Dataset Dir:  {dataset_dir}")

    if not os.path.exists(schema_path):
        print(f"ERROR: schema.sql not found at {schema_path}", file=sys.stderr)
        sys.exit(1)

    if not os.path.exists(dataset_dir):
        print(f"ERROR: dataset directory not found at {dataset_dir}", file=sys.stderr)
        sys.exit(1)

    # Read schema DDL verbatim from disk
    with open(schema_path, "r", encoding="utf-8") as sf:
        schema_sql = sf.read()

    # Rebuild strategy: delete existing DB file to ensure clean compile
    if os.path.exists(db_path):
        os.remove(db_path)
        print("Removed existing database file for clean rebuild.")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Execute DDL verbatim
    cursor.executescript(schema_sql)
    print("Applied schema.sql DDL verbatim.")

    # Locate canonical JSON files (both previous_papers and practice_questions, excluding _flagged)
    json_files = glob.glob(os.path.join(dataset_dir, "**", "*.json"), recursive=True)
    canonical_files = [f for f in json_files if "_flagged" not in f]

    print(f"Found {len(canonical_files)} canonical JSON files to process.\n")

    total_records_considered = 0
    inserted_count = 0
    skipped_records = []

    section_breakdown = {"QA": 0, "DILR": 0, "VARC": 0}
    type_breakdown = {"MCQ": 0, "TITA": 0}
    source_breakdown = {"previous_paper": 0, "practice_question": 0}
    json_export_list = []

    for file_path in canonical_files:
        rel_file = os.path.relpath(file_path, dataset_dir)
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            records = data.get("questions", data.get("data", [data])) if isinstance(data, dict) else data
            if not isinstance(records, list):
                continue

            for idx, r in enumerate(records):
                if not isinstance(r, dict):
                    continue

                total_records_considered += 1
                q_id = r.get("question_id") or f"{rel_file}[{idx}]"

                # Extract and validate fields
                q_text = r.get("question_text")
                corr_ans = r.get("correct_answer")

                if not q_text or not isinstance(q_text, str) or not q_text.strip():
                    skipped_records.append((q_id, rel_file, "Missing or empty question_text"))
                    continue

                if not corr_ans or not isinstance(corr_ans, str) or not corr_ans.strip():
                    skipped_records.append((q_id, rel_file, "Missing or empty correct_answer"))
                    continue

                section = infer_section(r)
                if not section or section not in ("QA", "DILR", "VARC"):
                    skipped_records.append((q_id, rel_file, f"Unresolvable or invalid section '{r.get('section')}'"))
                    continue

                # Serialize options
                opts_raw = r.get("options")
                if opts_raw is None:
                    opts_raw = []
                if not isinstance(opts_raw, list):
                    skipped_records.append((q_id, rel_file, "options field is not a list"))
                    continue

                options_json = json.dumps(opts_raw, ensure_ascii=False)
                explanation = r.get("solution_text")

                # Exam context for PYQs vs practice questions
                exam_ctx = r.get("exam_context") if isinstance(r.get("exam_context"), dict) else None
                source_type = r.get("source_type")

                if source_type == "previous_paper" or exam_ctx or "previous_papers" in rel_file:
                    year = exam_ctx.get("year") if exam_ctx else None
                    slot = exam_ctx.get("slot") if exam_ctx else None
                    is_pyq = True
                else:
                    year = None
                    slot = None
                    is_pyq = False

                # Insert into questions table (id auto-generated)
                try:
                    cursor.execute("""
                        INSERT INTO questions (question_text, options, correct_answer, explanation, section, year, slot)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (q_text, options_json, corr_ans, explanation, section, year, slot))
                    
                    row_id = cursor.lastrowid
                    inserted_count += 1
                    section_breakdown[section] += 1

                    if len(opts_raw) > 0:
                        type_breakdown["MCQ"] += 1
                    else:
                        type_breakdown["TITA"] += 1

                    if is_pyq:
                        source_breakdown["previous_paper"] += 1
                    else:
                        source_breakdown["practice_question"] += 1

                    json_export_list.append({
                        "id": row_id,
                        "question_text": q_text,
                        "options": opts_raw,
                        "correct_answer": corr_ans,
                        "explanation": explanation,
                        "section": section,
                        "year": year,
                        "slot": slot
                    })

                except sqlite3.IntegrityError as err:
                    skipped_records.append((q_id, rel_file, f"Database constraint error: {err}"))

        except Exception as err:
            skipped_records.append((f"FILE_ERROR", rel_file, f"Failed to parse JSON file: {err}"))

    # Populate _meta table
    build_date_iso = datetime.now(timezone.utc).isoformat()
    meta_entries = [
        ("schema_version", "1.0"),
        ("build_date", build_date_iso),
        ("source_row_count", str(inserted_count))
    ]

    cursor.executemany("INSERT INTO _meta (key, value) VALUES (?, ?)", meta_entries)
    conn.commit()
    conn.close()

    # Sync assets directory
    os.makedirs(assets_dir, exist_ok=True)
    shutil.copy2(db_path, assets_db_path)
    with open(assets_json_path, "w", encoding="utf-8") as jf:
        json.dump(json_export_list, jf, ensure_ascii=False, separators=(',', ':'))

    print(f"Synced database to {assets_db_path}")
    print(f"Exported JSON dataset to {assets_json_path}")

    # Final Compilation Report
    print("==========================================================")
    print("              DATABASE COMPILATION REPORT                 ")
    print("==========================================================")
    print(f"Target Database File:       {db_path}")
    print(f"Asset Database File:        {assets_db_path}")
    print(f"Asset JSON File:            {assets_json_path}")
    print(f"Canonical Files Processed:  {len(canonical_files)}")
    print(f"Total Records Considered:   {total_records_considered}")
    print(f"Total Rows Inserted:        {inserted_count}")
    print(f"Total Records Skipped:       {len(skipped_records)}")
    print("----------------------------------------------------------")
    print("Section Breakdown:")
    for sec, count in section_breakdown.items():
        pct = (count / inserted_count * 100) if inserted_count else 0
        print(f"  - {sec:5s}: {count:5d} ({pct:5.1f}%)")
    print("----------------------------------------------------------")
    print("Question Type Breakdown:")
    for qtype, count in type_breakdown.items():
        pct = (count / inserted_count * 100) if inserted_count else 0
        print(f"  - {qtype:5s}: {count:5d} ({pct:5.1f}%)")
    print("----------------------------------------------------------")
    print("Source Breakdown:")
    for stype, count in source_breakdown.items():
        pct = (count / inserted_count * 100) if inserted_count else 0
        print(f"  - {stype:18s}: {count:5d} ({pct:5.1f}%)")
    print("----------------------------------------------------------")
    if skipped_records:
        print("Skipped Records Details:")
        for qid, relf, reason in skipped_records:
            print(f"  - [{qid}] in {relf}: {reason}")
    else:
        print("Skipped Records Details: None")
    print("==========================================================")
    print("BUILD COMPLETED SUCCESSFULLY.")

if __name__ == "__main__":
    build_database()
