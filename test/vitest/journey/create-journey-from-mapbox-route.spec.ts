import { expect, it } from "vitest";
import {
  createJourneyFromMapboxRoute,
  type MapboxRouteWithDurations,
} from "../../../src/journey";

const route: MapboxRouteWithDurations = {
  legs: [
    {
      annotation: {
        duration: [1.111, 2.222],
      },
    },
    {
      annotation: {
        duration: [3.333],
      },
    },
  ],
  geometry: {
    type: "LineString",
    coordinates: [
      [1, 11],
      [2, 22],
      [3, 33],
      [4, 44],
    ],
  },
};

it("creates a journey from a Mapbox route", () => {
  const journey = createJourneyFromMapboxRoute(route, 1111);

  expect(journey.segmentAtTime(0)).toMatchObject([
    { coords: { longitude: 1, latitude: 11, altitude: null } },
    { coords: { longitude: 2, latitude: 22, altitude: null } },
    -Infinity,
  ]);
  expect(journey.segmentAtTime(1111)).toMatchObject([
    { coords: { longitude: 1, latitude: 11, altitude: null } },
    { coords: { longitude: 2, latitude: 22, altitude: null } },
    0,
  ]);
  expect(journey.segmentAtTime(2222)).toMatchObject([
    { coords: { longitude: 2, latitude: 22, altitude: null } },
    { coords: { longitude: 3, latitude: 33, altitude: null } },
    0,
  ]);
  expect(journey.segmentAtTime(4444)).toMatchObject([
    { coords: { longitude: 3, latitude: 33, altitude: null } },
    { coords: { longitude: 4, latitude: 44, altitude: null } },
    0,
  ]);
  expect(journey.segmentAtTime(7777)).toMatchObject([
    { coords: { longitude: 3, latitude: 33, altitude: null } },
    { coords: { longitude: 4, latitude: 44, altitude: null } },
    Infinity,
  ]);
});

it("throws when there are insufficient positions", () => {
  const route: MapboxRouteWithDurations = {
    legs: [
      {
        annotation: {
          duration: [],
        },
      },
    ],
    geometry: {
      type: "LineString",
      coordinates: [[1, 11]],
    },
  };

  expect(() => createJourneyFromMapboxRoute(route)).toThrow(
    "Insufficient positions for a journey",
  );
});
