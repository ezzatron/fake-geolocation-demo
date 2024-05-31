import type { FeatureCollection, Point, Position } from "geojson";

export type Journey = {
  positionAtRatio: (ratio: number) => Position;
};

export type JourneyPointProperties = {
  time: string;
};

export function createJourney(
  _collection: FeatureCollection<Point, JourneyPointProperties>,
): Journey {
  // const features = collection.features.toSorted((a, b) => {
  //   const aTime = new Date(a.properties.time).getTime();
  //   const bTime = new Date(b.properties.time).getTime();

  //   return aTime - bTime;
  // });

  return {
    positionAtRatio: (_ratio: number) => {
      return [0, 0];
    },
  };
}
