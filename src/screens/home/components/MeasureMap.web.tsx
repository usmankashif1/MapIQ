import React, {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useMemo,
} from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  APIProvider,
  Map as GoogleMap,
  Marker,
  Polygon,
  Polyline,
  type MapEvent,
  useMap,
} from '@vis.gl/react-google-maps';
import { GOOGLE_MAPS_API_KEY } from '../../../core/utils/config';
import type { Vertex } from '../hooks/outlineReducer';
import type { MapRegion, MeasureMapHandle } from './mapTypes';
import { COLORS } from './measureTheme';

type Props = {
  initialRegion: MapRegion;
  vertices: readonly Vertex[];
  selectedId: number | null;
  selfIntersecting: boolean;
  onSelectVertex: (id: number) => void;
  onRegionChangeComplete: (region: MapRegion) => void;
};

// Region deltas represent the visible map height; this approximates the native initial framing.
const MAP_REFERENCE_HEIGHT = 800;
const MAX_ZOOM_LEVEL = 21;

const getInitialZoom = (latitudeDelta: number) => {
  const safeLatitudeDelta =
    Number.isFinite(latitudeDelta) && latitudeDelta > 0 ? latitudeDelta : 0.005;
  return Math.max(
    1,
    Math.min(MAX_ZOOM_LEVEL, Math.round(Math.log2((360 * MAP_REFERENCE_HEIGHT) / (256 * safeLatitudeDelta)))),
  );
};

type VertexMarkerProps = {
  vertex: Vertex;
  index: number;
  selected: boolean;
  onSelect: (id: number) => void;
};

const WebVertexMarker = memo(function WebVertexMarker({
  vertex,
  index,
  selected,
  onSelect,
}: VertexMarkerProps) {
  const color = selected
    ? COLORS.primary
    : index === 0
      ? COLORS.vertexFirst
      : COLORS.vertex;
  const icon = useMemo(() => ({
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="${selected ? 9 : 5}" fill="${color}" stroke="#fff" stroke-width="${selected ? 3 : 2}"/></svg>`,
    )}`,
    anchor: { x: 14, y: 14 },
  }), [color, selected]);
  const handleClick = useCallback(() => onSelect(vertex.id), [onSelect, vertex.id]);

  return (
    <Marker
      position={{ lat: vertex.latitude, lng: vertex.longitude }}
      icon={icon}
      zIndex={selected ? 2 : 1}
      onClick={handleClick}
    />
  );
});

const GoogleMapCanvas = forwardRef<MeasureMapHandle, Props>(function GoogleMapCanvas(
  { initialRegion, vertices, selectedId, selfIntersecting, onSelectVertex, onRegionChangeComplete },
  ref,
) {
  const map = useMap();

  useImperativeHandle(ref, () => ({
    getCenter: async () => {
      const center = map?.getCenter();
      return center
        ? { latitude: center.lat(), longitude: center.lng() }
        : null;
    },
  }), [map]);

  const coordinates = useMemo(
    () => vertices.map(({ latitude, longitude }) => ({ lat: latitude, lng: longitude })),
    [vertices],
  );

  const handleIdle = useCallback((event: MapEvent) => {
    const center = event.map.getCenter();
    if (!center) {
      return;
    }

    const bounds = event.map.getBounds();
    const northEast = bounds?.getNorthEast();
    const southWest = bounds?.getSouthWest();

    onRegionChangeComplete({
      latitude: center.lat(),
      longitude: center.lng(),
      latitudeDelta: northEast && southWest ? northEast.lat() - southWest.lat() : initialRegion.latitudeDelta,
      longitudeDelta: northEast && southWest ? northEast.lng() - southWest.lng() : initialRegion.longitudeDelta,
    });
  }, [initialRegion.latitudeDelta, initialRegion.longitudeDelta, onRegionChangeComplete]);

  const stroke = selfIntersecting ? COLORS.warning : COLORS.accent;
  const fill = selfIntersecting ? COLORS.warning : COLORS.accent;

  return (
    <GoogleMap
      defaultCenter={{ lat: initialRegion.latitude, lng: initialRegion.longitude }}
      defaultZoom={getInitialZoom(initialRegion.latitudeDelta)}
      mapTypeId="satellite"
      maxZoom={MAX_ZOOM_LEVEL}
      minZoom={1}
      tilt={0}
      heading={0}
      gestureHandling="greedy"
      disableDefaultUI
      clickableIcons={false}
      style={styles.map}
      onIdle={handleIdle}
    >
      {coordinates.length >= 3 && (
        <Polygon
          paths={coordinates}
          fillColor={fill}
          fillOpacity={0.35}
          strokeColor={stroke}
          strokeWeight={2}
          clickable={false}
        />
      )}
      {coordinates.length === 2 && (
        <Polyline path={coordinates} strokeColor={stroke} strokeWeight={2} clickable={false} />
      )}

      {vertices.map((vertex, index) => (
        <WebVertexMarker
          key={vertex.id}
          vertex={vertex}
          index={index}
          selected={vertex.id === selectedId}
          onSelect={onSelectVertex}
        />
      ))}
    </GoogleMap>
  );
});

function MeasureMapWeb(props: Props, ref: React.ForwardedRef<MeasureMapHandle>) {
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <View style={styles.message}>
        <Text style={styles.messageTitle}>Google Maps web key is missing</Text>
        <Text style={styles.messageBody}>
          Set GOOGLE_MAPS_API_KEY in the root .env file, then restart Expo.
        </Text>
      </View>
    );
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <GoogleMapCanvas {...props} ref={ref} />
    </APIProvider>
  );
}

const MeasureMap = forwardRef<MeasureMapHandle, Props>(MeasureMapWeb);

export default memo(MeasureMap);

const styles = StyleSheet.create({
  map: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  message: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F3F4F6',
  },
  messageTitle: {
    color: COLORS.ink,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  messageBody: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
