import React, { memo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from './measureTheme';

export const ICONS = {
  undo: ['M9 14 4 9l5-5M4 9h8a7 7 0 0 1 7 7'],
  redo: ['m15 14 5-5-5-5m5 5h-8a7 7 0 0 0-7 7'],
  trash: [
    'M3 6h18',
    'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6',
    'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
    'M10 11v6',
    'M14 11v6',
  ],
  plus: ['M12 5v14', 'M5 12h14'],
  close: ['M18 6 6 18', 'm6 6 12 12'],
} as const;

type IconProps = {
  paths: readonly string[];
  color: string;
  size?: number;
};

export function Icon({ paths, color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {paths.map(d => (
        <Path
          key={d}
          d={d}
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
        />
      ))}
    </Svg>
  );
}

type IconButtonProps = {
  label: string;
  icon: readonly string[];
  onPress: () => void;
  disabled?: boolean;
};

export const IconButton = memo(function IconButton({
  label,
  icon,
  onPress,
  disabled = false,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Icon paths={icon} color={disabled ? COLORS.disabled : COLORS.ink} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.55 },
  pressed: { backgroundColor: COLORS.surfacePressed },
});
