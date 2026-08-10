import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
} from 'react-native';
import { Colors } from '../constants/colors';
import { FontFamily } from '../constants/typography';

const REPORT_CATEGORIES = [
  'Typo / Math Error',
  'Incorrect Key',
  'Unclear Solution',
  'Formatting Issue',
];

interface ReportModalProps {
  visible: boolean;
  questionId?: string;
  onClose: () => void;
  onSubmit: (category: string, details: string) => void;
}

export function ReportModal({
  visible,
  questionId,
  onClose,
  onSubmit,
}: ReportModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(REPORT_CATEGORIES[0]);
  const [details, setDetails] = useState<string>('');

  const handleSubmit = () => {
    onSubmit(selectedCategory, details);
    setDetails('');
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.icon}>⚠️</Text>
              <Text style={styles.title}>Report Question Issue</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close modal">
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {questionId && (
              <Text style={styles.subtext}>
                Question ID: <Text style={styles.qIdHighlight}>{questionId}</Text>
              </Text>
            )}

            <Text style={styles.label}>Select Issue Category</Text>
            <View style={styles.chipGrid}>
              {REPORT_CATEGORIES.map((category) => {
                const isSelected = selectedCategory === category;
                return (
                  <Pressable
                    key={category}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {category}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>Additional Details (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={details}
              onChangeText={setDetails}
              placeholder="Describe the issue in detail (e.g. step 2 calculation error)..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.actionRow}>
              <Pressable style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.submitBtn} onPress={handleSubmit}>
                <Text style={styles.submitBtnText}>Submit Report</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 15, 23, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 18,
  },
  title: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.track,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: FontFamily.bold,
  },
  content: {
    gap: 14,
  },
  subtext: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  qIdHighlight: {
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  label: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: Colors.textBody,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: Colors.textBody,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
  textInput: {
    borderWidth: 1.2,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: Colors.textBody,
    backgroundColor: '#FAFAFD',
    minHeight: 90,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: Colors.textSecondary,
  },
  submitBtn: {
    flex: 1.5,
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
});
