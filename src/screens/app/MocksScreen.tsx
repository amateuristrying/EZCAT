import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';
import { Card, IconBadge } from '../../components/AppUI';
import { useAppStore } from '../../store/AppStore';
import { getMockExam, getDailyPracticeSet, getQuestionsBySection, Question } from '../../data/questionRepository';
import { SectionId } from '../../constants/data';
import { MockAttempt } from '../../storage/progressStorage';
import { MockSessionModal } from '../../components/MockSessionModal';
import { MockAnalysisModal } from '../../components/MockAnalysisModal';

// ─── Eligible Full Mocks (Checked empirically against cat_questions.db) ──────
// Only sittings with complete 3-section coverage (VARC > 0 AND DILR > 0 AND QA > 0)
const ELIGIBLE_FULL_MOCKS = [
  { year: 2023, slot: 1, label: 'CAT 2023 Slot 1 Full Mock', total: 68 },
  { year: 2023, slot: 2, label: 'CAT 2023 Slot 2 Full Mock', total: 69 },
  { year: 2023, slot: 3, label: 'CAT 2023 Slot 3 Full Mock', total: 69 },
  { year: 2022, slot: 1, label: 'CAT 2022 Slot 1 Full Mock', total: 76 },
  { year: 2022, slot: 2, label: 'CAT 2022 Slot 2 Full Mock', total: 65 },
  { year: 2022, slot: 3, label: 'CAT 2022 Slot 3 Full Mock', total: 70 },
  { year: 2021, slot: 1, label: 'CAT 2021 Slot 1 Full Mock', total: 71 },
  { year: 2021, slot: 2, label: 'CAT 2021 Slot 2 Full Mock', total: 71 },
  { year: 2021, slot: 3, label: 'CAT 2021 Slot 3 Full Mock', total: 71 },
  { year: 2020, slot: 1, label: 'CAT 2020 Slot 1 Full Mock', total: 71 },
  { year: 2020, slot: 2, label: 'CAT 2020 Slot 2 Full Mock', total: 68 },
  { year: 2020, slot: 3, label: 'CAT 2020 Slot 3 Full Mock', total: 77 },
];

