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
 * MobileFrame — Responsive phone viewport wrapper for Web.
 *
 * - On Web (Desktop / Tablet): Centers a 390px phone-shaped chassis with obsidian
 *   shadow borders, subtle dynamic bezel indicator, and dark obsidian canvas background (#0B0F17).
 * - On Web (Mobile viewport < 480px): Renders edge-to-edge full-bleed for seamless native mobile browser feel.
 * - On Native (iOS / Android): Passes children directly without any container overhead.
 */
export function MobileFrame({ children }: MobileFrameProps) {
  const { width, height } = useWindowDimensions();

  // Native — pass through untouched
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  // Mobile Web — full-bleed edge-to-edge viewport
  if (width < 480) {
    return (
      <View style={styles.mobileWebWrapper}>
        {children}
      </View>
    );
  }

  // Desktop / Tablet Web — refined 390px floating chassis
  const frameHeight = Math.min(Math.max(height - 40, 680), 852);

  return (
    <View style={styles.browserBg}>
      <View
        style={[
          styles.chassisOuter,
          { height: frameHeight },
        ]}
      >
        {/* Dynamic Island / Bezel notch */}
        <View style={styles.dynamicIsland} pointerEvents="none">
          <View style={styles.cameraLens} />
          <View style={styles.sensorDot} />
        </View>

        {/* Screen inner content */}
        <View style={styles.screenInner}>
          {children}
        </View>

        {/* Bottom home indicator pill */}
        <View style={styles.homeIndicatorWrapper} pointerEvents="none">
          <View style={styles.homeIndicator} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /** Full-bleed mobile browser viewport */
  mobileWebWrapper: {
    flex: 1,
    width: '100%',
    minHeight: '100%' as any,
    backgroundColor: Colors.background,
  },

  /** Desktop / Tablet dark obsidian slate canvas (#0B0F17) */
  browserBg: {
    flex: 1,
    backgroundColor: Colors.webBackground,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%' as any,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },

  /** Outer 390px phone chassis with dark obsidian bezel & glowing shadow */
  chassisOuter: {
    width: 390,
    backgroundColor: '#0F172A',
    borderRadius: 44,
    borderWidth: 8,
    borderColor: '#1E293B',
    position: 'relative',
    overflow: 'hidden',
    // High-density tactical cockpit shadow & depth border
    ...(Platform.OS === 'web'
      ? ({
          boxShadow:
            '0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.08), 0 0 45px rgba(11, 44, 116, 0.35)',
        } as any)
      : {}),
  },

  /** Top Dynamic Island / hardware pill */
  dynamicIsland: {
    position: 'absolute',
    top: 10,
    left: '50%',
    transform: [{ translateX: -48 }],
    width: 96,
    height: 22,
    backgroundColor: '#070B12',
    borderRadius: 11,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },

  cameraLens: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#0B1528',
    borderWidth: 1,
    borderColor: '#1E293B',
    marginRight: 4,
  },

  sensorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0F2744',
  },

  /** Screen inner wrapper */
  screenInner: {
    flex: 1,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: Colors.background,
  },

  /** Bottom Home Bar indicator */
  homeIndicatorWrapper: {
    position: 'absolute',
    bottom: 6,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },

  homeIndicator: {
    width: 120,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#94A3B8',
    opacity: 0.35,
  },
});
