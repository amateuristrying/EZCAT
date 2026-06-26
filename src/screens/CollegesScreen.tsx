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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { PrimaryButton } from '../components/PrimaryButton';
import { Colors } from '../constants/colors';
import { FontFamily, Typography } from '../constants/typography';

// ─── Constants & Metadata ───────────────────────────────────────────────────

interface College {
  id: string;
  part1: string;
  part2: string;
}

const COLLEGES: College[] = [
  { id: 'iim_ahmedabad', part1: 'IIM', part2: 'Ahmedabad' },
  { id: 'iim_bangalore', part1: 'IIM', part2: 'Bangalore' },
  { id: 'iim_calcutta', part1: 'IIM', part2: 'Calcutta' },
  { id: 'iim_lucknow', part1: 'IIM', part2: 'Lucknow' },
  { id: 'iim_kozhikode', part1: 'IIM', part2: 'Kozhikode' },
  { id: 'iim_indore', part1: 'IIM', part2: 'Indore' },
  { id: 'fms_delhi', part1: 'FMS', part2: 'Delhi' },
  { id: 'spjimr_mumbai', part1: 'SPJIMR', part2: 'Mumbai' },
  { id: 'xlri_jamshedpur', part1: 'XLRI', part2: 'Jamshedpur' },
  { id: 'mdi_gurgaon', part1: 'MDI', part2: 'Gurgaon' },
  { id: 'jbims_mumbai', part1: 'JBIMS', part2: 'Mumbai' },
  { id: 'isb_hyderabad', part1: 'ISB', part2: 'Hyderabad' },
];

const COLLEGE_METADATA: Record<string, { initials: string; color: string }> = {
  iim_ahmedabad: { initials: 'A', color: '#0B2C74' },
  iim_bangalore: { initials: 'B', color: '#0D7F3B' },
  iim_calcutta: { initials: 'C', color: '#8B261D' },
  iim_lucknow: { initials: 'L', color: '#1E5A34' },
  iim_kozhikode: { initials: 'K', color: '#0D47A1' },
  iim_indore: { initials: 'I', color: '#4A148C' },
  fms_delhi: { initials: 'FMS', color: '#B71C1C' },
  spjimr_mumbai: { initials: 'SPJ', color: '#E65100' },
  xlri_jamshedpur: { initials: 'XLR', color: '#0D3C61' },
  mdi_gurgaon: { initials: 'MDI', color: '#006064' },
  jbims_mumbai: { initials: 'JBI', color: '#212121' },
  isb_hyderabad: { initials: 'ISB', color: '#01579B' },
};

// ─── College Logo Placeholder ───────────────────────────────────────────────

function CollegeLogo({ id }: { id: string }) {
  const meta = COLLEGE_METADATA[id] || { initials: '?', color: '#0B2C74' };
  const fontSize = meta.initials.length > 1 ? 8 : 12;

  return (
    <View style={[logoStyles.container, { borderColor: meta.color }]}>
      <View style={[logoStyles.inner, { backgroundColor: meta.color + '15' }]}>
        <Text style={[logoStyles.text, { color: meta.color, fontSize }]} numberOfLines={1}>
          {meta.initials}
        </Text>
      </View>
    </View>
  );
}

const logoStyles = StyleSheet.create({
  container: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    padding: 1.5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: FontFamily.bold,
    textAlign: 'center',
  },
});

// ─── Search Icon Component ──────────────────────────────────────────────────

function SearchIcon() {
  return (
    <View style={styles.searchIconContainer}>
      <View style={styles.searchCircle} />
      <View style={styles.searchHandle} />
    </View>
  );
}

// ─── Main Screen Component ──────────────────────────────────────────────────

