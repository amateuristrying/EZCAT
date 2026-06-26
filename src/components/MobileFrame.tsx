import React from 'react';
import {
  View,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Colors } from '../constants/colors';

interface MobileFrameProps {
  children: React.ReactNode;
}

/**
 * MobileFrame — Web-only phone viewport wrapper.
 *
 * On web: centers a 390×100vh phone-shaped container with rounded corners
 *         and a soft shadow against a grey browser background.
 *
 * On native (iOS / Android): renders children directly with no wrapping.
 */
export function MobileFrame({ children }: MobileFrameProps) {
  const { height } = useWindowDimensions();

  // Native — pass through untouched
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  return (
    <View style={styles.browserBg}>
      <View
        style={[
          styles.phoneShell,
          { height: Math.min(height, 900) },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /** Full-browser grey canvas */
  browserBg: {
    flex: 1,
    backgroundColor: Colors.webBackground,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%' as any,
  },

  /** The centered mobile shell */
  phoneShell: {
    width: 390,
    backgroundColor: Colors.background,
    borderRadius: 28,
    overflow: 'hidden',
    // Web shadow
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0px 24px 72px rgba(11, 44, 116, 0.18), 0px 4px 16px rgba(0,0,0,0.08)',
        } as any)
      : {}),
  },
});
