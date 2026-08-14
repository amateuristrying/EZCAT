import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { Colors } from '../constants/colors';
import { FontFamily } from '../constants/typography';
import { IconBadge } from './AppUI';
import { useAppStore } from '../store/AppStore';

export interface LeaderboardEntry {
  rank: number;
  name: string;
  avatarText: string;
  avatarBg: string;
  streak: number;
  totalSolved: number;
  accuracy: number;
  targetCollege: string;
  isUser?: boolean;
}

const COMMUNITY_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    name: 'Aarav Sharma',
    avatarText: 'AS',
    avatarBg: '#FEF3C7',
    streak: 64,
    totalSolved: 842,
    accuracy: 94,
    targetCollege: 'IIM Ahmedabad',
  },
  {
    rank: 2,
    name: 'Priya Iyer',
    avatarText: 'PI',
    avatarBg: '#E0E7FF',
    streak: 52,
    totalSolved: 710,
    accuracy: 91,
    targetCollege: 'IIM Bangalore',
  },
  {
    rank: 3,
    name: 'Rohan Mehta',
    avatarText: 'RM',
    avatarBg: '#DCFCE7',
    streak: 45,
    totalSolved: 685,
    accuracy: 89,
    targetCollege: 'FMS Delhi',
  },
  {
    rank: 4,
    name: 'Ananya Gupta',
    avatarText: 'AG',
    avatarBg: '#FCE7F3',
    streak: 38,
    totalSolved: 590,
    accuracy: 88,
    targetCollege: 'IIM Calcutta',
  },
  {
    rank: 5,
    name: 'Kabir Verma',
    avatarText: 'KV',
    avatarBg: '#EDE9FE',
    streak: 34,
    totalSolved: 520,
    accuracy: 86,
    targetCollege: 'XLRI Jamshedpur',
  },
  {
    rank: 6,
    name: 'Tanvi Deshmukh',
    avatarText: 'TD',
    avatarBg: '#FEE2E2',
    streak: 29,
    totalSolved: 480,
    accuracy: 87,
    targetCollege: 'IIM Kozhikode',
  },
  {
    rank: 7,
    name: 'Aditya Nair',
    avatarText: 'AN',
    avatarBg: '#E0F2FE',
    streak: 25,
    totalSolved: 445,
    accuracy: 85,
    targetCollege: 'IIM Lucknow',
  },
  {
    rank: 8,
    name: 'Sneha Patel',
    avatarText: 'SP',
    avatarBg: '#FEF9C3',
    streak: 21,
    totalSolved: 390,
    accuracy: 84,
    targetCollege: 'SPJIMR Mumbai',
  },
  {
    rank: 9,
    name: 'Vikram Sengupta',
    avatarText: 'VS',
    avatarBg: '#F1F5F9',
    streak: 18,
    totalSolved: 360,
    accuracy: 83,
    targetCollege: 'IIM Indore',
  },
  {
    rank: 10,
    name: 'Divya Reddy',
    avatarText: 'DR',
    avatarBg: '#E0E7FF',
    streak: 15,
    totalSolved: 310,
    accuracy: 82,
    targetCollege: 'MDI Gurgaon',
  },
];

type LeaderboardTab = 'streak' | 'solved' | 'accuracy';

interface LeaderboardModalProps {
  visible: boolean;
  onClose: () => void;
}

