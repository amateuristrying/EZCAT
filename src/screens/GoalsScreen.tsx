import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  useWindowDimensions,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { PrimaryButton } from '../components/PrimaryButton';
import { Colors } from '../constants/colors';
import { FontFamily, Typography } from '../constants/typography';
import { useAppStore } from '../store/AppStore';
import {
  PERCENTILE_STEPS,
  DEFAULT_PERCENTILE_INDEX,
  YEAR_OPTIONS,
} from '../constants/data';

// ─── Year Option Card ────────────────────────────────────────────────────────

interface YearCardProps {
  label: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
}

function YearCard({ label, icon, selected, onPress }: YearCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        yearStyles.card,
        selected && yearStyles.cardSelected,
        pressed && yearStyles.cardPressed,
      ]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label.replace('\n', ' ')}
    >
      <Text style={yearStyles.icon}>{icon}</Text>
      <Text
        style={[yearStyles.label, selected && yearStyles.labelSelected]}
        numberOfLines={2}
        textBreakStrategy="simple"
      >
        {label}
      </Text>
    </Pressable>
  );
}

const yearStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: 8,
    backgroundColor: Colors.background,
    ...Platform.select({
      ios: {
        shadowColor: '#0B2C74',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
      default: {},
    }),
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0px 2px 8px rgba(11,44,116,0.06)' } as any)
      : {}),
  },
  cardSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: '#F0F4FF',
  },
  cardPressed: {
    opacity: 0.82,
  },
  icon: {
    fontSize: 22,
    lineHeight: 26,
  },
  label: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: Colors.textBody,
    textAlign: 'center',
    lineHeight: 16,
  },
  labelSelected: {
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
  },
});

// ─── Step Slider ─────────────────────────────────────────────────────────────

interface StepSliderProps {
  steps: string[];
  selectedIndex: number;
  onChangeIndex: (index: number) => void;
}

function StepSlider({ steps, selectedIndex, onChangeIndex }: StepSliderProps) {
  const trackWidth = useRef(0);

  /** Map a touch X position to the nearest step index */
  const xToIndex = (x: number): number => {
    if (trackWidth.current === 0) return selectedIndex;
    const ratio = Math.max(0, Math.min(1, x / trackWidth.current));
    return Math.round(ratio * (steps.length - 1));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const idx = xToIndex(evt.nativeEvent.locationX);
        onChangeIndex(idx);
      },
      onPanResponderMove: (evt) => {
        const idx = xToIndex(evt.nativeEvent.locationX);
        onChangeIndex(idx);
      },
    }),
  ).current;

  const handleTrackLayout = (e: LayoutChangeEvent) => {
    trackWidth.current = e.nativeEvent.layout.width;
  };

  const thumbPercent =
    steps.length > 1 ? (selectedIndex / (steps.length - 1)) * 100 : 0;

  return (
    <View style={sliderStyles.container}>
      {/* Track + Thumb */}
      <View
        style={sliderStyles.trackWrap}
        onLayout={handleTrackLayout}
        {...panResponder.panHandlers}
        accessibilityRole="adjustable"
        accessibilityValue={{
          text: steps[selectedIndex],
          min: 0,
          max: steps.length - 1,
          now: selectedIndex,
        }}
      >
        {/* Grey background track */}
        <View style={sliderStyles.trackBg} />

        {/* Blue filled portion */}
        <View
          style={[
            sliderStyles.trackFill,
            { width: `${thumbPercent}%` as any },
          ]}
        />

        {/* Thumb */}
        <View
          style={[
            sliderStyles.thumb,
            { left: `${thumbPercent}%` as any },
          ]}
        />
      </View>

      {/* Step labels row */}
      <View style={sliderStyles.labelsRow}>
        {steps.map((step, i) => (
          <Pressable
            key={step}
            onPress={() => onChangeIndex(i)}
            style={sliderStyles.labelWrap}
          >
            <Text
              style={[
                sliderStyles.stepLabel,
                i === selectedIndex && sliderStyles.stepLabelActive,
              ]}
            >
              {step}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const THUMB_SIZE = 24;

const sliderStyles = StyleSheet.create({
  container: {
    paddingTop: 8,
    paddingBottom: 4,
  },

  trackWrap: {
    height: THUMB_SIZE + 16,
    justifyContent: 'center',
    position: 'relative',
    // Extend touch beyond the visual track
    marginHorizontal: THUMB_SIZE / 2,
    cursor: 'pointer' as any,
  },

  trackBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#DDE1EF',
  },

  trackFill: {
    position: 'absolute',
    left: 0,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },

  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: Colors.primary,
    marginLeft: -(THUMB_SIZE / 2),
    // Thumb shadow
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
      default: {},
    }),
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0px 4px 12px rgba(11,44,116,0.32)' } as any)
      : {}),
  },

  labelsRow: {
    flexDirection: 'row',
    marginTop: 10,
  },

  labelWrap: {
    flex: 1,
    alignItems: 'center',
  },

  stepLabel: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Colors.textMuted,
  },

  stepLabelActive: {
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
  },
});

