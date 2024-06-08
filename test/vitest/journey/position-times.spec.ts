import { expect, it } from "vitest";
import { createJourney } from "../../../src/journey";
import { createCoordinates } from "./util";

const journey = createJourney(
  {
    coords: createCoordinates({ accuracy: 10 }),
    timestamp: 0,
  },
  {
    coords: createCoordinates({ accuracy: 20 }),
    timestamp: 50,
  },
  {
    coords: createCoordinates({ accuracy: 30 }),
    timestamp: 150,
  },
);

it("exposes the position times", () => {
  expect(journey.positionTimes).toMatchObject([0, 50, 150]);
});
