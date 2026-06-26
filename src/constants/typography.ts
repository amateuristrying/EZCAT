/**
 * EZCAT Design System — Typography Tokens
 *
 * Font family: Inter (loaded via @expo-google-fonts/inter + expo-font)
 * Font weights map to loaded Inter variants.
 */

/**
 * Font family names — must match the keys used in useFonts() in _layout.tsx.
 * On native, these are the postscript names of the loaded TTF files.
 * On web, Expo Font injects them as CSS @font-face families.
 */
export const FontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extraBold: 'Inter_800ExtraBold',
} as const;

export const Typography = {
  fontFamily: FontFamily,
  fontSize: {
    xs: 11,
    sm: 13,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 26,
    xxxl: 32,
  },
  /** fontWeight is not used when fontFamily is set — kept for reference. */
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    loose: 1.8,
  },
} as const;
