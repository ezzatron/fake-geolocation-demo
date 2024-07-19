import { expect, it } from "vitest";
import {
  createJourneyFromGoogleRoute,
  type GoogleRoute,
} from "../../../src/journey";

const route: GoogleRoute = {
  legs: [
    {
      steps: [
        {
          staticDuration: "1.111s",
          polyline: {
            geoJsonLinestring: {
              type: "LineString",
              coordinates: [
                [1, 11],
                [2, 22],
                [3, 33],
              ],
            },
          },
          navigationInstruction: {
            instructions: "<nav instructions A>",
          },
        },
        {
          staticDuration: "0s",
          polyline: {
            geoJsonLinestring: {
              type: "LineString",
              coordinates: [],
            },
          },
          navigationInstruction: {
            instructions: "<nav instructions B>",
          },
        },
        {
          staticDuration: "0s",
          polyline: {
            geoJsonLinestring: {
              type: "LineString",
              coordinates: [[3, 33]],
            },
          },
          navigationInstruction: {
            instructions: "<nav instructions C>",
          },
        },
        {
          staticDuration: "0s",
          polyline: {
            geoJsonLinestring: {
              type: "LineString",
              coordinates: [
                [3, 33],
                [3, 33],
              ],
            },
          },
          navigationInstruction: {
            instructions: "<nav instructions D>",
          },
        },
        {
          staticDuration: "2.222s",
          polyline: {
            geoJsonLinestring: {
              type: "LineString",
              coordinates: [
                [3, 33],
                [4, 44],
              ],
            },
          },
          navigationInstruction: {
            instructions: "<nav instructions E>",
          },
        },
      ],
    },
    {
      steps: [
        {
          staticDuration: "3.333s",
          polyline: {
            geoJsonLinestring: {
              type: "LineString",
              coordinates: [
                [4, 44],
                [5, 55],
              ],
            },
          },
          navigationInstruction: {
            instructions: "<nav instructions F>",
          },
        },
      ],
    },
  ],
};

it("creates a journey from a Google Routes API route", () => {
  const journey = createJourneyFromGoogleRoute(route, 1111);

  expect(journey.positions).toMatchObject([
    { coords: { longitude: 1, latitude: 11, altitude: null }, timestamp: 1111 },
    { coords: { longitude: 2, latitude: 22, altitude: null } },
    { coords: { longitude: 3, latitude: 33, altitude: null }, timestamp: 2222 },
    { coords: { longitude: 3, latitude: 33, altitude: null }, timestamp: 2222 },
    { coords: { longitude: 4, latitude: 44, altitude: null }, timestamp: 4444 },
    { coords: { longitude: 5, latitude: 55, altitude: null }, timestamp: 7777 },
  ]);

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
    { coords: { longitude: 3, latitude: 33, altitude: null } },
    { coords: { longitude: 4, latitude: 44, altitude: null } },
    0,
  ]);
  expect(journey.segmentAtTime(4444)).toMatchObject([
    { coords: { longitude: 4, latitude: 44, altitude: null } },
    { coords: { longitude: 5, latitude: 55, altitude: null } },
    0,
  ]);
  expect(journey.segmentAtTime(7777)).toMatchObject([
    { coords: { longitude: 4, latitude: 44, altitude: null } },
    { coords: { longitude: 5, latitude: 55, altitude: null } },
    Infinity,
  ]);
});

it("creates chapters from the route steps", () => {
  const journey = createJourneyFromGoogleRoute(route, 1111);

  expect(journey.chapters).toEqual([
    {
      time: 1111,
      offsetTime: 0,
      duration: 1111,
      description: "<nav instructions A>",
    },
    {
      time: 2222,
      offsetTime: 1111,
      duration: 2222,
      description: "<nav instructions E>",
    },
    {
      time: 4444,
      offsetTime: 3333,
      duration: 3333,
      description: "<nav instructions F>",
    },
  ]);
});

it("throws when there are single-position steps with non-zero durations", () => {
  const route: GoogleRoute = {
    legs: [
      {
        steps: [
          {
            staticDuration: "1.111s",
            polyline: {
              geoJsonLinestring: {
                type: "LineString",
                coordinates: [[1, 11]],
              },
            },
            navigationInstruction: {
              instructions: "<nav instructions A>",
            },
          },
        ],
      },
    ],
  };

  expect(() => createJourneyFromGoogleRoute(route)).toThrow(
    "Single-position step with duration in leg 0, step 0",
  );
});

it("throws when there are not enough positions in a route", () => {
  const route: GoogleRoute = { legs: [{ steps: [] }] };

  expect(() => createJourneyFromGoogleRoute(route)).toThrow(
    "Not enough positions",
  );
});
