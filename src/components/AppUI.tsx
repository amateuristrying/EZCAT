import React from 'react';
import { View, Text, StyleSheet, Platform, ViewStyle } from 'react-native';
import { Colors } from '../constants/colors';
import { FontFamily } from '../constants/typography';

// ─── Card ────────────────────────────────────────────────────────────────────

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// ─── Delta (▲6% / ▼10s) ──────────────────────────────────────────────────────

export function Delta({
  value,
  direction = 'up',
  good = true,
}: {
  value: string;
  direction?: 'up' | 'down';
  /** Whether this delta is a positive signal (green) or negative (red). */
  good?: boolean;
}) {
  const color = good ? Colors.success : Colors.danger;
  return (
    <Text style={[styles.delta, { color }]}>
      {direction === 'up' ? '↑' : '↓'} {value}
    </Text>
  );
}

// ─── Icon Badge (rounded square / circle holding an emoji or glyph) ──────────

export function IconBadge({
  children,
  bg,
  size = 44,
  radius,
}: {
  children: React.ReactNode;
  bg: string;
  size?: number;
  radius?: number;
}) {
  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: radius ?? size / 2.6,
          backgroundColor: bg,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#0B2C74',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      },
      android: { elevation: 2 },
      default: {},
    }),
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0px 4px 16px rgba(11,44,116,0.06)' } as any)
      : {}),
  },
  delta: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