export default function MocksScreen() {
  const { userProgress } = useAppStore();

  // Selector modals state
  const [fullSelectorOpen, setFullSelectorOpen] = useState(false);
  const [sectionalSelectorOpen, setSectionalSelectorOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [loadingMock, setLoadingMock] = useState(false);

  // Active mock session state
  const [activeSession, setActiveSession] = useState<{
    visible: boolean;
    type: 'full' | 'sectional' | 'mini';
    title: string;
    year?: number | null;
    slot?: number | null;
    section?: SectionId | null;
    questions: Question[];
    durationMinutes: number;
  }>({
    visible: false,
    type: 'full',
    title: '',
    questions: [],
    durationMinutes: 120,
  });

  // Analysis modal state
  const [analysisAttempt, setAnalysisAttempt] = useState<MockAttempt | null>(null);

  // Computed performance from real completed mockAttempts
  const mockAttempts = userProgress.mockAttempts || [];
  const totalMocks = mockAttempts.length;
  const bestScore = totalMocks > 0 ? Math.max(...mockAttempts.map((m) => m.totalScore)) : 0;
  const avgAccuracy = totalMocks > 0
    ? Math.round(mockAttempts.reduce((acc, m) => acc + m.accuracyPct, 0) / totalMocks)
    : 0;
  const avgScorePct = totalMocks > 0
    ? Math.round(
        mockAttempts.reduce((acc, m) => acc + (m.totalScore / (m.maxPossibleScore || 1)) * 100, 0) /
          totalMocks
      )
    : 0;

  // 1. Launch Full CAT Mock
  const handleStartFullMock = async (year: number, slot: number, title: string) => {
    setFullSelectorOpen(false);
    setLoadingMock(true);
    try {
      const examData = await getMockExam(year, slot);
      const allQuestions = [
        ...examData.sections.VARC,
        ...examData.sections.DILR,
        ...examData.sections.QA,
      ];
      setActiveSession({
        visible: true,
        type: 'full',
        title,
        year,
        slot,
        questions: allQuestions,
        durationMinutes: 120,
      });
    } catch (err) {
      console.error('Failed to load Full Mock exam data:', err);
    } finally {
      setLoadingMock(false);
    }
  };

  // 2. Launch Sectional Mock
  const handleStartSectionalMock = async (sec: 'VARC' | 'DILR' | 'QA') => {
    setSectionalSelectorOpen(false);
    setLoadingMock(true);
    try {
      // Pick a random eligible sitting for section practice
      const randomSitting = ELIGIBLE_FULL_MOCKS[Math.floor(Math.random() * ELIGIBLE_FULL_MOCKS.length)];
      const examData = await getMockExam(randomSitting.year, randomSitting.slot);
      const secQuestions = examData.sections[sec];
      setActiveSession({
        visible: true,
        type: 'sectional',
        title: `${sec} Sectional Mock (CAT ${randomSitting.year})`,
        year: randomSitting.year,
        slot: randomSitting.slot,
        section: sec.toLowerCase() as SectionId,
        questions: secQuestions,
        durationMinutes: 40,
      });
    } catch (err) {
      console.error('Failed to load Sectional Mock data:', err);
    } finally {
      setLoadingMock(false);
    }
  };

  // 3. Launch Mini Mock (15-min speed test, 10 mixed questions)
  const handleStartMiniMock = async () => {
    setLoadingMock(true);
    try {
      const miniQuestions = await getDailyPracticeSet({ VARC: 3, DILR: 3, QA: 4 });
      setActiveSession({
        visible: true,
        type: 'mini',
        title: 'Daily Mini Mock (15 Min Speed Test)',
        questions: miniQuestions,
        durationMinutes: 15,
      });
    } catch (err) {
      console.error('Failed to load Mini Mock data:', err);
    } finally {
      setLoadingMock(false);
    }
  };

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Header ───────────────────────────────────────────── */}
        <View style={styles.headerRow}>
          <View style={styles.flex}>
            <Text style={styles.title}>Mock Tests</Text>
            <Text style={styles.subtitle}>Practice like it's CAT day.</Text>
          </View>
          <Pressable style={styles.historyBtn} onPress={() => setHistoryModalOpen(true)}>
            <Text style={styles.historyIcon}>🗓️</Text>
            <Text style={styles.historyText}>Mock History ({totalMocks})</Text>
          </Pressable>
        </View>

        {/* ─── Performance (dark) ───────────────────────────────── */}
        <View style={styles.perfCard}>
          <Text style={styles.perfHeading}>Your Mock Performance</Text>
          <View style={styles.perfGrid}>
            <View style={styles.perfTile}>
              <Text style={styles.perfTileLabel}>Mocks Taken</Text>
              <Text style={styles.perfTileValue}>{totalMocks}</Text>
              <View style={styles.perfTileFooter}>
                <Text style={styles.perfTileIcon}>📄</Text>
              </View>
            </View>

            <View style={styles.perfTile}>
              <Text style={styles.perfTileLabel}>Best Raw Score</Text>
              <Text style={styles.perfTileValue}>{bestScore}</Text>
              <View style={styles.perfTileFooter}>
                <Text style={styles.perfTileIcon}>🏆</Text>
              </View>
            </View>

            <View style={styles.perfTile}>
              <Text style={styles.perfTileLabel}>Avg. Score %</Text>
              <Text style={styles.perfTileValue}>{avgScorePct}%</Text>
              <View style={styles.perfTileFooter}>
                <Text style={styles.perfTileIcon}>🎯</Text>
              </View>
            </View>

            <View style={styles.perfTile}>
              <Text style={styles.perfTileLabel}>Avg. Accuracy</Text>
              <Text style={styles.perfTileValue}>{avgAccuracy}%</Text>
              <View style={styles.perfTileFooter}>
                <Text style={styles.perfTileIcon}>🛡️</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Loading Indicator for Mock Data Generation */}
        {loadingMock && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingBoxText}>Preparing real exam paper from database...</Text>
          </View>
        )}

        {/* ─── Choose Your Mock ─────────────────────────────────── */}
        <Text style={styles.sectionHeading}>Choose Your Mock</Text>
        <View style={styles.mockRow}>
          {/* Mini Mock */}
          <Card style={styles.mockCard}>
            <View style={styles.quickBadge}>
              <Text style={styles.quickBadgeText}>Quick</Text>
            </View>
            <IconBadge bg={Colors.dilrBg} size={54} radius={27}>
              <Text style={{ fontSize: 24 }}>⏱️</Text>
            </IconBadge>
            <Text style={styles.mockName}>Mini Mock</Text>
            <Text style={styles.mockDesc}>10 Questions | 15 Mins mixed speed test.</Text>
            <Pressable
              style={[styles.mockCta, { backgroundColor: Colors.dilrBg }]}
              onPress={handleStartMiniMock}
            >
              <Text style={[styles.mockCtaText, { color: Colors.dilr }]}>Start Mini Mock ›</Text>
            </Pressable>
          </Card>

          {/* Sectional Mock */}
          <Card style={styles.mockCard}>
            <IconBadge bg={Colors.varcBg} size={54} radius={27}>
              <Text style={{ fontSize: 24 }}>📖</Text>
            </IconBadge>
            <Text style={styles.mockName}>Sectional Mock</Text>
            <Text style={styles.mockDesc}>40 Mins timed single-section test.</Text>
            <View style={styles.sectionalPills}>
              <Pressable
                style={[styles.sectionalPill, { backgroundColor: Colors.varcBg }]}
                onPress={() => handleStartSectionalMock('VARC')}
              >
                <Text style={[styles.sectionalPillText, { color: Colors.varc }]}>VARC</Text>
                <Text style={[styles.sectionalPillChevron, { color: Colors.varc }]}>›</Text>
              </Pressable>
              <Pressable
                style={[styles.sectionalPill, { backgroundColor: Colors.dilrBg }]}
                onPress={() => handleStartSectionalMock('DILR')}
              >
                <Text style={[styles.sectionalPillText, { color: Colors.dilr }]}>DILR</Text>
                <Text style={[styles.sectionalPillChevron, { color: Colors.dilr }]}>›</Text>
              </Pressable>
              <Pressable
                style={[styles.sectionalPill, { backgroundColor: Colors.qaBg }]}
                onPress={() => handleStartSectionalMock('QA')}
              >
                <Text style={[styles.sectionalPillText, { color: Colors.qa }]}>QA</Text>
                <Text style={[styles.sectionalPillChevron, { color: Colors.qa }]}>›</Text>
              </Pressable>
            </View>
          </Card>

          {/* Full CAT Mock */}
          <Card style={styles.mockCard}>
            <IconBadge bg={Colors.purpleBg} size={54} radius={27}>
              <Text style={{ fontSize: 24 }}>🏆</Text>
            </IconBadge>
            <Text style={styles.mockName}>Full CAT Mock</Text>
            <Text style={styles.mockDesc}>120 Mins complete 3-section exam sitting.</Text>
            <Pressable
              style={[styles.mockCta, { backgroundColor: Colors.purpleBg }]}
              onPress={() => setFullSelectorOpen(true)}
            >
              <Text style={[styles.mockCtaText, { color: Colors.purple }]}>Select Paper ›</Text>
            </Pressable>
          </Card>
        </View>

        {/* ─── Mock History Section ─────────────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Recent Completed Mocks</Text>
          {mockAttempts.length > 0 && (
            <Pressable onPress={() => setHistoryModalOpen(true)}>
              <Text style={styles.viewAll}>View History ({mockAttempts.length})</Text>
            </Pressable>
          )}
        </View>

        <Card style={styles.block}>
          {mockAttempts.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryIcon}>📝</Text>
              <Text style={styles.emptyHistoryTitle}>No completed mocks yet</Text>
              <Text style={styles.emptyHistorySub}>
                Take your first Full, Sectional, or Mini Mock above to track score analytics!
              </Text>
            </View>
          ) : (
            mockAttempts.slice(0, 3).map((item, idx) => (
              <Pressable
                key={item.id || idx}
                style={[styles.historyRow, idx > 0 && styles.historyDivider]}
                onPress={() => setAnalysisAttempt(item)}
              >
                <IconBadge
                  bg={
                    item.type === 'full'
                      ? Colors.purpleBg
                      : item.type === 'sectional'
                      ? Colors.varcBg
                      : Colors.dilrBg
                  }
                  size={40}
                  radius={12}
                >
                  <Text style={{ fontSize: 18 }}>
                    {item.type === 'full' ? '🏆' : item.type === 'sectional' ? '📖' : '⏱️'}
                  </Text>
                </IconBadge>

                <View style={styles.flex}>
                  <Text style={styles.historyItemTitle}>{item.title}</Text>
                  <Text style={styles.historyItemDate}>
                    {new Date(item.timestamp).toLocaleDateString()} • {item.attemptedCount}/
                    {item.totalQuestions} Attempted
                  </Text>
                </View>

                <View style={styles.historyScoreBox}>
                  <Text style={styles.historyScoreVal}>{item.totalScore}</Text>
                  <Text style={styles.historyScoreSub}>{Math.round(item.accuracyPct)}% Acc</Text>
                </View>

                <Text style={styles.historyChevron}>›</Text>
              </Pressable>
            ))
          )}
        </Card>
      </ScrollView>

      {/* ─── Full Mock Selector Modal ──────────────────────────── */}
      <Modal visible={fullSelectorOpen} animationType="slide" transparent transparent={false}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Full CAT Mock Paper</Text>
            <Pressable onPress={() => setFullSelectorOpen(false)} style={styles.closeModalBtn}>
              <Text style={styles.closeModalText}>✕ Close</Text>
            </Pressable>
          </View>

          <Text style={styles.modalNotice}>
            Eligible sittings with complete 3-section data (VARC, DILR & QA):
          </Text>

          <ScrollView contentContainerStyle={styles.selectorList}>
            {ELIGIBLE_FULL_MOCKS.map((paper) => (
              <Card key={`${paper.year}_${paper.slot}`} style={styles.paperCard}>
                <View style={styles.paperRow}>
                  <IconBadge bg={Colors.purpleBg} size={44} radius={14}>
                    <Text style={{ fontSize: 20 }}>🎓</Text>
                  </IconBadge>
                  <View style={styles.flex}>
                    <Text style={styles.paperTitle}>{paper.label}</Text>
                    <Text style={styles.paperSub}>{paper.total} Questions • 120 Mins</Text>
                  </View>
                  <Pressable
                    style={styles.startPaperBtn}
                    onPress={() => handleStartFullMock(paper.year, paper.slot, paper.label)}
                  >
                    <Text style={styles.startPaperText}>Start ›</Text>
                  </Pressable>
                </View>
              </Card>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* ─── Full Mock History Modal ───────────────────────────── */}
      <Modal visible={historyModalOpen} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Complete Mock History</Text>
            <Pressable onPress={() => setHistoryModalOpen(false)} style={styles.closeModalBtn}>
              <Text style={styles.closeModalText}>✕ Close</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.selectorList}>
            {mockAttempts.length === 0 ? (
              <Text style={styles.noHistoryText}>No mock attempts recorded yet.</Text>
            ) : (
              mockAttempts.map((item) => (
                <Card key={item.id} style={styles.paperCard}>
                  <Pressable
                    style={styles.historyModalRow}
                    onPress={() => {
                      setHistoryModalOpen(false);
                      setAnalysisAttempt(item);
                    }}
                  >
                    <View style={styles.flex}>
                      <Text style={styles.paperTitle}>{item.title}</Text>
                      <Text style={styles.paperSub}>
                        {new Date(item.timestamp).toLocaleString()} • {item.attemptedCount}/
                        {item.totalQuestions} Attempted
                      </Text>
                    </View>

                    <View style={styles.historyModalRight}>
                      <Text style={styles.historyScoreVal}>
                        {item.totalScore} <Text style={styles.smMuted}>/ {item.maxPossibleScore}</Text>
                      </Text>
                      <Text style={styles.historyAccText}>{Math.round(item.accuracyPct)}% Accuracy</Text>
                    </View>
                  </Pressable>
                </Card>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Active Mock Session Modal */}
      <MockSessionModal
        visible={activeSession.visible}
        mockType={activeSession.type}
        title={activeSession.title}
        year={activeSession.year}
        slot={activeSession.slot}
        section={activeSession.section}
        questions={activeSession.questions}
        durationMinutes={activeSession.durationMinutes}
        onClose={() => setActiveSession((prev) => ({ ...prev, visible: false }))}
        onComplete={(attempt) => {
          setActiveSession((prev) => ({ ...prev, visible: false }));
          setAnalysisAttempt(attempt);
        }}
      />

      {/* Mock Analysis Modal */}
      <MockAnalysisModal
        visible={analysisAttempt != null}
        attempt={analysisAttempt}
        onClose={() => setAnalysisAttempt(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 8 },

  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  title: { fontSize: 24, fontFamily: FontFamily.extraBold, color: Colors.primary, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, fontFamily: FontFamily.regular, color: Colors.textSecondary, marginTop: 2 },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.2,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: Colors.background,
  },
  historyIcon: { fontSize: 14 },
  historyText: { fontSize: 13, fontFamily: FontFamily.semiBold, color: Colors.primary },

  perfCard: { backgroundColor: Colors.primary, borderRadius: 20, padding: 16, marginBottom: 16 },
  perfHeading: { color: '#FFFFFF', fontSize: 15, fontFamily: FontFamily.bold, marginBottom: 14 },
  perfGrid: { flexDirection: 'row', gap: 8 },
  perfTile: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 10 },
  perfTileLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 10, fontFamily: FontFamily.medium },
  perfTileValue: { color: '#FFFFFF', fontSize: 18, fontFamily: FontFamily.extraBold, marginTop: 4 },
  perfTileFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 },
  perfTileIcon: { fontSize: 12 },

  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.varcBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  loadingBoxText: { fontSize: 13, fontFamily: FontFamily.semiBold, color: Colors.primary },

  sectionHeading: { fontSize: 17, fontFamily: FontFamily.bold, color: Colors.primary, marginBottom: 12 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  viewAll: { fontSize: 13, fontFamily: FontFamily.semiBold, color: Colors.accentBlue },
  block: { marginBottom: 20 },

  mockRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  mockCard: { flex: 1, alignItems: 'center', paddingHorizontal: 10, paddingVertical: 16 },
  quickBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: Colors.dilrBg,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  quickBadgeText: { fontSize: 9, fontFamily: FontFamily.bold, color: Colors.dilr },
  mockName: { fontSize: 14, fontFamily: FontFamily.bold, color: Colors.primary, marginTop: 12, textAlign: 'center' },
  mockDesc: { fontSize: 11, fontFamily: FontFamily.regular, color: Colors.textSecondary, marginTop: 6, textAlign: 'center', lineHeight: 16 },
  mockCta: { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, marginTop: 14, width: '100%', alignItems: 'center' },
  mockCtaText: { fontSize: 11, fontFamily: FontFamily.bold },
  sectionalPills: { marginTop: 14, gap: 6, width: '100%' },
  sectionalPill: { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionalPillText: { fontSize: 11, fontFamily: FontFamily.bold },
  sectionalPillChevron: { fontSize: 14, fontFamily: FontFamily.bold },

  emptyHistory: { alignItems: 'center', paddingVertical: 24 },
  emptyHistoryIcon: { fontSize: 32 },
  emptyHistoryTitle: { fontSize: 15, fontFamily: FontFamily.bold, color: Colors.primary, marginTop: 8 },
  emptyHistorySub: { fontSize: 12, fontFamily: FontFamily.regular, color: Colors.textSecondary, textAlign: 'center', marginTop: 4, paddingHorizontal: 20 },

  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  historyDivider: { borderTopWidth: 1, borderTopColor: Colors.border },
  historyItemTitle: { fontSize: 14, fontFamily: FontFamily.bold, color: Colors.primary },
  historyItemDate: { fontSize: 11, fontFamily: FontFamily.regular, color: Colors.textSecondary, marginTop: 2 },
  historyScoreBox: { alignItems: 'flex-end' },
  historyScoreVal: { fontSize: 16, fontFamily: FontFamily.extraBold, color: Colors.primary },
  historyScoreSub: { fontSize: 10, fontFamily: FontFamily.semiBold, color: Colors.accentBlue },
  historyChevron: { fontSize: 18, color: Colors.textMuted },

  modalContainer: { flex: 1, backgroundColor: Colors.background, padding: 18 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 18, fontFamily: FontFamily.extraBold, color: Colors.primary },
  closeModalBtn: { padding: 6 },
  closeModalText: { fontSize: 14, fontFamily: FontFamily.bold, color: Colors.primary },
  modalNotice: { fontSize: 12, fontFamily: FontFamily.regular, color: Colors.textSecondary, marginBottom: 14 },
  selectorList: { gap: 10, paddingBottom: 20 },
  paperCard: { padding: 14 },
  paperRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  paperTitle: { fontSize: 14, fontFamily: FontFamily.bold, color: Colors.primary },
  paperSub: { fontSize: 11, fontFamily: FontFamily.regular, color: Colors.textSecondary, marginTop: 2 },
  startPaperBtn: { backgroundColor: Colors.purpleBg, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  startPaperText: { fontSize: 12, fontFamily: FontFamily.bold, color: Colors.purple },

  historyModalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyModalRight: { alignItems: 'flex-end' },
  smMuted: { fontSize: 12, fontFamily: FontFamily.regular, color: Colors.textMuted },
  historyAccText: { fontSize: 11, fontFamily: FontFamily.semiBold, color: Colors.accentBlue },
  noHistoryText: { textAlign: 'center', color: Colors.textMuted, fontSize: 14, marginTop: 40 },
});
