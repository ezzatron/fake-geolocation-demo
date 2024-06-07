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

export type Journey = {
  readonly startPosition: GeolocationPosition;
  readonly endPosition: GeolocationPosition;
  segmentAtOffsetTime: (offsetTime: number) => JourneySegmentWithT;
  segmentAtTime: (time: number) => JourneySegmentWithT;
};

export type JourneySegment = [a: GeolocationPosition, b: GeolocationPosition];

export type JourneySegmentWithT = [
  a: GeolocationPosition,
  b: GeolocationPosition,
  t: number,
];

export function createJourney(
  a: GeolocationPosition,
  b: GeolocationPosition,
  ...additional: GeolocationPosition[]
): Journey {
  const positions = [a, b, ...additional].sort(
    ({ timestamp: a }, { timestamp: b }) => a - b,
  );

  const count = positions.length;
  const startPosition = positions[0];
  const endPosition = positions[count - 1];
  const startTime = startPosition.timestamp;
  const endTime = endPosition.timestamp;
  const start: JourneySegment = [startPosition, positions[1]] as const;
  const end: JourneySegment = [positions[count - 2], endPosition] as const;

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
    startPosition,
    endPosition,

    segmentAtOffsetTime: (offsetTime) => {
      return segmentAtTime(startTime + offsetTime);
    },

    segmentAtTime,
  };
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
