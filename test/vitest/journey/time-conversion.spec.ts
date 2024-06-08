import { expect, it } from "vitest";
import { createJourney } from "../../../src/journey";
import { createCoordinates } from "./util";

const journey = createJourney(
  {
    coords: createCoordinates({ accuracy: 10 }),
    timestamp: 150,
  },
  {
    coords: createCoordinates({ accuracy: 20 }),
    timestamp: 200,
  },
);

it("converts absolute time to offset time", () => {
  expect(journey.timeToOffsetTime(150)).toBe(0);
  expect(journey.timeToOffsetTime(200)).toBe(50);
  expect(journey.timeToOffsetTime(300)).toBe(150);
});

it("converts offset time to absolute time", () => {
  expect(journey.offsetTimeToTime(0)).toBe(150);
  expect(journey.offsetTimeToTime(50)).toBe(200);
  expect(journey.offsetTimeToTime(150)).toBe(300);
});
