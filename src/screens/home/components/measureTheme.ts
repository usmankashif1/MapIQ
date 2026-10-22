import type { ViewStyle } from 'react-native';

export const COLORS = {
  accent: '#00BFFF',
  accentFill: 'rgba(0, 191, 255, 0.35)',
  warning: '#FF9500',
  warningFill: 'rgba(255, 149, 0, 0.35)',
  primary: '#0A6CFF',
  danger: '#D92D20',
  dangerSoft: '#FDECEA',
  ink: '#111827',
  muted: '#6B7280',
  disabled: '#9CA3AF',
  surface: '#FFFFFF',
  surfaceAlt: '#F3F4F6',
  surfacePressed: '#E5E7EB',
  hairline: '#E5E7EB',
  vertex: '#FF3B30',
  vertexFirst: '#34C759',
} as const;

/** Distance from the screen edges to the floating header and toolbar. */
export const FLOATING_MARGIN = 12;

/** Shared look for the floating header and toolbar cards. */
export const FLOATING_CARD: ViewStyle = {
  backgroundColor: COLORS.surface,
  borderRadius: 20,
  shadowColor: '#000000',
  shadowOpacity: 0.18,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 6,
};
