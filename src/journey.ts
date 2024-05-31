import {
  apply,
  degrees,
  fromGeodeticCoordinates,
  normalize,
  radians,
  toGeodeticCoordinates,
} from "nvector-geodesy";

export type Journey = {
  coordsAtTime: (ratio: number) => GeolocationCoordinates;
};

export type Interpolate = (a: number, b: number, t: number) => number;

const lerp: Interpolate = (a, b, t) => a + (b - a) * t;

export function createJourney(...positions: GeolocationPosition[]): Journey {
  if (positions.length < 1) throw new TypeError("No positions provided");

  positions.sort(({ timestamp: a }, { timestamp: b }) => a - b);
  const count = positions.length;
  const last = positions[count - 1];

  function find(t: number): number {
    let i = 0;

    for (let j = count; i < j; ) {
      const h = Math.floor(i + (j - i) / 2);

      if (positions[h].timestamp < t) {
        i = h + 1;
      } else {
        j = h;
      }
    }

    return i;
  }

  return {
    coordsAtTime: (t: number) => {
      const i = find(t);
      const p1 = positions[i];

      if (!p1) return last.coords;

      const p0 = positions[i - 1];

      if (!p0) return p1.coords;

      const r = (t - p0.timestamp) / (p1.timestamp - p0.timestamp);

      if (r == 1) return p1.coords;

      const c0 = p0.coords;
      const c1 = p1.coords;

      const v0 = fromGeodeticCoordinates(
        radians(c0.latitude),
        radians(c0.longitude),
      );
      const v1 = fromGeodeticCoordinates(
        radians(c1.latitude),
        radians(c1.longitude),
      );
      const nvi = normalize(apply((nv0, nv1) => lerp(nv0, nv1, r), v0, v1));
      const [lat, lon] = toGeodeticCoordinates(nvi);

      return {
        latitude: degrees(lat),
        longitude: degrees(lon),
        altitude: interpolateNullable(lerp, c0.altitude, c1.altitude, r),
        accuracy: lerp(c0.accuracy, c1.accuracy, r),
        altitudeAccuracy: interpolateNullable(
          lerp,
          c0.altitudeAccuracy,
          c1.altitudeAccuracy,
          r,
        ),
        heading: null,
        speed: null,
      };
    },
  };
}

function interpolateNullable(
  i: Interpolate,
  a: number | null,
  b: number | null,
  t: number,
): number | null {
  return a == null ? null : b == null ? a : i(a, b, t);
}
