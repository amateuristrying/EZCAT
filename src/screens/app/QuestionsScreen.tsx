import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';
import { Card, IconBadge } from '../../components/AppUI';
import { useAppStore } from '../../store/AppStore';
import { type SectionId } from '../../constants/data';
import { checkMCQCorrect, checkTITACorrect, UIQuestion, mapRepoQuestionToUIQuestion } from '../../data/adapter';
import { getSimilarQuestion, SectionType } from '../../data/questionRepository';
import { ReportModal } from '../../components/ReportModal';
import { AskAIChatModal } from '../../components/AskAIChatModal';

// ─── Section tab meta ────────────────────────────────────────────────────────

const SECTION_META: { key: SectionId; bg: string; color: string; glyph: string }[] = [
  { key: 'qa', bg: Colors.qaBg, color: Colors.qa, glyph: '☰' },
  { key: 'dilr', bg: Colors.dilrBg, color: Colors.dilr, glyph: '☰' },
  { key: 'varc', bg: Colors.varcBg, color: Colors.varc, glyph: 'A' },
];
const SECTION_LABEL: Record<SectionId, string> = { qa: 'QA', dilr: 'DILR', varc: 'VARC' };

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function QuestionsScreen() {
  const {
    answers,
    recordAnswerAttempt,
    progress,
    setActiveTab,
    dailyQuestions,
    isQuestionsLoading,
    loadDailyPracticeSet,
    userProgress,
    toggleBookmark,
  } = useAppStore();

  const [activeSection, setActiveSection] = useState<SectionId>('qa');
  const [indexBySection, setIndexBySection] = useState<Record<SectionId, number>>({
    varc: 0,
    dilr: 0,
    qa: 0,
  });
  const [pending, setPending] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [hintShown, setHintShown] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [askAiModalOpen, setAskAiModalOpen] = useState(false);
  const [isFetchingSimilar, setIsFetchingSimilar] = useState(false);

  // Automatically trigger loading daily practice set from repository on mount
  useEffect(() => {
    if (dailyQuestions.length === 0 && !isQuestionsLoading) {
      loadDailyPracticeSet();
    }
  }, [dailyQuestions.length, isQuestionsLoading, loadDailyPracticeSet]);

  const sectionQuestions: UIQuestion[] = dailyQuestions.filter(
    (q) => q.section === activeSection
  );

  const rawIdx = indexBySection[activeSection] || 0;
  const currentIndex = sectionQuestions.length > 0
    ? Math.max(0, Math.min(rawIdx, sectionQuestions.length - 1))
    : 0;
  const q = sectionQuestions[currentIndex];

  // Sync selection/reveal state whenever the current question changes.
  useEffect(() => {
    if (!q) return;
    const recorded = answers[q.id];
    setPending(recorded ?? null);
    setRevealed(recorded != null);
    setHintShown(false);
    setNotice(null);
  }, [q?.id, answers]);

  const selectOption = (val: string) => {
    if (revealed) return;
    setPending(val);
  };

  const handlePrimary = () => {
    if (!q) return;
    if (!revealed) {
      if (pending == null || pending.trim() === '') return;
      const correctBool = q.isTITA
        ? checkTITACorrect(pending, q.rawCorrectAnswer)
        : checkMCQCorrect(pending, q.rawCorrectAnswer, q.options);

      // Record answer attempt in AppStore & persist to AsyncStorage
      recordAnswerAttempt(q.id, activeSection, correctBool, pending, q.rawId);
      setRevealed(true);
    } else {
      // Advance to the next question in this section (wraps at the end).
      setIndexBySection((prev) => ({
        ...prev,
        [activeSection]: (currentIndex + 1) % sectionQuestions.length,
      }));
    }
  };

  const isBookmarked = q ? (userProgress.bookmarkedQuestionIds || []).includes(q.id) : false;

  const handleFetchSimilar = async () => {
    if (!q || isFetchingSimilar) return;
    setIsFetchingSimilar(true);
    try {
      const repoSec = activeSection.toUpperCase() as SectionType;
      const match = await getSimilarQuestion(repoSec, q.rawId || q.id);
      if (match) {
        const uiMatch = mapRepoQuestionToUIQuestion(match);
        const exists = dailyQuestions.some((item) => item.id === uiMatch.id);
        if (!exists) {
          dailyQuestions.push(uiMatch);
        }
        const updatedSectionQuestions = dailyQuestions.filter((item) => item.section === activeSection);
        const targetIndex = updatedSectionQuestions.findIndex((item) => item.id === uiMatch.id);
        if (targetIndex !== -1) {
          setIndexBySection((prev) => ({
            ...prev,
            [activeSection]: targetIndex,
          }));
        }
        setNotice(`Loaded a similar concept ${SECTION_LABEL[activeSection]} question!`);
      } else {
        setNotice(`No additional similar questions available for ${SECTION_LABEL[activeSection]}.`);
      }
    } catch (err) {
      setNotice('Failed to load a similar question.');
    } finally {
      setIsFetchingSimilar(false);
    }
  };
  const isCorrect = revealed && q
    ? (q.isTITA
        ? checkTITACorrect(pending || '', q.rawCorrectAnswer)
        : checkMCQCorrect(pending || '', q.rawCorrectAnswer, q.options))
    : false;

  const positionPct = sectionQuestions.length > 0
    ? ((currentIndex + 1) / sectionQuestions.length) * 100
    : 0;

  // Render loading state if questions are being fetched from repository
  if (isQuestionsLoading && dailyQuestions.length === 0) {
    return (
      <View style={[styles.flex, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading Today's Practice Questions...</Text>
      </View>
    );
  }

  // Fallback if no questions are available for the active section
  if (!q) {
    return (
      <View style={[styles.flex, styles.centerContent]}>
        <Text style={styles.noQuestionsText}>No questions available for {SECTION_LABEL[activeSection]}.</Text>
        <Pressable style={styles.primaryBtn} onPress={() => loadDailyPracticeSet()}>
          <Text style={styles.primaryBtnText}>Reload Questions</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ─── Header ───────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Questions</Text>
        <Pressable
          style={styles.endBtn}
          onPress={() => setActiveTab('home')}
          accessibilityRole="button"
          accessibilityLabel="End Session"
        >
          <Text style={styles.endIcon}>⏻</Text>
          <Text style={styles.endText}>End Session</Text>
        </Pressable>
      </View>

      {/* ─── Today's Plan legend ──────────────────────────────── */}
      <View style={styles.planRow}>
        <Text style={styles.planLabel}>Today's Plan</Text>
        <View style={styles.legendGroup}>
          <Legend color={Colors.varc} text={`VARC ${progress.bySection.varc.total}`} />
          <Legend color={Colors.dilr} text={`DILR ${progress.bySection.dilr.total}`} />
          <Legend color={Colors.qa} text={`QA ${progress.bySection.qa.total}`} />
        </View>
      </View>

      {/* ─── Section tabs + palette ───────────────────────────── */}
      <View style={styles.tabsRow}>
        <View style={styles.tabsGroup}>
          {SECTION_META.map((t) => {
            const active = activeSection === t.key;
            const sp = progress.bySection[t.key];
            return (
              <Pressable
                key={t.key}
                onPress={() => setActiveSection(t.key)}
                style={[styles.tab, active && styles.tabActive]}
              >
                <IconBadge bg={active ? 'rgba(255,255,255,0.16)' : t.bg} size={28} radius={9}>
                  <Text style={{ color: active ? '#FFFFFF' : t.color, fontFamily: FontFamily.bold, fontSize: 13 }}>
                    {t.glyph}
                  </Text>
                </IconBadge>
                <View>
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                    {SECTION_LABEL[t.key]}
                  </Text>
                  <Text style={[styles.tabFrac, active && styles.tabFracActive]}>
                    {sp.answered} / {sp.total}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          style={styles.paletteBtn}
          onPress={() => setPaletteOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Open Question Palette"
        >
          <Text style={styles.paletteIcon}>▦</Text>
          <Text style={styles.paletteText}>Question{'\n'}Palette</Text>
        </Pressable>
      </View>

      {/* ─── Progress strip ───────────────────────────────────── */}
      <View style={styles.progressCard}>
        <View style={styles.progressTopRow}>
          <Text style={styles.progressQ}>
            Question <Text style={styles.hlBlue}>{currentIndex + 1}</Text> of {sectionQuestions.length}
          </Text>
          <View style={styles.progressMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>🕐</Text>
              <View>
                <Text style={styles.metaValue}>12:45</Text>
                <Text style={styles.metaSub}>Est. Time</Text>
              </View>
            </View>
            <Pressable
              style={styles.metaItem}
              onPress={() => q && toggleBookmark(q.id)}
              accessibilityRole="button"
              accessibilityLabel="Bookmark question"
            >
              <Text style={styles.metaIcon}>{isBookmarked ? '🔖' : '📑'}</Text>
              <Text style={[styles.metaSub, isBookmarked && styles.bookmarkedText]}>
                {isBookmarked ? 'Saved' : 'Bookmark'}
              </Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${positionPct}%` }]} />
        </View>
      </View>

      {/* ─── Question card ────────────────────────────────────── */}
      <Card style={styles.qCard}>
        {q.passage && <Text style={styles.passage}>{q.passage}</Text>}

        <Text style={styles.qText}>{q.prompt}</Text>

        {q.statements?.map((s) => (
          <View key={s.key} style={styles.statement}>
            <Text style={styles.statementKey}>{s.key}:</Text>
            <Text style={styles.statementText}>{s.text}</Text>
          </View>
        ))}

        {/* ─── Option rendering: MCQ vs TITA ───────────────────── */}
        {!q.isTITA ? (
          /* MCQ Option list */
          q.options.map((opt) => {
            const state = optionState(opt.key, pending, revealed, q.correctKey);
            return (
              <Pressable
                key={opt.key}
                onPress={() => selectOption(opt.key)}
                style={[styles.option, state.container]}
              >
                <View style={[styles.optionCircle, state.circle]}>
                  <Text style={[styles.optionLetter, state.letter]}>{opt.key}</Text>
                </View>
                <Text style={styles.optionText}>{opt.text}</Text>
                {state.mark ? <Text style={[styles.optionMark, state.letter]}>{state.mark}</Text> : null}
              </Pressable>
            );
          })
        ) : (
          /* TITA Input Component */
          <View style={styles.titaContainer}>
            <View style={styles.titaBadgeRow}>
              <View style={styles.titaBadge}>
                <Text style={styles.titaBadgeText}>⌨️ Type In The Answer (TITA)</Text>
              </View>
              <Text style={styles.titaNotice}>No negative marking</Text>
            </View>
            <TextInput
              style={[
                styles.titaInput,
                pending != null && pending.trim() !== '' && !revealed && styles.titaInputActive,
                revealed && isCorrect && styles.titaInputCorrect,
                revealed && !isCorrect && styles.titaInputWrong,
              ]}
              value={pending || ''}
              onChangeText={selectOption}
              placeholder="Type your answer here (e.g. 380)..."
              placeholderTextColor={Colors.textMuted}
              editable={!revealed}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="default"
            />
          </View>
        )}

        {/* Result banner */}
        {revealed && (
          <View style={[styles.result, isCorrect ? styles.resultCorrect : styles.resultWrong]}>
            <Text style={[styles.resultText, { color: isCorrect ? Colors.success : Colors.danger }]}>
              {isCorrect
                ? '✓ Correct!'
                : `✗ Incorrect — correct answer is ${q.rawCorrectAnswer || q.correctKey}`}
            </Text>
          </View>
        )}

        {/* Hint */}
        {hintShown && (q.hint || q.explanation) && (
          <View style={styles.hintBox}>
            <Text style={styles.hintText}>💡 {q.hint || q.explanation}</Text>
          </View>
        )}

        {/* Notice Banner */}
        {notice && (
          <View style={[styles.result, { backgroundColor: Colors.purpleBg, marginTop: 12 }]}>
            <Text style={[styles.resultText, { color: Colors.purple }]}>{notice}</Text>
          </View>
        )}
      </Card>

      {/* ─── Actions ──────────────────────────────────────────── */}
      <Card style={styles.actionsCard}>
        <Action icon="💡" label="Hint" onPress={() => setHintShown((v) => !v)} />
        <Action icon="💬" label="Ask AI" onPress={() => setAskAiModalOpen(true)} />
        <Action
          icon="⚠️"
          label="Report"
          onPress={() => setReportModalOpen(true)}
        />
        <Action
          icon="↻"
          label={isFetchingSimilar ? 'Loading...' : 'Similar'}
          onPress={handleFetchSimilar}
        />
      </Card>

      {/* ─── Primary CTA ──────────────────────────────────────── */}
      <Pressable
        onPress={handlePrimary}
        disabled={!revealed && (pending == null || pending.trim() === '')}
        style={({ pressed }) => [
          styles.primaryBtn,
          !revealed && (pending == null || pending.trim() === '') && styles.primaryBtnDisabled,
          pressed && { opacity: 0.9 },
        ]}
        accessibilityRole="button"
      >
        <Text style={styles.primaryBtnText}>
          {revealed ? 'Next Question' : 'Check Answer'}
        </Text>
        <Text style={styles.primaryBtnArrow}>→</Text>
      </Pressable>

      <View style={{ height: 12 }} />

      {/* Ask AI Coaching Chat Modal */}
      <AskAIChatModal
        visible={askAiModalOpen}
        question={q}
        onClose={() => setAskAiModalOpen(false)}
      />

      {/* Report Issue Modal */}
      <ReportModal
        visible={reportModalOpen}
        questionId={q?.id}
        onClose={() => setReportModalOpen(false)}
        onSubmit={(category, details) => {
          setNotice(`Reported issue '${category}'. Thank you for your feedback!`);
        }}
      />

      {/* Question Palette Drawer Modal */}
      <Modal
        visible={paletteOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPaletteOpen(false)}
      >
        <View style={styles.paletteOverlay}>
          <View style={styles.paletteContainer}>
            <View style={styles.paletteHeader}>
              <Text style={styles.paletteDrawerTitle}>
                Question Palette — {SECTION_LABEL[activeSection]}
              </Text>
              <Pressable onPress={() => setPaletteOpen(false)} style={styles.closePaletteIconBtn}>
                <Text style={styles.closePaletteIconText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.paletteGrid} showsVerticalScrollIndicator={false}>
              {sectionQuestions.map((item, idx) => {
                const answered = answers[item.id] != null && answers[item.id] !== '';
                const isCurrent = idx === currentIndex;
                const bookmarked = (userProgress.bookmarkedQuestionIds || []).includes(item.id);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      setIndexBySection((prev) => ({ ...prev, [activeSection]: idx }));
                      setPaletteOpen(false);
                    }}
                    style={[
                      styles.paletteItem,
                      answered && styles.paletteItemAnswered,
                      isCurrent && styles.paletteItemCurrent,
                    ]}
                  >
                    <Text
                      style={[
                        styles.paletteItemText,
                        answered && styles.paletteItemTextAnswered,
                        isCurrent && styles.paletteItemTextCurrent,
                      ]}
                    >
                      {idx + 1} {bookmarked ? '🔖' : ''}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable style={styles.closePaletteBtn} onPress={() => setPaletteOpen(false)}>
              <Text style={styles.closePaletteText}>Close Drawer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ─── Option visual state ─────────────────────────────────────────────────────

function optionState(
  key: string,
  pending: string | null,
  revealed: boolean,
  correctKey: string,
) {
  if (revealed) {
    if (key.toUpperCase() === correctKey.toUpperCase()) {
      return {
        container: styles.optionCorrect,
        circle: styles.optionCircleCorrect,
        letter: styles.optionLetterCorrect,
        mark: '✓',
      };
    }
    if (key.toUpperCase() === (pending || '').toUpperCase()) {
      return {
        container: styles.optionWrong,
        circle: styles.optionCircleWrong,
        letter: styles.optionLetterWrong,
        mark: '✗',
      };
    }
    return { container: undefined, circle: undefined, letter: undefined, mark: '' };
  }
  if (key.toUpperCase() === (pending || '').toUpperCase()) {
    return {
      container: styles.optionActive,
      circle: styles.optionCircleActive,
      letter: styles.optionLetterActive,
      mark: '',
    };
  }
  return { container: undefined, circle: undefined, letter: undefined, mark: '' };
}

// ─── Pieces ──────────────────────────────────────────────────────────────────

function Legend({ color, text }: { color: string; text: string }) {
  return (
    <View style={styles.legend}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{text}</Text>
    </View>
  );
}

function Action({ icon, label, badge, onPress }: { icon: string; label: string; badge?: string; onPress?: () => void }) {
  return (
    <Pressable style={styles.action} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <View>
        <Text style={styles.actionIcon}>{icon}</Text>
        {badge && (
          <View style={styles.actionBadge}>
            <Text style={styles.actionBadgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 8 },
  centerContent: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 14, fontSize: 15, fontFamily: FontFamily.semiBold, color: Colors.textSecondary },
  noQuestionsText: { fontSize: 15, fontFamily: FontFamily.semiBold, color: Colors.textSecondary, marginBottom: 16 },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 24, fontFamily: FontFamily.extraBold, color: Colors.primary, letterSpacing: -0.5 },
  endBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.2,
    borderColor: Colors.danger,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.background,
  },
  endIcon: { color: Colors.danger, fontSize: 13, fontFamily: FontFamily.bold },
  endText: { color: Colors.danger, fontSize: 13, fontFamily: FontFamily.semiBold },

  planRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6, marginBottom: 14, flexWrap: 'wrap' },
  planLabel: { fontSize: 13, fontFamily: FontFamily.bold, color: Colors.textBody },
  legendGroup: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 3.5 },
  legendText: { fontSize: 12, fontFamily: FontFamily.medium, color: Colors.textSecondary },

  tabsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  tabsGroup: { flexDirection: 'row', gap: 8, flex: 1 },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: Colors.border,
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: Colors.background,
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabLabel: { fontSize: 12, fontFamily: FontFamily.bold, color: Colors.textBody },
  tabLabelActive: { color: '#FFFFFF' },
  tabFrac: { fontSize: 10, fontFamily: FontFamily.medium, color: Colors.textMuted },
  tabFracActive: { color: 'rgba(255,255,255,0.85)' },
  paletteBtn: { alignItems: 'center', gap: 2, width: 64 },
  paletteIcon: { fontSize: 16, color: Colors.primary },
  paletteText: { fontSize: 10, fontFamily: FontFamily.semiBold, color: Colors.primary, textAlign: 'center' },

  progressCard: { backgroundColor: Colors.varcBg, borderRadius: 16, padding: 14, marginBottom: 14 },
  progressTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressQ: { fontSize: 14, fontFamily: FontFamily.semiBold, color: Colors.textBody },
  hlBlue: { color: Colors.accentBlue, fontFamily: FontFamily.bold },
  progressMeta: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaIcon: { fontSize: 14 },
  metaValue: { fontSize: 13, fontFamily: FontFamily.bold, color: Colors.textBody },
  metaSub: { fontSize: 10, fontFamily: FontFamily.regular, color: Colors.textSecondary },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: '#D4E0FA', marginTop: 12 },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: Colors.accentBlue },

  qCard: { marginBottom: 14 },
  passage: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: Colors.textBody,
    lineHeight: 21,
    backgroundColor: '#F5F7FC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  qText: { fontSize: 15, fontFamily: FontFamily.semiBold, color: Colors.textBody, lineHeight: 23 },
  statement: { flexDirection: 'row', gap: 8, marginTop: 14 },
  statementKey: { fontSize: 14, fontFamily: FontFamily.bold, color: Colors.textBody },
  statementText: { flex: 1, fontSize: 14, fontFamily: FontFamily.regular, color: Colors.textBody, lineHeight: 21 },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.2,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
  },
  optionActive: { borderColor: Colors.accentBlue, borderWidth: 1.8, backgroundColor: '#F5F8FF' },
  optionCorrect: { borderColor: Colors.success, borderWidth: 1.8, backgroundColor: Colors.successBg },
  optionWrong: { borderColor: Colors.danger, borderWidth: 1.8, backgroundColor: Colors.dangerBg },
  optionCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCircleActive: { borderColor: Colors.accentBlue },
  optionCircleCorrect: { borderColor: Colors.success },
  optionCircleWrong: { borderColor: Colors.danger },
  optionLetter: { fontSize: 13, fontFamily: FontFamily.bold, color: Colors.textSecondary },
  optionLetterActive: { color: Colors.accentBlue },
  optionLetterCorrect: { color: Colors.success },
  optionLetterWrong: { color: Colors.danger },
  optionText: { flex: 1, fontSize: 14, fontFamily: FontFamily.medium, color: Colors.textBody, lineHeight: 20 },
  optionMark: { fontSize: 16, fontFamily: FontFamily.bold },

  // TITA Styling
  titaContainer: { marginTop: 16 },
  titaBadgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  titaBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  titaBadgeText: { fontSize: 12, fontFamily: FontFamily.bold, color: Colors.primary },
  titaNotice: { fontSize: 11, fontFamily: FontFamily.medium, color: Colors.textMuted },
  titaInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: FontFamily.medium,
    color: Colors.textBody,
    backgroundColor: '#FAFAFD',
  },
  titaInputActive: { borderColor: Colors.accentBlue, backgroundColor: '#F5F8FF' },
  titaInputCorrect: { borderColor: Colors.success, backgroundColor: Colors.successBg, color: Colors.success },
  titaInputWrong: { borderColor: Colors.danger, backgroundColor: Colors.dangerBg, color: Colors.danger },

  result: { borderRadius: 12, padding: 12, marginTop: 16 },
  resultCorrect: { backgroundColor: Colors.successBg },
  resultWrong: { backgroundColor: Colors.dangerBg },
  resultText: { fontSize: 13, fontFamily: FontFamily.bold },

  hintBox: { backgroundColor: '#FFF6E9', borderRadius: 12, padding: 12, marginTop: 12 },
  hintText: { fontSize: 13, fontFamily: FontFamily.regular, color: '#7A4E12', lineHeight: 19 },

  actionsCard: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16 },
  action: { flex: 1, alignItems: 'center', gap: 6 },
  actionIcon: { fontSize: 22, textAlign: 'center' },
  actionBadge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  actionBadgeText: { color: '#FFFFFF', fontSize: 9, fontFamily: FontFamily.bold },
  actionLabel: { fontSize: 12, fontFamily: FontFamily.medium, color: Colors.textSecondary },

  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 14,
  },
  primaryBtnDisabled: { backgroundColor: '#AEB6C7' },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: FontFamily.semiBold },
  primaryBtnArrow: { color: '#FFFFFF', fontSize: 18 },

  bookmarkedText: { color: Colors.accentBlue, fontFamily: FontFamily.bold },
  paletteOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 15, 23, 0.6)',
    justifyContent: 'flex-end',
  },
  paletteContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: 380,
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
  },
  paletteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  paletteDrawerTitle: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  closePaletteIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.track,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closePaletteIconText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: FontFamily.bold,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 10,
  },
  paletteItem: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  paletteItemAnswered: {
    backgroundColor: Colors.accentBlue,
    borderColor: Colors.accentBlue,
  },
  paletteItemCurrent: {
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: '#EEF2FF',
  },
  paletteItemText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: Colors.textBody,
  },
  paletteItemTextAnswered: {
    color: '#FFFFFF',
  },
  paletteItemTextCurrent: {
    color: Colors.primary,
  },
  closePaletteBtn: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  closePaletteText: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
});
