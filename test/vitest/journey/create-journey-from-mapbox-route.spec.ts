import { expect, it } from "vitest";
import {
  createJourneyFromMapboxRoute,
  type MapboxRoute,
} from "../../../src/journey";

const route: MapboxRoute = {
  legs: [
    {
      annotation: {
        duration: [1.111, 2.222],
      },
      steps: [
        {
          name: "<step A>",
          duration: 1.111,
          maneuver: {
            instruction: "<maneuver instruction A>",
          },
        },
        {
          name: "",
          duration: 2.222,
          maneuver: {
            instruction: "<maneuver instruction B>",
          },
        },
        {
          name: "<step C>",
          duration: 0,
          maneuver: {
            instruction: "<maneuver instruction C>",
          },
        },
      ],
    },
    {
      annotation: {
        duration: [3.333],
      },
      steps: [
        {
          name: "<step C>",
          duration: 3.333,
          maneuver: {
            instruction: "<maneuver instruction D>",
          },
        },
        {
          name: "<step D>",
          duration: 0,
          maneuver: {
            instruction: "<maneuver instruction D>",
          },
        },
      ],
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

it("creates chapters from the route steps", () => {
  const journey = createJourneyFromMapboxRoute(route, 1111);

  expect(journey.chapters).toEqual([
    {
      time: 1111,
      offsetTime: 0,
      duration: 1111,
      description: "<step A>",
    },
    {
      time: 2222,
      offsetTime: 1111,
      duration: 2222,
      description: "<maneuver instruction B>",
    },
    {
      time: 4444,
      offsetTime: 3333,
      duration: 3333,
      description: "<step C>",
    },
  ]);
});

it("throws when there are not enough positions", () => {
  const route: MapboxRoute = {
    legs: [
      {
        annotation: {
          duration: [],
        },
        steps: [],
      },
    ],
    geometry: {
      type: "LineString",
      coordinates: [[1, 11]],
    },
  };

  expect(() => createJourneyFromMapboxRoute(route)).toThrow(
    "Not enough positions",
  );
});
