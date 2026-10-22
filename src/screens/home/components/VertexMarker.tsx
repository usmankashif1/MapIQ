import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';
import type { Vertex } from '../hooks/outlineReducer';
import { COLORS } from './measureTheme';

/** Long enough to paint the first frame and any style change before rasterising the marker. */
const TRACK_VIEW_CHANGES_MS = 350;

type Props = {
  vertex: Vertex;
  isFirst: boolean;
  selected: boolean;
  onSelect: (id: number) => void;
};

/**
 * A corner of the outline. Markers are for selecting an existing point only: they are not
 * draggable, because a finger on the glass hides exactly the pixel being placed. Points
 * are placed and moved with the crosshair.
 */
function VertexMarker({ vertex, isFirst, selected, onSelect }: Props) {
  const { id, latitude, longitude } = vertex;
  const coordinate = useMemo(() => ({ latitude, longitude }), [latitude, longitude]);

  // Custom marker views are rasterised once for performance. Track view changes just long
  // enough to pick up a style change (selected / first), then switch tracking off again.
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  useEffect(() => {
    setTracksViewChanges(true);
    const timer = setTimeout(() => setTracksViewChanges(false), TRACK_VIEW_CHANGES_MS);
    return () => clearTimeout(timer);
  }, [selected, isFirst]);

  const handlePress = useCallback(() => onSelect(id), [onSelect, id]);

  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracksViewChanges}
      zIndex={selected ? 2 : 1}
      onPress={handlePress}
    >
      <View style={styles.hitArea}>
        <View style={[styles.dot, isFirst && styles.dotFirst, selected && styles.dotSelected]} />
      </View>
    </Marker>
  );
}

export default memo(VertexMarker);

const styles = StyleSheet.create({
  hitArea: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.vertex,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  dotFirst: { backgroundColor: COLORS.vertexFirst },
  dotSelected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
  },
});
