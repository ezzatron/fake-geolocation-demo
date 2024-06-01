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
  coordinatesAtTime: (time: number) => GeolocationCoordinates;
};

export function createJourney(...positions: GeolocationPosition[]): Journey {
  if (positions.length < 1) throw new TypeError("No positions provided");

  // Sort by time, make copies, and strip headings and speeds
  positions = positions
    .sort(({ timestamp: a }, { timestamp: b }) => a - b)
    .map((p) => ({ ...p, coords: { ...p.coords, heading: NaN, speed: 0 } }));
  const count = positions.length;
  const last = positions[count - 1];

  return {
    coordinatesAtTime: (time) => {
      // Find the index of the first position after t, or count if t is after the
      // last position, using a binary search.
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

      if (!b) return last.coords;

      const a = positions[idx - 1];

      if (!a) return b.coords;

      const t = (time - a.timestamp) / (b.timestamp - a.timestamp);
      const ca = a.coords;
      const cb = b.coords;

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
        altitudeAccuracy: lerpNullable(
          ca.altitudeAccuracy,
          cb.altitudeAccuracy,
          t,
        ),
        heading: (degrees(az) + 360) % 360,
        speed: dist / ((b.timestamp - a.timestamp) / 1000),
      };
    },
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

  return createJourney(...positions);
}
