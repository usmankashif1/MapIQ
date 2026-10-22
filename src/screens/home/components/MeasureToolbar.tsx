import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ICONS, Icon, IconButton } from './Icons';
import { COLORS, FLOATING_CARD, FLOATING_MARGIN } from './measureTheme';

type Props = {
  pointCount: number;
  /** 1-based number of the selected point, or null when nothing is selected. */
  selectedNumber: number | null;
  onAddPoint: () => void;
  onMoveHere: () => void;
  onDelete: () => void;
  onDeselect: () => void;
};

function getHint(pointCount: number): string {
  if (pointCount === 0) {
    return 'Pan the map to line up the crosshair, then tap Add point.';
  }
  if (pointCount < 3) {
    return 'Keep adding corners. An area needs at least 3 points.';
  }
  return 'Tap a point to edit it, or keep adding corners.';
}

type ActionButtonProps = {
  label: string;
  accessibilityLabel: string;
  tone: 'primary' | 'danger';
  onPress: () => void;
};

function ActionButton({ label, accessibilityLabel, tone, onPress }: ActionButtonProps) {
  const isPrimary = tone === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        isPrimary ? styles.actionPrimary : styles.actionDanger,
        pressed && styles.actionPressed,
      ]}
    >
      <Text style={[styles.actionLabel, isPrimary ? styles.actionLabelPrimary : styles.actionLabelDanger]}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Floating dock at the bottom: edit actions for the selected point, plus "Add point". */
function MeasureToolbar({ pointCount, selectedNumber, onAddPoint, onMoveHere, onDelete, onDeselect }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, { bottom: Math.max(insets.bottom, FLOATING_MARGIN) }]}
    >
      <View style={styles.card}>
        <View style={styles.contextRow}>
          {selectedNumber !== null ? (
            <>
              <Text style={styles.selectionLabel}>Point {selectedNumber}</Text>
              <View style={styles.selectionActions}>
                <ActionButton
                  label="Move here"
                  accessibilityLabel="Move selected point to the crosshair"
                  tone="primary"
                  onPress={onMoveHere}
                />
                <ActionButton
                  label="Delete"
                  accessibilityLabel="Delete selected point"
                  tone="danger"
                  onPress={onDelete}
                />
                <IconButton label="Deselect point" icon={ICONS.close} onPress={onDeselect} />
              </View>
            </>
          ) : (
            <Text style={styles.hint} numberOfLines={2}>
              {getHint(pointCount)}
            </Text>
          )}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add point at the crosshair"
          onPress={onAddPoint}
          style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
        >
          <Icon paths={ICONS.plus} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add point</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default memo(MeasureToolbar);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: FLOATING_MARGIN,
    right: FLOATING_MARGIN,
  },
  card: {
    ...FLOATING_CARD,
    padding: 12,
    gap: 8,
  },
  // Fixed height in every state, so the dock never changes size.
  contextRow: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  hint: { flex: 1, fontSize: 13, lineHeight: 18, color: COLORS.muted },
  selectionLabel: { fontSize: 15, fontWeight: '600', color: COLORS.ink },
  selectionActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionButton: {
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPrimary: { backgroundColor: COLORS.primary },
  actionDanger: { backgroundColor: COLORS.dangerSoft },
  actionPressed: { opacity: 0.8 },
  actionLabel: { fontSize: 14, fontWeight: '600' },
  actionLabelPrimary: { color: '#FFFFFF' },
  actionLabelDanger: { color: COLORS.danger },
  addButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonPressed: { opacity: 0.85 },
  addButtonText: { fontSize: 17, fontWeight: '600', color: '#FFFFFF' },
});
