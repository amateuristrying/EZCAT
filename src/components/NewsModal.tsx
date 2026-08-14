import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { Colors } from '../constants/colors';
import { FontFamily } from '../constants/typography';
import { IconBadge } from './AppUI';

export interface CATNewsItem {
  id: string;
  title: string;
  category: 'Circular' | 'Pattern' | 'Dates' | 'Admissions';
  date: string;
  badge?: string;
  badgeType?: 'urgent' | 'info' | 'success';
  summary: string;
  details: string;
  source: string;
  url?: string;
}

const CAT_NEWS_ITEMS: CATNewsItem[] = [
  {
    id: 'news-1',
    title: 'CAT 2026 Official Notification & Information Bulletin Released',
    category: 'Circular',
    date: 'Aug 14, 2026',
    badge: 'OFFICIAL',
    badgeType: 'urgent',
    summary: 'IIM Kozhikode releases the official CAT 2026 media release, candidate registration timeline, and participating institute matrix.',
    details: 'The Common Admission Test 2026 will be conducted across 170 test cities in 3 discrete test sessions. The registration portal will remain active from August 1, 2026 until September 20, 2026 (5:00 PM IST). Test duration is confirmed at 120 minutes with 40-minute sectional countdowns.',
    source: 'iimcat.ac.in',
    url: 'https://iimcat.ac.in',
  },
  {
    id: 'news-2',
    title: 'Exam Pattern & Marking Scheme Confirmed: +3 / -1 Rule',
    category: 'Pattern',
    date: 'Aug 08, 2026',
    badge: 'EXAM SPECS',
    badgeType: 'info',
    summary: 'Sectional time limit of 40 minutes strictly enforced with 66 total questions across VARC, DILR, and QA.',
    details: 'Multiple Choice Questions (MCQs) carry +3 marks for correct responses and -1 mark penalty for incorrect attempts. Non-MCQ / Type In The Answer (TITA) questions carry +3 marks with zero negative marking. On-screen basic virtual calculator will be accessible throughout the exam.',
    source: 'CAT Convening Committee',
    url: 'https://iimcat.ac.in',
  },
  {
    id: 'news-3',
    title: 'Admit Card Download Window & Test City Allocation',
    category: 'Dates',
    date: 'Jul 28, 2026',
    badge: 'KEY DATES',
    badgeType: 'info',
    summary: 'Registered candidates can download official admit cards starting October 28, 2026 until exam day.',
    details: 'Test city preferences submitted during registration will be allotted strictly based on candidate preferences and test center capacity. Scribe guidelines and PwD candidate accommodation documents have also been updated on the official portal.',
    source: 'Admissions Secretariat',
    url: 'https://iimcat.ac.in',
  },
  {
    id: 'news-4',
    title: '115+ Non-IIM Member B-Schools Join CAT 2026 Score Sharing',
    category: 'Admissions',
    date: 'Jul 15, 2026',
    badge: 'B-SCHOOLS',
    badgeType: 'success',
    summary: 'FMS Delhi, SPJIMR Mumbai, MDI Gurgaon, and IIT Management Departments confirm CAT 2026 score acceptance.',
    details: 'Over 115 premier non-IIM management institutions across India have officially registered with the CAT 2026 score-sharing agreement. Candidates are advised to check individual B-school application deadlines as they maintain independent admission schedules.',
    source: 'Ministry of Education / IIM Matrix',
    url: 'https://iimcat.ac.in',
  },
  {
    id: 'news-5',
    title: 'Official Mock Practice Test Interface Launch Announcement',
    category: 'Pattern',
    date: 'Jul 02, 2026',
    badge: 'PRACTICE',
    badgeType: 'info',
    summary: 'Official navigation simulator and sample paper interface to go live in the first week of November.',
    details: 'Candidates can familiarize themselves with screen layouts, question palette status flags (Answered, Not Answered, Marked for Review), and keyboard controls for TITA numeric inputs.',
    source: 'Technical Committee',
    url: 'https://iimcat.ac.in',
  },
];

const CATEGORIES = ['All', 'Circular', 'Pattern', 'Dates', 'Admissions'] as const;

