import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Modal,
  FlatList,
  Pressable,
  TextInput,
  Platform,
  useWindowDimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { PrimaryButton } from '../components/PrimaryButton';
import { FormInputCard } from '../components/FormInputCard';
import { Colors } from '../constants/colors';
import { FontFamily, Typography } from '../constants/typography';
import { useAppStore } from '../store/AppStore';

// ─── Graduation year options ───────────────────────────────────────────────
const CURRENT_YEAR = new Date().getFullYear();
const GRAD_YEARS = Array.from({ length: 12 }, (_, i) =>
  String(CURRENT_YEAR - 6 + i),
).reverse();



// ─── Dropdown Modal ────────────────────────────────────────────────────────
interface DropdownModalProps {
  visible: boolean;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
  title: string;
}

function DropdownModal({
  visible,
  options,
  selected,
  onSelect,
  onClose,
  title,
}: DropdownModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={dropStyles.backdrop} onPress={onClose} />
      <View style={dropStyles.sheet}>
        {/* Handle bar */}
        <View style={dropStyles.handle} />
        <Text style={dropStyles.title}>{title}</Text>

        <FlatList
          data={options}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Pressable
              style={[
                dropStyles.option,
                item === selected && dropStyles.optionSelected,
              ]}
              onPress={() => {
                onSelect(item);
                onClose();
              }}
            >
              <Text
                style={[
                  dropStyles.optionText,
                  item === selected && dropStyles.optionTextSelected,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          )}
          style={dropStyles.list}
        />
      </View>
    </Modal>
  );
}

const dropStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: Typography.fontSize.md,
    fontFamily: FontFamily.semiBold,
    color: Colors.textDark,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  list: { paddingHorizontal: 16 },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  optionSelected: {
    backgroundColor: '#EFF2FA',
  },
  optionText: {
    fontSize: Typography.fontSize.md,
    fontFamily: FontFamily.regular,
    color: Colors.textBody,
  },
  optionTextSelected: {
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
  },
});

// ─── Main Screen ───────────────────────────────────────────────────────────
/**
 * ProfileScreen — Screen 02
 *
 * Collects: Name · Age · Graduation Year
 * Navigation: Continue → next onboarding screen (placeholder)
 */
export default function ProfileScreen() {
  const { width } = useWindowDimensions();
  const logoSize = Math.min(width * 0.52, 210);

  const { profile, setProfile } = useAppStore();
  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(profile.age);
  const [gradYear, setGradYear] = useState(profile.gradYear);
  const [gradPickerOpen, setGradPickerOpen] = useState(false);

  const ageInputRef = useRef<TextInput>(null);

  const handleContinue = useCallback(() => {
    setProfile({ name, age, gradYear });
    router.push('/onboarding/goals');
  }, [name, age, gradYear, setProfile]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
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

          {/* ─── Heading ─────────────────────────────────────────── */}
          <View style={styles.headingSection}>
            <Text style={styles.heading}>Tell us about yourself</Text>
            <Text style={styles.subheading}>
              Let's personalize your CAT prep journey.
            </Text>
          </View>

          {/* ─── Form Fields ─────────────────────────────────────── */}
          <View style={styles.formSection}>
            {/* Name */}
            <FormInputCard
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => ageInputRef.current?.focus()}
            />

            {/* Age */}
            <FormInputCard
              ref={ageInputRef}
              label="Age"
              value={age}
              onChangeText={(t) => setAge(t.replace(/[^0-9]/g, ''))}
              placeholder="Enter your age"
              keyboardType="number-pad"
              returnKeyType="done"
              maxLength={2}
            />

            {/* Graduation Year — dropdown */}
            <FormInputCard
              label="Graduation Year"
              value={gradYear}
              placeholder="Enter your graduation year"
              isDropdown
              onDropdownPress={() => setGradPickerOpen(true)}
              editable={false}
            />
          </View>
        </ScrollView>

        {/* ─── CTA Section — pinned to bottom ──────────────────── */}
        <View style={styles.ctaSection}>
          <PrimaryButton
            testID="profile-continue-btn"
            label="Continue"
            showArrow
            onPress={handleContinue}
            style={styles.ctaButton}
          />
          <Text style={styles.footer}>Developed by 99VCA</Text>
        </View>
      </KeyboardAvoidingView>

      {/* Graduation Year picker sheet */}
      <DropdownModal
        visible={gradPickerOpen}
        options={GRAD_YEARS}
        selected={gradYear}
        onSelect={setGradYear}
        onClose={() => setGradPickerOpen(false)}
        title="Select Graduation Year"
      />
    </SafeAreaView>
  );
}

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

  // ── Form ──────────────────────────────────────────────────
  formSection: {
    gap: 14,
    marginBottom: 32,
  },

  // ── CTA + Footer ──────────────────────────────────────────
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
