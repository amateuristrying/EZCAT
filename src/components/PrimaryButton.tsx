import React from 'react';
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { Colors } from '../constants/colors';
import { FontFamily, Typography } from '../constants/typography';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  /** Show a right-arrow "→" at the trailing edge (e.g. Continue button) */
  showArrow?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

/**
 * Full-width primary CTA button matching the EZCAT design system.
 * Blue background · Inter SemiBold · 64px height · 22px radius · shadow.
 */
export function PrimaryButton({
  label,
  onPress,
  showArrow = false,
  style,
  textStyle,
  testID,
}: PrimaryButtonProps) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {/* Invisible left spacer keeps label truly centered when arrow shown */}
      {showArrow && <View style={styles.arrowSpacer} />}

      <Text style={[styles.label, textStyle]}>{label}</Text>

      {showArrow ? (
        <View style={styles.arrowWrap}>
          <Text style={styles.arrow}>→</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    height: 64,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    // Shadow — iOS
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.28,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0px 8px 24px rgba(11, 44, 116, 0.3)' } as any)
      : {}),
  },

  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },

  label: {
    flex: 1,
    color: Colors.textOnPrimary,
    fontSize: Typography.fontSize.lg,
    fontFamily: FontFamily.semiBold,
    letterSpacing: 0.2,
    textAlign: 'center',
  },

  arrowSpacer: {
    width: 32, // mirror the arrowWrap width so text stays centred
  },

  arrowWrap: {
    width: 32,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  arrow: {
    color: Colors.textOnPrimary,
    fontSize: 20,
    fontFamily: FontFamily.regular,
    lineHeight: 22,
  },
});
