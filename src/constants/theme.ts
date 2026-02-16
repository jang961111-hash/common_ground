// ==========================================
// Common Ground - 디자인 시스템
// ==========================================

export const COLORS = {
  // Primary
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryLight: '#93C5FD',
  primaryBg: '#EFF6FF',

  // Accent
  accent: '#8B5CF6',
  accentLight: '#C4B5FD',

  // Success
  success: '#22C55E',
  successLight: '#BBF7D0',
  successBg: '#F0FDF4',

  // Warning
  warning: '#F59E0B',
  warningLight: '#FDE68A',

  // Error
  error: '#EF4444',
  errorLight: '#FECACA',

  // Neutral
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  black: '#000000',

  // Online status
  online: '#22C55E',
  offline: '#9CA3AF',
} as const;

// ── 다크모드 색상 ──
export const DARK_COLORS: ThemeColors = {
  // Primary (유지 — 어두운 배경에서도 시인성 좋음)
  primary: '#60A5FA',
  primaryDark: '#3B82F6',
  primaryLight: '#1E3A5F',
  primaryBg: '#1E293B',

  // Accent
  accent: '#A78BFA',
  accentLight: '#4C1D95',

  // Success
  success: '#4ADE80',
  successLight: '#14532D',
  successBg: '#052E16',

  // Warning
  warning: '#FBBF24',
  warningLight: '#78350F',

  // Error
  error: '#F87171',
  errorLight: '#7F1D1D',

  // Neutral (반전)
  white: '#0F172A',       // 배경 → 어두운 슬레이트
  gray50: '#1E293B',
  gray100: '#1E293B',
  gray200: '#334155',
  gray300: '#475569',
  gray400: '#94A3B8',
  gray500: '#94A3B8',
  gray600: '#CBD5E1',
  gray700: '#E2E8F0',
  gray800: '#F1F5F9',
  gray900: '#F8FAFC',
  black: '#FFFFFF',

  // Online status
  online: '#4ADE80',
  offline: '#64748B',
} as const;

export type ThemeColors = {
  [K in keyof typeof COLORS]: string;
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  hero: 40,
} as const;

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
} as const;
