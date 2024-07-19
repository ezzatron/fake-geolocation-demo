import { createCoordinates } from "fake-geolocation";
import { expect, it } from "vitest";
import { createJourney } from "../../../src/journey";

const journey = createJourney({
  positions: [
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
  ],
});

it("exposes the start time", () => {
  expect(journey.startTime).toBe(100);
});

it("exposes the end time", () => {
  expect(journey.endTime).toBe(300);
});

it("exposes the duration", () => {
  expect(journey.duration).toBe(200);
});

it("exposes the position times", () => {
  expect(journey.positionTimes).toMatchObject([100, 200, 300]);
});

it("exposes the position offset times", () => {
  expect(journey.positionOffsetTimes).toMatchObject([0, 100, 200]);
});
