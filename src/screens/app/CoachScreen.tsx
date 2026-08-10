import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';
import { Card, IconBadge } from '../../components/AppUI';
import { ProgressRing, Sparkline } from '../../components/Charts';
import { useAppStore } from '../../store/AppStore';
import { useBYOK } from '../../store/BYOKContext';
import { BYOKConfigModal } from '../../components/byok/BYOKConfigModal';
import {
  calculateSectionalAccuracy,
  getTopicDiagnostics,
  calculateReadinessScore,
  calculatePredictedPercentile,
  getWeeklyConsistency,
} from '../../utils/analyticsEngine';

export default function CoachScreen() {
  const { profile, levels, userProgress, percentile, setActiveTab } = useAppStore();
  const {
    hasKey,
    config,
    cachedInsights,
    isLoadingInsights,
    insightError,
    fetchGenerativeInsights,
  } = useBYOK();

  const [isByokModalOpen, setIsByokModalOpen] = useState(false);

  const firstName = profile.name.trim().split(/\s+/)[0] || 'Aspirant';
  const attempts = userProgress.attempts || {};
  const attemptsCount = Object.keys(attempts).length;

  // Run dynamic analytics engine
  const sectionalAcc = calculateSectionalAccuracy(attempts);
  const topicDiag = getTopicDiagnostics(attempts);
  const readinessScore = calculateReadinessScore(attempts, levels);
  const predPercentile = calculatePredictedPercentile(attempts, percentile);
  const weeklyConsistency = getWeeklyConsistency(attempts, userProgress.dailyProgress);

  // Trigger Generative Insights fetch when BYOK is enabled & key is connected
  useEffect(() => {
    if (hasKey && attemptsCount > 0 && !cachedInsights && !isLoadingInsights) {
      fetchGenerativeInsights({
        userName: firstName,
        targetPercentile: percentile,
        readinessScore,
        sectionalAccuracy: {
          varc: sectionalAcc.varc.accuracyPct,
          dilr: sectionalAcc.dilr.accuracyPct,
          qa: sectionalAcc.qa.accuracyPct,
        },
        weakTopics: topicDiag.weak.map((t) => t.topic),
        strongTopics: topicDiag.strong.map((t) => t.topic),
        totalAttempts: attemptsCount,
      });
    }
  }, [hasKey, attemptsCount, cachedInsights, isLoadingInsights, fetchGenerativeInsights, firstName, percentile, readinessScore, sectionalAcc, topicDiag]);

  const handleRefreshAiInsights = () => {
    fetchGenerativeInsights({
      userName: firstName,
      targetPercentile: percentile,
      readinessScore,
      sectionalAccuracy: {
        varc: sectionalAcc.varc.accuracyPct,
        dilr: sectionalAcc.dilr.accuracyPct,
        qa: sectionalAcc.qa.accuracyPct,
      },
      weakTopics: topicDiag.weak.map((t) => t.topic),
      strongTopics: topicDiag.strong.map((t) => t.topic),
      totalAttempts: attemptsCount,
    });
  };

  // Derive dynamic recommendations based on weak topics / sectional accuracy
  const lowestTopic = topicDiag.weak[0]?.topic || 'DILR Sets & Caselets';
  const secondTopic = topicDiag.weak[1]?.topic || topicDiag.strong[0]?.topic || 'Geometry Concepts';

  const recommendations = [
    {
      icon: '☰',
      iconBg: Colors.dilrBg,
      iconColor: Colors.dilr,
      title: attemptsCount > 0 ? `Solve 2 additional ${lowestTopic} sets` : 'Solve 2 additional DILR sets',
      sub: attemptsCount > 0 ? `Current accuracy in ${lowestTopic} needs attention` : 'Focus on Arrangements & Caselets',
      priority: 'High Priority',
      pillBg: Colors.dilrBg,
      pillColor: Colors.dilr,
    },
    {
      icon: '📐',
      iconBg: Colors.qaBg,
      iconColor: Colors.qa,
      title: attemptsCount > 0 ? `Review ${secondTopic} mistakes` : 'Review Geometry & Quant mistakes',
      sub: 'Focus on accuracy improvement in recent practice',
      priority: 'Medium Priority',
      pillBg: Colors.qaBg,
      pillColor: Colors.qa,
    },
    {
      icon: '📊',
      iconBg: Colors.varcBg,
      iconColor: Colors.varc,
      title: 'Attempt a Mini Mock',
      sub: 'Track your speed & percentile under exam conditions',
      priority: 'Low Priority',
      pillBg: Colors.varcBg,
      pillColor: Colors.varc,
    },
  ];

  // Derive AI Insights dynamically
  const insights = [
    {
      icon: '🎯',
      bg: Colors.dilrBg,
      title: 'Focus On',
      sub: lowestTopic,
      note: 'Next 3 practice sets',
    },
    {
      icon: '⏭️',
      bg: Colors.qaBg,
      title: 'Skip For Now',
      sub: 'Advanced QA',
      note: 'Hard speed traps',
    },
    {
      icon: '🔄',
      bg: Colors.purpleBg,
      title: 'Revise',
      sub: secondTopic,
      note: 'Formula rules',
    },
    {
      icon: '📈',
      bg: Colors.varcBg,
      title: 'Improve',
      sub: `VARC ${sectionalAcc.varc.accuracyPct}%`,
      note: 'Target +5% gain',
    },
  ];

  const streakDisplay = userProgress.currentStreak || 1;

  // Fallback lists if attempts >= 5
  const weakList = topicDiag.weak.slice(0, 4);
  const strongList = topicDiag.strong.slice(0, 4);

  // Sparkline data generation based on readiness / attempts progression
  const sparklineData = attemptsCount > 0
    ? [readinessScore - 8, readinessScore - 6, readinessScore - 4, readinessScore - 2, readinessScore]
    : [40, 44, 48, 50, 52];

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
            <Text style={styles.title}>AI Coach</Text>
            <Text style={styles.subtitle}>Your personal CAT mentor, guiding you every day.</Text>
          </View>
          <Pressable
            style={styles.historyBtn}
            onPress={() => setActiveTab('questions')}
            accessibilityRole="button"
          >
            <Text style={styles.historyIcon}>🕐</Text>
            <Text style={styles.historyText}>Practice History</Text>
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
              {attemptsCount > 0
                ? `I've analyzed your ${attemptsCount} practice attempts and calculated your prep plan.`
                : 'Complete your first practice set to unlock personalized topic analytics.'}
            </Text>
          </View>
          <ProgressRing
            size={64}
            strokeWidth={7}
            progress={readinessScore / 100}
            progressColor={Colors.success}
          >
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.prepValue}>{readinessScore}%</Text>
              <Text style={styles.prepLabel}>Prep Score</Text>
            </View>
          </ProgressRing>
        </View>

        {/* ─── Today's Recommendation ───────────────────────────── */}
        <Card style={styles.block}>
          <Text style={styles.cardTitle}>✦ Today's Recommendation</Text>
          {recommendations.map((r, i) => (
            <Pressable
              key={i}
              style={styles.recRow}
              onPress={() => {
                if (r.priority === 'Low Priority') {
                  setActiveTab('mocks');
                } else {
                  setActiveTab('questions');
                }
              }}
            >
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
            </Pressable>
          ))}
          <Pressable onPress={() => setActiveTab('questions')}>
            <Text style={[styles.footerLinkBlue, { marginTop: 14 }]}>View Full Practice Plan ›</Text>
          </Pressable>
        </Card>

        {/* ─── Weak Topics + Strengths ──────────────────────────── */}
        <View style={styles.row}>
          <Card style={styles.col}>
            <Text style={[styles.listTitle, { color: Colors.danger }]}>↘ Weak Topics</Text>
            {attemptsCount < 5 ? (
              <View style={styles.emptyTopicBox}>
                <Text style={styles.emptyTopicText}>
                  Complete 5 practice questions to generate topic diagnostics.
                </Text>
                <Pressable
                  style={styles.startBtnSmall}
                  onPress={() => setActiveTab('questions')}
                >
                  <Text style={styles.startBtnSmallText}>Start Solving</Text>
                </Pressable>
              </View>
            ) : weakList.length === 0 ? (
              <View style={styles.emptyTopicBox}>
                <Text style={styles.emptyTopicText}>
                  Great job! No weak topics ({"<"}70% accuracy) detected.
                </Text>
              </View>
            ) : (
              weakList.map((w) => (
                <View key={w.topic} style={styles.topicRow}>
                  <Text style={styles.topicName} numberOfLines={1}>
                    {w.topic}
                  </Text>
                  <View style={[styles.pctPill, { backgroundColor: Colors.dangerBg }]}>
                    <Text style={[styles.pctText, { color: Colors.danger }]}>{w.pct}</Text>
                  </View>
                </View>
              ))
            )}
            {attemptsCount >= 5 && (
              <Pressable onPress={() => setActiveTab('questions')}>
                <Text style={[styles.listFooter, { color: Colors.danger }]}>Focus Weak Topics ›</Text>
              </Pressable>
            )}
          </Card>

          <Card style={styles.col}>
            <Text style={[styles.listTitle, { color: Colors.success }]}>↗ Strengths</Text>
            {attemptsCount < 5 ? (
              <View style={styles.emptyTopicBox}>
                <Text style={styles.emptyTopicText}>
                  Strengths will appear here as your accuracy improves.
                </Text>
              </View>
            ) : strongList.length === 0 ? (
              <View style={styles.emptyTopicBox}>
                <Text style={styles.emptyTopicText}>
                  Keep practicing to turn topics into strengths (&#62;=70%).
                </Text>
              </View>
            ) : (
              strongList.map((s) => (
                <View key={s.topic} style={styles.topicRow}>
                  <Text style={styles.topicName} numberOfLines={1}>
                    {s.topic}
                  </Text>
                  <View style={[styles.pctPill, { backgroundColor: Colors.successBg }]}>
                    <Text style={[styles.pctText, { color: Colors.success }]}>{s.pct}</Text>
                  </View>
                </View>
              ))
            )}
            {attemptsCount >= 5 && (
              <Pressable onPress={() => setActiveTab('questions')}>
                <Text style={[styles.listFooter, { color: Colors.success }]}>Maintain Strengths ›</Text>
              </Pressable>
            )}
          </Card>
        </View>

        {/* ─── Free Algorithmic AI Insights ─────────────────────── */}
        <Card style={styles.block}>
          <Text style={styles.cardTitle}>✦ Free Algorithmic Insights</Text>
          <View style={styles.insightsRow}>
            {insights.map((it, i) => (
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
          <Pressable onPress={() => setActiveTab('questions')}>
            <Text style={styles.footerLinkBlue}>View Detailed Practice Insights ›</Text>
          </Pressable>
        </Card>

        {/* ─── Percentile Projection + Readiness ────────────────── */}
        <View style={styles.row}>
          <Card style={styles.col}>
            <Text style={styles.listTitle}>📈 Percentile Projection</Text>
            <View style={styles.projRow}>
              <Text style={styles.projValue}>{predPercentile.formatted}%</Text>
              <Text style={styles.projDelta}>{predPercentile.deltaStr}</Text>
            </View>
            <View style={styles.projTrackWrap}>
              <View style={styles.projTrack}>
                <View
                  style={[
                    styles.projFill,
                    { width: `${Math.round(predPercentile.progressRatio * 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.projEnd}>99+</Text>
            </View>
            <Text style={styles.projNote}>
              On track to reach your target {percentile} percentile
            </Text>
          </Card>

          <Card style={styles.col}>
            <Text style={styles.listTitle}>🛡️ Readiness Score</Text>
            <Text style={styles.readyValue}>{readinessScore}%</Text>
            <Text style={styles.readyGood}>
              {readinessScore >= 70 ? "You're exam ready!" : "Keep building consistency!"}
            </Text>
            <View style={styles.sparkWrap}>
              <Sparkline
                data={sparklineData}
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
            <Text style={styles.streakValue}>{streakDisplay} {streakDisplay === 1 ? 'Day' : 'Days'}</Text>
            <Text style={styles.streakSub}>Keep the streak alive!</Text>
          </View>
          <View style={styles.streakDays}>
            {weeklyConsistency.bars.map((bar, i) => (
              <View key={i} style={styles.dayItem}>
                <View
                  style={[
                    styles.dayCircle,
                    bar.active && styles.dayCircleDone,
                  ]}
                >
                  {bar.active && <Text style={styles.dayCheck}>✓</Text>}
                </View>
                <Text style={styles.dayLabel}>{bar.dayLabel}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ─── BYOK Unlock / Generative AI Insights Deck ───────── */}
        <View style={styles.byokSection}>
          {!hasKey ? (
            <Card style={styles.byokCardLocked}>
              <View style={styles.byokHeaderRow}>
                <View style={styles.byokIconWrap}>
                  <Text style={{ fontSize: 22 }}>⚡</Text>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.byokTitle}>Unlock Enhanced AI Insights (BYOK)</Text>
                  <Text style={styles.byokBadgeText}>Bring Your Own Key • Zero Server Telemetry</Text>
                </View>
              </View>

              <Text style={styles.byokDesc}>
                Connect your OpenAI, OpenRouter, DeepSeek, or Groq API key to unlock personalized, generative AI strategy roadmaps & live problem coaching.
              </Text>
              <Text style={styles.byokSecurityNote}>
                🔒 Keys are encrypted directly on your device (iOS Keychain / Android Keystore) and never sent to our servers.
              </Text>

              <Pressable
                style={styles.byokUnlockBtn}
                onPress={() => setIsByokModalOpen(true)}
              >
                <Text style={styles.byokUnlockBtnText}>Configure API Key & Unlock 🔒</Text>
              </Pressable>
            </Card>
          ) : (
            <Card style={styles.byokCardUnlocked}>
              <View style={styles.byokHeaderRow}>
                <View style={styles.byokIconWrapActive}>
                  <Text style={{ fontSize: 20 }}>🧠</Text>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.byokTitle}>Enhanced Generative AI Mentor</Text>
                  <Text style={styles.byokBadgeTextActive}>
                    Model Active: {config.model} ({config.provider})
                  </Text>
                </View>
                <Pressable
                  style={styles.byokSettingsBtn}
                  onPress={() => setIsByokModalOpen(true)}
                  accessibilityLabel="BYOK Key Settings"
                >
                  <Text style={styles.byokSettingsIcon}>⚙️</Text>
                </Pressable>
              </View>

              {isLoadingInsights ? (
                <View style={styles.aiLoadingState}>
                  <ActivityIndicator size="small" color={Colors.accentBlue} />
                  <Text style={styles.aiLoadingText}>Generative AI is analyzing your CAT accuracy patterns...</Text>
                </View>
              ) : insightError ? (
                <View style={styles.aiErrorState}>
                  <Text style={styles.aiErrorText}>⚠️ {insightError}</Text>
                  <Pressable style={styles.aiRetryBtn} onPress={handleRefreshAiInsights}>
                    <Text style={styles.aiRetryBtnText}>Retry AI Analysis 🔄</Text>
                  </Pressable>
                </View>
              ) : cachedInsights ? (
                <View style={styles.aiContentDeck}>
                  {/* Strategic Roadmap */}
                  <Text style={styles.aiSectionHeading}>🎯 Generative Study Roadmap</Text>
                  {cachedInsights.roadmap.map((item, idx) => (
                    <View key={idx} style={styles.aiRoadmapItem}>
                      <View style={styles.flex}>
                        <Text style={styles.aiRoadmapTitle}>{item.title}</Text>
                        <Text style={styles.aiRoadmapSub}>{item.subtitle}</Text>
                      </View>
                      <View style={[
                        styles.priorityPill,
                        { backgroundColor: item.priority === 'High Priority' ? Colors.dilrBg : Colors.qaBg }
                      ]}>
                        <Text style={[
                          styles.priorityText,
                          { color: item.priority === 'High Priority' ? Colors.dilr : Colors.qa }
                        ]}>
                          {item.priority}
                        </Text>
                      </View>
                    </View>
                  ))}

                  {/* Deep Diagnostic Analysis */}
                  <Text style={styles.aiSectionHeading}>🧠 Cognitive Diagnostic</Text>
                  <View style={styles.aiBox}>
                    <Text style={styles.aiBoxText}>{cachedInsights.deepDiagnostic}</Text>
                  </View>

                  {/* Exam Strategy */}
                  <Text style={styles.aiSectionHeading}>⏱️ Exam Day Strategy</Text>
                  <View style={styles.aiBox}>
                    <Text style={styles.aiBoxText}>{cachedInsights.examStrategy}</Text>
                  </View>

                  <Pressable style={styles.aiRefreshLink} onPress={handleRefreshAiInsights}>
                    <Text style={styles.footerLinkBlue}>Refresh AI Strategy Insights 🔄</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable style={styles.byokUnlockBtn} onPress={handleRefreshAiInsights}>
                  <Text style={styles.byokUnlockBtnText}>Generate AI Insights Now ⚡</Text>
                </Pressable>
              )}
            </Card>
          )}
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      <BYOKConfigModal
        visible={isByokModalOpen}
        onClose={() => setIsByokModalOpen(false)}
      />
    </View>
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

  // Empty state inside cards
  emptyTopicBox: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTopicText: {
    fontSize: 11.5,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  startBtnSmall: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
  },
  startBtnSmallText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: FontFamily.bold,
  },

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
  projValue: { fontSize: 24, fontFamily: FontFamily.extraBold, color: Colors.primary },
  projDelta: { fontSize: 12, fontFamily: FontFamily.semiBold, color: Colors.success },
  projTrackWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  projTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: Colors.track, justifyContent: 'center' },
  projFill: { height: 6, borderRadius: 3, backgroundColor: Colors.accentBlue },
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
    marginBottom: 16,
  },
  streakTitle: { fontSize: 14, fontFamily: FontFamily.bold, color: '#B45309' },
  streakValue: { fontSize: 24, fontFamily: FontFamily.extraBold, color: Colors.primary, marginTop: 2 },
  streakSub: { fontSize: 12, fontFamily: FontFamily.regular, color: Colors.textSecondary, marginTop: 2 },
  streakDays: { flexDirection: 'row', gap: 8 },
  dayItem: { alignItems: 'center', gap: 4 },
  dayCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: '#E7C99A', alignItems: 'center', justifyContent: 'center' },
  dayCircleDone: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
  dayCheck: { color: '#FFFFFF', fontSize: 10, fontFamily: FontFamily.bold },
  dayLabel: { fontSize: 9, fontFamily: FontFamily.medium, color: Colors.textSecondary },

  // BYOK Section & Cards
  byokSection: {
    marginTop: 4,
  },
  byokCardLocked: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 18,
    padding: 18,
  },
  byokCardUnlocked: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 18,
    padding: 18,
  },
  byokHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  byokIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  byokIconWrapActive: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  byokTitle: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  byokBadgeText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  byokBadgeTextActive: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#15803D',
    marginTop: 2,
  },
  byokDesc: {
    fontSize: 12.5,
    fontFamily: FontFamily.regular,
    color: Colors.textBody,
    lineHeight: 18,
    marginBottom: 8,
  },
  byokSecurityNote: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
    marginBottom: 14,
  },
  byokUnlockBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  byokUnlockBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontFamily: FontFamily.bold,
  },
  byokSettingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  byokSettingsIcon: {
    fontSize: 16,
  },
  aiLoadingState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 20,
  },
  aiLoadingText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: Colors.textBody,
  },
  aiErrorState: {
    paddingVertical: 14,
    gap: 10,
  },
  aiErrorText: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Colors.danger,
    lineHeight: 17,
  },
  aiRetryBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  aiRetryBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  aiContentDeck: {
    marginTop: 10,
    gap: 12,
  },
  aiSectionHeading: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
    marginTop: 4,
  },
  aiRoadmapItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
  },
  aiRoadmapTitle: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: Colors.textBody,
  },
  aiRoadmapSub: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  aiBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
  },
  aiBoxText: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Colors.textBody,
    lineHeight: 18,
  },
  aiRefreshLink: {
    marginTop: 4,
    alignItems: 'center',
  },
});
