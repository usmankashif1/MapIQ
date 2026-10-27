import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { type LatLng, type Region } from 'react-native-maps';
import Crosshair from '../components/Crosshair';
import MeasureHeader from '../components/MeasureHeader';
import MeasureMap from '../components/MeasureMap';
import MeasureToolbar from '../components/MeasureToolbar';
import {
  describeMeasurement,
  measurePath,
  toMeasurementResult,
  type MeasurementResult,
  type UnitSystem,
} from '../components/measurement';
import { useOutlineEditor } from '../hooks/useOutlineEditor';

export type { MeasurementResult } from '../components/measurement';

export type MeasurementScreenProps = {
  initialRegion?: Region;
  /** Called whenever the committed outline changes. */
  onMeasurementChange?: (result: MeasurementResult) => void;
};

// Placeholder start position. Pass `initialRegion` (e.g. the job address) to override it.
const DEFAULT_REGION: Region = {
  // latitude: 28.40346579052557,
  // longitude: 70.3113253971184,
  latitude: 37.78825,
  longitude: -122.4324,
  latitudeDelta: 0.005,
  longitudeDelta: 0.005,
};

/**
 * Drag-and-target measuring screen.
 *
 * The map fills the screen and a fixed crosshair sits at its centre. The user pans the map
 * until the crosshair is over a corner, then taps "Add point". Nothing is ever placed by
 * tapping the map itself.
 *
 * Performance: the map centre is only written to a ref, never to state, so panning and
 * zooming trigger zero React renders. React only renders when the outline, selection or
 * unit system changes, and every child below is memoized against stable props.
 */
export default function HomeScreen({
  initialRegion = DEFAULT_REGION,
  onMeasurementChange,
}: MeasurementScreenProps) {
  const mapRef = useRef<MapView>(null);
  const centerRef = useRef<LatLng>({
    latitude: initialRegion.latitude,
    longitude: initialRegion.longitude,
  });
  const [units, setUnits] = useState<UnitSystem>('imperial');

  const {
    vertices,
    selectedId,
    selectedIndex,
    canUndo,
    canRedo,
    add,
    moveSelected,
    removeSelected,
    clear,
    undo,
    redo,
    select,
    deselect,
  } = useOutlineEditor();

  /* ----- measurement ----- */

  const measurement = useMemo(() => measurePath(vertices), [vertices]);
  const summary = useMemo(
    () => describeMeasurement(vertices.length, measurement, units),
    [vertices.length, measurement, units],
  );

  // Keep the latest callback in a ref so a new function identity from the host never
  // re-fires the effect; only an actual change to the outline does.
  const onChangeRef = useRef(onMeasurementChange);
  useEffect(() => {
    onChangeRef.current = onMeasurementChange;
  }, [onMeasurementChange]);

  useEffect(() => {
    onChangeRef.current?.(toMeasurementResult(vertices, measurement));
  }, [vertices, measurement]);

  /* ----- crosshair position ----- */

  const handleRegionChangeComplete = useCallback((region: Region) => {
    centerRef.current = { latitude: region.latitude, longitude: region.longitude };
  }, []);

  /**
   * The coordinate under the crosshair right now. The ref is kept current by
   * onRegionChangeComplete, but that only fires once the map has come to rest. If the user
   * taps while the map is still coasting after a fling, the native camera knows the true
   * centre at this instant, so it is asked first and the ref is the fallback.
   */
  const readCrosshair = useCallback(async (): Promise<LatLng> => {
    try {
      const camera = await mapRef.current?.getCamera();
      if (camera?.center) {
        return { latitude: camera.center.latitude, longitude: camera.center.longitude };
      }
    } catch {
      // fall through to the last reported centre
    }
    return centerRef.current;
  }, []);

  /* ----- handlers ----- */

  const handleAddPoint = useCallback(() => {
    void readCrosshair().then(add);
  }, [readCrosshair, add]);

  const handleMoveHere = useCallback(() => {
    void readCrosshair().then(moveSelected);
  }, [readCrosshair, moveSelected]);

  const handleToggleUnits = useCallback(
    () => setUnits(current => (current === 'imperial' ? 'metric' : 'imperial')),
    [],
  );

  return (
    <View style={styles.root}>
      <MeasureMap
        ref={mapRef}
        initialRegion={initialRegion}
        vertices={vertices}
        selectedId={selectedId}
        selfIntersecting={measurement.selfIntersecting}
        onSelectVertex={select}
        onRegionChangeComplete={handleRegionChangeComplete}
      />

      {/* Same parent as the map, so both share one centre point. */}
      <Crosshair />

      <MeasureHeader
        primary={summary.primary}
        detail={summary.detail}
        units={units}
        selfIntersecting={measurement.selfIntersecting}
        canUndo={canUndo}
        canRedo={canRedo}
        canClear={vertices.length > 0}
        onUndo={undo}
        onRedo={redo}
        onClear={clear}
        onToggleUnits={handleToggleUnits}
      />

      <MeasureToolbar
        pointCount={vertices.length}
        selectedNumber={selectedIndex >= 0 ? selectedIndex + 1 : null}
        onAddPoint={handleAddPoint}
        onMoveHere={handleMoveHere}
        onDelete={removeSelected}
        onDeselect={deselect}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000'
  },
});
















































