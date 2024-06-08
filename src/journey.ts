import type { Feature, GeoJsonProperties, LineString } from "geojson";
import {
  apply,
  degrees,
  delta,
  fromGeodeticCoordinates,
  norm,
  normalize,
  radians,
  toGeodeticCoordinates,
  toRotationMatrix,
  transform,
  transpose,
} from "nvector-geodesy";

export type AtLeastTwoPositions = [
  GeolocationPosition,
  GeolocationPosition,
  ...GeolocationPosition[],
];

export type AtLeastOneSegment = [JourneySegment, ...JourneySegment[]];

export type Journey = {
  readonly positions: AtLeastTwoPositions;
  readonly startPosition: GeolocationPosition;
  readonly endPosition: GeolocationPosition;
  readonly positionTimes: number[];
  readonly positionOffsetTimes: number[];
  readonly segments: AtLeastOneSegment;
  segmentAtOffsetTime: (offsetTime: number) => JourneySegmentWithT;
  segmentAtTime: (time: number) => JourneySegmentWithT;
  timeToOffsetTime: (time: number) => number;
  offsetTimeToTime: (offsetTime: number) => number;
};

export type JourneySegment = [a: GeolocationPosition, b: GeolocationPosition];

export type JourneySegmentWithT = [
  a: GeolocationPosition,
  b: GeolocationPosition,
  t: number,
];

export function createJourney(...positions: AtLeastTwoPositions): Journey {
  positions.sort(({ timestamp: a }, { timestamp: b }) => a - b);

  const count = positions.length;
  const startPosition = positions[0];
  const endPosition = positions[count - 1];
  const startTime = startPosition.timestamp;
  const endTime = endPosition.timestamp;
  const start: JourneySegment = [startPosition, positions[1]] as const;
  const end: JourneySegment = [positions[count - 2], endPosition] as const;

  const positionTimes = [];
  const positionOffsetTimes = [];

  for (const { timestamp } of positions) {
    positionTimes.push(timestamp);
    positionOffsetTimes.push(timestamp - startTime);
  }

  const segments: AtLeastOneSegment = [[positions[0], positions[1]]];

  for (let i = 2; i < count; ++i) {
    segments.push([positions[i - 1], positions[i]]);
  }

  const segmentAtTime: Journey["segmentAtTime"] = (time: number) => {
    if (time < startTime) return [...start, -Infinity];
    if (time >= endTime) return [...end, Infinity];

    // Find the index of the first position after t, or count if t is after
    // the last position, using a binary search.
    let idx = 0;

    for (let j = count; idx < j; ) {
      // Fast integer division by 2
      const h = (idx + j) >> 1;

      if (positions[h].timestamp <= time) {
        idx = h + 1;
      } else {
        j = h;
      }
    }

    const b = positions[idx];
    const a = positions[idx - 1];

    return [a, b, (time - a.timestamp) / (b.timestamp - a.timestamp)];
  };

  return {
    positions,
    startPosition,
    endPosition,
    positionTimes,
    positionOffsetTimes,
    segments,

    segmentAtOffsetTime: (offsetTime) => {
      return segmentAtTime(startTime + offsetTime);
    },

    segmentAtTime,

    timeToOffsetTime(time) {
      return time - startTime;
    },

    offsetTimeToTime(offsetTime) {
      return offsetTime + startTime;
    },
  };
}

type BoundingBox = [west: number, south: number, east: number, north: number];

/**
 * @see https://stackoverflow.com/a/58859132/736156
 */
export function boundingBox(...positions: AtLeastTwoPositions): BoundingBox {
  const count = positions.length;
  const lons = positions
    .map(({ coords: { longitude } }) => longitude)
    .sort((a, b) => a - b);

  let w = NaN,
    s = Infinity,
    e = NaN,
    n = -Infinity,
    maxD = -Infinity;

  for (let i = 0; i < count; ++i) {
    const lat = positions[i].coords.latitude;

    if (lat < s) s = lat;
    if (lat > n) n = lat;

    const j = (i + 1) % count;

    const lonA = lons[i];
    const lonB = lons[j];

    const d = (lonB - lonA + 360) % 360;

    if (d > maxD) {
      maxD = d;
      e = lonA;
      w = lonB;
    }
  }

  // Mapbox won't render a bounding box correctly if the east bound is less
  // than the west bound.
  if (e < w) e += 360;

  return [w, s, e, n];
}

