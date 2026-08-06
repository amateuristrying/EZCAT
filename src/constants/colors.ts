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

  // ── App (post-onboarding) tokens ────────────────────────────
  /** App page background (behind cards) */
  pageBg: '#F3F5FA',
  /** Brighter accent blue used in charts / progress */
  accentBlue: '#2E6BFF',
  /** Secondary body text */
  textSecondary: '#6B7280',
  /** Gauge / progress track */
  track: '#E5E9F2',
  /** Positive delta / success */
  success: '#1CA05C',
  successBg: '#E7F6EC',
  /** Negative / destructive */
  danger: '#E1483C',
  dangerBg: '#FDECEA',
  /** Warning / QA accent (orange) */
  warning: '#E97C1F',
  warningBg: '#FDEEE1',
  /** AI / mocks accent (purple) */
  purple: '#7C4DFF',
  purpleBg: '#EFEAFE',
  // Section accents
  varc: '#2563EB',
  varcBg: '#EAF1FE',
  qa: '#E97C1F',
  qaBg: '#FDEEE1',
  dilr: '#1CA05C',
  dilrBg: '#E7F6EC',
} as const;

export type ColorToken = keyof typeof Colors;
