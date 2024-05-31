import type { Feature, Point, Position } from "geojson";
import {
  apply,
  fromGeodeticCoordinates,
  normalize,
  toGeodeticCoordinates,
} from "nvector-geodesy";

export type Journey = {
  positionAtRatio: (ratio: number) => Position;
};

export function createJourney(
  {
    geometry: {
      coordinates: [aLon, aLat],
    },
  }: Feature<Point>,
  {
    geometry: {
      coordinates: [bLon, bLat],
    },
  }: Feature<Point>,
): Journey {
  const a = fromGeodeticCoordinates(aLat, aLon);
  const b = fromGeodeticCoordinates(bLat, bLon);

  return {
    positionAtRatio: (ratio: number) => {
      const [lat, lon] = toGeodeticCoordinates(
        normalize(apply((a, b) => a + (b - a) * ratio, a, b)),
      );

      return [lon, lat];
    },
  };
}