// ─── Screen ──────────────────────────────────────────────────────────────────

/**
 * GoalsScreen — Screen 03
 *
 * Collects: target CAT year · target percentile
 * Navigation: back arrow → profile · Continue → next screen (placeholder)
 */
export default function GoalsScreen() {
  const { width } = useWindowDimensions();
  const logoSize = Math.min(width * 0.52, 210);

  const { targetYear, percentile, setTargetYear, setPercentile } = useAppStore();
  const [selectedYear, setSelectedYear] = useState<string>(targetYear);
  const [percentileIndex, setPercentileIndex] = useState(() => {
    const idx = PERCENTILE_STEPS.indexOf(percentile);
    return idx >= 0 ? idx : DEFAULT_PERCENTILE_INDEX;
  });

  const handleContinue = useCallback(() => {
    setTargetYear(selectedYear);
    setPercentile(PERCENTILE_STEPS[percentileIndex]);
    router.push('/onboarding/colleges');
  }, [selectedYear, percentileIndex, setTargetYear, setPercentile]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* ─── Back Arrow ─────────────────────────────────────── */}
      <View style={styles.topBar}>
        <Pressable
          onPress={handleBack}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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

        {/* ─── Heading ─────────────────────────────────────────── */}
        <View style={styles.headingSection}>
          <Text style={styles.heading}>What's your CAT goal?</Text>
          <Text style={styles.subheading}>
            Let's understand your target and timeline.
          </Text>
        </View>

        {/* ─── When are you planning to appear? ────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            When are you planning to appear?
          </Text>

          <View style={styles.yearGrid}>
            {YEAR_OPTIONS.map((opt) => (
              <YearCard
                key={opt.id}
                label={opt.label}
                icon={opt.icon}
                selected={selectedYear === opt.id}
                onPress={() => setSelectedYear(opt.id)}
              />
            ))}
          </View>
        </View>

        {/* ─── Divider ─────────────────────────────────────────── */}
        <View style={styles.divider} />

        {/* ─── Target Percentile ───────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Target Percentile</Text>
          <Text style={styles.sectionSub}>
            Select your target CAT percentile.
          </Text>

          <StepSlider
            steps={PERCENTILE_STEPS}
            selectedIndex={percentileIndex}
            onChangeIndex={setPercentileIndex}
          />
        </View>

        {/* Bottom spacer so content clears the pinned CTA */}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ─── Pinned CTA ─────────────────────────────────────── */}
      <View style={styles.ctaSection}>
        <PrimaryButton
          testID="goals-continue-btn"
          label="Continue"
          showArrow
          onPress={handleContinue}
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

  // ── Top bar ───────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 4,
    paddingLeft: 12,
    height: 52,
  },

  // ── Back button ───────────────────────────────────────────
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },

  backArrow: {
    fontSize: 22,
    color: Colors.primary,
    fontFamily: FontFamily.regular,
    lineHeight: 24,
  },

  // ── Scroll content ────────────────────────────────────────
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

  // ── Heading ───────────────────────────────────────────────
  headingSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 28,
    gap: 6,
  },

  heading: {
    fontSize: Typography.fontSize.xl,
    fontFamily: FontFamily.bold,
    color: Colors.textDark,
    textAlign: 'center',
    letterSpacing: -0.3,
  },

  subheading: {
    fontSize: Typography.fontSize.md,
    fontFamily: FontFamily.regular,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Sections ──────────────────────────────────────────────
  section: {
    marginBottom: 8,
  },

  sectionLabel: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
    marginBottom: 14,
  },

  sectionSub: {
    fontSize: Typography.fontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textMuted,
    marginTop: -8,
    marginBottom: 20,
  },

  // ── Year option grid ──────────────────────────────────────
  yearGrid: {
    flexDirection: 'row',
    gap: 10,
  },

  // ── Divider ───────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 24,
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
