import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Colors } from '../constants/colors';
import { FontFamily } from '../constants/typography';
import { Card } from './AppUI';
import { SectionId } from '../constants/data';
import { Question as RepoQuestion } from '../data/types';
import { UIQuestion, mapRepoQuestionToUIQuestion, checkMCQCorrect, checkTITACorrect } from '../data/adapter';
import { MockAttempt, SectionScoreDetail } from '../storage/progressStorage';
import { useAppStore } from '../store/AppStore';

interface MockSessionModalProps {
  visible: boolean;
  mockType: 'full' | 'sectional' | 'mini';
  title: string;
  year?: number | null;
  slot?: number | null;
  section?: SectionId | null;
  questions: RepoQuestion[]; // raw repository questions for the mock
  durationMinutes: number;
  onClose: () => void;
  onComplete: (attempt: MockAttempt) => void;
}

export function MockSessionModal({
  visible,
  mockType,
  title,
  year,
  slot,
  section,
  questions,
  durationMinutes,
  onClose,
  onComplete,
}: MockSessionModalProps) {
  const { recordMockAttempt } = useAppStore();

  const [activeSection, setActiveSection] = useState<SectionId>(section || 'qa');
  const [indexBySection, setIndexBySection] = useState<Record<SectionId, number>>({
    varc: 0,
    dilr: 0,
    qa: 0,
  });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeftSec, setTimeLeftSec] = useState<number>(durationMinutes * 60);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const uiQuestions = useRef<UIQuestion[]>([]);

  // Initialize questions and timer when modal opens
  useEffect(() => {
    if (visible && questions.length > 0) {
      uiQuestions.current = questions.map(mapRepoQuestionToUIQuestion);
      setAnswers({});
      setTimeLeftSec(durationMinutes * 60);
      setIndexBySection({ varc: 0, dilr: 0, qa: 0 });

      // Default active section to first available
      const firstSec = (section || uiQuestions.current[0]?.section || 'qa').toLowerCase() as SectionId;
      setActiveSection(firstSec);
    }
  }, [visible, questions, durationMinutes, section]);

  // Submit mock handler
  const handleSubmitMock = useCallback(() => {
    const totalSecSpent = Math.max(1, durationMinutes * 60 - timeLeftSec);

    const sectionScores: Record<SectionId, SectionScoreDetail> = {
      varc: { attempted: 0, correct: 0, incorrect: 0, unattempted: 0, score: 0, maxScore: 0, accuracyPct: 0 },
      dilr: { attempted: 0, correct: 0, incorrect: 0, unattempted: 0, score: 0, maxScore: 0, accuracyPct: 0 },
      qa: { attempted: 0, correct: 0, incorrect: 0, unattempted: 0, score: 0, maxScore: 0, accuracyPct: 0 },
    };

    let totalScore = 0;
    let maxPossibleScore = 0;
    let attemptedCount = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;

    for (const q of uiQuestions.current) {
      const sec = q.section as SectionId;
      const secDetail = sectionScores[sec];
      secDetail.maxScore += 3;
      maxPossibleScore += 3;

      const userAns = answers[q.id];
      if (userAns != null && userAns.trim() !== '') {
        attemptedCount += 1;
        secDetail.attempted += 1;

        const isCorrect = q.isTITA
          ? checkTITACorrect(userAns, q.rawCorrectAnswer)
          : checkMCQCorrect(userAns, q.rawCorrectAnswer, q.options);

        if (isCorrect) {
          correctCount += 1;
          secDetail.correct += 1;
          secDetail.score += 3;
          totalScore += 3;
        } else {
          incorrectCount += 1;
          secDetail.incorrect += 1;
          // CAT Penalty: -1 for MCQ, 0 for TITA
          if (!q.isTITA) {
            secDetail.score -= 1;
            totalScore -= 1;
          }
        }
      } else {
        unattemptedCount += 1;
        secDetail.unattempted += 1;
      }
    }

    // Calculate accuracy percentages
    for (const secKey of ['varc', 'dilr', 'qa'] as SectionId[]) {
      const s = sectionScores[secKey];
      s.accuracyPct = s.attempted > 0 ? (s.correct / s.attempted) * 100 : 0;
    }
    const overallAccuracyPct = attemptedCount > 0 ? (correctCount / attemptedCount) * 100 : 0;

    const mockAttempt: MockAttempt = {
      id: `mock_${Date.now()}`,
      type: mockType,
      title,
      year: year ?? null,
      slot: slot ?? null,
      section: section ?? null,
      timestamp: new Date().toISOString(),
      timeTakenSec: totalSecSpent,
      totalQuestions: uiQuestions.current.length,
      attemptedCount,
      correctCount,
      incorrectCount,
      unattemptedCount,
      totalScore,
      maxPossibleScore,
      accuracyPct: overallAccuracyPct,
      bySection: sectionScores,
    };

    recordMockAttempt(mockAttempt);
    onComplete(mockAttempt);
  }, [answers, durationMinutes, mockType, onComplete, recordMockAttempt, section, slot, timeLeftSec, title, year]);

  // Countdown timer effect
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setTimeLeftSec((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitMock();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, handleSubmitMock]);

  if (!visible) return null;

  const sectionQuestions = uiQuestions.current.filter((q) => q.section === activeSection);
  const rawIdx = indexBySection[activeSection] || 0;
  const currentIndex = sectionQuestions.length > 0
    ? Math.max(0, Math.min(rawIdx, sectionQuestions.length - 1))
    : 0;
  const q = sectionQuestions[currentIndex];

  const currentAnswer = q ? answers[q.id] || '' : '';

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSelectOption = (val: string) => {
    if (!q) return;
    setAnswers((prev) => ({ ...prev, [q.id]: val }));
  };

  const confirmSubmit = () => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to submit this mock? You answered ${Object.keys(answers).length} of ${uiQuestions.current.length} questions.`)) {
        handleSubmitMock();
      }
    } else {
      Alert.alert(
        'Submit Mock Test',
        `Are you sure you want to finish this mock? You have answered ${Object.keys(answers).length} of ${uiQuestions.current.length} questions.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Submit', style: 'destructive', onPress: handleSubmitMock },
        ]
      );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header with Title, Timer, and Submit button */}
        <View style={styles.header}>
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>

          <View style={styles.timerBadge}>
            <Text style={styles.timerIcon}>⏱️</Text>
            <Text style={styles.timerText}>{formatTimer(timeLeftSec)}</Text>
          </View>

          <Pressable style={styles.submitBtn} onPress={confirmSubmit}>
            <Text style={styles.submitBtnText}>Submit</Text>
          </Pressable>
        </View>

        {/* Section Tabs */}
        <View style={styles.sectionTabs}>
          {(['qa', 'dilr', 'varc'] as SectionId[]).map((secKey) => {
            const count = uiQuestions.current.filter((it) => it.section === secKey).length;
            if (count === 0) return null;
            const active = activeSection === secKey;
            const secAnswers = uiQuestions.current
              .filter((it) => it.section === secKey)
              .filter((it) => answers[it.id] != null && answers[it.id] !== '').length;

            return (
              <Pressable
                key={secKey}
                onPress={() => setActiveSection(secKey)}
                style={[styles.tab, active && styles.tabActive]}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {secKey.toUpperCase()} ({secAnswers}/{count})
                </Text>
              </Pressable>
            );
          })}
          <Pressable style={styles.paletteToggle} onPress={() => setPaletteOpen((v) => !v)}>
            <Text style={styles.paletteToggleText}>▦ Palette</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Progress Strip */}
          <View style={styles.progressRow}>
            <Text style={styles.progressQ}>
              Question <Text style={styles.hlBlue}>{currentIndex + 1}</Text> of {sectionQuestions.length}
            </Text>
            <Pressable onPress={() => setAnswers((prev) => ({ ...prev, [q?.id || '']: '' }))}>
              <Text style={styles.clearBtnText}>Clear Answer</Text>
            </Pressable>
          </View>

          {/* Question Display Card */}
          {q ? (
            <Card style={styles.qCard}>
              {q.passage && <Text style={styles.passage}>{q.passage}</Text>}
              <Text style={styles.qText}>{q.prompt}</Text>

              {/* Options: MCQ vs TITA */}
              {!q.isTITA ? (
                q.options.map((opt) => {
                  const selected = currentAnswer.toUpperCase() === opt.key.toUpperCase();
                  return (
                    <Pressable
                      key={opt.key}
                      onPress={() => handleSelectOption(opt.key)}
                      style={[styles.option, selected && styles.optionSelected]}
                    >
                      <View style={[styles.optionCircle, selected && styles.optionCircleSelected]}>
                        <Text style={[styles.optionLetter, selected && styles.optionLetterSelected]}>
                          {opt.key}
                        </Text>
                      </View>
                      <Text style={styles.optionText}>{opt.text}</Text>
                    </Pressable>
                  );
                })
              ) : (
                <View style={styles.titaContainer}>
                  <View style={styles.titaBadgeRow}>
                    <View style={styles.titaBadge}>
                      <Text style={styles.titaBadgeText}>⌨️ Type In The Answer (TITA)</Text>
                    </View>
                    <Text style={styles.titaNotice}>No negative marking</Text>
                  </View>
                  <TextInput
                    style={[styles.titaInput, currentAnswer !== '' && styles.titaInputActive]}
                    value={currentAnswer}
                    onChangeText={handleSelectOption}
                    placeholder="Type your numeric or word answer..."
                    placeholderTextColor={Colors.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              )}
            </Card>
          ) : (
            <Text style={styles.noQ}>No questions in this section.</Text>
          )}

          {/* Exam Condition Actions (Hint / Ask AI strictly DISABLED) */}
          <Card style={styles.examNoticeCard}>
            <Text style={styles.examNoticeTitle}>🔒 Official Exam Mode</Text>
            <Text style={styles.examNoticeText}>
              `Hint` and `Ask AI` are disabled during active mock sessions to mirror real CAT testing conditions.
            </Text>
          </Card>

          {/* Prev / Next CTAs */}
          <View style={styles.navRow}>
            <Pressable
              style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
              disabled={currentIndex === 0}
              onPress={() =>
                setIndexBySection((prev) => ({
                  ...prev,
                  [activeSection]: Math.max(0, currentIndex - 1),
                }))
              }
            >
              <Text style={styles.navBtnText}>← Previous</Text>
            </Pressable>

            <Pressable
              style={styles.navBtnPrimary}
              onPress={() =>
                setIndexBySection((prev) => ({
                  ...prev,
                  [activeSection]: (currentIndex + 1) % sectionQuestions.length,
                }))
              }
            >
              <Text style={styles.navBtnPrimaryText}>
                {currentIndex === sectionQuestions.length - 1 ? 'Review / Next' : 'Save & Next →'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* Question Palette Drawer */}
        {paletteOpen && (
          <View style={styles.paletteModal}>
            <Text style={styles.paletteTitle}>Question Palette - {activeSection.toUpperCase()}</Text>
            <ScrollView contentContainerStyle={styles.paletteGrid}>
              {sectionQuestions.map((item, idx) => {
                const answered = answers[item.id] != null && answers[item.id] !== '';
                const isCurrent = idx === currentIndex;
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
                      {idx + 1}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable style={styles.closePaletteBtn} onPress={() => setPaletteOpen(false)}>
              <Text style={styles.closePaletteText}>Close Palette</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: { flex: 1, fontSize: 15, fontFamily: FontFamily.bold, color: Colors.primary, marginRight: 8 },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF6E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timerIcon: { fontSize: 13 },
  timerText: { fontSize: 14, fontFamily: FontFamily.extraBold, color: '#7A4E12' },
  submitBtn: {
    backgroundColor: Colors.danger,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginLeft: 10,
  },
  submitBtnText: { color: '#FFFFFF', fontSize: 13, fontFamily: FontFamily.bold },

  sectionTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: Colors.track,
  },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 12, fontFamily: FontFamily.bold, color: Colors.textBody },
  tabTextActive: { color: '#FFFFFF' },
  paletteToggle: { marginLeft: 'auto', padding: 6 },
  paletteToggleText: { fontSize: 12, fontFamily: FontFamily.bold, color: Colors.accentBlue },

  content: { padding: 16, gap: 12 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressQ: { fontSize: 14, fontFamily: FontFamily.semiBold, color: Colors.textBody },
  hlBlue: { color: Colors.accentBlue, fontFamily: FontFamily.bold },
  clearBtnText: { fontSize: 12, fontFamily: FontFamily.semiBold, color: Colors.danger },

  qCard: { padding: 16 },
  passage: {
    fontSize: 13.5,
    fontFamily: FontFamily.regular,
    color: Colors.textBody,
    backgroundColor: '#F5F7FC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  qText: { fontSize: 15, fontFamily: FontFamily.semiBold, color: Colors.textBody, lineHeight: 22 },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.2,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  optionSelected: { borderColor: Colors.accentBlue, backgroundColor: '#F5F8FF', borderWidth: 1.8 },
  optionCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCircleSelected: { borderColor: Colors.accentBlue },
  optionLetter: { fontSize: 12, fontFamily: FontFamily.bold, color: Colors.textSecondary },
  optionLetterSelected: { color: Colors.accentBlue },
  optionText: { flex: 1, fontSize: 14, fontFamily: FontFamily.medium, color: Colors.textBody },

  titaContainer: { marginTop: 14 },
  titaBadgeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  titaBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  titaBadgeText: { fontSize: 11, fontFamily: FontFamily.bold, color: Colors.primary },
  titaNotice: { fontSize: 11, fontFamily: FontFamily.regular, color: Colors.textMuted },
  titaInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: FontFamily.medium,
    backgroundColor: '#FAFAFD',
  },
  titaInputActive: { borderColor: Colors.accentBlue, backgroundColor: '#F5F8FF' },

  examNoticeCard: { padding: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: Colors.border },
  examNoticeTitle: { fontSize: 12, fontFamily: FontFamily.bold, color: Colors.primary },
  examNoticeText: { fontSize: 11, fontFamily: FontFamily.regular, color: Colors.textSecondary, marginTop: 2 },

  navRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  navBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  navBtnDisabled: { opacity: 0.5 },
  navBtnText: { fontSize: 14, fontFamily: FontFamily.bold, color: Colors.textBody },
  navBtnPrimary: {
    flex: 1.5,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnPrimaryText: { fontSize: 14, fontFamily: FontFamily.bold, color: '#FFFFFF' },
  noQ: { textAlign: 'center', marginVertical: 30, color: Colors.textMuted, fontSize: 14 },

  paletteModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 320,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.2, shadowRadius: 10 },
      android: { elevation: 10 },
    }),
  },
  paletteTitle: { fontSize: 14, fontFamily: FontFamily.bold, color: Colors.primary, marginBottom: 12 },
  paletteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  paletteItem: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  paletteItemAnswered: { backgroundColor: Colors.accentBlue, borderColor: Colors.accentBlue },
  paletteItemCurrent: { borderWidth: 2, borderColor: Colors.primary },
  paletteItemText: { fontSize: 13, fontFamily: FontFamily.bold, color: Colors.textBody },
  paletteItemTextAnswered: { color: '#FFFFFF' },
  paletteItemTextCurrent: { color: Colors.primary },
  closePaletteBtn: {
    marginTop: 10,
    backgroundColor: Colors.track,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  closePaletteText: { fontSize: 13, fontFamily: FontFamily.bold, color: Colors.primary },
});
