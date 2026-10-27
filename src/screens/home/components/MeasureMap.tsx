import React, { forwardRef, memo, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Polygon, Polyline, PROVIDER_GOOGLE, type LatLng } from 'react-native-maps';
import type { Vertex } from '../hooks/outlineReducer';
import type { MapRegion, MeasureMapHandle } from './mapTypes';
import { COLORS } from './measureTheme';
import VertexMarker from './VertexMarker';

/** Google Maps' deepest zoom. Lets the user get as close as the imagery allows. */
const MAX_ZOOM_LEVEL = 21;

type Props = {
  initialRegion: MapRegion;
  vertices: readonly Vertex[];
  selectedId: number | null;
  selfIntersecting: boolean;
  onSelectVertex: (id: number) => void;
  onRegionChangeComplete: (region: MapRegion) => void;
};

/**
 * The only component that renders the map and its overlays. It is memoized and receives
 * nothing that changes while the map is being panned, so a pan or pinch never re-renders it.
 *
 * There is intentionally no `onPress` / `onLongPress` here: a point is only ever added
 * from the crosshair.
 */
const MeasureMap = forwardRef<MeasureMapHandle, Props>(function MeasureMap(
  { initialRegion, vertices, selectedId, selfIntersecting, onSelectVertex, onRegionChangeComplete },
  ref,
) {
  const mapRef = useRef<MapView>(null);

  useImperativeHandle(ref, () => ({
    getCenter: async () => {
      const camera = await mapRef.current?.getCamera();
      return camera?.center
        ? { latitude: camera.center.latitude, longitude: camera.center.longitude }
        : null;
    },
  }), []);

  // Strip the ids so only plain coordinates cross the bridge.
  const outline = useMemo<LatLng[]>(
    () => vertices.map(({ latitude, longitude }) => ({ latitude, longitude })),
    [vertices],
  );

  const stroke = selfIntersecting ? COLORS.warning : COLORS.accent;
  const fill = selfIntersecting ? COLORS.warningFill : COLORS.accentFill;

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_GOOGLE}
      style={StyleSheet.absoluteFill}
      mapType="satellite"
      initialRegion={initialRegion}
      maxZoomLevel={MAX_ZOOM_LEVEL}
      rotateEnabled={false}
      pitchEnabled={false}
      toolbarEnabled={false}
      showsCompass={false}
      moveOnMarkerPress={false}
      loadingEnabled
      onRegionChangeComplete={region =>
        onRegionChangeComplete({
          latitude: region.latitude,
          longitude: region.longitude,
          latitudeDelta: region.latitudeDelta,
          longitudeDelta: region.longitudeDelta,
        })
      }
    >
      {outline.length >= 3 && (
        <Polygon coordinates={outline} fillColor={fill} strokeColor={stroke} strokeWidth={2} />
      )}
      {outline.length === 2 && <Polyline coordinates={outline} strokeColor={stroke} strokeWidth={2} />}

      {vertices.map((vertex, index) => (
        <VertexMarker
          key={vertex.id}
          vertex={vertex}
          isFirst={index === 0}
          selected={vertex.id === selectedId}
          onSelect={onSelectVertex}
        />
      ))}
    </MapView>
  );
});

export default memo(MeasureMap);
