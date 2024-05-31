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

export function createJourney(...positions: GeolocationPosition[]): Journey {
  if (positions.length < 1) throw new TypeError("No positions provided");

  positions.sort(({ timestamp: a }, { timestamp: b }) => a - b);
  const count = positions.length;
  const last = positions[count - 1];

  // Returns the index of the first position after t, or count if t is after the
  // last position, using a binary search.
  function find(t: number): number {
    let i = 0;

    for (let j = count; i < j; ) {
      // Fast integer division by 2
      const h = (i + j) >> 1;

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
        radians(c0.longitude),
        radians(c0.latitude),
      );
      const v1 = fromGeodeticCoordinates(
        radians(c1.longitude),
        radians(c1.latitude),
      );
      const nvi = normalize(apply((nv0, nv1) => lerp(nv0, nv1, r), v0, v1));
      const [lon, lat] = toGeodeticCoordinates(nvi);

      return {
        longitude: degrees(lon),
        latitude: degrees(lat),
        altitude: lerpNullable(c0.altitude, c1.altitude, r),
        accuracy: lerp(c0.accuracy, c1.accuracy, r),
        altitudeAccuracy: lerpNullable(
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

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpNullable(
  a: number | null,
  b: number | null,
  t: number,
): number | null {
  return a == null ? null : b == null ? a : a + (b - a) * t;
}
