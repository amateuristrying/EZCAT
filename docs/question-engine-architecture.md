# EZCAT Question Engine — Architecture Proposal

**Status:** v2 — incorporates review feedback · **Scope:** system design only, no implementation
**Product thesis:** *Open app → solve today's questions → maintain streak → leave. The AI decides what to practice.*

---

## 0. The One Big Idea: Five Planes

The original metadata list mixes fundamentally different kinds of data into one
"question object." Avg accuracy, bookmarks, times attempted, and last seen do **not**
belong next to question text and options — they change at different rates, are owned by
different systems, and two of them aren't even properties of the question (bookmarks and
last-seen are per-user). The single most important architectural decision is to split the
engine into five planes:

| Plane | Contents | Mutability | Owner |
|---|---|---|---|
| **Content** | question text, options, passages, assets, explanations, capsules | Immutable (versioned) | Ingestion pipeline + editors |
| **Taxonomy** | exam → section → concept graph, prerequisite edges, exam weights | Slowly changing | Curriculum admin |
| **Learner** | attempts, sessions, mastery estimates, bookmarks, review schedule, plans, streaks | Per-user, high write volume | The app runtime |
| **Analytics** | avg accuracy, median time, IRT difficulty, option pick-rates, similarity, calibration, weakness rankings | Derived — recomputed from attempts, never hand-edited | Background jobs |
| **AI** | plan adjustments, coaching narration, generated explanations/similars | Stateless consumer of the other four | Swappable model layer |

**Analytics is not AI.** Analytics computes objective facts (accuracy, pace, weakest
concepts, difficulty estimates). The AI layer *consumes* those facts to make judgment
calls ("two more Geometry questions tomorrow", "skip DILR today — yesterday's mock had
four hard sets"). Keeping them separate means the model behind the AI layer (GPT,
Claude, Gemini, in-house) is swappable without touching the learning engine — and the
engine keeps working when the model is down.

One boundary rule to hold firmly: **the LLM never sits in the scheduling hot path.**
The planner (§5) stays deterministic — scored, replayable, A/B-tunable. The AI layer
adjusts the planner's *inputs* (weights, suppressions, budgets) and narrates its
*outputs*. If an LLM directly picks tomorrow's questions, you lose reproducibility and
debuggability, and you pay model latency + cost on the most-hit path in the product.

Everything below follows from this split. It is what lets you scale to 100k questions,
plug in new exams, and feed the AI Coach without the schema collapsing into a blob.

---

## 1. Content Plane

### 1.1 The delivery unit is not always a question

CAT questions come in two shapes:

- **Standalone** — one QA question, one para-jumble.
- **Grouped** — an RC passage with 4 questions; a DILR caselet with a table, a chart,
  and 5 questions.

This forces a first-class **QuestionGroup** entity. The group owns the shared context
(passage, tables, diagrams); questions own only their prompt and options. Critically,
**the scheduler must treat a group as atomic** — serving question 3 of a DILR set
without its caselet is meaningless, and "DILR × 2" in a daily plan almost certainly
means *one set containing 2+ questions*, not two orphans. Your current flow diagram
assumes single questions; the plan composer must be group-aware from day one.

Rule of thumb: content shared by 2+ questions → lives on the group. Content used by
exactly one question → inlined in that question.

### 1.2 Core content entities

**`question_groups`**
- id, exam_id, section_id, concept_id
- kind: `rc_passage` | `dilr_set` | `caselet` | `generic`
- content: ordered content blocks (see 1.3)
- source provenance (year, slot, PDF page range)
- status, version

**`questions`**
- id (ULID — sortable, safe to expose), external_ref (`CAT2023-S2-Q14`)
- exam_id, section_id, concept_id (leaf of the taxonomy tree)
- group_id (nullable) + position within group
- **answer_type: `mcq_single` | `tita_numeric` | `tita_text` | `mcq_multi`** ← see §10
- content: ordered content blocks
- options: embedded JSON array `[{key, blocks}]` — canonical order preserved
- answer: option key for MCQ; value or accepted range for TITA
- marks / negative_marks: **nullable overrides** — defaults come from the exam/section
  (marking schemes changed across CAT eras; they're a property of the exam context,
  not the question)
- shuffle_allowed: boolean, default **false** for PYQs ("None of these", "Both A and B"
  options break under shuffling — never shuffle unless verified safe)
