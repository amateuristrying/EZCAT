import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { PrimaryButton } from '../components/PrimaryButton';
import { Colors } from '../constants/colors';
import { FontFamily, Typography } from '../constants/typography';
import { useAppStore } from '../store/AppStore';

// ─── Constants ───────────────────────────────────────────────────────────────

/** CAT sections shown as rating cards */
const SECTIONS = [
  { id: 'varc', label: 'VARC' },
  { id: 'dilr', label: 'DILR' },
  { id: 'qa', label: 'QA' },
] as const;

/** Skill level options per section */
const LEVELS = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];
type LevelId = (typeof LEVELS)[number]['id'];

// ─── Bar Chart Icon ──────────────────────────────────────────────────────────

/** Small three-bar chart glyph used inside each level option. */
function BarChartIcon({ color }: { color: string }) {
  return (
    <View style={barStyles.wrap}>
      <View style={[barStyles.bar, { height: 5, backgroundColor: color }]} />
      <View style={[barStyles.bar, { height: 8, backgroundColor: color }]} />
      <View style={[barStyles.bar, { height: 11, backgroundColor: color }]} />
    </View>
  );
}

const barStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 11,
    gap: 1.5,
    marginRight: 5,
  },
  bar: {
    width: 2.5,
    borderRadius: 1,
  },
});

// ─── Info Icon ───────────────────────────────────────────────────────────────

/** Thin circle enclosing a lowercase "i". */
function InfoIcon() {
  return (
    <View style={infoStyles.circle}>
      <Text style={infoStyles.text}>i</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  circle: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    borderWidth: 1,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 9,
    lineHeight: 11,
    fontFamily: FontFamily.semiBold,
    color: Colors.textMuted,
  },
});

// ─── Section Rating Card ─────────────────────────────────────────────────────

interface SectionCardProps {
  label: string;
  selected: LevelId | null;
  onSelect: (level: LevelId) => void;
}

function SectionCard({ label, selected, onSelect }: SectionCardProps) {
  return (
    <View style={cardStyles.card}>
      {/* Header: section name + info icon */}
      <View style={cardStyles.header}>
        <Text style={cardStyles.title}>{label}</Text>
        <InfoIcon />
      </View>

      {/* Segmented level control */}
      <View style={cardStyles.segment}>
        {LEVELS.map((level, i) => {
          const isSelected = selected === level.id;
          return (
            <Pressable
              key={level.id}
              onPress={() => onSelect(level.id)}
              style={({ pressed }) => [
                cardStyles.cell,
                i > 0 && cardStyles.cellDivider,
                isSelected && cardStyles.cellSelected,
                pressed && !isSelected && cardStyles.cellPressed,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${label} ${level.label}`}
            >
              <BarChartIcon color={isSelected ? Colors.primary : Colors.textMuted} />
              <Text
                style={[
                  cardStyles.cellLabel,
                  isSelected && cardStyles.cellLabelSelected,
                ]}
                numberOfLines={1}
              >
                {level.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#0B2C74',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
      default: {},
    }),
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0px 2px 8px rgba(11,44,116,0.05)' } as any)
      : {}),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  title: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
    letterSpacing: 0.2,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: Colors.border,
    overflow: 'hidden',
    backgroundColor: Colors.background,
  },
  cell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  cellDivider: {
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
  },
  cellSelected: {
    backgroundColor: '#F0F4FF',
  },
  cellPressed: {
    backgroundColor: '#F7F8FC',
  },
  cellLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: Colors.textMuted,
  },
  cellLabelSelected: {
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
  },
});

// ─── Screen ──────────────────────────────────────────────────────────────────

/**
 * LevelScreen — Screen 05
 *
 * Collects: self-rated skill level for VARC · DILR · QA.
 * Navigation: back arrow → colleges · Continue → ready.
 */
export default function LevelScreen() {
  const { width } = useWindowDimensions();
  const logoSize = Math.min(width * 0.52, 210);

  const { levels: storedLevels, setLevel } = useAppStore();
  const [levels, setLevels] = useState<Record<SectionId, LevelId | null>>(storedLevels);

  const handleSelect = useCallback((section: SectionId, level: LevelId) => {
    setLevels((prev) => ({ ...prev, [section]: level }));
  }, []);

  const handleContinue = useCallback(() => {
    (Object.keys(levels) as SectionId[]).forEach((section) => {
      const level = levels[section];
      if (level) setLevel(section, level);
    });
    router.push('/onboarding/ready');
  }, [levels, setLevel]);

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
          <Text style={styles.heading}>
            How would you rate your current level in each section?
          </Text>
          <Text style={styles.subheading}>
            This helps us personalize your practice.
          </Text>
        </View>

        {/* ─── Section Cards ───────────────────────────────────── */}
        <View style={styles.cards}>
          {SECTIONS.map((section) => (
            <SectionCard
              key={section.id}
              label={section.label}
              selected={levels[section.id]}
              onSelect={(level) => handleSelect(section.id, level)}
            />
          ))}
        </View>

        {/* Bottom spacer so content clears the pinned CTA */}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ─── Pinned CTA ─────────────────────────────────────── */}
      <View style={styles.ctaSection}>
        <PrimaryButton
          testID="level-continue-btn"
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
    lineHeight: 30,
  },

  subheading: {
    fontSize: Typography.fontSize.md,
    fontFamily: FontFamily.regular,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Section cards ─────────────────────────────────────────
  cards: {
    gap: 16,
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
