/**
 * Pure measurement helpers (no React / React Native imports) so they can be unit-tested in plain Node.
 *
 * Area and perimeter are computed with Turf.js on closed [lng, lat] rings. Turf works on a sphere,
 * so results can differ from true WGS84 ellipsoidal values by a few tenths of a percent
 * depending on latitude. Swap `measurePath` for an ellipsoidal implementation if you need
 * survey-grade numbers; the rest of the screen only depends on the `Measurement` shape.
 */
import * as turf from '@turf/turf';

export type Coordinate = { latitude: number; longitude: number };

export type Measurement = {
  /** Enclosed area in square meters. 0 until there are 3 points. */
  areaM2: number;
  /** Closed perimeter with 3+ points, open path length with 2 points. Meters. */
  perimeterM: number;
  /** True when two non-adjacent edges cross. The area of such an outline is not meaningful. */
  selfIntersecting: boolean;
};

export type MeasurementResult = {
  points: Coordinate[];
  areaSqM: number;
  areaSqFt: number;
  perimeterM: number;
  perimeterFt: number;
  /** When true the outline crosses itself and the area should not be trusted. */
  selfIntersecting: boolean;
};

export type UnitSystem = 'imperial' | 'metric';

type Position = [longitude: number, latitude: number];

// 1 international foot is exactly 0.3048 m by definition.
export const METERS_PER_FOOT = 0.3048;
export const FEET_PER_METER = 1 / METERS_PER_FOOT;
export const SQFT_PER_SQM = 1 / (METERS_PER_FOOT * METERS_PER_FOOT);
const SQFT_PER_ACRE = 43_560;
const SQM_PER_HECTARE = 10_000;

export const EMPTY_MEASUREMENT: Measurement = {
  areaM2: 0,
  perimeterM: 0,
  selfIntersecting: false,
};

/* -------------------------------------------------------------------------- */
/* Geometry                                                                   */
/* -------------------------------------------------------------------------- */

const toPosition = ({ latitude, longitude }: Coordinate): Position => [longitude, latitude];

/**
 * GeoJSON rings are [lng, lat] and must end on the position they started from. The closing
 * position is appended here, so the polygon is closed mathematically before Turf sees it.
 */
function toClosedRing(points: readonly Coordinate[]): Position[] {
  const ring = points.map(toPosition);
  const [firstLng, firstLat] = ring[0];
  ring.push([firstLng, firstLat]);
  return ring;
}

/** Great-circle distance between two coordinates, in meters. */
export function distanceMeters(a: Coordinate, b: Coordinate): number {
  return turf.distance(toPosition(a), toPosition(b), { units: 'meters' });
}

/**
 * Measures an outline. Fewer than 3 points gives a length only (open path); 3+ points
 * gives the area and perimeter of the closed polygon, whichever way it was drawn
 * (Turf returns the absolute area, so winding order does not matter).
 */
export function measurePath(points: readonly Coordinate[]): Measurement {
  if (points.length < 2) {
    return EMPTY_MEASUREMENT;
  }

  if (points.length === 2) {
    return { areaM2: 0, perimeterM: distanceMeters(points[0], points[1]), selfIntersecting: false };
  }

  const ring = toClosedRing(points);

  return {
    areaM2: turf.area(turf.polygon([ring])),
    perimeterM: turf.length(turf.lineString(ring), { units: 'meters' }),
    selfIntersecting: hasSelfIntersection(points),
  };
}

/**
 * True when any two non-adjacent edges of the closed outline properly cross.
 * Crossings are unchanged by a linear change of axes, so a local flat plane is sufficient
 * at property scale. (Not intended for outlines that straddle the antimeridian.)
 */
export function hasSelfIntersection(points: readonly Coordinate[]): boolean {
  const n = points.length;
  if (n < 4) {
    return false;
  }

  const lat0 = points[0].latitude;
  const lon0 = points[0].longitude;
  const lonScale = Math.cos((lat0 * Math.PI) / 180);
  const xs = points.map(p => (p.longitude - lon0) * lonScale);
  const ys = points.map(p => p.latitude - lat0);

  const cross = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) =>
    (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);

  for (let i = 0; i < n; i++) {
    const i2 = (i + 1) % n;
    for (let j = i + 2; j < n; j++) {
      const j2 = (j + 1) % n;
      if (j2 === i) {
        continue; // first and last edges share a vertex
      }

      const d1 = cross(xs[i], ys[i], xs[i2], ys[i2], xs[j], ys[j]);
      const d2 = cross(xs[i], ys[i], xs[i2], ys[i2], xs[j2], ys[j2]);
      const d3 = cross(xs[j], ys[j], xs[j2], ys[j2], xs[i], ys[i]);
      const d4 = cross(xs[j], ys[j], xs[j2], ys[j2], xs[i2], ys[i2]);

      if (d1 * d2 < 0 && d3 * d4 < 0) {
        return true;
      }
    }
  }
  return false;
}

/** Shape handed to the host app through `onMeasurementChange`. */
export function toMeasurementResult(
  points: readonly Coordinate[],
  measurement: Measurement,
): MeasurementResult {
  return {
    points: points.map(({ latitude, longitude }) => ({ latitude, longitude })),
    areaSqM: measurement.areaM2,
    areaSqFt: measurement.areaM2 * SQFT_PER_SQM,
    perimeterM: measurement.perimeterM,
    perimeterFt: measurement.perimeterM * FEET_PER_METER,
    selfIntersecting: measurement.selfIntersecting,
  };
}

/* -------------------------------------------------------------------------- */
/* Formatting                                                                 */
/* -------------------------------------------------------------------------- */

const formatNumber = (value: number, digits: number) =>
  value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

/** `primary` is in the chosen unit system, `secondary` is the same area in the other units. */
export function formatArea(areaM2: number, units: UnitSystem): { primary: string; secondary: string } {
  const sqft = areaM2 * SQFT_PER_SQM;

  if (units === 'imperial') {
    const acres = sqft / SQFT_PER_ACRE;
    return {
      primary: `${formatNumber(sqft, 0)} ft²`,
      secondary: `${formatNumber(areaM2, 1)} m²${acres >= 0.1 ? ` · ${formatNumber(acres, 2)} ac` : ''}`,
    };
  }

  const hectares = areaM2 / SQM_PER_HECTARE;
  return {
    primary: `${formatNumber(areaM2, 1)} m²`,
    secondary: `${formatNumber(sqft, 0)} ft²${hectares >= 0.1 ? ` · ${formatNumber(hectares, 2)} ha` : ''}`,
  };
}

export function formatLength(meters: number, units: UnitSystem): string {
  return units === 'imperial'
    ? `${formatNumber(meters * FEET_PER_METER, 1)} ft`
    : `${formatNumber(meters, 1)} m`;
}

/** Headline number and the line under it, for the header card. */
export function describeMeasurement(
  pointCount: number,
  measurement: Measurement,
  units: UnitSystem,
): { primary: string; detail: string } {
  const area = formatArea(measurement.areaM2, units);

  if (pointCount < 2) {
    return { primary: area.primary, detail: 'Add at least 3 points to measure an area' };
  }
  if (pointCount === 2) {
    return { primary: area.primary, detail: `Length ${formatLength(measurement.perimeterM, units)}` };
  }
  return {
    primary: area.primary,
    detail: `${area.secondary} · Perimeter ${formatLength(measurement.perimeterM, units)}`,
  };
}
