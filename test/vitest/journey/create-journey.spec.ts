import { createCoordinates } from "fake-geolocation";
import { expect, it } from "vitest";
import { createJourney } from "../../../src/journey";

const journey = createJourney(
  {
    coords: createCoordinates({ accuracy: 2 }),
    timestamp: 50,
  },
  {
    coords: createCoordinates({ accuracy: 3 }),
    timestamp: 150,
  },
  {
    coords: createCoordinates({ accuracy: 1 }),
    timestamp: 0,
  },
);

it("finds the start position", () => {
  expect(journey.startPosition).toMatchObject({
    coords: { accuracy: 1 },
  });
});

it("finds the end position", () => {
  expect(journey.endPosition).toMatchObject({
    coords: { accuracy: 3 },
  });
});
