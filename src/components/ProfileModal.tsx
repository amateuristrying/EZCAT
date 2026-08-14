import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Colors } from '../constants/colors';
import { FontFamily } from '../constants/typography';
import {
  YEAR_OPTIONS,
  PERCENTILE_STEPS,
  COLLEGES,
  COLLEGE_METADATA,
} from '../constants/data';
import { useAppStore } from '../store/AppStore';

// ─── College Logo Component ──────────────────────────────────────────────────

function CollegeLogoMini({ id }: { id: string }) {
  const meta = COLLEGE_METADATA[id] || { initials: '?', color: '#0B2C74' };
  const fontSize = meta.initials.length > 2 ? 7 : 8;

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
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    padding: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    width: '100%',
    height: '100%',
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: FontFamily.bold,
    textAlign: 'center',
  },
});

// ─── Modal Props ─────────────────────────────────────────────────────────────

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ProfileModal({ visible, onClose }: ProfileModalProps) {
  const {
    profile,
    targetYear,
    percentile,
    colleges,
    updateProfileAndGoals,
    addCustomCollege,
  } = useAppStore();

  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(profile.age);
  const [gradYear, setGradYear] = useState(profile.gradYear);
  const [selectedYear, setSelectedYear] = useState(targetYear);
  const [selectedPercentile, setSelectedPercentile] = useState(percentile);
  const [selectedColleges, setSelectedColleges] = useState<string[]>(colleges);

  const [searchQuery, setSearchQuery] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomBox, setShowCustomBox] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Sync state whenever modal is opened
  useEffect(() => {
    if (visible) {
      setName(profile.name);
      setAge(profile.age);
      setGradYear(profile.gradYear);
      setSelectedYear(targetYear);
      setSelectedPercentile(percentile);
      setSelectedColleges(colleges);
      setShowCustomBox(false);
      setCustomName('');
      setSearchQuery('');
      setToastMsg(null);
    }
  }, [visible, profile, targetYear, percentile, colleges]);

  const toggleCollege = useCallback((id: string) => {
    setSelectedColleges((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) {
          setToastMsg('Please keep at least one target college');
          setTimeout(() => setToastMsg(null), 2500);
          return prev;
        }
        return prev.filter((c) => c !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  const handleAddCustom = async () => {
    if (!customName.trim()) return;
    const added = await addCustomCollege(customName.trim());
    setSelectedColleges((prev) => (prev.includes(added.id) ? prev : [...prev, added.id]));
    setCustomName('');
    setShowCustomBox(false);
    setToastMsg(`Added ${added.part1} to target colleges`);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleSave = async () => {
    const trimmedName = name.trim() || 'Aspirant';
    await updateProfileAndGoals({
      profile: {
        name: trimmedName,
        age: age.trim(),
        gradYear: gradYear.trim(),
      },
      targetYear: selectedYear,
      percentile: selectedPercentile,
      colleges: selectedColleges,
    });
    onClose();
  };

  const filteredColleges = COLLEGES.filter((c) => {
    const fullName = `${c.part1} ${c.part2}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase().trim());
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close modal" />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <View style={styles.modalSheet}>
            {/* Handle bar */}
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <View style={styles.avatarMini}>
                  <Text style={styles.avatarText}>
                    {name.trim().length > 0 ? name.trim()[0].toUpperCase() : '👤'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.title}>My Profile & Goals</Text>
                  <Text style={styles.subtitle}>Customize your target exam and B-schools</Text>
                </View>
              </View>
              <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close">
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>

            {/* Toast feedback */}
            {toastMsg && (
              <View style={styles.toastBanner}>
                <Text style={styles.toastText}>{toastMsg}</Text>
              </View>
            )}

            {/* Scrollable Form Content */}
            <ScrollView
              contentContainerStyle={styles.scrollBody}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* ── 1. Personal Info ───────────────────────────── */}
              <Text style={styles.sectionHeading}>Personal Information</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor={Colors.placeholder}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.col]}>
                  <Text style={styles.inputLabel}>Age</Text>
                  <TextInput
                    style={styles.textInput}
                    value={age}
                    onChangeText={(t) => setAge(t.replace(/[^0-9]/g, ''))}
                    placeholder="e.g. 21"
                    placeholderTextColor={Colors.placeholder}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>

                <View style={[styles.inputGroup, styles.col]}>
                  <Text style={styles.inputLabel}>Graduation Year</Text>
                  <TextInput
                    style={styles.textInput}
                    value={gradYear}
                    onChangeText={(t) => setGradYear(t.replace(/[^0-9]/g, ''))}
                    placeholder="e.g. 2026"
                    placeholderTextColor={Colors.placeholder}
                    keyboardType="number-pad"
                    maxLength={4}
                  />
                </View>
              </View>

              <View style={styles.divider} />

              {/* ── 2. Target CAT Year ─────────────────────────── */}
              <Text style={styles.sectionHeading}>Target CAT Exam Year</Text>
              <Text style={styles.sectionSub}>Select the exam cycle you are targeting.</Text>
              <View style={styles.yearGrid}>
                {YEAR_OPTIONS.map((opt) => {
                  const isSelected = selectedYear === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      style={[
                        styles.yearCard,
                        isSelected && styles.yearCardSelected,
                      ]}
                      onPress={() => setSelectedYear(opt.id)}
                    >
                      <Text style={styles.yearIcon}>{opt.icon}</Text>
                      <Text style={[styles.yearLabel, isSelected && styles.yearLabelSelected]}>
                        {opt.label.replace('\n', ' ')}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.divider} />

              {/* ── 3. Target Percentile ───────────────────────── */}
              <View style={styles.percentileHeaderRow}>
                <Text style={styles.sectionHeading}>Target Percentile Goal</Text>
                <View style={styles.percentileBadge}>
                  <Text style={styles.percentileBadgeText}>{selectedPercentile} %ile</Text>
                </View>
              </View>
              <Text style={styles.sectionSub}>Select your desired CAT percentile milestone.</Text>

              <View style={styles.percentileGrid}>
                {PERCENTILE_STEPS.map((p) => {
                  const isSelected = selectedPercentile === p;
                  return (
                    <Pressable
                      key={p}
                      style={[
                        styles.percentileChip,
                        isSelected && styles.percentileChipSelected,
                      ]}
                      onPress={() => setSelectedPercentile(p)}
                    >
                      <Text
                        style={[
                          styles.percentileChipText,
                          isSelected && styles.percentileChipTextSelected,
                        ]}
                      >
                        {p}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.divider} />

              {/* ── 4. Target B-Schools ────────────────────────── */}
              <View style={styles.collegesHeaderRow}>
                <Text style={styles.sectionHeading}>Target B-Schools</Text>
                <Text style={styles.collegeCountBadge}>{selectedColleges.length} Selected</Text>
              </View>
              <Text style={styles.sectionSub}>Tap to select or deselect your dream colleges.</Text>

              {/* College Search */}
              <View style={styles.searchBar}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search college (e.g. IIM, FMS, XLRI)..."
                  placeholderTextColor={Colors.placeholder}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')} style={styles.clearSearch}>
                    <Text style={styles.clearSearchText}>✕</Text>
                  </Pressable>
                )}
              </View>

              {/* College Chips Grid */}
              <View style={styles.collegesGrid}>
                {filteredColleges.map((c) => {
                  const isSelected = selectedColleges.includes(c.id);
                  return (
                    <Pressable
                      key={c.id}
                      style={[
                        styles.collegeChip,
                        isSelected && styles.collegeChipSelected,
                      ]}
                      onPress={() => toggleCollege(c.id)}
                    >
                      <CollegeLogoMini id={c.id} />
                      <Text
                        style={[
                          styles.collegeChipText,
                          isSelected && styles.collegeChipTextSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {c.part1} {c.part2}
                      </Text>
                      {isSelected && <Text style={styles.collegeCheck}>✓</Text>}
                    </Pressable>
                  );
                })}
              </View>

              {/* Add Custom College Trigger */}
              {!showCustomBox ? (
                <Pressable
                  style={styles.addCustomBtn}
                  onPress={() => setShowCustomBox(true)}
                >
                  <Text style={styles.addCustomPlus}>+</Text>
                  <Text style={styles.addCustomText}>Add college not listed here</Text>
                </Pressable>
              ) : (
                <View style={styles.customInputCard}>
                  <Text style={styles.customCardTitle}>Add Custom B-School</Text>
                  <TextInput
                    style={styles.textInput}
                    value={customName}
                    onChangeText={setCustomName}
                    placeholder="Enter institute name (e.g. IIT Kharagpur VGSOM)"
                    placeholderTextColor={Colors.placeholder}
                    autoFocus
                  />
                  <View style={styles.customActionRow}>
                    <Pressable
                      style={styles.customCancelBtn}
                      onPress={() => {
                        setShowCustomBox(false);
                        setCustomName('');
                      }}
                    >
                      <Text style={styles.customCancelText}>Cancel</Text>
                    </Pressable>
                    <Pressable style={styles.customSaveBtn} onPress={handleAddCustom}>
                      <Text style={styles.customSaveText}>Add B-School</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              <View style={{ height: 24 }} />
            </ScrollView>

            {/* Footer Action Buttons */}
            <View style={styles.footer}>
              <Pressable style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveText}>Save Changes</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 15, 23, 0.7)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  keyboardContainer: {
    width: '100%',
    maxHeight: '90%',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    maxHeight: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: { elevation: 20 },
      default: {},
    }),
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarMini: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.varcBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  title: {
    fontSize: 17,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.track,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: Colors.textSecondary,
  },
  toastBanner: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 10,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FontFamily.medium,
    textAlign: 'center',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionHeading: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    color: Colors.textBody,
    marginBottom: 6,
  },
  textInput: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: Colors.textBody,
    backgroundColor: '#FAFAFD',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 18,
  },
  yearGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  yearCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: Colors.border,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    gap: 4,
  },
  yearCardSelected: {
    borderColor: Colors.primary,
    borderWidth: 1.8,
    backgroundColor: '#F0F4FF',
  },
  yearIcon: {
    fontSize: 18,
  },
  yearLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: Colors.textBody,
  },
  yearLabelSelected: {
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  percentileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  percentileBadge: {
    backgroundColor: Colors.varcBg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  percentileBadgeText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  percentileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  percentileChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: Colors.border,
    backgroundColor: '#FAFAFD',
  },
  percentileChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  percentileChipText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: Colors.textBody,
  },
  percentileChipTextSelected: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
  collegesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collegeCountBadge: {
    fontSize: 11,
    fontFamily: FontFamily.semiBold,
    color: Colors.accentBlue,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    backgroundColor: '#FAFAFD',
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: Colors.textBody,
    padding: 0,
  },
  clearSearch: {
    padding: 4,
  },
  clearSearchText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  collegesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  collegeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
  },
  collegeChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#F0F4FF',
  },
  collegeChipText: {
    fontSize: 11.5,
    fontFamily: FontFamily.medium,
    color: Colors.textBody,
    maxWidth: 150,
  },
  collegeChipTextSelected: {
    color: Colors.primary,
    fontFamily: FontFamily.bold,
  },
  collegeCheck: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  addCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    backgroundColor: '#FAFAFD',
    justifyContent: 'center',
  },
  addCustomPlus: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  addCustomText: {
    fontSize: 12.5,
    fontFamily: FontFamily.medium,
    color: Colors.primary,
  },
  customInputCard: {
    backgroundColor: '#F5F7FC',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  customCardTitle: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  customActionRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  customCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  customCancelText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
  },
  customSaveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  customSaveText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: '#FFFFFF',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelText: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    color: Colors.textSecondary,
  },
  saveBtn: {
    flex: 1.8,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  saveText: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
});
