import { expect, it } from "vitest";
import { createJourney } from "../../../src/journey";
import { createCoordinates } from "./util";

const journey = createJourney(
  {
    coords: createCoordinates({ accuracy: 10 }),
    timestamp: 100,
  },
  {
    coords: createCoordinates({ accuracy: 20 }),
    timestamp: 200,
  },
  {
    coords: createCoordinates({ accuracy: 30 }),
    timestamp: 300,
  },
);

it("exposes the position times", () => {
  expect(journey.positionTimes).toMatchObject([100, 200, 300]);
});

it("exposes the position offset times", () => {
  expect(journey.positionOffsetTimes).toMatchObject([0, 100, 200]);
});
