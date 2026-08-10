import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Alert } from 'react-native';
import Svg, { Circle, Path, Rect, Line } from 'react-native-svg';
import { Colors } from '../constants/colors';
import { FontFamily } from '../constants/typography';

// ─── Menu icons ──────────────────────────────────────────────────────────────

function MenuIcon({ name, color }: { name: string; color: string }) {
  const p = {
    stroke: color,
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  switch (name) {
    case 'profile':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24">
          <Circle cx={12} cy={8} r={3.4} {...p} />
          <Path d="M5.5 19.5 C5.5 15.7 8.4 14.2 12 14.2 C15.6 14.2 18.5 15.7 18.5 19.5" {...p} />
        </Svg>
      );
    case 'news':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24">
          <Rect x={4} y={5} width={16} height={14} rx={2.5} {...p} />
          <Line x1={7.5} y1={9} x2={13} y2={9} {...p} />
          <Line x1={7.5} y1={12} x2={16.5} y2={12} {...p} />
          <Line x1={7.5} y1={15} x2={16.5} y2={15} {...p} />
        </Svg>
      );
    case 'trophy':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24">
          <Path d="M8 4 H16 V7.5 A4 4 0 0 1 8 7.5 Z" {...p} />
          <Path d="M16 5 H18.5 A1 1 0 0 1 19.5 6 C19.5 8.5 17.5 9.5 16 9.5" {...p} />
          <Path d="M8 5 H5.5 A1 1 0 0 0 4.5 6 C4.5 8.5 6.5 9.5 8 9.5" {...p} />
          <Line x1={12} y1={11.5} x2={12} y2={15} {...p} />
          <Path d="M9 19 H15 M9.5 19 V16 H14.5 V19" {...p} />
        </Svg>
      );
    case 'reset':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24">
          <Path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" {...p} />
          <Path d="M3 3v5h5" {...p} />
        </Svg>
      );
    case 'logout':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24">
          <Path d="M14 8 V6.5 A2 2 0 0 0 12 4.5 H6.5 A2 2 0 0 0 4.5 6.5 V17.5 A2 2 0 0 0 6.5 19.5 H12 A2 2 0 0 0 14 17.5 V16" {...p} />
          <Path d="M9.5 12 H20 M16.5 8.5 L20 12 L16.5 15.5" {...p} />
        </Svg>
      );
    default:
      return null;
  }
}

// ─── Account Menu ────────────────────────────────────────────────────────────

interface AccountMenuProps {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
  onResetData?: () => void;
}

const ITEMS = [
  { key: 'profile', label: 'My Profile' },
  { key: 'news', label: 'CAT Official News' },
  { key: 'trophy', label: 'EZCAT Leaderboard' },
];

export function AccountMenu({ open, onClose, onLogout, onResetData }: AccountMenuProps) {
  if (!open) return null;

  const handleResetPress = () => {
    const confirmMsg =
      'Are you sure you want to reset all application data? This will permanently clear all saved progress, attempts, streak, custom colleges, and bookmarks.';
    if (Platform.OS === 'web') {
      if (window.confirm(confirmMsg)) {
        onResetData?.();
      }
    } else {
      Alert.alert('Reset All Application Data', confirmMsg, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset Data', style: 'destructive', onPress: () => onResetData?.() },
      ]);
    }
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop — tap anywhere to dismiss */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close menu" />

      {/* Dropdown card */}
      <View style={styles.card}>
        {ITEMS.map((item) => (
          <Pressable
            key={item.key}
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            <MenuIcon name={item.key} color={Colors.primary} />
            <Text style={styles.label} numberOfLines={1}>{item.label}</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}

        <Pressable
          style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
          onPress={handleResetPress}
          accessibilityRole="button"
          accessibilityLabel="Reset All Data"
        >
          <MenuIcon name="reset" color={Colors.danger} />
          <Text style={[styles.label, styles.resetLabel]} numberOfLines={1}>Reset All Data</Text>
        </Pressable>

        <View style={styles.divider} />

        <Pressable
          style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
          onPress={onLogout}
          accessibilityRole="button"
          accessibilityLabel="Log Out"
        >
          <MenuIcon name="logout" color={Colors.danger} />
          <Text style={[styles.label, styles.logoutLabel]} numberOfLines={1}>Log Out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    top: 46,
    right: 14,
    width: 250,
    backgroundColor: Colors.background,
    borderRadius: 18,
    paddingVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#0B2C74',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 24,
      },
      android: { elevation: 12 },
      default: {},
    }),
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0px 12px 32px rgba(11,44,116,0.18)' } as any)
      : {}),
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  itemPressed: { backgroundColor: '#F5F7FC' },
  label: {
    flex: 1,
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
  },
  logoutLabel: { color: Colors.danger },
  resetLabel: { color: Colors.danger },
  chevron: { fontSize: 18, color: Colors.textMuted, fontFamily: FontFamily.regular },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 4, marginHorizontal: 4 },
});
