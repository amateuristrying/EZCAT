/**
 * EZCAT Design System — Color Tokens
 */
export const Colors = {
  /** Primary brand blue */
  primary: '#0B2C74',
  /** White screen / card background */
  background: '#FFFFFF',
  /** Web browser chrome background */
  webBackground: '#F5F6FA',
  /** Footer / placeholder / muted text */
  textMuted: '#9AA1AF',
  /** White text on primary buttons / cards */
  textOnPrimary: '#FFFFFF',
  /** Main heading / brand text */
  textDark: '#0B2C74',
  /** Body / secondary text */
  textBody: '#1A1A2E',
  /** Input card border */
  border: '#E8EBF2',
  /** Input label text */
  labelText: '#0B2C74',
  /** Input placeholder */
  placeholder: '#9AA1AF',
  /** Light icon tint (unused slots) */
  iconMuted: '#9AA1AF',
} as const;

export type ColorToken = keyof typeof Colors;
