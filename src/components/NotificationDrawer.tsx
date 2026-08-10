import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { Colors } from '../constants/colors';
import { FontFamily } from '../constants/typography';
import { IconBadge } from './AppUI';

export interface NotificationItem {
  id: string;
  icon: string;
  iconBg: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type?: 'practice' | 'mock' | 'coach' | 'streak';
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    icon: '🎯',
    iconBg: Colors.dilrBg,
    title: 'Daily Practice Goal Ready',
    body: 'Your 7 customized CAT practice questions for today are ready to solve.',
    time: '10m ago',
    read: false,
    type: 'practice',
  },
  {
    id: 'n2',
    icon: '🤖',
    iconBg: Colors.varcBg,
    title: 'AI Coach Insight Updated',
    body: 'Accuracy in Arithmetic is up 12%! Check your updated topic diagnostics.',
    time: '2h ago',
    read: false,
    type: 'coach',
  },
  {
    id: 'n3',
    icon: '🔥',
    iconBg: Colors.qaBg,
    title: 'Streak Warning',
    body: 'Solve at least 1 question today to keep your daily study streak active.',
    time: '5h ago',
    read: true,
    type: 'streak',
  },
  {
    id: 'n4',
    icon: '📆',
    iconBg: Colors.purpleBg,
    title: 'Upcoming Mock Reminder',
    body: 'Mini Mock Test #3 scheduled for tomorrow at 9:00 AM.',
    time: '1d ago',
    read: true,
    type: 'mock',
  },
];

interface NotificationDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSelectAction?: (type: string) => void;
}

export function NotificationDrawer({ visible, onClose, onSelectAction }: NotificationDrawerProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleToggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.drawer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.title}>Notifications</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount} new</Text>
                </View>
              )}
            </View>
            <View style={styles.headerRightRow}>
              {unreadCount > 0 && (
                <Pressable onPress={handleMarkAllRead} style={styles.markReadBtn}>
                  <Text style={styles.markReadText}>Mark all read</Text>
                </Pressable>
              )}
              <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close notifications">
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>
          </View>

          {/* List */}
          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={{ fontSize: 32 }}>🔔</Text>
                <Text style={styles.emptyTitle}>All caught up!</Text>
                <Text style={styles.emptySub}>No new notifications at this time.</Text>
              </View>
            ) : (
              notifications.map((item) => (
                <Pressable
                  key={item.id}
                  style={[styles.itemCard, !item.read && styles.itemUnread]}
                  onPress={() => {
                    handleToggleRead(item.id);
                    if (onSelectAction && item.type) {
                      onSelectAction(item.type);
                    }
                  }}
                >
                  <IconBadge bg={item.iconBg} size={42} radius={14}>
                    <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                  </IconBadge>
                  <View style={styles.itemMain}>
                    <View style={styles.itemTitleRow}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemTime}>{item.time}</Text>
                    </View>
                    <Text style={styles.itemBody}>{item.body}</Text>
                  </View>
                  {!item.read && <View style={styles.unreadDot} />}
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 15, 23, 0.65)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  drawer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    minHeight: 380,
    paddingTop: 16,
    paddingBottom: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12 },
      android: { elevation: 16 },
      default: {},
    }),
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
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  unreadBadge: {
    backgroundColor: Colors.varcBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markReadBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  markReadText: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    color: Colors.accentBlue,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: Colors.textSecondary,
  },
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    gap: 10,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemUnread: {
    backgroundColor: '#EEF2FE',
    borderColor: '#C7D2FE',
  },
  itemMain: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: 13.5,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  itemTime: {
    fontSize: 10,
    fontFamily: FontFamily.regular,
    color: Colors.textMuted,
  },
  itemBody: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Colors.textBody,
    lineHeight: 16,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accentBlue,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  emptySub: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
});
