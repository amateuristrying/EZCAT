import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { Colors } from '../constants/colors';
import { FontFamily } from '../constants/typography';
import { Card, IconBadge } from './AppUI';
import { MockAttempt } from '../storage/progressStorage';

interface MockAnalysisModalProps {
  visible: boolean;
  attempt: MockAttempt | null;
  onClose: () => void;
}

export function MockAnalysisModal({ visible, attempt, onClose }: MockAnalysisModalProps) {
  if (!attempt) return null;

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}m ${secs}s`;
  };

  const formattedDate = attempt.timestamp
    ? new Date(attempt.timestamp).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Today';

  const sectionsList: Array<{ key: 'varc' | 'dilr' | 'qa'; label: string; color: string }> = [
    { key: 'varc', label: 'VARC', color: Colors.varc },
    { key: 'dilr', label: 'DILR', color: Colors.dilr },
    { key: 'qa', label: 'QA', color: Colors.qa },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕ Close</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Mock Analysis Report</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Title & Date */}
          <Card style={styles.mainCard}>
            <View style={styles.titleRow}>
              <View>
                <Text style={styles.attemptTitle}>{attempt.title}</Text>
                <Text style={styles.attemptDate}>Completed on {formattedDate}</Text>
              </View>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{attempt.type.toUpperCase()}</Text>
              </View>
            </View>

            {/* Score Highlight Box */}
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>Raw Score</Text>
              <Text style={styles.scoreValue}>
                {attempt.totalScore} <Text style={styles.scoreMax}>/ {attempt.maxPossibleScore}</Text>
              </Text>
              <Text style={styles.scoreNote}>
                +3 for Correct | -1 for Wrong MCQ | 0 for Wrong TITA
              </Text>
            </View>
          </Card>

          {/* Key Metrics Row */}
          <View style={styles.metricsRow}>
            <Card style={styles.metricCard}>
              <IconBadge bg={Colors.dilrBg} size={36} radius={10}>
                <Text style={{ fontSize: 16 }}>🎯</Text>
              </IconBadge>
              <Text style={styles.metricLabel}>Accuracy</Text>
              <Text style={styles.metricValue}>{Math.round(attempt.accuracyPct)}%</Text>
            </Card>

            <Card style={styles.metricCard}>
              <IconBadge bg={Colors.varcBg} size={36} radius={10}>
                <Text style={{ fontSize: 16 }}>⏱️</Text>
              </IconBadge>
              <Text style={styles.metricLabel}>Time Taken</Text>
              <Text style={styles.metricValue}>{formatTime(attempt.timeTakenSec)}</Text>
            </Card>

            <Card style={styles.metricCard}>
              <IconBadge bg={Colors.purpleBg} size={36} radius={10}>
                <Text style={{ fontSize: 16 }}>📋</Text>
              </IconBadge>
              <Text style={styles.metricLabel}>Attempted</Text>
              <Text style={styles.metricValue}>
                {attempt.attemptedCount} / {attempt.totalQuestions}
              </Text>
            </Card>
          </View>

          {/* Attempt Breakdown */}
          <Card style={styles.blockCard}>
            <Text style={styles.blockTitle}>Question Breakdown</Text>
            <View style={styles.breakdownRow}>
              <View style={[styles.breakdownItem, { backgroundColor: Colors.successBg }]}>
                <Text style={[styles.breakdownVal, { color: Colors.success }]}>
                  {attempt.correctCount}
                </Text>
                <Text style={styles.breakdownLabel}>Correct</Text>
              </View>
              <View style={[styles.breakdownItem, { backgroundColor: Colors.dangerBg }]}>
                <Text style={[styles.breakdownVal, { color: Colors.danger }]}>
                  {attempt.incorrectCount}
                </Text>
                <Text style={styles.breakdownLabel}>Incorrect</Text>
              </View>
              <View style={[styles.breakdownItem, { backgroundColor: Colors.track }]}>
                <Text style={[styles.breakdownVal, { color: Colors.textSecondary }]}>
                  {attempt.unattemptedCount}
                </Text>
                <Text style={styles.breakdownLabel}>Unattempted</Text>
              </View>
            </View>
          </Card>

          {/* Per-Section Score Breakdown Table */}
          <Card style={styles.blockCard}>
            <Text style={styles.blockTitle}>Section Breakdown</Text>
            {sectionsList.map((sec) => {
              const detail = attempt.bySection[sec.key];
              if (!detail || detail.maxScore === 0) return null;
              return (
                <View key={sec.key} style={styles.sectionRow}>
                  <View style={styles.sectionLeft}>
                    <Text style={[styles.sectionName, { color: sec.color }]}>{sec.label}</Text>
                    <Text style={styles.sectionSub}>
                      {detail.correct} Correct | {detail.incorrect} Incorrect | {detail.unattempted} Left
                    </Text>
                  </View>
                  <View style={styles.sectionRight}>
                    <Text style={styles.sectionScore}>
                      {detail.score} <Text style={styles.smMuted}>/ {detail.maxScore}</Text>
                    </Text>
                    <Text style={styles.sectionAcc}>{Math.round(detail.accuracyPct)}% Acc</Text>
                  </View>
                </View>
              );
            })}
          </Card>

          {/* Return CTA */}
          <Pressable style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>Back to Mocks</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: '#FFFFFF',
  },
  closeBtn: { padding: 6 },
  closeBtnText: { fontSize: 14, fontFamily: FontFamily.bold, color: Colors.primary },
  headerTitle: { fontSize: 16, fontFamily: FontFamily.bold, color: Colors.primary },
  content: { padding: 18, gap: 14 },
  mainCard: { padding: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  attemptTitle: { fontSize: 18, fontFamily: FontFamily.extraBold, color: Colors.primary },
  attemptDate: { fontSize: 12, fontFamily: FontFamily.regular, color: Colors.textSecondary, marginTop: 2 },
  typeBadge: { backgroundColor: Colors.varcBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeBadgeText: { fontSize: 11, fontFamily: FontFamily.bold, color: Colors.primary },
  scoreBox: {
    backgroundColor: '#F5F7FC',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 14,
  },
  scoreLabel: { fontSize: 12, fontFamily: FontFamily.medium, color: Colors.textSecondary },
  scoreValue: { fontSize: 32, fontFamily: FontFamily.extraBold, color: Colors.primary, marginVertical: 2 },
  scoreMax: { fontSize: 18, fontFamily: FontFamily.bold, color: Colors.textMuted },
  scoreNote: { fontSize: 11, fontFamily: FontFamily.regular, color: Colors.textMuted },
  metricsRow: { flexDirection: 'row', gap: 10 },
  metricCard: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  metricLabel: { fontSize: 11, fontFamily: FontFamily.regular, color: Colors.textSecondary, marginTop: 6 },
  metricValue: { fontSize: 16, fontFamily: FontFamily.extraBold, color: Colors.primary, marginTop: 2 },
  blockCard: { padding: 16 },
  blockTitle: { fontSize: 15, fontFamily: FontFamily.bold, color: Colors.primary, marginBottom: 12 },
  breakdownRow: { flexDirection: 'row', gap: 10 },
  breakdownItem: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  breakdownVal: { fontSize: 20, fontFamily: FontFamily.extraBold },
  breakdownLabel: { fontSize: 11, fontFamily: FontFamily.medium, color: Colors.textBody, marginTop: 2 },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionLeft: { flex: 1 },
  sectionName: { fontSize: 14, fontFamily: FontFamily.bold },
  sectionSub: { fontSize: 11, fontFamily: FontFamily.regular, color: Colors.textSecondary, marginTop: 2 },
  sectionRight: { alignItems: 'flex-end' },
  sectionScore: { fontSize: 16, fontFamily: FontFamily.extraBold, color: Colors.primary },
  smMuted: { fontSize: 12, fontFamily: FontFamily.regular, color: Colors.textMuted },
  sectionAcc: { fontSize: 11, fontFamily: FontFamily.semiBold, color: Colors.accentBlue, marginTop: 2 },
  doneBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  doneBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: FontFamily.semiBold },
});
