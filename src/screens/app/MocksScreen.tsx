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
import { SemiGauge } from '../../components/Charts';

// ─── Data ────────────────────────────────────────────────────────────────────

const PERF = [
  { label: 'Mocks Taken', value: '12', delta: '3', icon: '📄' },
  { label: 'Best Percentile', value: '97.6', delta: '2.1', icon: '🏆' },
  { label: 'Avg. Score', value: '78.3%', delta: '5.4%', icon: '🎯' },
  { label: 'Avg. Accuracy', value: '84%', delta: '6%', icon: '🛡️' },
];

const UPCOMING = [
  {
    name: 'Full CAT Mock #5',
    when: 'Sunday, 18 May 2025 • 9:00 AM',
    icon: '📆',
    iconBg: Colors.purpleBg,
    pills: [
      { text: '180 mins', bg: Colors.varcBg, color: Colors.varc },
      { text: 'All Sections', bg: Colors.purpleBg, color: Colors.purple },
    ],
  },
  {
    name: 'DILR Sectional Mock',
    when: 'Wednesday, 21 May 2025 • 6:00 PM',
    icon: '📆',
    iconBg: Colors.dilrBg,
    pills: [
      { text: '40 mins', bg: Colors.dilrBg, color: Colors.dilr },
      { text: 'DILR', bg: Colors.dilrBg, color: Colors.dilr },
    ],
  },
  {
    name: 'Mini Mock #12',
    when: 'Tomorrow • 8:00 AM',
    icon: '📆',
    iconBg: Colors.qaBg,
    pills: [
      { text: '15 mins', bg: Colors.qaBg, color: Colors.qa },
      { text: 'Mixed', bg: Colors.qaBg, color: Colors.qa },
    ],
  },
];

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function MocksScreen() {
  return (
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
        <Pressable style={styles.historyBtn} accessibilityRole="button">
          <Text style={styles.historyIcon}>🗓️</Text>
          <Text style={styles.historyText}>Mock History</Text>
        </Pressable>
      </View>

      {/* ─── Performance (dark) ───────────────────────────────── */}
      <View style={styles.perfCard}>
        <Text style={styles.perfHeading}>Your Mock Performance</Text>
        <View style={styles.perfGrid}>
          {PERF.map((p) => (
            <View key={p.label} style={styles.perfTile}>
              <Text style={styles.perfTileLabel}>{p.label}</Text>
              <Text style={styles.perfTileValue}>{p.value}</Text>
              <View style={styles.perfTileFooter}>
                <Text style={styles.perfDelta}>↑ {p.delta}</Text>
                <Text style={styles.perfTileIcon}>{p.icon}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

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
          <Text style={styles.mockDesc}>10–20 questions Quick practice, every day.</Text>
          <View style={[styles.mockCta, { backgroundColor: Colors.dilrBg }]}>
            <Text style={[styles.mockCtaText, { color: Colors.dilr }]}>Start Mini Mock ›</Text>
          </View>
        </Card>

        {/* Sectional Mock */}
        <Card style={styles.mockCard}>
          <IconBadge bg={Colors.varcBg} size={54} radius={27}>
            <Text style={{ fontSize: 24 }}>📖</Text>
          </IconBadge>
          <Text style={styles.mockName}>Sectional Mock</Text>
          <Text style={styles.mockDesc}>Practice a single section in-depth.</Text>
          <View style={styles.sectionalPills}>
            <SectionalPill text="VARC" bg={Colors.varcBg} color={Colors.varc} />
            <SectionalPill text="DILR" bg={Colors.dilrBg} color={Colors.dilr} />
            <SectionalPill text="QA" bg={Colors.qaBg} color={Colors.qa} />
          </View>
        </Card>

        {/* Full CAT Mock */}
        <Card style={styles.mockCard}>
          <IconBadge bg={Colors.purpleBg} size={54} radius={27}>
            <Text style={{ fontSize: 24 }}>🏆</Text>
          </IconBadge>
          <Text style={styles.mockName}>Full CAT Mock</Text>
          <Text style={styles.mockDesc}>Simulate the real CAT exam experience.</Text>
          <View style={[styles.mockCta, { backgroundColor: Colors.purpleBg }]}>
            <Text style={[styles.mockCtaText, { color: Colors.purple }]}>Start Full Mock ›</Text>
          </View>
        </Card>
      </View>

      {/* ─── Upcoming Mocks ───────────────────────────────────── */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeading}>Upcoming Mocks</Text>
        <Text style={styles.viewAll}>View All</Text>
      </View>
      <Card style={styles.block}>
        {UPCOMING.map((u, i) => (
          <View key={u.name} style={[styles.upcomingRow, i > 0 && styles.upcomingDivider]}>
            <IconBadge bg={u.iconBg} size={38} radius={12}>
              <Text style={{ fontSize: 16 }}>{u.icon}</Text>
            </IconBadge>
            <View style={styles.flex}>
              <Text style={styles.upcomingName}>{u.name}</Text>
              <Text style={styles.upcomingWhen}>{u.when}</Text>
            </View>
            <View style={styles.upcomingPills}>
              {u.pills.map((p) => (
                <View key={p.text} style={[styles.pill, { backgroundColor: p.bg }]}>
                  <Text style={[styles.pillText, { color: p.color }]}>{p.text}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        ))}
      </Card>

      {/* ─── Recent Mock Analysis ─────────────────────────────── */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeading}>Recent Mock Analysis</Text>
        <Text style={styles.viewAll}>View All</Text>
      </View>
      <Card style={styles.block}>
        <View style={styles.analysisTop}>
          <View style={styles.analysisGauge}>
            <Text style={styles.analysisName}>Full CAT Mock #4</Text>
            <Text style={styles.analysisDate}>10 May 2025</Text>
            <View style={{ alignItems: 'center', marginTop: 8 }}>
              <SemiGauge size={110} strokeWidth={10} progress={0.87} progressColor={Colors.accentBlue}>
                <View style={{ alignItems: 'center', marginTop: 10 }}>
                  <Text style={styles.gaugeValue}>93.4</Text>
                  <Text style={styles.gaugeUnit}>Percentile</Text>
                </View>
              </SemiGauge>
              <Text style={styles.gaugeDelta}>↑ 3.2</Text>
            </View>
          </View>

          <View style={styles.analysisStats}>
            <View style={styles.statGridRow}>
              <Stat label="Score" value="85.6%" delta="6.1%" />
              <Stat label="Accuracy" value="87%" delta="5%" />
              <Stat label="Attempts" value="66/66" />
            </View>
            <View style={{ marginTop: 12 }}>
              <Text style={styles.statLabel}>Time Taken</Text>
              <Text style={styles.statValue}>
                165 mins <Text style={styles.statVs}>vs 180 mins</Text>
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.aiInsightBox}>
          <Text style={styles.aiInsightTitle}>✦ AI Insight</Text>
          <Text style={styles.aiInsightText}>
            Great job! You improved in QA. Focus more on DILR Set 3 & 4.
          </Text>
          <Text style={styles.footerLinkBlue}>View Analysis ›</Text>
        </View>
      </Card>

      {/* ─── AI Recommendation ────────────────────────────────── */}
      <View style={styles.recoCard}>
        <View style={styles.recoRow}>
          <View style={styles.flex}>
            <Text style={styles.recoTitle}>💡 AI Recommendation</Text>
            <Text style={styles.recoText}>
              Your DILR accuracy drops in Set 3 & 4. Practice more Caselets and Arrangement sets to
              improve your consistency.
            </Text>
          </View>
        </View>
        <Pressable style={styles.recoBtn} accessibilityRole="button">
          <Text style={styles.recoBtnText}>View Plan ›</Text>
        </Pressable>
      </View>

      <View style={{ height: 12 }} />
    </ScrollView>
  );
}

// ─── Pieces ──────────────────────────────────────────────────────────────────

function SectionalPill({ text, bg, color }: { text: string; bg: string; color: string }) {
  return (
    <View style={[styles.sectionalPill, { backgroundColor: bg }]}>
      <Text style={[styles.sectionalPillText, { color }]}>{text}</Text>
      <Text style={[styles.sectionalPillChevron, { color }]}>›</Text>
    </View>
  );
}

function Stat({ label, value, delta }: { label: string; value: string; delta?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {delta && <Text style={styles.statDelta}>↑ {delta}</Text>}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

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

  // Performance dark card
  perfCard: { backgroundColor: Colors.primary, borderRadius: 20, padding: 16, marginBottom: 20 },
  perfHeading: { color: '#FFFFFF', fontSize: 15, fontFamily: FontFamily.bold, marginBottom: 14 },
  perfGrid: { flexDirection: 'row', gap: 8 },
  perfTile: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 10 },
  perfTileLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 10, fontFamily: FontFamily.medium },
  perfTileValue: { color: '#FFFFFF', fontSize: 18, fontFamily: FontFamily.extraBold, marginTop: 4 },
  perfTileFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  perfDelta: { color: '#4ADE80', fontSize: 10, fontFamily: FontFamily.semiBold },
  perfTileIcon: { fontSize: 12 },

  sectionHeading: { fontSize: 17, fontFamily: FontFamily.bold, color: Colors.primary, marginBottom: 12 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  viewAll: { fontSize: 13, fontFamily: FontFamily.semiBold, color: Colors.accentBlue },
  block: { marginBottom: 20 },

  // Mock choice cards
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

  // Upcoming
  upcomingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  upcomingDivider: { borderTopWidth: 1, borderTopColor: '#EFF1F6' },
  upcomingName: { fontSize: 14, fontFamily: FontFamily.bold, color: Colors.textBody },
  upcomingWhen: { fontSize: 11, fontFamily: FontFamily.regular, color: Colors.textSecondary, marginTop: 2 },
  upcomingPills: { alignItems: 'flex-end', gap: 4 },
  pill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  pillText: { fontSize: 10, fontFamily: FontFamily.semiBold },
  chevron: { fontSize: 20, color: Colors.textMuted, marginLeft: 2 },

  // Analysis
  analysisTop: { flexDirection: 'row', gap: 12 },
  analysisGauge: { alignItems: 'center' },
  analysisName: { fontSize: 13, fontFamily: FontFamily.bold, color: Colors.textBody },
  analysisDate: { fontSize: 11, fontFamily: FontFamily.regular, color: Colors.textSecondary, marginTop: 1 },
  gaugeValue: { fontSize: 20, fontFamily: FontFamily.extraBold, color: Colors.primary },
  gaugeUnit: { fontSize: 10, fontFamily: FontFamily.regular, color: Colors.textMuted },
  gaugeDelta: { fontSize: 11, fontFamily: FontFamily.semiBold, color: Colors.success, marginTop: 4 },
  analysisStats: { flex: 1, justifyContent: 'center' },
  statGridRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { flex: 1 },
  statLabel: { fontSize: 11, fontFamily: FontFamily.regular, color: Colors.textSecondary },
  statValue: { fontSize: 15, fontFamily: FontFamily.extraBold, color: Colors.primary, marginTop: 2 },
  statVs: { fontSize: 11, fontFamily: FontFamily.regular, color: Colors.textMuted },
  statDelta: { fontSize: 10, fontFamily: FontFamily.semiBold, color: Colors.success, marginTop: 1 },

  aiInsightBox: { backgroundColor: '#F1F5FE', borderRadius: 14, padding: 14, marginTop: 16 },
  aiInsightTitle: { fontSize: 13, fontFamily: FontFamily.bold, color: Colors.accentBlue },
  aiInsightText: { fontSize: 12.5, fontFamily: FontFamily.regular, color: Colors.textBody, lineHeight: 18, marginTop: 6, marginBottom: 8 },
  footerLinkBlue: { fontSize: 13, fontFamily: FontFamily.semiBold, color: Colors.accentBlue },

  // Recommendation
  recoCard: { backgroundColor: '#EFF3FE', borderRadius: 18, padding: 16 },
  recoRow: { flexDirection: 'row' },
  recoTitle: { fontSize: 14, fontFamily: FontFamily.bold, color: Colors.primary },
  recoText: { fontSize: 12.5, fontFamily: FontFamily.regular, color: Colors.textBody, lineHeight: 18, marginTop: 6 },
  recoBtn: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recoBtnText: { fontSize: 13, fontFamily: FontFamily.semiBold, color: Colors.primary },
});
