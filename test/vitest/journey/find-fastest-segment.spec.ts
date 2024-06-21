import { createCoordinates } from "fake-geolocation";
import { expect, it } from "vitest";
import { createJourney, findFastestSegment } from "../../../src/journey";

const journey = createJourney(
  {
    coords: createCoordinates({ latitude: 1 }),
    timestamp: 0,
  },
  {
    coords: createCoordinates({ latitude: 2 }),
    timestamp: 200,
  },
  {
    coords: createCoordinates({ latitude: 3 }),
    timestamp: 300,
  },
  {
    coords: createCoordinates({ latitude: 4 }),
    timestamp: 500,
  },
);

it("finds the fastest segment", () => {
  expect(findFastestSegment(...journey.segments)).toMatchObject([
    {
      coords: { latitude: 2 },
      timestamp: 200,
    },
    {
      coords: { latitude: 3 },
      timestamp: 300,
    },
  ]);
});
