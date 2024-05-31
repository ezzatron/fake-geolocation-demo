import {
  apply,
  fromGeodeticCoordinates,
  normalize,
  toGeodeticCoordinates,
} from "nvector-geodesy";

export type Journey = {
  coordsAtTime: (ratio: number) => GeolocationCoordinates;
};

export function createJourney(
  a: GeolocationPosition,
  b: GeolocationPosition,
): Journey {
  return {
    coordsAtTime: (t: number) => {
      const aNV = fromGeodeticCoordinates(
        a.coords.longitude,
        a.coords.latitude,
      );
      const aAlt = a.coords.altitude ?? 0;
      const bNV = fromGeodeticCoordinates(
        b.coords.longitude,
        b.coords.latitude,
      );
      const bAlt = b.coords.altitude ?? 0;

      const ratio = (t - a.timestamp) / (b.timestamp - a.timestamp);
      const [latitude, longitude] = toGeodeticCoordinates(
        normalize(apply((a, b) => a + (b - a) * ratio, aNV, bNV)),
      );
      const altitude = aAlt + (bAlt - aAlt) * ratio;

      return {
        latitude,
        longitude,
        altitude,
        accuracy: 10,
        altitudeAccuracy: 10,
        heading: null,
        speed: null,
      };
    },
  };
}
