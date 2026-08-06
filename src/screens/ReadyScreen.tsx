import React, { useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { PrimaryButton } from '../components/PrimaryButton';
import { Colors } from '../constants/colors';
import { FontFamily, Typography } from '../constants/typography';
import { useAppStore } from '../store/AppStore';
import { collegeLabel, catYearLabel } from '../constants/data';

// ─── Constants ───────────────────────────────────────────────────────────────

const CLIP_BLUE = '#2E86FF';

// ─── Summary Row ─────────────────────────────────────────────────────────────

interface SummaryRowProps {
  icon: string;
  label: string;
  children: React.ReactNode;
  showDivider?: boolean;
}

function SummaryRow({ icon, label, children, showDivider = true }: SummaryRowProps) {
  return (
    <>
      <View style={rowStyles.row}>
        <View style={rowStyles.iconCircle}>
          <Text style={rowStyles.icon}>{icon}</Text>
        </View>
        <View style={rowStyles.textWrap}>
          <Text style={rowStyles.label}>{label}</Text>
          {children}
        </View>
      </View>
      {showDivider && <View style={rowStyles.divider} />}
    </>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EAF1FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
    lineHeight: 24,
  },
  textWrap: {
    flex: 1,
    gap: 3,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontFamily: FontFamily.medium,
    color: Colors.textMuted,
  },
  value: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  subValue: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Colors.textMuted,
    marginTop: 1,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
  },
  divider: {
    height: 1,
    backgroundColor: '#EFF1F6',
  },
});

// ─── Screen ──────────────────────────────────────────────────────────────────

/**
 * ReadyScreen — Screen 06 (final onboarding step)
 *
 * Shows a summary "clipboard" of the user's plan.
 * "Start Practicing" is the entry point into the app itself — currently a
 * placeholder since the app screens are not built yet.
 */
export default function ReadyScreen() {
  const { width } = useWindowDimensions();
  const logoSize = Math.min(width * 0.52, 210);

  const { colleges, targetYear, percentile, progress } = useAppStore();

  // Build the summary from the user's onboarding selections.
  const summary = {
    targetCollege: colleges.length ? collegeLabel(colleges[0]) : 'Not selected yet',
    targetYear: catYearLabel(targetYear),
    targetPercentile: percentile,
    dailyPractice: '20 Minutes',
    todaysQuestions: [
      { label: `VARC × ${progress.bySection.varc.total}`, color: Colors.varc, bg: Colors.varcBg },
      { label: `QA × ${progress.bySection.qa.total}`, color: Colors.qa, bg: Colors.qaBg },
      { label: `DILR × ${progress.bySection.dilr.total}`, color: Colors.dilr, bg: Colors.dilrBg },
    ],
  };

  const handleStartPracticing = useCallback(() => {
    // Onboarding complete → open the main app (replace so back doesn't
    // return into the onboarding flow).
    router.replace('/home');
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Logo ───────────────────────────────────────────── */}
        <View style={styles.logoSection}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={{ width: logoSize, height: logoSize * 1.05 }}
            resizeMode="contain"
            accessibilityLabel="EZCAT logo"
          />
        </View>

        {/* ─── Clipboard Card ──────────────────────────────────── */}
        <View style={styles.clipboardWrap}>
          {/* Metal clip at top */}
          <View style={styles.clip}>
            <View style={styles.clipHole} />
          </View>

          {/* Blue clipboard body */}
          <View style={styles.clipboard}>
            {/* White paper */}
            <View style={styles.paper}>
              {/* Heading */}
              <View style={styles.readyHeadingWrap}>
                <Text style={styles.readyHeading}>You're Ready!</Text>
                <View style={styles.readyUnderline} />
              </View>

              {/* Summary rows */}
              <SummaryRow icon="🎯" label="Target">
                <Text style={rowStyles.value}>{summary.targetCollege}</Text>
                <Text style={rowStyles.subValue}>{summary.targetYear}</Text>
              </SummaryRow>

              <SummaryRow icon="🏆" label="Target Percentile">
                <Text style={rowStyles.value}>{summary.targetPercentile}</Text>
              </SummaryRow>

              <SummaryRow icon="🕐" label="Daily Practice">
                <Text style={rowStyles.value}>{summary.dailyPractice}</Text>
              </SummaryRow>

              <SummaryRow icon="📋" label="Today's Questions" showDivider={false}>
                <View style={rowStyles.chipsRow}>
                  {summary.todaysQuestions.map((q) => (
                    <View key={q.label} style={[rowStyles.chip, { backgroundColor: q.bg }]}>
                      <Text style={[rowStyles.chipText, { color: q.color }]}>
                        {q.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </SummaryRow>
            </View>
          </View>
        </View>

        {/* Bottom spacer so content clears the pinned CTA */}
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ─── Pinned CTA ─────────────────────────────────────── */}
      <View style={styles.ctaSection}>
        <PrimaryButton
          testID="ready-start-btn"
          label="Start Practicing"
          showArrow
          onPress={handleStartPracticing}
          style={styles.ctaButton}
        />
        <Text style={styles.footer}>Developed by 99VCA</Text>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  flex: { flex: 1 },

  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },

  // ── Logo ──────────────────────────────────────────────────
  logoSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 4,
  },

  // ── Clipboard ─────────────────────────────────────────────
  clipboardWrap: {
    marginTop: 24,
    alignItems: 'center',
  },

  clip: {
    width: 90,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#C9CDD6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    marginBottom: -14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
      default: {},
    }),
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0px 2px 6px rgba(0,0,0,0.12)' } as any)
      : {}),
  },

  clipHole: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#9AA1AF',
  },

  clipboard: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: CLIP_BLUE,
    paddingTop: 26,
    paddingBottom: 14,
    paddingHorizontal: 14,
    ...Platform.select({
      ios: {
        shadowColor: CLIP_BLUE,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
      default: {},
    }),
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0px 8px 24px rgba(46,134,255,0.25)' } as any)
      : {}),
  },

  paper: {
    borderRadius: 12,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },

  // ── "You're Ready!" heading ───────────────────────────────
  readyHeadingWrap: {
    alignItems: 'center',
    marginBottom: 14,
  },

  readyHeading: {
    fontSize: Typography.fontSize.xxl,
    fontFamily: FontFamily.extraBold,
    color: CLIP_BLUE,
    fontStyle: 'italic',
    letterSpacing: -0.5,
  },

  readyUnderline: {
    marginTop: 4,
    width: 150,
    height: 3,
    borderRadius: 2,
    backgroundColor: CLIP_BLUE,
  },

  // ── CTA ───────────────────────────────────────────────────
  ctaSection: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 14,
    alignItems: 'center',
    backgroundColor: Colors.background,
  },

  ctaButton: {
    width: '100%',
  },

  footer: {
    fontSize: Typography.fontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textMuted,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
});