export function LeaderboardModal({ visible, onClose }: LeaderboardModalProps) {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('streak');
  const { profile, userProgress } = useAppStore();

  const userName = profile.name.trim() || 'You';
  const nameParts = profile.name.trim().split(/\s+/).filter(Boolean);
  const initials =
    nameParts.length >= 2
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : nameParts.length === 1
      ? nameParts[0].slice(0, 2).toUpperCase()
      : 'YOU';

  const userStreak = userProgress.currentStreak || 1;
  const userSolved = userProgress.totalSolved || 0;
  const userAccuracy =
    userProgress.totalSolved > 0
      ? Math.round((userProgress.totalCorrect / userProgress.totalSolved) * 100)
      : 84;

  // Build sorted list incorporating user
  const sortedList = useMemo(() => {
    const userEntry: LeaderboardEntry = {
      rank: 0,
      name: `${userName} (You)`,
      avatarText: initials,
      avatarBg: Colors.varcBg,
      streak: userStreak,
      totalSolved: userSolved,
      accuracy: userAccuracy,
      targetCollege: 'Aiming for 99+ %ile',
      isUser: true,
    };

    const combined = [...COMMUNITY_LEADERBOARD, userEntry];

    if (activeTab === 'streak') {
      combined.sort((a, b) => b.streak - a.streak);
    } else if (activeTab === 'solved') {
      combined.sort((a, b) => b.totalSolved - a.totalSolved);
    } else {
      combined.sort((a, b) => b.accuracy - a.accuracy);
    }

    return combined.map((entry, idx) => ({ ...entry, rank: idx + 1 }));
  }, [activeTab, userName, initials, userStreak, userSolved, userAccuracy]);

  const userRankEntry = sortedList.find((e) => e.isUser) || {
    rank: sortedList.length,
    streak: userStreak,
    totalSolved: userSolved,
    accuracy: userAccuracy,
  };

  const top3 = sortedList.slice(0, 3);
  const remainingList = sortedList.slice(3);

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
              <IconBadge bg={Colors.qaBg} size={42} radius={14}>
                <Text style={{ fontSize: 20 }}>🏆</Text>
              </IconBadge>
              <View>
                <Text style={styles.title}>EZCAT Leaderboard</Text>
                <Text style={styles.subtitle}>Community rankings across India</Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close">
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {/* Tabs */}
          <View style={styles.tabsRow}>
            <Pressable
              style={[styles.tabBtn, activeTab === 'streak' && styles.tabBtnActive]}
              onPress={() => setActiveTab('streak')}
            >
              <Text style={[styles.tabText, activeTab === 'streak' && styles.tabTextActive]}>
                🔥 Daily Streaks
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tabBtn, activeTab === 'solved' && styles.tabBtnActive]}
              onPress={() => setActiveTab('solved')}
            >
              <Text style={[styles.tabText, activeTab === 'solved' && styles.tabTextActive]}>
                🎯 Questions Solved
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tabBtn, activeTab === 'accuracy' && styles.tabBtnActive]}
              onPress={() => setActiveTab('accuracy')}
            >
              <Text style={[styles.tabText, activeTab === 'accuracy' && styles.tabTextActive]}>
                ⚡ Accuracy
              </Text>
            </Pressable>
          </View>

          {/* User Sticky Rank Card */}
          <View style={styles.userCard}>
            <View style={styles.userCardLeft}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>{initials}</Text>
              </View>
              <View>
                <Text style={styles.userCardName} numberOfLines={1}>{userName}</Text>
                <Text style={styles.userCardSub}>
                  {activeTab === 'streak'
                    ? `${userStreak} Day Streak`
                    : activeTab === 'solved'
                    ? `${userSolved} Questions Solved`
                    : `${userAccuracy}% Accuracy`}
                </Text>
              </View>
            </View>

            <View style={styles.userCardRight}>
              <Text style={styles.rankLabel}>YOUR RANK</Text>
              <Text style={styles.rankNumber}>#{userRankEntry.rank}</Text>
            </View>
          </View>

          {/* Scrollable Leaderboard */}
          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {/* Top 3 Podium Cards */}
            <View style={styles.podiumContainer}>
              {/* 2nd Place */}
              {top3[1] && (
                <View style={[styles.podiumCol, styles.podiumSilver]}>
                  <View style={styles.medalCircle}>
                    <Text style={{ fontSize: 16 }}>🥈</Text>
                  </View>
                  <View style={[styles.podiumAvatar, { backgroundColor: top3[1].avatarBg }]}>
                    <Text style={styles.podiumAvatarText}>{top3[1].avatarText}</Text>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>{top3[1].name.split(' ')[0]}</Text>
                  <Text style={styles.podiumScore}>
                    {activeTab === 'streak'
                      ? `${top3[1].streak}d`
                      : activeTab === 'solved'
                      ? `${top3[1].totalSolved}Q`
                      : `${top3[1].accuracy}%`}
                  </Text>
                  <View style={styles.podiumPedestalSilver}>
                    <Text style={styles.pedestalText}>#2</Text>
                  </View>
                </View>
              )}

              {/* 1st Place */}
              {top3[0] && (
                <View style={[styles.podiumCol, styles.podiumGold]}>
                  <View style={styles.medalCircle}>
                    <Text style={{ fontSize: 20 }}>🥇</Text>
                  </View>
                  <View style={[styles.podiumAvatarGold, { backgroundColor: top3[0].avatarBg }]}>
                    <Text style={styles.podiumAvatarTextGold}>{top3[0].avatarText}</Text>
                  </View>
                  <Text style={styles.podiumNameBold} numberOfLines={1}>{top3[0].name.split(' ')[0]}</Text>
                  <Text style={styles.podiumScoreGold}>
                    {activeTab === 'streak'
                      ? `${top3[0].streak}d streak`
                      : activeTab === 'solved'
                      ? `${top3[0].totalSolved} solved`
                      : `${top3[0].accuracy}% acc`}
                  </Text>
                  <View style={styles.podiumPedestalGold}>
                    <Text style={styles.pedestalTextGold}>#1</Text>
                  </View>
                </View>
              )}

              {/* 3rd Place */}
              {top3[2] && (
                <View style={[styles.podiumCol, styles.podiumBronze]}>
                  <View style={styles.medalCircle}>
                    <Text style={{ fontSize: 16 }}>🥉</Text>
                  </View>
                  <View style={[styles.podiumAvatar, { backgroundColor: top3[2].avatarBg }]}>
                    <Text style={styles.podiumAvatarText}>{top3[2].avatarText}</Text>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>{top3[2].name.split(' ')[0]}</Text>
                  <Text style={styles.podiumScore}>
                    {activeTab === 'streak'
                      ? `${top3[2].streak}d`
                      : activeTab === 'solved'
                      ? `${top3[2].totalSolved}Q`
                      : `${top3[2].accuracy}%`}
                  </Text>
                  <View style={styles.podiumPedestalBronze}>
                    <Text style={styles.pedestalText}>#3</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Remaining Ranks List (4+) */}
            <View style={styles.ranksList}>
              {remainingList.map((item) => (
                <View
                  key={`${item.rank}-${item.name}`}
                  style={[styles.rankRow, item.isUser && styles.rankRowUser]}
                >
                  <Text style={[styles.rankColNumber, item.isUser && styles.rankColNumberUser]}>
                    #{item.rank}
                  </Text>

                  <View style={[styles.listAvatar, { backgroundColor: item.avatarBg }]}>
                    <Text style={styles.listAvatarText}>{item.avatarText}</Text>
                  </View>

                  <View style={styles.listMain}>
                    <View style={styles.listNameRow}>
                      <Text style={[styles.listName, item.isUser && styles.listNameUser]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      {item.isUser && <View style={styles.youPill}><Text style={styles.youPillText}>YOU</Text></View>}
                    </View>
                    <Text style={styles.listTarget} numberOfLines={1}>{item.targetCollege}</Text>
                  </View>

                  <View style={styles.listStatRight}>
                    <Text style={styles.statValue}>
                      {activeTab === 'streak'
                        ? `${item.streak}d`
                        : activeTab === 'solved'
                        ? item.totalSolved
                        : `${item.accuracy}%`}
                    </Text>
                    <Text style={styles.statLabel}>
                      {activeTab === 'streak' ? 'Streak' : activeTab === 'solved' ? 'Solved' : 'Acc'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={{ height: 24 }} />
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
    minHeight: 520,
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
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: '#FAFAFD',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 11.5,
    fontFamily: FontFamily.medium,
    color: Colors.textBody,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 18,
    marginTop: 12,
    padding: 14,
    backgroundColor: '#0B2C74',
    borderRadius: 16,
    ...Platform.select({
      ios: { shadowColor: '#0B2C74', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8 },
      android: { elevation: 4 },
      default: {},
    }),
  },
  userCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
    fontSize: 15,
  },
  userCardName: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  userCardSub: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 1,
  },
  userCardRight: {
    alignItems: 'flex-end',
  },
  rankLabel: {
    fontSize: 10,
    fontFamily: FontFamily.semiBold,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
  },
  rankNumber: {
    fontSize: 20,
    fontFamily: FontFamily.extraBold,
    color: '#F59E0B',
  },
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    marginBottom: 12,
  },
  podiumCol: {
    alignItems: 'center',
    width: 96,
  },
  podiumGold: {
    width: 106,
  },
  podiumSilver: {},
  podiumBronze: {},
  medalCircle: {
    marginBottom: 4,
  },
  podiumAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  podiumAvatarGold: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  podiumAvatarText: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  podiumAvatarTextGold: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  podiumName: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    color: Colors.textBody,
    marginTop: 4,
    textAlign: 'center',
  },
  podiumNameBold: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
    marginTop: 4,
    textAlign: 'center',
  },
  podiumScore: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: Colors.textMuted,
    marginTop: 1,
  },
  podiumScoreGold: {
    fontSize: 11,
    fontFamily: FontFamily.semiBold,
    color: '#D97706',
    marginTop: 1,
  },
  podiumPedestalGold: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    width: '100%',
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  podiumPedestalSilver: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    width: '100%',
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  podiumPedestalBronze: {
    backgroundColor: '#FFEDD5',
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    width: '100%',
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  pedestalText: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: Colors.textSecondary,
  },
  pedestalTextGold: {
    fontSize: 16,
    fontFamily: FontFamily.extraBold,
    color: '#B45309',
  },
  ranksList: {
    gap: 8,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFD',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rankRowUser: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  rankColNumber: {
    width: 32,
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: Colors.textMuted,
  },
  rankColNumberUser: {
    color: Colors.primary,
  },
  listAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  listAvatarText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  listMain: {
    flex: 1,
  },
  listNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  listName: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  listNameUser: {
    color: Colors.primary,
  },
  youPill: {
    backgroundColor: Colors.varcBg,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  youPillText: {
    fontSize: 9,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  listTarget: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: Colors.textMuted,
    marginTop: 1,
  },
  listStatRight: {
    alignItems: 'flex-end',
    minWidth: 46,
  },
  statValue: {
    fontSize: 14,
    fontFamily: FontFamily.extraBold,
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: FontFamily.regular,
    color: Colors.textMuted,
  },
});
