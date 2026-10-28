type GoogleCoordinate = {
  lat: number;
  lng: number;
};

type GoogleLatLng = {
  lat: () => number;
  lng: () => number;
};

type GoogleBounds = {
  toJSON: () => {
    north: number;
    south: number;
    east: number;
    west: number;
  };
};

type GoogleListener = {
  remove: () => void;
};

type GoogleMapInstance = {
  getCenter: () => GoogleLatLng | null;
  getBounds: () => GoogleBounds | null;
  addListener: (event: string, handler: () => void) => GoogleListener;
};

type GoogleMapOptions = {
  center: GoogleCoordinate;
  zoom: number;
  minZoom: number;
  maxZoom: number;
  mapTypeId: string;
  fullscreenControl: boolean;
  mapTypeControl: boolean;
  streetViewControl: boolean;
  clickableIcons: boolean;
};

type GoogleOverlayOptions = {
  map: GoogleMapInstance;
  paths?: GoogleCoordinate[];
  path?: GoogleCoordinate[];
  strokeColor?: string;
  strokeWeight?: number;
  fillColor?: string;
  fillOpacity?: number;
  clickable?: boolean;
  position?: GoogleCoordinate;
  zIndex?: number;
  icon?: {
    path: string;
    scale: number;
    fillColor: string;
    fillOpacity: number;
    strokeColor: string;
    strokeWeight: number;
  };
};

type GoogleOverlay = {
  setMap: (map: GoogleMapInstance | null) => void;
  addListener?: (event: string, handler: () => void) => GoogleListener;
};

export type GoogleMapsApi = {
  Map: new (element: HTMLElement, options: GoogleMapOptions) => GoogleMapInstance;
  Polygon: new (options: GoogleOverlayOptions) => GoogleOverlay;
  Polyline: new (options: GoogleOverlayOptions) => GoogleOverlay;
  Marker: new (options: GoogleOverlayOptions) => GoogleOverlay;
  SymbolPath: {
    CIRCLE: string;
  };
};

declare global {
  interface Window {
    google?: {
      maps?: GoogleMapsApi;
    };
    __mapiqGoogleMapsReady?: () => void;
    gm_authFailure?: () => void;
  }
}

let googleMapsPromise: Promise<GoogleMapsApi> | undefined;

export function loadGoogleMapsApi(apiKey: string | undefined): Promise<GoogleMapsApi> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('Google Maps is only available in a browser.'));
  }

  const existingApi = window.google?.maps;
  if (existingApi?.Map && existingApi.Polygon && existingApi.Polyline && existingApi.Marker) {
    return Promise.resolve(existingApi);
  }

  if (!apiKey?.trim()) {
    return Promise.reject(
      new Error('Google Maps key is missing. Configure GOOGLE_MAPS_API_KEY in the app config.'),
    );
  }

  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise<GoogleMapsApi>((resolve, reject) => {
    const script = document.createElement('script');
    const url = new URL('https://maps.googleapis.com/maps/api/js');
    url.searchParams.set('key', apiKey.trim());
    url.searchParams.set('callback', '__mapiqGoogleMapsReady');
    url.searchParams.set('loading', 'async');
    url.searchParams.set('v', 'weekly');

    window.__mapiqGoogleMapsReady = () => {
      const maps = window.google?.maps;
      delete window.__mapiqGoogleMapsReady;
      if (!maps?.Map || !maps.Polygon || !maps.Polyline || !maps.Marker) {
        googleMapsPromise = undefined;
        reject(new Error('Google Maps loaded without its map libraries.'));
        return;
      }
      resolve(maps);
    };

    script.async = true;
    script.src = url.toString();
    script.onerror = () => {
      delete window.__mapiqGoogleMapsReady;
      googleMapsPromise = undefined;
      script.remove();
      reject(new Error('Google Maps could not load. Check your internet connection and API key.'));
    };
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}
