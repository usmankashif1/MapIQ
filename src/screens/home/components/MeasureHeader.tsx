import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ICONS, IconButton } from './Icons';
import { COLORS, FLOATING_CARD, FLOATING_MARGIN } from './measureTheme';
import type { UnitSystem } from './measurement';

type Props = {
  primary: string;
  detail: string;
  units: UnitSystem;
  selfIntersecting: boolean;
  canUndo: boolean;
  canRedo: boolean;
  canClear: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onToggleUnits: () => void;
};

/** Floating card with the live area, perimeter, history controls and unit switch. */
function MeasureHeader({
  primary,
  detail,
  units,
  selfIntersecting,
  canUndo,
  canRedo,
  canClear,
  onUndo,
  onRedo,
  onClear,
  onToggleUnits,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={[styles.container, { top: insets.top + FLOATING_MARGIN }]}>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text
            style={styles.area}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
            accessibilityLiveRegion="polite"
          >
            {primary}
          </Text>
          <View style={styles.history}>
            <IconButton label="Undo" icon={ICONS.undo} disabled={!canUndo} onPress={onUndo} />
            <IconButton label="Redo" icon={ICONS.redo} disabled={!canRedo} onPress={onRedo} />
            <IconButton label="Clear all points" icon={ICONS.trash} disabled={!canClear} onPress={onClear} />
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.detail} numberOfLines={1}>
            {detail}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Units: ${units === 'imperial' ? 'square feet' : 'square meters'}. Tap to switch.`}
            hitSlop={8}
            onPress={onToggleUnits}
            style={({ pressed }) => [styles.unitChip, pressed && styles.unitChipPressed]}
          >
            <Text style={styles.unitChipText}>{units === 'imperial' ? 'ft²' : 'm²'}</Text>
          </Pressable>
        </View>
      </View>

      {selfIntersecting && (
        <View pointerEvents="none" style={styles.banner}>
          <Text style={styles.bannerText}>Outline crosses itself, so the area is not reliable</Text>
        </View>
      )}
    </View>
  );
}

export default memo(MeasureHeader);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: FLOATING_MARGIN,
    right: FLOATING_MARGIN,
    gap: 8,
  },
  card: {
    ...FLOATING_CARD,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  // Fixed row heights, so the card never changes size while drawing.
  row: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  area: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  history: { flexDirection: 'row', gap: 8 },
  detail: {
    flex: 1,
    fontSize: 14,
    color: COLORS.muted,
    fontVariant: ['tabular-nums'],
  },
  unitChip: {
    minWidth: 52,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitChipPressed: { backgroundColor: COLORS.surfacePressed },
  unitChipText: { fontSize: 14, fontWeight: '600', color: COLORS.ink },
  banner: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.warning,
  },
  bannerText: { fontSize: 13, fontWeight: '600', color: '#1F1300' },
});
