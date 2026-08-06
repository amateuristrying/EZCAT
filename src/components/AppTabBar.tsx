import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import { Colors } from '../constants/colors';
import { FontFamily } from '../constants/typography';

export type TabKey = 'home' | 'questions' | 'mocks' | 'coach';

export const TABS: { key: TabKey; label: string }[] = [
  { key: 'home', label: 'Home' },
  { key: 'questions', label: 'Questions' },
  { key: 'mocks', label: 'Mocks' },
  { key: 'coach', label: 'AI Coach' },
];

// ─── Tab Icons ───────────────────────────────────────────────────────────────

function TabIcon({ name, color }: { name: TabKey; color: string }) {
  const props = {
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  switch (name) {
    case 'home':
      return (
        <Svg width={24} height={24} viewBox="0 0 24 24">
          <Path d="M3 10.5 L12 3.5 L21 10.5" {...props} />
          <Path d="M5 9.5 V20 H19 V9.5" {...props} />
        </Svg>
      );
    case 'questions':
      return (
        <Svg width={24} height={24} viewBox="0 0 24 24">
          <Path d="M12 6.5 C12 6.5 9.5 4.8 4.5 4.8 V18 C9.5 18 12 19.8 12 19.8" {...props} />
          <Path d="M12 6.5 C12 6.5 14.5 4.8 19.5 4.8 V18 C14.5 18 12 19.8 12 19.8" {...props} />
        </Svg>
      );
    case 'mocks':
      return (
        <Svg width={24} height={24} viewBox="0 0 24 24">
          <Rect x={5} y={4.5} width={14} height={16.5} rx={2.5} {...props} />
          <Path d="M9 4.5 V3.5 h6 v1" {...props} />
          <Path d="M8.5 12.5 l2.2 2.2 L15 10.5" {...props} />
        </Svg>
      );
    case 'coach':
      return (
        <Svg width={24} height={24} viewBox="0 0 24 24">
          <Rect x={4.5} y={8} width={15} height={11} rx={3} {...props} />
          <Line x1={12} y1={4} x2={12} y2={8} {...props} />
          <Circle cx={12} cy={3.5} r={1.2} fill={color} stroke="none" />
          <Circle cx={9.5} cy={13.5} r={1.3} fill={color} stroke="none" />
          <Circle cx={14.5} cy={13.5} r={1.3} fill={color} stroke="none" />
        </Svg>
      );
  }
}

// ─── Tab Bar ─────────────────────────────────────────────────────────────────

interface AppTabBarProps {
  activeKey: TabKey;
  onChange: (key: TabKey) => void;
}

export function AppTabBar({ activeKey, onChange }: AppTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bar}>
        {TABS.map((tab) => {
          const isFocused = activeKey === tab.key;
          const color = isFocused ? Colors.primary : Colors.textMuted;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onChange(tab.key)}
              style={styles.item}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={tab.label}
            >
              <TabIcon name={tab.key} color={color} />
              <Text
                style={[
                  styles.label,
                  { color },
                  isFocused && { fontFamily: FontFamily.semiBold },
                ]}
              >
                {tab.label}
              </Text>
              {isFocused && <View style={styles.dot} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.background,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#0B2C74',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
      default: {},
    }),
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0px 4px 16px rgba(11,44,116,0.10)' } as any)
      : {}),
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  label: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.primary,
    position: 'absolute',
    bottom: -4,
  },
});
