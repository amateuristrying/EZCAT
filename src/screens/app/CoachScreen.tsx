import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';
import { Card, IconBadge } from '../../components/AppUI';
import { ProgressRing, Sparkline } from '../../components/Charts';
import { useAppStore } from '../../store/AppStore';

// ─── Data ────────────────────────────────────────────────────────────────────

const RECOMMENDATIONS = [
  {
    icon: '☰',
    iconBg: Colors.dilrBg,
    iconColor: Colors.dilr,
    title: 'Solve 2 additional DILR sets',
    sub: 'Focus on Arrangements & Caselets',
    priority: 'High Priority',
    pillBg: Colors.dilrBg,
    pillColor: Colors.dilr,
  },
  {
    icon: '📐',
    iconBg: Colors.qaBg,
    iconColor: Colors.qa,
    title: 'Review Geometry mistakes',
    sub: 'Accuracy has dropped in last 3 sessions',
    priority: 'Medium Priority',
    pillBg: Colors.qaBg,
    pillColor: Colors.qa,
  },
  {
    icon: '📊',
    iconBg: Colors.varcBg,
    iconColor: Colors.varc,
    title: 'Attempt a Mini Mock',
    sub: 'Track your improvement this week',
    priority: 'Low Priority',
    pillBg: Colors.varcBg,
    pillColor: Colors.varc,
  },
];

const WEAK = [
  { topic: 'Geometry', pct: '62%' },
  { topic: 'Number Systems', pct: '64%' },
  { topic: 'Reading Comprehension', pct: '66%' },
  { topic: 'Arrangements', pct: '68%' },
];

const STRENGTHS = [
  { topic: 'Arithmetic', pct: '88%' },
  { topic: 'Para Jumbles', pct: '86%' },
  { topic: 'Ratios', pct: '85%' },
  { topic: 'Percentages', pct: '84%' },
];

const INSIGHTS = [
  { icon: '🎯', bg: Colors.dilrBg, title: 'Focus On', sub: 'DILR Sets', note: 'For next 3 days' },
  { icon: '⏭️', bg: Colors.qaBg, title: 'Skip For Now', sub: 'Advance QA', note: 'Topics' },
  { icon: '🔄', bg: Colors.purpleBg, title: 'Revise', sub: 'Geometry', note: 'Concepts' },
  { icon: '📈', bg: Colors.varcBg, title: 'Improve', sub: 'VARC Accuracy', note: 'by 5-7%' },
];

const WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function CoachScreen() {
  const { profile } = useAppStore();
  const firstName = profile.name.trim().split(/\s+/)[0] || 'Aspirant';

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ─── Header ───────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <View style={styles.flex}>
          <Text style={styles.title}>AI Coach</Text>
          <Text style={styles.subtitle}>Your personal CAT mentor, guiding you every day.</Text>
        </View>
        <Pressable style={styles.historyBtn} accessibilityRole="button">
          <Text style={styles.historyIcon}>🕐</Text>
          <Text style={styles.historyText}>Coach History</Text>
        </Pressable>
      </View>

      {/* ─── Greeting / prep score ────────────────────────────── */}
      <View style={styles.coachCard}>
        <View style={styles.robotCircle}>
          <Text style={{ fontSize: 26 }}>🤖</Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.coachGreeting}>Good morning, {firstName}! 👋</Text>
          <Text style={styles.coachText}>
            I've analyzed your performance and created a plan to help you reach 99+ percentile.
          </Text>
        </View>
        <ProgressRing size={64} strokeWidth={7} progress={0.93} progressColor={Colors.success}>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.prepValue}>93%</Text>
            <Text style={styles.prepLabel}>Prep Score</Text>
          </View>
        </ProgressRing>
      </View>

      {/* ─── Today's Recommendation ───────────────────────────── */}
      <Card style={styles.block}>
        <Text style={styles.cardTitle}>✦ Today's Recommendation</Text>
        {RECOMMENDATIONS.map((r) => (
          <View key={r.title} style={styles.recRow}>
            <IconBadge bg={r.iconBg} size={40} radius={12}>
              <Text style={{ fontSize: 17, color: r.iconColor }}>{r.icon}</Text>
            </IconBadge>
            <View style={styles.flex}>
              <Text style={styles.recTitle}>{r.title}</Text>
              <Text style={styles.recSub}>{r.sub}</Text>
            </View>
            <View style={[styles.priorityPill, { backgroundColor: r.pillBg }]}>
              <Text style={[styles.priorityText, { color: r.pillColor }]}>{r.priority}</Text>
            </View>
          </View>
        ))}
        <Text style={[styles.footerLinkBlue, { marginTop: 12 }]}>View Full Plan ›</Text>
      </Card>

      {/* ─── Weak Topics + Strengths ──────────────────────────── */}
      <View style={styles.row}>
        <Card style={styles.col}>
          <Text style={[styles.listTitle, { color: Colors.danger }]}>↘ Weak Topics</Text>
          {WEAK.map((w) => (
            <View key={w.topic} style={styles.topicRow}>
              <Text style={styles.topicName} numberOfLines={1}>{w.topic}</Text>
              <View style={[styles.pctPill, { backgroundColor: Colors.dangerBg }]}>
                <Text style={[styles.pctText, { color: Colors.danger }]}>{w.pct}</Text>
              </View>
            </View>
          ))}
          <Text style={[styles.listFooter, { color: Colors.danger }]}>View All Weak Topics ›</Text>
        </Card>

        <Card style={styles.col}>
          <Text style={[styles.listTitle, { color: Colors.success }]}>↗ Strengths</Text>
          {STRENGTHS.map((s) => (
            <View key={s.topic} style={styles.topicRow}>
              <Text style={styles.topicName} numberOfLines={1}>{s.topic}</Text>
              <View style={[styles.pctPill, { backgroundColor: Colors.successBg }]}>
                <Text style={[styles.pctText, { color: Colors.success }]}>{s.pct}</Text>
              </View>
            </View>
          ))}
          <Text style={[styles.listFooter, { color: Colors.success }]}>View All Strenghts ›</Text>
        </Card>
      </View>

      {/* ─── AI Insights ──────────────────────────────────────── */}
      <Card style={styles.block}>
        <Text style={styles.cardTitle}>✦ AI Insights</Text>
        <View style={styles.insightsRow}>
          {INSIGHTS.map((it, i) => (
            <View key={it.title} style={[styles.insight, i > 0 && styles.insightDivider]}>
              <IconBadge bg={it.bg} size={40} radius={20}>
                <Text style={{ fontSize: 16 }}>{it.icon}</Text>
              </IconBadge>
              <Text style={styles.insightTitle}>{it.title}</Text>
              <Text style={styles.insightSub}>{it.sub}</Text>
              <Text style={styles.insightNote}>{it.note}</Text>
            </View>
          ))}
        </View>
        <View style={styles.cardFooterDivider} />
        <Text style={styles.footerLinkBlue}>View Detailed Insights ›</Text>
      </Card>

      {/* ─── Percentile Projection + Readiness ────────────────── */}
      <View style={styles.row}>
        <Card style={styles.col}>
          <Text style={styles.listTitle}>📈 Percentile Projection</Text>
          <View style={styles.projRow}>
            <Text style={styles.projValue}>93.4%</Text>
            <Text style={styles.projDelta}>↑ 3.2</Text>
          </View>
          <View style={styles.projTrackWrap}>
            <View style={styles.projTrack}>
              <View style={[styles.projFill, { width: '88%' }]} />
              <View style={[styles.projThumb, { left: '86%' }]} />
            </View>
            <Text style={styles.projEnd}>99+</Text>
          </View>
          <Text style={styles.projNote}>On track to achieve 99+ percentile</Text>
        </Card>

        <Card style={styles.col}>
          <Text style={styles.listTitle}>🛡️ Readiness Score</Text>
          <Text style={styles.readyValue}>72%</Text>
          <Text style={styles.readyGood}>You're getting better!</Text>
          <View style={styles.sparkWrap}>
            <Sparkline
              data={[10, 12, 11, 14, 13, 16, 15, 20, 22, 28]}
              width={130}
              height={40}
              color={Colors.accentBlue}
              showDots
            />
          </View>
          <Text style={styles.readyNote}>Keep practicing consistently</Text>
        </Card>
      </View>

      {/* ─── Study Streak ─────────────────────────────────────── */}
      <View style={styles.streakCard}>
        <View style={styles.flex}>
          <Text style={styles.streakTitle}>🔥 Study Streak</Text>
          <Text style={styles.streakValue}>27 Days</Text>
          <Text style={styles.streakSub}>Keep the streak alive!</Text>
        </View>
        <View style={styles.streakDays}>
          {WEEK.map((d, i) => (
            <View key={i} style={styles.dayItem}>
              <View style={[styles.dayCircle, i < 6 && styles.dayCircleDone]} />
              <Text style={styles.dayLabel}>{d}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ height: 12 }} />
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 8 },

  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  title: { fontSize: 24, fontFamily: FontFamily.extraBold, color: Colors.primary, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, fontFamily: FontFamily.regular, color: Colors.textSecondary, marginTop: 2, paddingRight: 8 },
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

  // Coach greeting card
  coachCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EEF2FE',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  robotCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coachGreeting: { fontSize: 15, fontFamily: FontFamily.bold, color: Colors.primary },
  coachText: { fontSize: 12, fontFamily: FontFamily.regular, color: Colors.textBody, lineHeight: 17, marginTop: 3 },
  prepValue: { fontSize: 14, fontFamily: FontFamily.extraBold, color: Colors.primary },
  prepLabel: { fontSize: 7, fontFamily: FontFamily.medium, color: Colors.textSecondary },

  block: { marginBottom: 16 },
  cardTitle: { fontSize: 15, fontFamily: FontFamily.bold, color: Colors.primary, marginBottom: 6 },

  // Recommendations
  recRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  recTitle: { fontSize: 14, fontFamily: FontFamily.bold, color: Colors.textBody },
  recSub: { fontSize: 11.5, fontFamily: FontFamily.regular, color: Colors.textSecondary, marginTop: 2 },
  priorityPill: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 },
  priorityText: { fontSize: 10, fontFamily: FontFamily.bold },
  footerLinkBlue: { fontSize: 13, fontFamily: FontFamily.semiBold, color: Colors.accentBlue },

  // Two-col
  row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  col: { flex: 1 },

  // Weak / strengths lists
  listTitle: { fontSize: 14, fontFamily: FontFamily.bold, color: Colors.primary, marginBottom: 10 },
  topicRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 10 },
  topicName: { flex: 1, fontSize: 12.5, fontFamily: FontFamily.medium, color: Colors.textBody },
  pctPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  pctText: { fontSize: 11, fontFamily: FontFamily.bold },
  listFooter: { fontSize: 12, fontFamily: FontFamily.semiBold, marginTop: 2 },

  // Insights
  insightsRow: { flexDirection: 'row', marginTop: 14 },
  insight: { flex: 1, alignItems: 'center', gap: 4, paddingHorizontal: 4 },
  insightDivider: { borderLeftWidth: 1, borderLeftColor: Colors.border },
  insightTitle: { fontSize: 11, fontFamily: FontFamily.bold, color: Colors.textBody, marginTop: 4, textAlign: 'center' },
  insightSub: { fontSize: 10, fontFamily: FontFamily.medium, color: Colors.textSecondary, textAlign: 'center' },
  insightNote: { fontSize: 9, fontFamily: FontFamily.regular, color: Colors.textMuted, textAlign: 'center' },
  cardFooterDivider: { height: 1, backgroundColor: Colors.border, marginTop: 16, marginBottom: 10 },

  // Projection
  projRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  projValue: { fontSize: 26, fontFamily: FontFamily.extraBold, color: Colors.primary },
  projDelta: { fontSize: 12, fontFamily: FontFamily.semiBold, color: Colors.success },
  projTrackWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  projTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: Colors.track, justifyContent: 'center' },
  projFill: { height: 6, borderRadius: 3, backgroundColor: Colors.accentBlue },
  projThumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.accentBlue,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  projEnd: { fontSize: 11, fontFamily: FontFamily.bold, color: Colors.textSecondary },
  projNote: { fontSize: 11, fontFamily: FontFamily.regular, color: Colors.textSecondary, marginTop: 12 },

  // Readiness
  readyValue: { fontSize: 26, fontFamily: FontFamily.extraBold, color: Colors.primary },
  readyGood: { fontSize: 12, fontFamily: FontFamily.semiBold, color: Colors.success, marginTop: 2 },
  sparkWrap: { marginTop: 8, alignItems: 'center' },
  readyNote: { fontSize: 11, fontFamily: FontFamily.regular, color: Colors.textSecondary, marginTop: 8 },

  // Streak
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF6E9',
    borderRadius: 18,
    padding: 16,
  },
  streakTitle: { fontSize: 14, fontFamily: FontFamily.bold, color: '#B45309' },
  streakValue: { fontSize: 24, fontFamily: FontFamily.extraBold, color: Colors.primary, marginTop: 2 },
  streakSub: { fontSize: 12, fontFamily: FontFamily.regular, color: Colors.textSecondary, marginTop: 2 },
  streakDays: { flexDirection: 'row', gap: 8 },
  dayItem: { alignItems: 'center', gap: 4 },
  dayCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: '#E7C99A' },
  dayCircleDone: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
  dayLabel: { fontSize: 9, fontFamily: FontFamily.medium, color: Colors.textSecondary },
});
