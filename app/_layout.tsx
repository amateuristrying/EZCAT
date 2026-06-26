import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { MobileFrame } from '../src/components/MobileFrame';
import { Colors } from '../src/constants/colors';

/**
 * RootLayout — App entry point.
 *
 * Responsibilities:
 *  1. Load Inter font variants once for the entire app.
 *  2. Wrap everything in SafeAreaProvider.
 *  3. On web: wrap in MobileFrame (390px centered phone shell).
 *  4. Disable the Expo Router header globally.
 */
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  // Show a minimal loading state while fonts hydrate
  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <MobileFrame>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding/profile" />
          <Stack.Screen name="onboarding/goals" />
          <Stack.Screen name="onboarding/colleges" />
        </Stack>
      </MobileFrame>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
