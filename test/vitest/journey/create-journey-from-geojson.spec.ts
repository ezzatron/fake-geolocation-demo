import { expect, it } from "vitest";
import {
  createJourneyFromGeoJSON,
  type GeoJSONJourney,
} from "../../../src/journey";

const geoJSON: GeoJSONJourney = {
  type: "Feature",
  properties: {
    coordinateProperties: {
      times: [
        "2002-03-09T16:22:27Z",
        null,
        "2002-03-09T16:19:57Z",
        null,
        "2002-03-09T16:22:07Z",
      ],
    },
  },
  geometry: {
    type: "LineString",
    coordinates: [
      [3, 33, 333],
      [-1, -2, -3],
      [1, 11, 111],
      [-4, -5, -6],
      [2, 22, 222],
    ],
  },
};

it("creates a journey from GeoJSON", () => {
  const journey = createJourneyFromGeoJSON(geoJSON);

  expect(
    journey.segmentAtTime(new Date("2002-03-09T16:19:57Z").getTime()),
  ).toMatchObject([
    {
      coords: {
        longitude: 1,
        latitude: 11,
        altitude: 111,
      },
    },
    {
      coords: {
        longitude: 2,
        latitude: 22,
        altitude: 222,
      },
    },
    0,
  ]);
  expect(
    journey.segmentAtTime(new Date("2002-03-09T16:22:07Z").getTime()),
  ).toMatchObject([
    {
      coords: {
        longitude: 2,
        latitude: 22,
        altitude: 222,
      },
    },
    {
      coords: {
        longitude: 3,
        latitude: 33,
        altitude: 333,
      },
    },
    0,
  ]);
  expect(
    journey.segmentAtTime(new Date("2002-03-09T16:22:27Z").getTime()),
  ).toMatchObject([
    {
      coords: {
        longitude: 2,
        latitude: 22,
        altitude: 222,
      },
    },
    {
      coords: {
        longitude: 3,
        latitude: 33,
        altitude: 333,
      },
    },
    Infinity,
  ]);
});

it("throws when there are insufficient positions", () => {
  const geoJSONWithoutTimes: GeoJSONJourney = {
    type: "Feature",
    properties: {
      coordinateProperties: {
        times: [null, "2002-03-09T16:19:57Z", null],
      },
    },
    geometry: {
      type: "LineString",
      coordinates: [
        [-1, -2, -3],
        [1, 11, 111],
        [-4, -5, -6],
      ],
    },
  };

  expect(() => createJourneyFromGeoJSON(geoJSONWithoutTimes)).toThrowError(
    "Insufficient positions for a journey",
  );
});
