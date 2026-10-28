import React, {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import type { CSSProperties } from 'react';
import type { Vertex } from '../hooks/outlineReducer';
import type { MapRegion, MeasureMapHandle } from './mapTypes';
import { COLORS } from './measureTheme';
import { GOOGLE_MAPS_API_KEY } from '../../../core/utils/config';
import {
  loadGoogleMapsApi,
  type GoogleMapsApi,
} from './googleMapsLoader.web';

type Props = {
  initialRegion: MapRegion;
  vertices: readonly Vertex[];
  selectedId: number | null;
  selfIntersecting: boolean;
  onSelectVertex: (id: number) => void;
  onRegionChangeComplete: (region: MapRegion) => void;
};

type GoogleOverlayHandle = {
  setMap: (map: InstanceType<GoogleMapsApi['Map']> | null) => void;
  addListener?: (event: string, handler: () => void) => { remove: () => void };
};
type GoogleListenerHandle = { remove: () => void };

const MAP_REFERENCE_HEIGHT = 800;
const MAX_ZOOM_LEVEL = 21;
const mapContainerStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  background: '#111827',
};
const messageStyle: CSSProperties = {
  position: 'absolute',
  inset: 16,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 18,
  color: '#FFFFFF',
  background: 'rgba(17, 24, 39, 0.88)',
  borderRadius: 12,
  textAlign: 'center',
  fontFamily: 'Arial, sans-serif',
  fontSize: 14,
  lineHeight: 1.5,
};

const getInitialZoom = (latitudeDelta: number) => {
  const safeLatitudeDelta =
    Number.isFinite(latitudeDelta) && latitudeDelta > 0 ? latitudeDelta : 0.005;
  return Math.max(
    1,
    Math.min(
      MAX_ZOOM_LEVEL,
      Math.round(Math.log2((360 * MAP_REFERENCE_HEIGHT) / (256 * safeLatitudeDelta))),
    ),
  );
};

const MeasureMap = forwardRef<MeasureMapHandle, Props>(function MeasureMap(
  { initialRegion, vertices, selectedId, selfIntersecting, onSelectVertex, onRegionChangeComplete },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<InstanceType<GoogleMapsApi['Map']> | null>(null);
  const mapsApiRef = useRef<GoogleMapsApi | null>(null);
  const overlaysRef = useRef<GoogleOverlayHandle[]>([]);
  const overlayListenersRef = useRef<GoogleListenerHandle[]>([]);
  const mapListenersRef = useRef<GoogleListenerHandle[]>([]);
  const regionChangeCallbackRef = useRef(onRegionChangeComplete);
  const [mapVersion, setMapVersion] = useState(0);
  const [mapMessage, setMapMessage] = useState('Loading Google Maps…');

  useEffect(() => {
    regionChangeCallbackRef.current = onRegionChangeComplete;
  }, [onRegionChangeComplete]);

  useImperativeHandle(ref, () => ({
    getCenter: async () => {
      const center = mapRef.current?.getCenter();
      return center
        ? { latitude: center.lat(), longitude: center.lng() }
        : null;
    },
  }), []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let authFailureHandler: (() => void) | undefined;
    const previousAuthFailure = window.gm_authFailure;

    if (GOOGLE_MAPS_API_KEY) {
      authFailureHandler = () => {
        setMapMessage('Google Maps rejected the API key. Check that the Maps JavaScript API is enabled and the key allows this website.');
        previousAuthFailure?.();
      };
      window.gm_authFailure = authFailureHandler;
    }

    void loadGoogleMapsApi(GOOGLE_MAPS_API_KEY)
      .then(maps => {
        if (cancelled) return;

        mapsApiRef.current = maps;
        const map = new maps.Map(container, {
          center: {
            lat: initialRegion.latitude,
            lng: initialRegion.longitude,
          },
          zoom: getInitialZoom(initialRegion.latitudeDelta),
          minZoom: 1,
          maxZoom: MAX_ZOOM_LEVEL,
          mapTypeId: 'satellite',
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          clickableIcons: false,
        });
        mapRef.current = map;
        const idleListener = map.addListener('idle', () => {
          const center = map.getCenter();
          const bounds = map.getBounds()?.toJSON();
          if (!center || !bounds) return;
          regionChangeCallbackRef.current({
            latitude: center.lat(),
            longitude: center.lng(),
            latitudeDelta: bounds.north - bounds.south,
            longitudeDelta: bounds.east - bounds.west,
          });
        });
        mapListenersRef.current.push(idleListener);
        setMapMessage('');
        setMapVersion(version => version + 1);
      })
      .catch(error => {
        if (cancelled) return;
        setMapMessage(
          error instanceof Error ? error.message : 'Google Maps could not be loaded.',
        );
      });

    return () => {
      cancelled = true;
      mapListenersRef.current.forEach(listener => listener.remove());
      mapListenersRef.current = [];
      overlayListenersRef.current.forEach(listener => listener.remove());
      overlayListenersRef.current = [];
      overlaysRef.current.forEach(overlay => overlay.setMap(null));
      overlaysRef.current = [];
      mapRef.current = null;
      mapsApiRef.current = null;
      if (authFailureHandler && window.gm_authFailure === authFailureHandler) {
        window.gm_authFailure = previousAuthFailure;
      }
    };
  }, [initialRegion]);

  useEffect(() => {
    const map = mapRef.current;
    const maps = mapsApiRef.current;
    if (!map || !maps || mapVersion === 0) return;

    overlayListenersRef.current.forEach(listener => listener.remove());
    overlayListenersRef.current = [];
    overlaysRef.current.forEach(overlay => overlay.setMap(null));
    overlaysRef.current = [];

    const coordinates = vertices.map(vertex => ({
      lat: vertex.latitude,
      lng: vertex.longitude,
    }));
    const stroke = selfIntersecting ? COLORS.warning : COLORS.accent;

    if (coordinates.length >= 3) {
      overlaysRef.current.push(new maps.Polygon({
        map,
        paths: coordinates,
        strokeColor: stroke,
        strokeWeight: 2,
        fillColor: stroke,
        fillOpacity: 0.35,
        clickable: false,
      }));
    } else if (coordinates.length === 2) {
      overlaysRef.current.push(new maps.Polyline({
        map,
        path: coordinates,
        strokeColor: stroke,
        strokeWeight: 2,
        clickable: false,
      }));
    }

    vertices.forEach((vertex, index) => {
      const color = vertex.id === selectedId
        ? COLORS.primary
        : index === 0
          ? COLORS.vertexFirst
          : COLORS.vertex;
      const marker = new maps.Marker({
        map,
        position: { lat: vertex.latitude, lng: vertex.longitude },
        zIndex: vertex.id === selectedId ? 2 : 1,
        icon: {
          path: maps.SymbolPath.CIRCLE,
          scale: vertex.id === selectedId ? 9 : 6,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: vertex.id === selectedId ? 3 : 2,
        },
      });
      overlaysRef.current.push(marker);
      const listener = marker.addListener?.('click', () => onSelectVertex(vertex.id));
      if (listener) overlayListenersRef.current.push(listener);
    });
  }, [vertices, selectedId, selfIntersecting, onSelectVertex, mapVersion]);

  return React.createElement(
    'div',
    {
      style: { position: 'absolute', inset: 0, width: '100%', height: '100%' },
    },
    React.createElement('div', {
      ref: containerRef,
      style: mapContainerStyle,
    }),
    mapMessage
      ? React.createElement(
          'div',
          { role: 'status', 'aria-live': 'polite', style: messageStyle },
          mapMessage,
        )
      : null,
  );
});

export default memo(MeasureMap);
