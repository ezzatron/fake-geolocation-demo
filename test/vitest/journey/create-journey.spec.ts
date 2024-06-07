import { expect, it } from "vitest";
import { createJourney } from "../../../src/journey";
import { createCoordinates } from "./util";

const journey = createJourney(
  {
    coords: createCoordinates({ accuracy: 20 }),
    timestamp: 50,
  },
  {
    coords: createCoordinates({ accuracy: 30 }),
    timestamp: 150,
  },
  {
    coords: createCoordinates({ accuracy: 10 }),
    timestamp: 0,
  },
);

it("finds the start position", () => {
  expect(journey.startPosition).toMatchObject({
    coords: {
      accuracy: 10,
    },
  });
});

it("finds the end position", () => {
  expect(journey.endPosition).toMatchObject({
    coords: {
      accuracy: 30,
    },
  });
});