- lifecycle: `imported → needs_review → verified → published → deprecated → archived`,
  plus a parallel `disputed` flag (a published question can be under dispute without
  erasing its circulation history)
- version, content_hash, source provenance

**Why options embedded, not a separate table:** options are meaningless outside their
question, are always fetched together, and their order matters. A separate table buys
referential integrity you don't need and a join you'll pay on every question load. The
one thing a separate table would give you — per-option analytics (distractor pick
rates) — belongs in the **analytics plane** anyway, keyed `(question_id, option_key)`.

**`explanations`** — separate table, multiple per question
- question_id, kind: `official` | `ai_generated` | `alternative` | `video`
- content blocks (markdown + LaTeX), generator model/version if AI, quality score
- The flow shows "AI Explanation → Alternative Solution" as distinct steps — that's
  two rows here, not two fields. Multiple explanations per question is a feature, and
  keeping them out of the question row keeps the hot read path lean.
- **Blocks carry semantic roles**, not just types: `step` | `shortcut` |
  `common_mistake` | `key_concept` | `formula`. This is a `role` field on the existing
  block format — no new system — and it's what lets the AI Coach serve *pieces*
  ("show only the shortcut", "read the common mistake") instead of dumping 400 words.
  OCR extraction and AI generation both target the same role vocabulary.

**`assets`**
- id, kind: `image` | `table_image` | `chart_image` | `svg`
- storage_key (content-addressed: sha256 of bytes → automatic dedupe across years)
- mime, width, height, alt_text, OCR confidence, source PDF page
- Referenced from content blocks by asset id. Nothing else in the DB knows about files.

### 1.3 Content blocks — the answer to "no giant blobs"

Every piece of renderable content (question body, group passage, explanation) is an
**ordered list of typed blocks**:

- `text` — markdown, **with LaTeX for math** (see §10)
- `image` — asset_id + caption
- `table` — structured rows/columns when OCR confidence is high; falls back to an
  `image` block when it isn't. Structured tables render crisply, reflow on small
  screens, support dark mode, and are machine-readable for the AI Coach.
- future: `code`, `audio`, whatever GRE/GMAT needs

This one format serves questions, passages, explanations, and hints. The renderer is
written once. The OCR pipeline targets one schema. The AI reads one shape.

### 1.4 Versioning and disputes (you will need this)

CAT answer keys get legally challenged; OCR makes mistakes; users will hit "Report."
Requirements:

- Questions are **versioned**; edits create a new version, never mutate in place.
  Over the years you will fix OCR, improve explanations, and replace diagrams —
  every one of those is a new version, and nothing ever disappears.
- Attempts record the version answered — a corrected answer key must not silently
  invalidate historical accuracy stats.
- The `disputed` flag pulls a question from scheduling without deleting it.
- **Never hard-delete** a question (attempts reference it). `deprecated`/`archived` only.
- The in-app **Report** button (already in your UI) feeds a review queue — this is your
  free, crowd-sourced content QA loop. Wire it early.

---

## 2. Taxonomy Plane — designed for multi-exam from day one

The naive design ties topics to CAT sections. Then GMAT arrives and "Percentages" exists
twice. Instead:

- **`concepts`** — a single exam-agnostic tree: `quant → arithmetic → percentages`,
  `verbal → reading_comprehension → inference`. This is the spine of the whole engine.
- **`exams`** — CAT, XAT, SNAP, NMAT, GMAT… with default marking rules, timing rules.
- **`exam_sections`** — VARC/DILR/QA for CAT; sections for other exams.
- **`exam_concept_weights`** — which concepts an exam tests and how heavily. This is
  what the adaptive engine uses to prioritize ("geometry is 12% of CAT QA").

A question tags to a **concept** (+ its source exam). A CAT PYQ on percentages is then
servable, unchanged, to a future CMAT user — the entire multi-exam expansion becomes
a data entry task (new exam row + weights), not a schema migration.

Store the tree with a materialized path or closure table so "all descendants of
arithmetic" is one cheap query — the planner asks this constantly.

### 2.1 The Learning Graph — prerequisites, not just hierarchy

The hierarchy answers "what belongs where." It cannot answer "what do I need to know
*first*." Add **`concept_edges`** — (from_concept, to_concept, kind: `prerequisite`,
strength) — turning the tree into a DAG:

```
Percentages → Profit & Loss → Simple/Compound Interest
Triangles → Similarity → Areas → Coordinate Geometry
```

