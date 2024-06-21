import { createCoordinates } from "fake-geolocation";
import { expect, it } from "vitest";
import { createJourney, lerpPosition } from "../../../src/journey";

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

it.each([
  [-25, 10],
  [0, 10],
  [25, 15],
  [50, 20],
  [75, 22.5],
  [100, 25],
  [125, 27.5],
  [150, 30],
  [175, 30],
])("linearly interpolates accuracy for time = %s", (offsetTime, accuracy) => {
  const [a, b, t] = journey.segmentAtOffsetTime(offsetTime);

  expect(lerpPosition(a, b, t).accuracy).toBe(accuracy);
});
