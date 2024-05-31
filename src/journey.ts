import {
  apply,
  fromGeodeticCoordinates,
  normalize,
  toGeodeticCoordinates,
} from "nvector-geodesy";

export type Journey = {
  coordsAtRatio: (ratio: number) => GeolocationCoordinates;
};

export function createJourney(
  aCoords: GeolocationCoordinates,
  bCoords: GeolocationCoordinates,
): Journey {
  const a = fromGeodeticCoordinates(aCoords.longitude, aCoords.latitude);
  const aAlt = aCoords.altitude ?? 0;
  const b = fromGeodeticCoordinates(bCoords.longitude, bCoords.latitude);
  const bAlt = bCoords.altitude ?? 0;

  return {
    coordsAtRatio: (ratio: number) => {
      const [latitude, longitude] = toGeodeticCoordinates(
        normalize(apply((a, b) => a + (b - a) * ratio, a, b)),
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