export function findFastestSegment(
  ...segments: AtLeastOneSegment
): JourneySegment {
  let maxSpd = -Infinity;
  let fastest: JourneySegment = segments[0];

  for (const seg of segments) {
    const spd = speed(...seg);

    if (spd > maxSpd) {
      maxSpd = spd;
      fastest = seg;
    }
  }

  return fastest;
}

export function distance(
  a: GeolocationCoordinates,
  b: GeolocationCoordinates,
): number {
  return norm(
    delta(
      fromGeodeticCoordinates(radians(a.longitude), radians(a.latitude)),
      fromGeodeticCoordinates(radians(b.longitude), radians(b.latitude)),
      -(a.altitude ?? -0),
      -(b.altitude ?? -0),
    ),
  );
}

export function speed(a: GeolocationPosition, b: GeolocationPosition): number {
  return distance(a.coords, b.coords) / ((b.timestamp - a.timestamp) / 1000);
}

export function lerpPosition(
  a: GeolocationPosition,
  b: GeolocationPosition,
  t: number,
): GeolocationCoordinates {
  const ca = a.coords;
  const cb = b.coords;

  if (t < 0) return { ...ca, heading: NaN, speed: 0 };
  if (t >= 1) return { ...cb, heading: NaN, speed: 0 };

  // Position n-vectors
  const va = fromGeodeticCoordinates(
    radians(ca.longitude),
    radians(ca.latitude),
  );
  const vb = fromGeodeticCoordinates(
    radians(cb.longitude),
    radians(cb.latitude),
  );

  // From n-vector example 6, interpolated position
  const vi = normalize(apply((va, vb) => lerp(va, vb, t), va, vb));
  const [lon, lat] = toGeodeticCoordinates(vi);

  // From n-vector example 1, A and B to delta
  const d = delta(va, vb, -(ca.altitude ?? -0), -(cb.altitude ?? -0));
  const [north, east] = transform(transpose(toRotationMatrix(va)), d);
  const az = Math.atan2(east, north);
  const dist = norm(d);

  return {
    longitude: degrees(lon),
    latitude: degrees(lat),
    accuracy: lerp(ca.accuracy, cb.accuracy, t),
    altitude: lerpNullable(ca.altitude, cb.altitude, t),
    altitudeAccuracy: lerpNullable(ca.altitudeAccuracy, cb.altitudeAccuracy, t),
    heading: (degrees(az) + 360) % 360,
    speed: dist / ((b.timestamp - a.timestamp) / 1000),
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpNullable(
  a: number | null,
  b: number | null,
  t: number,
): number | null {
  return a == null ? null : b == null ? a : a + (b - a) * t;
}

export type GeoJSONPropertiesWithCoordinateProperties =
  NonNullable<GeoJsonProperties> & {
    coordinateProperties: {
      times: (number | string | null)[];
    };
  };

export type GeoJSONJourney = Feature<
  LineString,
  GeoJSONPropertiesWithCoordinateProperties
>;

export function createJourneyFromGeoJSON({
  geometry: { coordinates },
  properties: {
    coordinateProperties: { times },
  },
}: GeoJSONJourney): Journey {
  const positions: GeolocationPosition[] = [];

  for (let i = 0; i < coordinates.length; ++i) {
    const time = times[i];

    // Skip positions without a time
    if (time == null) continue;

    const [longitude, latitude, altitude] = coordinates[i];

    positions.push({
      coords: {
        longitude,
        latitude,
        altitude,
        accuracy: 0,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: new Date(time).getTime(),
    });
  }

  const a = positions.shift();
  const b = positions.shift();

  if (!a || !b) throw new Error("Insufficient positions for a journey");

  return createJourney(a, b, ...positions);
}
