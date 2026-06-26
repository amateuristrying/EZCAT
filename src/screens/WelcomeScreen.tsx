import React, { useCallback } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { PrimaryButton } from '../components/PrimaryButton';
import { Colors } from '../constants/colors';
import { FontFamily, Typography } from '../constants/typography';

/**
 * WelcomeScreen — Screen 01
 *
 * Brand splash shown on first launch.
 * No navigation bar · No animations · Pure layout + brand.
 */
export default function WelcomeScreen() {
  const { width } = useWindowDimensions();

  // Scale logo relative to available width — works on SE → Pro Max → web frame
  const logoSize = Math.min(width * 0.72, 280);

  const handleGetStarted = useCallback(() => {
    router.push('/onboarding/profile');
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* ─── Top Brand Section ─────────────────────────────── */}
      <View style={styles.brandSection}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={{ width: logoSize, height: logoSize * 1.05 }}
          resizeMode="contain"
          accessibilityLabel="EZCAT logo — Practice Smart. Crack CAT."
        />
      </View>

      {/* ─── Bottom CTA Section ────────────────────────────── */}
      <View style={styles.ctaSection}>
        <PrimaryButton
          testID="welcome-get-started-btn"
          label="Get started"
          onPress={handleGetStarted}
          style={styles.ctaButton}
        />

        <Text style={styles.footer}>Developed by 99VCA</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  brandSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
    paddingBottom: 8,
  },

  ctaSection: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 16,
    alignItems: 'center',
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