When a student keeps failing Profit & Loss, the engine can walk the edges backwards
and hypothesize that the real gap is Percentages. Two disciplines keep this honest:

- **Probe, don't conclude.** A failing child concept makes the parent a *hypothesis*.
  The right response is to schedule two Percentages probe questions and let the result
  confirm or reject it — diagnose by experiment, not by graph traversal alone.
- **Coarse and curated.** Edges are curriculum-expert work. Start with dozens of
  concept-level edges, not thousands of subtopic ones. The graph is fully additive —
  one table on top of the existing taxonomy, so it never blocks v1.

Downstream payoffs: prerequisite-aware daily plans, "foundation first" remediation
paths, and capsule sequencing (§8.1).

---

## 3. Analytics Plane — derived facts, never hand-edited

**`question_stats`** (1:1 with question, recomputed async from attempts)
- attempts_count, correct_count, skip_rate
- time: p50 / p90 (medians, not means — time data is heavily skewed)
- **difficulty**: IRT/Elo estimate, not a hand tag (see §5.3)
- discrimination (does this question separate strong from weak students?)
- option_pick_counts (distractor analytics — gold for the AI Coach: "43% of students
  fall for option C here")

**`question_similarity`** (question_id, similar_id, score, method) — **computed** from
embeddings on a schedule. Your instinct to store "Similar Question IDs" as static
metadata is a trap: hand-curated similarity goes stale, doesn't scale past a few
hundred questions, and embeddings do it better. Store an **embedding per question**
(content + concept, pgvector) and materialize top-k into this table.

Derived stats replace three fields on your list: *Estimated Time* (→ p50 from real
attempts, seeded by a per-concept heuristic until data exists), *Difficulty* (→ learned),
*Average Accuracy / Times Attempted* (→ stats row).

---

## 4. Learner Plane

### 4.1 Attempts — the most valuable table you'll ever own

Every future feature — adaptive difficulty, predicted percentile, AI coaching, mock
analysis — trains on this table. Design it generously; it's append-only, so it costs
little.

**`attempts`** (one row per question served)
- user_id, question_id, question_version, group_id
- **context**: `daily_plan` | `mock` | `similar_practice` | `reattempt` | `browse`
  + plan_item_id / mock_session_id when applicable
- started_at, submitted_at, active_time_ms, paused_ms
- answer (option key or TITA value), is_correct, **skipped** (a skip is information,
  not absence of information)
- hints_used, answer_changes (changed B→A→B is a strong uncertainty signal)
- confidence: 4-level post-submit self-report (see below)
- mistake classification: inferred + optional self-report (see below)
- device, app_version

Fine-grained UI telemetry (option toggles, scroll depth on passages) goes to a separate
**`attempt_events`** stream, not onto this row — analytics and learning state have
different lifecycles.

**Confidence — asked *after* submitting, never before.** A tiny chip selector:
`Guess · Unsure · Fairly Sure · Certain`. Pre-answer prompts prime the attempt;
post-answer capture is fast and honest. Correct-while-guessing and
correct-with-certainty are different facts — this is how the engine separates
*knowledge* from *luck*. Two guards protect the "solve and leave" loop:

- Always skippable, and consider **sampling** (every other question, but always on
  wrong answers) rather than asking all ten times a day.
- Derive a **calibration score** in the analytics plane: a user's confident-wrong
  rate is one of the most coachable signals the product will ever own.

**Mistake classification** — richer than correct/incorrect/skipped:
`calculation_error · concept_gap · misread_question · time_pressure · careless`.
The taxonomy is right; the trap is *who classifies*. Self-report after every wrong
answer is heavy friction and self-flattering (everything becomes a "silly mistake").
So capture both, with provenance:

- **Inferred** (`source: inferred`) — from signals already on the attempt: fast +
  confident + classic-distractor pick ≈ calculation slip; slow + guessing + random
  distractor ≈ concept gap. Distractor analytics (§3) are what make this possible.
- **Self-reported** (`source: self_reported`) — an *optional* one-tap "what went
  wrong?" shown only after the student has read the explanation.

The Coach weighs the two sources accordingly, and the payoff is precision coaching:
not "you struggle in Geometry" but "you understand Geometry — you're losing marks to
calculation errors under time pressure."

### 4.2 Learning state

- **`user_concept_state`** — (user, concept): mastery 0–1, attempts, correct, pace
  ratio (user time ÷ p50), last_practiced_at, **due_at** (spaced repetition), lapses.
  Seeded from the onboarding self-rating (Beginner/Intermediate/Advanced → prior),
  updated after every attempt.
- **`user_question_state`** — (user, question): seen_count, last_seen_at, last_result,
  bookmarked, next_review_at. This is what prevents repeats and schedules mistake
  reattempts. (Bookmarks live *here* — per-user — not on the question.)
- **`daily_plans`** + **`plan_items`** — see §5. Plans are persisted, not generated on
  the fly at render time, so the plan survives app restarts, works offline, and the
  rationale is auditable.
- **`user_daily_summary`** — (user, date): questions done, time, streak state. Computed
  against the **user's local timezone**, with a grace window — nothing kills a
  streak-based product faster than a streak lost to UTC midnight.

### 4.3 Sessions generalize daily practice and mocks

A **`practice_session`** entity (kind: `daily` | `mini_mock` | `sectional_mock` |
`full_mock` | `custom`) with per-session timing rules. Mocks are not a separate engine —
they're the same questions, same attempts table, different session wrapper. This is how
"PYQs, licensed mocks, our own mocks, AI-generated practice all use the same engine"
actually happens.

Sessions are also an **intelligence source about *how* the student studies**, not just
what they answer. Per session: started/ended, device, questions solved, interruptions
(app backgrounded mid-question), and:

- **focus_score — derived, never asked.** Computed from pause patterns, interruption
  counts, and pace variance. Asking "how focused were you?" is friction; the behavior
  already says it.
- **mood — optional and occasional** (a light prompt now and then, never a gate).
- **location — coarse or absent.** Time-of-day and device patterns deliver most of the
  "when does Abhi perform best" value (evenings dip, weekends run long, phone is
  faster than tablet) without the privacy cost of location capture. Timestamps and
  device are already on every attempt — this analysis is nearly free.

The analytics plane turns session history into facts ("accuracy drops 12% after
9 pm"); the AI layer turns facts into adjustments ("schedule the hard DILR set in the
morning").

---

## 5. Adaptive Engine — tomorrow's questions

### 5.1 Pipeline: generate → filter → score → compose

**Candidate generation** (per section) from four pools:
1. **Due reviews** — mistakes whose spaced-repetition `next_review_at` has arrived
2. **Weak concepts** — lowest mastery × exam weight
3. **Coverage** — concepts never/rarely seen (breadth insurance)
4. **Strengths** — light sampling to maintain + build confidence

**Hard filters:** published only, not seen within cooldown, difficulty inside the
user's band, **group integrity** (whole set or nothing), fits remaining time budget.

**Scoring** — transparent weighted sum (resist the ML-model urge until you have data):

```
score = w1·need (weakness × exam_weight)
      + w2·urgency (spaced-rep overdue-ness)
      + w3·difficulty_match (target ~70% success probability)
      + w4·diversity (penalize same subtopic twice in one day)
      + w5·freshness
```

**Composition:** pack scored candidates into the daily time budget (default 20 min)
using per-item p50 times, honoring the section mix. Busy-day fallback: a 5-minute
"streak saver" plan — protecting the streak on a bad day matters more than the ideal mix.

### 5.2 Every plan item records *why*

Store a machine-readable rationale on each plan item (`weak_topic:geometry`,
`review_due`, `coverage:new`). Two payoffs: the AI Coach can narrate the plan honestly
("2 geometry questions because Tuesday's mistakes are due for review"), and you can
debug/tune the planner by querying which reasons correlate with improvement. An
unexplainable planner is untunable.

### 5.3 Difficulty must be learned, not tagged

Hand tags drift and OCR can't produce them. Use item response theory (or simpler Elo):
question difficulty and user ability update from every attempt. Bootstrap: editor's
rough tag + historical CAT accuracy data as priors; the estimate converges as attempts
accumulate. The 70%-success targeting is the engagement sweet spot — hard enough to
grow, easy enough to keep the streak alive.

**~70% success rate is the design target for daily practice** — this drives retention,
which drives everything else.

### 5.4 Cold start

New users have zero attempts. You already collect the fix at onboarding: the
self-rated level per section → mastery priors. Treat week one explicitly as
**calibration mode** — deliberately span difficulty within each weak/strong section to
localize actual ability fast, then narrow to the 70% band.

---

## 6. OCR / Ingestion Pipeline Compatibility

Design the boundary as a **versioned ingestion contract** (JSON schema with an explicit
`schema_version`), and never let OCR output write to production tables directly:

```
PDF → OCR service → contract JSON → staging_questions → validate → review queue → publish
```

- **`staging_questions`** retains the *raw* OCR JSON alongside normalized fields,
  validation errors, per-field OCR confidence, and review status. Raw retention means
  a better parser later can re-process without re-OCRing.
- **Idempotent imports** via natural key (exam, year, slot, question_no) + content
  hash — re-running an import is always safe.
- **Human review queue**, prioritized by confidence: math notation, tables, and answer
  keys are exactly where OCR fails and where errors are fatal to trust. Budget for
  human eyes on every published question. A 5,000-question bank with 2% silent errors
  is a product-killer; students *know* the official keys.
- Assets upload first (content-addressed) → asset ids → content blocks reference them.
- Provenance (PDF page refs) kept on questions and assets for audit and re-OCR.
- **Near-duplicate detection at ingest** (embeddings) — CAT reuses concepts across
  years; you want repeats linked, not served as "new."

---

## 7. Storage Strategy

- **Postgres** for everything relational + JSONB content blocks + **pgvector** for
  embeddings. One database covers all five planes at your scale for years. (Supabase
  works well with Expo and gives you auth + storage + Postgres in one move.)
- **Object storage + CDN** (S3/R2/Supabase Storage) for all binary assets. Images
  **never** in the database. Content-addressed keys give free dedupe and immutable
  cache headers (`cache-control: immutable` — a year's PYQ diagram never changes).
- Pre-generate 2–3 responsive sizes per diagram at ingest; phones shouldn't download
  print-resolution scans.
- **Offline:** daily practice happens on commutes. Prefetch tonight's plan + its assets;
  queue attempts locally; reconcile server-side. Server is the source of truth for
  streaks (with the grace window). The persisted-plan design (§4.2) is what makes this
  possible.

Architecture shape: **modular monolith** with clean module boundaries (content /
taxonomy / stats / planner / learner-state). No microservices — the seams are the
module interfaces, and they can become services later if ever needed.

---

## 8. AI Coach Compatibility

The Coach should read **one document, not ten joins**. Expose a versioned
**learner-profile read model**, rebuilt incrementally after each attempt:

- mastery vector across concepts (+ trend)
- recent mistakes with concept + distractor chosen + confidence
- pace profile (fast-and-wrong vs slow-and-right — different coaching)
- streak state, plan adherence, time-of-day patterns
- plan rationales (§5.2) so the Coach explains rather than hallucinates

What makes future AI dramatically better, in priority order:
1. **Rich attempts** (confidence, answer changes, hints, time) — collect from day one;
   you can't backfill behavior
2. **Distractor analytics** — "you picked the classic trap" beats "wrong"
3. **Embeddings** — similarity retrieval grounds "generate similar questions" so
   generation is constrained by a real PYQ's structure (generate → auto-solve →
   verify → human-sample; never let unverified generated answers reach students)
4. **Structured explanations** — role-tagged blocks let the Coach serve exactly the
   piece that helps ("show only the shortcut") rather than regenerate from scratch

### 8.1 Knowledge Capsules — from scheduler to tutor

Every concept in the taxonomy can eventually own a tiny structured lesson —
**`concept_capsules`**, versioned content-plane entities built from the same role-tagged
block format: `definition · formula · visual · worked_example · common_mistakes ·
revision_notes`.

The trigger rule that changes the product: *N failures in a concept within a window →
serve the capsule → schedule two reinforcement questions.* A fifth wrong Percentages
answer stops producing a fifth explanation and starts producing a two-minute
Percentages lesson followed by targeted practice. Combined with the learning graph
(§2.1), remediation can start at the *prerequisite's* capsule. This is the moment
EZCAT becomes an intelligent tutor rather than an intelligent scheduler.

Be honest about the cost: ~200+ concepts × capsule is a real content project. The
pipeline is the same one questions use — AI-drafted → staging → human review queue →
publish — and authoring order is driven by analytics (write the Percentages capsule
first because aggregate weakness data says everyone needs it).

---

## 9. Bank Depth — an inconvenient number

Do this math early: CAT 2000–2025 at ~66–100 questions/year, minus the missing
2009–2016, minus OCR failures and duplicates, plausibly nets **4,000–6,000 published
questions**. A committed daily user consuming ~10/day burns **~3,600/year** — a power
user can exhaust entire sections in months. Consequences, in order:

1. Spaced **re-exposure is a feature, not a fallback** — reattempting a question from
   6 weeks ago has genuine pedagogical value; the scheduler should embrace it.
2. **AI-generated similars are core roadmap**, not a nice-to-have — they're the only
   scalable refill (with the verification gate above).
3. The cooldown/repeat policy (§5.1) needs tuning per bank depth per section — DILR
   sets deplete fastest.

---

## 10. Critique of the Current Thinking

Direct answers to "what am I missing":

1. **TITA questions.** CAT has had non-MCQ type-in-the-answer questions since 2015 —
   no options at all. Your model assumes options exist. `answer_type` (§1.2) is
   mandatory, and the attempt's `answer` field must hold typed values, not just option
   keys. This is the biggest concrete gap in the brief.
2. **Math rendering.** QA and half of DILR are unrenderable without LaTeX. If OCR emits
   math as inline images, you inherit blurry, unsearchable, un-AI-readable content
   forever. The OCR contract must emit LaTeX; the block format assumes it.
3. **Metadata list mixes planes** — the five-plane split (§0) is the fix; bookmarks
   and last-seen are per-user state, accuracy/time are derived stats.
4. **Static "Similar Question IDs"** — compute from embeddings (§3), don't curate.
5. **Marks on the question** — marking schemes belong to exam context with per-question
   override; CAT's scheme has changed across your 26-year span.
6. **Group atomicity** — RC/DILR sets schedule as units (§1.1); your flow and plan
   format ("DILR × 2") need this nuance.
7. **Versioning + disputes + no hard deletes** (§1.4) — answer-key corrections are a
   *when*, not an *if*.
8. **Option shuffling** — default off for PYQs; "None of these" breaks otherwise.
9. **Timezones & streak grace** — "daily" means user-local; add a grace window.
10. **Offline-first daily loop** (§7) — commute practice is your core use case.
11. **Copyright posture.** PYQs are IIM-authored. Common practice treats them as de
    facto public domain, but keep provenance on every question, license metadata on
    every future licensed mock, and takedown capability (retire by source in one
    query). Worth a real legal opinion before scale. *(Not legal advice.)*
12. **Cold start** (§5.4) — you already collect the seed data at onboarding; use it.
13. **Bank exhaustion** (§9) — plan for it now, it shapes the re-exposure policy and
    the AI-generation roadmap.
14. **Predicted percentile honesty** — the Home screen shows "93.4 percentile." Until
    you have a real calibration model (mock scores vs actual percentile mappings),
    label it as an estimate and keep the model simple (accuracy × difficulty coverage).
    False precision here erodes exactly the trust a daily-habit product runs on.

### What you got right (keep these)

- PYQ-only focus — highest-trust content in the category, and it makes the engine
  data problem tractable.
- "AI decides, student never picks a chapter" — this is the product. The plan
  rationale system (§5.2) is what keeps it trustworthy.
- Building the engine before the Questions screen — the screen is a thin client over
  `practice_sessions` + `plan_items`; designing this first was the correct order.
- Assuming clean JSON from a separate OCR pipeline — right boundary; the ingestion
  contract (§6) formalizes it.

---

## 11. Suggested Build Order (when implementation starts)

1. Taxonomy (exams, sections, concepts, weights) — everything references it
2. Content plane (groups, questions, assets, role-tagged explanations) + ingestion
   contract + staging
3. Attempts (with confidence + inferred mistake signals) + sessions +
   user_question_state + user_concept_state (simple mastery math first)
4. Planner v1: rules-based generate/filter/score/compose with rationales
5. Analytics jobs (accuracy, p50 time, calibration; Elo difficulty once attempts flow)
6. Embeddings + similarity (needs published content to embed)
7. Learner-profile read model + AI layer boundary (adjustments in, narration out)
8. Mock sessions (reuses everything above)
9. Learning-graph edges (`concept_edges`) + prerequisite-aware probing — additive
10. Knowledge capsules, authored in aggregate-weakness order — additive

Each step ships value alone, and nothing later forces a redesign of anything earlier.
Steps 9–10 are deliberately last: both are pure additions on top of a running engine.
