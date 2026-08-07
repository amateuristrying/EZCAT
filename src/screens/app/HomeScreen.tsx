import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';
import { Card, Delta, IconBadge } from '../../components/AppUI';
import { SemiGauge } from '../../components/Charts';
import { AccountMenu } from '../../components/AccountMenu';
import { useAppStore } from '../../store/AppStore';
import { catYearLabel, daysLeftForYear, type SectionId } from '../../constants/data';

// ─── Small local pieces ──────────────────────────────────────────────────────

function SectionBadge({ section }: { section: 'varc' | 'qa' | 'dilr' }) {
  const map = {
    varc: { bg: Colors.varcBg, color: Colors.varc, glyph: 'A' },
    qa: { bg: Colors.qaBg, color: Colors.qa, glyph: '×÷' },
    dilr: { bg: Colors.dilrBg, color: Colors.dilr, glyph: '☰' },
  } as const;
  const m = map[section];
  return (
    <IconBadge bg={m.bg} size={44} radius={14}>
      <Text style={{ color: m.color, fontFamily: FontFamily.bold, fontSize: m.glyph.length > 1 ? 14 : 18 }}>
        {m.glyph}
      </Text>
    </IconBadge>
  );
}

const WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { profile, targetYear, percentile, progress, setActiveTab, reset } = useAppStore();

  const nameParts = profile.name.trim().split(/\s+/).filter(Boolean);
  const initials =
    nameParts.length >= 2
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : nameParts.length === 1
      ? nameParts[0].slice(0, 2).toUpperCase()
      : 'EZ';
  const firstName = nameParts[0] || 'Aspirant';
  const daysLeft = daysLeftForYear(targetYear);
  const yearLabel = catYearLabel(targetYear);

  // Today's practice sections derived from the question bank + answers.
  const sectionData: { s: SectionId; label: string }[] = [
    { s: 'varc', label: 'VARC' },
    { s: 'qa', label: 'QA' },
    { s: 'dilr', label: 'DILR' },
  ];
  const statusFor = (answered: number, total: number) => {
    if (total > 0 && answered >= total) return { text: 'Completed', color: Colors.varc };
    if (answered > 0) return { text: 'In Progress', color: Colors.qa };
    return { text: 'Pending', color: Colors.textMuted };
  };
  const progressPct = progress.total > 0 ? (progress.answered / progress.total) * 100 : 0;

  const handleLogout = () => {
    setMenuOpen(false);
    // Log out → reset session data and return to Screen 1 (Welcome).
    reset();
    router.replace('/');
  };

  return (
    <View style={styles.flex}>
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ─── Header ───────────────────────────────────────────── */}
      <View style={styles.header}>
        <Image
          source={require('../../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="EZCAT"
        />
        <View style={styles.headerRight}>
          <View style={styles.bellWrap}>
            <Text style={styles.bell}>🔔</Text>
            <View style={styles.bellDot} />
          </View>
          <Pressable
            style={styles.avatar}
            onPress={() => setMenuOpen((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel="Account menu"
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </Pressable>
        </View>
      </View>

      {/* ─── Greeting ─────────────────────────────────────────── */}
      <Text style={styles.greeting}>Good morning, {firstName}! 👋</Text>
      <Text style={styles.greetingSub}>
        Let's make today a productive step forward.
      </Text>

      {/* ─── Streak + Countdown ───────────────────────────────── */}
      <View style={styles.row}>
        {/* Streak (dark) */}
        <View style={[styles.col, styles.streakCard]}>
          <View style={styles.streakTop}>
            <View style={styles.flameCircle}>
              <Text style={styles.flame}>🔥</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.streakLabel}>Current Streak</Text>
              <Text style={styles.streakValue}>27 Days</Text>
              <Text style={styles.streakSub}>Keep it going!</Text>
            </View>
          </View>
          <View style={styles.streakDays}>
            {WEEK.map((d, i) => (
              <View key={i} style={styles.dayItem}>
                <View style={[styles.dayCircle, i < 6 && styles.dayCircleDone]}>
                  {i < 6 && <Text style={styles.dayCheck}>✓</Text>}
                </View>
                <Text style={styles.dayLabel}>{d}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Countdown (light) */}
        <Card style={styles.col}>
          <View style={styles.countRow}>
            <IconBadge bg={Colors.varcBg} size={44} radius={14}>
              <Text style={{ fontSize: 20 }}>📅</Text>
            </IconBadge>
          </View>
          <Text style={styles.countTitle}>{yearLabel}</Text>
          <Text style={styles.countValue}>{daysLeft != null ? daysLeft : '—'}</Text>
          <Text style={styles.countUnit}>Days Left</Text>
          <View style={styles.countDivider} />
          <Text style={styles.countTarget}>
            Target: <Text style={styles.countTargetHl}>{percentile} Percentile</Text>
          </Text>
        </Card>
      </View>

      {/* ─── Today's Progress ─────────────────────────────────── */}
      <Card style={styles.block}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Today's Progress</Text>
          <Text style={styles.progressCount}>
            <Text style={styles.hlBlue}>{progress.answered}</Text> / {progress.total} Questions
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>

        <View style={styles.sectionRow}>
          {sectionData.map((it) => {
            const sp = progress.bySection[it.s];
            const status = statusFor(sp.answered, sp.total);
            return (
              <View key={it.label} style={styles.sectionItem}>
                <SectionBadge section={it.s} />
                <Text style={styles.sectionLabel}>{it.label}</Text>
                <Text style={styles.sectionFrac}>{sp.answered} / {sp.total}</Text>
                <Text style={[styles.sectionStatus, { color: status.color }]}>{status.text}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.miniBar}>
          <View style={styles.miniCol}>
            <Text style={styles.miniIcon}>🕐</Text>
            <View>
              <Text style={styles.miniLabel}>Estimated Time Left</Text>
              <Text style={styles.miniValue}>
                {Math.max(progress.total - progress.answered, 0) * 2} mins
              </Text>
            </View>
          </View>
          <View style={styles.miniDivider} />
          <View style={styles.miniCol}>
            <Text style={styles.miniIcon}>🎯</Text>
            <View>
              <Text style={styles.miniLabel}>Daily Goal</Text>
              <Text style={styles.miniValue}>20 mins</Text>
            </View>
          </View>
        </View>
      </Card>

      {/* ─── Continue Practice CTA ────────────────────────────── */}
      <Pressable
        style={({ pressed }) => [styles.continueBtn, pressed && { opacity: 0.9 }]}
        onPress={() => setActiveTab('questions')}
        accessibilityRole="button"
        accessibilityLabel="Continue Practice"
      >
        <View style={styles.continueIcon}>
          <Text style={{ fontSize: 16 }}>📖</Text>
        </View>
        <Text style={styles.continueText}>Continue Practice</Text>
        <Text style={styles.continueArrow}>→</Text>
      </Pressable>

      {/* ─── Weekly Consistency + Predicted Percentile ────────── */}
      <View style={styles.row}>
        <Card style={styles.col}>
          <Text style={styles.cardTitleSm}>Weekly Consistency</Text>
          <View style={styles.consistencyRow}>
            <View style={styles.bars}>
              {[16, 26, 20, 30, 22, 28, 10].map((h, i) => (
                <View key={i} style={styles.barCol}>
                  <View
                    style={[
                      styles.bar,
                      { height: h, backgroundColor: i === 6 ? Colors.track : Colors.accentBlue },
                    ]}
                  />
                  <Text style={styles.barLabel}>{WEEK[i]}</Text>
                </View>
              ))}
            </View>
            <View style={styles.consistencyValue}>
              <Text style={styles.bigBlue}>5/7</Text>
              <Text style={styles.smMuted}>Days</Text>
            </View>
          </View>
          <View style={styles.cardFooterDivider} />
          <Text style={styles.footerLinkGood}>↗ Great consistency!</Text>
        </Card>

        <Card style={styles.col}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitleSm}>Predicted Percentile</Text>
            <Text style={styles.infoGlyph}>ⓘ</Text>
          </View>
          <View style={styles.gaugeWrap}>
            <SemiGauge size={130} strokeWidth={11} progress={0.87} progressColor={Colors.accentBlue}>
              <View style={{ alignItems: 'center', marginTop: 14 }}>
                <Text style={styles.gaugeValue}>93.4</Text>
                <Text style={styles.smMuted}>Percentile</Text>
              </View>
            </SemiGauge>
          </View>
          <Text style={styles.footerLinkBlue}>Keep practicing to reach 99+</Text>
        </Card>
      </View>

      {/* ─── AI Insight + Upcoming Mock ───────────────────────── */}
      <View style={styles.row}>
        <Card style={styles.col}>
          <Text style={styles.aiTitle}>✦ AI Insight</Text>
          <View style={styles.aiBody}>
            <Text style={styles.aiText}>
              You're doing well in <Text style={styles.hlBlueBold}>QA!</Text> Focus a bit more on{' '}
              <Text style={styles.hlGreenBold}>DILR</Text> sets to improve accuracy.
            </Text>
            <View style={styles.bulbBadge}>
              <Text style={{ fontSize: 16 }}>💡</Text>
            </View>
          </View>
          <View style={styles.cardFooterDivider} />
          <Text style={styles.footerLinkBlue}>View Details ›</Text>
        </Card>

        <Card style={styles.col}>
          <Text style={styles.cardTitleSm}>Upcoming Mock</Text>
          <View style={styles.mockRow}>
            <IconBadge bg={Colors.dilrBg} size={40} radius={12}>
              <Text style={{ fontSize: 18 }}>📆</Text>
            </IconBadge>
            <View style={styles.flex}>
              <Text style={styles.mockName}>Mini Mock Test</Text>
              <Text style={styles.smMuted}>Tomorrow, 9:00 AM</Text>
            </View>
          </View>
          <View style={styles.cardFooterDivider} />
          <Text style={styles.footerLinkBlue}>Prepare Now ›</Text>
        </Card>
      </View>

      {/* ─── Recent Performance ───────────────────────────────── */}
      <Card style={styles.block}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Recent Performance</Text>
          <Text style={styles.footerLinkBlue}>View All</Text>
        </View>
        <View style={styles.perfRow}>
          <View style={styles.perfItem}>
            <IconBadge bg={Colors.dilrBg} size={40} radius={20}>
              <Text style={{ fontSize: 16 }}>🎯</Text>
            </IconBadge>
            <Text style={styles.perfLabel}>Accuracy</Text>
            <Text style={styles.perfValue}>84%</Text>
            <Delta value="6%" direction="up" good />
          </View>
          <View style={styles.perfItem}>
            <IconBadge bg={Colors.varcBg} size={40} radius={20}>
              <Text style={{ fontSize: 16 }}>🕐</Text>
            </IconBadge>
            <Text style={styles.perfLabel}>Avg. Time / Q</Text>
            <Text style={styles.perfValue}>1m 24s</Text>
            <Delta value="10s" direction="down" good />
          </View>
          <View style={styles.perfItem}>
            <IconBadge bg={Colors.purpleBg} size={40} radius={20}>
              <Text style={{ fontSize: 16 }}>📋</Text>
            </IconBadge>
            <Text style={styles.perfLabel}>Questions Solved</Text>
            <Text style={styles.perfValue}>156</Text>
            <Delta value="18" direction="up" good />
          </View>
        </View>
      </Card>

      <View style={{ height: 12 }} />
    </ScrollView>

      <AccountMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onLogout={handleLogout}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 8,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  logo: { width: 96, height: 40 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  bellWrap: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  bell: { fontSize: 20 },
  bellDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.varcBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: Colors.primary, fontFamily: FontFamily.bold, fontSize: 14 },

  // Greeting
  greeting: {
    fontSize: 26,
    fontFamily: FontFamily.extraBold,
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  greetingSub: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 18,
  },

  // Layout helpers
  row: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  col: { flex: 1 },
  block: { marginBottom: 14 },

  // Streak card
  streakCard: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
  },
  streakTop: { flexDirection: 'row', gap: 10 },
  flameCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flame: { fontSize: 20 },
  streakLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontFamily: FontFamily.medium },
  streakValue: { color: '#FFFFFF', fontSize: 24, fontFamily: FontFamily.extraBold, marginTop: 2 },
  streakSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: FontFamily.regular, marginTop: 2 },
  streakDays: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  dayItem: { alignItems: 'center', gap: 4 },
  dayCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleDone: { backgroundColor: '#3E7BFA', borderColor: '#3E7BFA' },
  dayCheck: { color: '#FFFFFF', fontSize: 10, fontFamily: FontFamily.bold },
  dayLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontFamily: FontFamily.medium },

  // Countdown card
  countRow: { flexDirection: 'row' },
  countTitle: { fontSize: 14, fontFamily: FontFamily.semiBold, color: Colors.primary, marginTop: 10, textAlign: 'center' },
  countValue: { fontSize: 30, fontFamily: FontFamily.extraBold, color: Colors.primary, textAlign: 'center' },
  countUnit: { fontSize: 13, fontFamily: FontFamily.medium, color: Colors.textBody, textAlign: 'center' },
  countDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 10 },
  countTarget: { fontSize: 12, fontFamily: FontFamily.regular, color: Colors.textSecondary, textAlign: 'center' },
  countTargetHl: { color: Colors.primary, fontFamily: FontFamily.bold },

  // Generic card header
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 16, fontFamily: FontFamily.bold, color: Colors.primary },
  cardTitleSm: { fontSize: 14, fontFamily: FontFamily.bold, color: Colors.primary },

  // Progress
  progressCount: { fontSize: 13, fontFamily: FontFamily.medium, color: Colors.textSecondary },
  hlBlue: { color: Colors.primary, fontFamily: FontFamily.bold },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: Colors.track, marginTop: 14, marginBottom: 18 },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: Colors.accentBlue },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sectionItem: { flex: 1, gap: 3 },
  sectionLabel: { fontSize: 13, fontFamily: FontFamily.bold, color: Colors.textBody, marginTop: 6 },
  sectionFrac: { fontSize: 18, fontFamily: FontFamily.extraBold, color: Colors.primary },
  sectionStatus: { fontSize: 11, fontFamily: FontFamily.semiBold },

  // Mini bar (time/goal)
  miniBar: {
    flexDirection: 'row',
    backgroundColor: '#F5F7FC',
    borderRadius: 14,
    padding: 14,
    marginTop: 18,
    alignItems: 'center',
  },
  miniCol: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  miniDivider: { width: 1, height: 32, backgroundColor: Colors.border },
  miniIcon: { fontSize: 18 },
  miniLabel: { fontSize: 11, fontFamily: FontFamily.regular, color: Colors.textSecondary },
  miniValue: { fontSize: 15, fontFamily: FontFamily.bold, color: Colors.primary, marginTop: 1 },

  // Continue button
  continueBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 14,
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16 },
      android: { elevation: 6 },
      default: {},
    }),
    ...(Platform.OS === 'web' ? ({ boxShadow: '0px 8px 24px rgba(11,44,116,0.28)' } as any) : {}),
  },
  continueIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: { flex: 1, textAlign: 'center', color: '#FFFFFF', fontSize: 17, fontFamily: FontFamily.semiBold },
  continueArrow: { color: '#FFFFFF', fontSize: 20, width: 34, textAlign: 'right' },

  // Weekly consistency
  consistencyRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 14 },
  bars: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 40 },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  bar: { width: 5, borderRadius: 3 },
  barLabel: { fontSize: 8, fontFamily: FontFamily.regular, color: Colors.textMuted },
  consistencyValue: { alignItems: 'flex-end', marginLeft: 6 },
  bigBlue: { fontSize: 22, fontFamily: FontFamily.extraBold, color: Colors.accentBlue },
  smMuted: { fontSize: 11, fontFamily: FontFamily.regular, color: Colors.textMuted },
  cardFooterDivider: { height: 1, backgroundColor: Colors.border, marginTop: 14, marginBottom: 10 },
  footerLinkGood: { fontSize: 12, fontFamily: FontFamily.semiBold, color: Colors.accentBlue, textAlign: 'center' },
  footerLinkBlue: { fontSize: 13, fontFamily: FontFamily.semiBold, color: Colors.accentBlue },

  // Gauge
  infoGlyph: { fontSize: 14, color: Colors.textMuted },
  gaugeWrap: { alignItems: 'center', marginVertical: 8 },
  gaugeValue: { fontSize: 24, fontFamily: FontFamily.extraBold, color: Colors.primary },

  // AI insight
  aiTitle: { fontSize: 14, fontFamily: FontFamily.bold, color: Colors.primary },
  aiBody: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 10 },
  aiText: { flex: 1, fontSize: 12.5, fontFamily: FontFamily.regular, color: Colors.textBody, lineHeight: 18 },
  hlBlueBold: { color: Colors.primary, fontFamily: FontFamily.bold },
  hlGreenBold: { color: Colors.dilr, fontFamily: FontFamily.bold },
  bulbBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.varcBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Upcoming mock
  mockRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  mockName: { fontSize: 14, fontFamily: FontFamily.bold, color: Colors.textBody },

  // Recent performance
  perfRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  perfItem: { flex: 1, alignItems: 'center', gap: 4 },
  perfLabel: { fontSize: 11, fontFamily: FontFamily.regular, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
  perfValue: { fontSize: 17, fontFamily: FontFamily.extraBold, color: Colors.primary },
});
