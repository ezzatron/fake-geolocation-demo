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

  function find(t: number): number {
    let i = 0,
      j = count;

    while (i < j) {
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
      const pt1 = positions[i];

      if (!pt1) return last.coords;

      const pt0 = positions[i - 1];

      if (!pt0) return pt1.coords;

      const r = (t - pt0.timestamp) / (pt1.timestamp - pt0.timestamp);

      if (r == 1) return pt1.coords;

      const nv0 = fromGeodeticCoordinates(
        radians(pt0.coords.latitude),
        radians(pt0.coords.longitude),
      );
      const nv1 = fromGeodeticCoordinates(
        radians(pt1.coords.latitude),
        radians(pt1.coords.longitude),
      );
      const nvi = normalize(apply((nv0, nv1) => lerp(nv0, nv1, r), nv0, nv1));
      const [latRad, lonRad] = toGeodeticCoordinates(nvi);

      return {
        latitude: degrees(latRad),
        longitude: degrees(lonRad),
        altitude: nullableLerp(pt0.coords.altitude, pt1.coords.altitude, r),
        accuracy: lerp(pt0.coords.accuracy, pt1.coords.accuracy, r),
        altitudeAccuracy: nullableLerp(
          pt0.coords.altitudeAccuracy,
          pt1.coords.altitudeAccuracy,
          r,
        ),
        heading: null,
        speed: null,
      };
    },
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function nullableLerp(
  a: number | null,
  b: number | null,
  t: number,
): number | null {
  return a == null ? null : b == null ? a : a + (b - a) * t;
}