interface NewsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function NewsModal({ visible, onClose }: NewsModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedId, setExpandedId] = useState<string | null>('news-1');

  const filteredNews = CAT_NEWS_ITEMS.filter((item) => {
    if (selectedCategory === 'All') return true;
    return item.category === selectedCategory;
  });

  const handleOpenLink = async (url?: string) => {
    const targetUrl = url || 'https://iimcat.ac.in';
    try {
      const supported = await Linking.canOpenURL(targetUrl);
      if (supported) {
        await Linking.openURL(targetUrl);
      }
    } catch (e) {
      console.warn('Could not open external url:', targetUrl);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Circular':
        return '📜';
      case 'Pattern':
        return '📐';
      case 'Dates':
        return '📅';
      case 'Admissions':
        return '🏛️';
      default:
        return '📰';
    }
  };

  const getBadgeStyle = (badgeType?: string) => {
    switch (badgeType) {
      case 'urgent':
        return { bg: '#FEF2F2', text: Colors.danger, border: '#FECACA' };
      case 'success':
        return { bg: '#ECFDF5', text: Colors.dilr, border: '#A7F3D0' };
      default:
        return { bg: '#EFF6FF', text: Colors.accentBlue, border: '#BFDBFE' };
    }
  };

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

        <View style={styles.modalSheet}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <IconBadge bg={Colors.varcBg} size={42} radius={14}>
                <Text style={{ fontSize: 20 }}>📰</Text>
              </IconBadge>
              <View>
                <Text style={styles.title}>CAT Official News</Text>
                <Text style={styles.subtitle}>Verified updates from convening IIM authorities</Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close">
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {/* Category Filter Chips */}
          <View style={styles.categoriesBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* News Feed List */}
          <ScrollView contentContainerStyle={styles.feedContent} showsVerticalScrollIndicator={false}>
            {filteredNews.map((item) => {
              const isExpanded = expandedId === item.id;
              const badgeStyle = getBadgeStyle(item.badgeType);

              return (
                <View key={item.id} style={styles.newsCard}>
                  <Pressable
                    style={styles.newsCardHeader}
                    onPress={() => setExpandedId(isExpanded ? null : item.id)}
                  >
                    <View style={styles.newsMetaRow}>
                      <View style={styles.categoryBadge}>
                        <Text style={{ fontSize: 11 }}>{getCategoryIcon(item.category)}</Text>
                        <Text style={styles.categoryBadgeText}>{item.category}</Text>
                      </View>
                      <Text style={styles.newsDate}>{item.date}</Text>
                      {item.badge && (
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: badgeStyle.bg, borderColor: badgeStyle.border },
                          ]}
                        >
                          <Text style={[styles.statusBadgeText, { color: badgeStyle.text }]}>
                            {item.badge}
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.newsTitle}>{item.title}</Text>
                    <Text style={styles.newsSummary}>{item.summary}</Text>
                  </Pressable>

                  {/* Expandable Detailed Announcement */}
                  {isExpanded && (
                    <View style={styles.expandedSection}>
                      <View style={styles.detailsDivider} />
                      <Text style={styles.newsDetails}>{item.details}</Text>

                      <View style={styles.cardFooterRow}>
                        <Text style={styles.sourceText}>
                          Source: <Text style={styles.sourceHighlight}>{item.source}</Text>
                        </Text>

                        <Pressable
                          style={styles.openLinkBtn}
                          onPress={() => handleOpenLink(item.url)}
                          accessibilityRole="link"
                          accessibilityLabel="Open official circular"
                        >
                          <Text style={styles.openLinkText}>Official Portal ↗</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}

            <View style={styles.disclaimerBox}>
              <Text style={styles.disclaimerText}>
                ⚠️ Press releases and bulletins are aggregated from the official IIM CAT portal (iimcat.ac.in). Candidates must verify all final dates from the convening body.
              </Text>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
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
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: 480,
    paddingTop: 12,
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
  title: {
    fontSize: 18,
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
  categoriesBar: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: '#FAFAFD',
  },
  categoriesScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: Colors.textBody,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
  feedContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 14,
  },
  newsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#0B2C74',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  newsCardHeader: {
    padding: 16,
  },
  newsMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontFamily: FontFamily.semiBold,
    color: Colors.textBody,
  },
  newsDate: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: Colors.textMuted,
  },
  statusBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
  },
  newsTitle: {
    fontSize: 14.5,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
    lineHeight: 20,
    marginBottom: 6,
  },
  newsSummary: {
    fontSize: 12.5,
    fontFamily: FontFamily.regular,
    color: Colors.textBody,
    lineHeight: 18,
  },
  expandedSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#F8FAFC',
  },
  detailsDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 12,
  },
  newsDetails: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: Colors.textBody,
    lineHeight: 19,
    marginBottom: 12,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  sourceText: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: Colors.textMuted,
  },
  sourceHighlight: {
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
  },
  openLinkBtn: {
    backgroundColor: Colors.varcBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  openLinkText: {
    fontSize: 11.5,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  disclaimerBox: {
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginTop: 6,
  },
  disclaimerText: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#92400E',
    lineHeight: 16,
  },
});