export default function CollegesScreen() {
  const { width } = useWindowDimensions();
  const logoSize = Math.min(width * 0.52, 210);

  const [selectedColleges, setSelectedColleges] = useState<string[]>(['iim_ahmedabad']);
  const [searchQuery, setSearchQuery] = useState('');

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleContinue = useCallback(() => {
    // Navigate to next onboarding step or complete onboarding flow
    console.log('Selected colleges:', selectedColleges);
  }, [selectedColleges]);

  const toggleCollege = useCallback((id: string) => {
    setSelectedColleges((prev) => {
      if (prev.includes(id)) {
        return prev.filter((c) => c !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  // Filter colleges based on search query
  const filteredColleges = COLLEGES.filter((college) => {
    const fullName = `${college.part1} ${college.part2}`.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    return fullName.includes(query);
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* ─── Back Arrow ──────────────────────────────────────── */}
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
        {/* ─── Logo ────────────────────────────────────────────── */}
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
          <Text style={styles.heading}>Which colleges are you aiming for?</Text>
          <Text style={styles.subheading}>
            Select all that apply. We'll tailor your journey to your goals.
          </Text>
        </View>

        {/* ─── Search Bar ──────────────────────────────────────── */}
        <View style={styles.searchBarContainer}>
          <SearchIcon />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search colleges"
            placeholderTextColor={Colors.placeholder}
            accessibilityLabel="Search colleges input"
          />
        </View>

        {/* ─── College Grid ────────────────────────────────────── */}
        <View style={styles.grid}>
          {filteredColleges.map((college) => {
            const isSelected = selectedColleges.includes(college.id);
            return (
              <Pressable
                key={college.id}
                onPress={() => toggleCollege(college.id)}
                style={({ pressed }) => [
                  styles.card,
                  isSelected && styles.cardSelected,
                  {
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={`${college.part1} ${college.part2}`}
              >
                {/* Checkbox Indicator top-right */}
                <View
                  style={[
                    styles.checkboxIndicator,
                    isSelected && styles.checkboxIndicatorSelected,
                  ]}
                >
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </View>

                {/* Logo left */}
                <View style={styles.cardLogoWrap}>
                  <CollegeLogo id={college.id} />
                </View>

                {/* College Info right */}
                <View style={styles.cardTextWrap}>
                  <Text
                    style={[
                      styles.collegePart1,
                      isSelected && styles.collegeTextSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {college.part1}
                  </Text>
                  <Text
                    style={[
                      styles.collegePart2,
                      isSelected && styles.collegeTextSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {college.part2}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* ─── "My college isn't listed" Card ──────────────────── */}
        <Pressable
          style={({ pressed }) => [
            styles.notListedCard,
            pressed && styles.notListedCardPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="My college isn't listed here"
        >
          {/* Plus icon inside dashed circle */}
          <View style={styles.plusCircle}>
            <Text style={styles.plusIcon}>+</Text>
          </View>

          {/* Texts */}
          <View style={styles.notListedTextWrap}>
            <Text style={styles.notListedTitle}>My college isn't listed here</Text>
            <Text style={styles.notListedSubtitle}>Let us know the college name</Text>
          </View>

          {/* Chevron Right */}
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        {/* Bottom spacer so content clears the pinned CTA */}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ─── Pinned CTA ──────────────────────────────────────── */}
      <View style={styles.ctaSection}>
        <PrimaryButton
          testID="colleges-continue-btn"
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

  // ── Top Bar ───────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 4,
    paddingLeft: 12,
    height: 52,
  },

  // ── Back Button ───────────────────────────────────────────
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

  // ── Scroll Content ────────────────────────────────────────
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

  // ── Search Bar ────────────────────────────────────────────
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    marginBottom: 20,
    backgroundColor: Colors.background,
  },

  searchIconContainer: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  searchCircle: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    borderWidth: 1.8,
    borderColor: Colors.placeholder,
    position: 'absolute',
    top: 1,
    left: 1,
  },

  searchHandle: {
    width: 2,
    height: 6,
    backgroundColor: Colors.placeholder,
    position: 'absolute',
    bottom: 2,
    right: 2,
    transform: [{ rotate: '-45deg' }],
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: FontFamily.regular,
    color: Colors.textBody,
    padding: 0,
    margin: 0,
  },

  // ── College Grid ──────────────────────────────────────────
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 10,
  },

  card: {
    width: '31.3%',
    height: 72,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    position: 'relative',
    backgroundColor: Colors.background,
    ...Platform.select({
      ios: {
        shadowColor: '#0B2C74',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
      default: {},
    }),
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0px 2px 6px rgba(11,44,116,0.05)' } as any)
      : {}),
  },

  cardSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: '#F0F4FF',
  },

  checkboxIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  checkboxIndicatorSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  checkmark: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: FontFamily.bold,
    lineHeight: 11,
  },

  cardLogoWrap: {
    marginRight: 6,
    justifyContent: 'center',
  },

  cardTextWrap: {
    flex: 1,
    justifyContent: 'center',
  },

  collegePart1: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: Colors.textBody,
    lineHeight: 12,
  },

  collegePart2: {
    fontSize: 9,
    fontFamily: FontFamily.medium,
    color: Colors.textMuted,
    lineHeight: 11,
    marginTop: 1,
  },

  collegeTextSelected: {
    color: Colors.primary,
  },

  // ── "My College Isn't Listed" Card ────────────────────────
  notListedCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.background,
    marginTop: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#0B2C74',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
      default: {},
    }),
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0px 2px 6px rgba(11,44,116,0.05)' } as any)
      : {}),
  },

  notListedCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },

  plusCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.textMuted,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  plusIcon: {
    fontSize: 20,
    color: Colors.primary,
    fontFamily: FontFamily.medium,
    lineHeight: 22,
    marginTop: -1,
  },

  notListedTextWrap: {
    flex: 1,
    justifyContent: 'center',
  },

  notListedTitle: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
    lineHeight: 18,
  },

  notListedSubtitle: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Colors.textMuted,
    lineHeight: 16,
    marginTop: 2,
  },

  chevron: {
    fontSize: 22,
    color: Colors.textMuted,
    fontFamily: FontFamily.regular,
    marginLeft: 8,
  },

  // ── CTA Pinned Section ────────────────────────────────────
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
