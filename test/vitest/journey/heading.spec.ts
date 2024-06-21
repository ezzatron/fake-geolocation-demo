import { createCoordinates } from "fake-geolocation";
import { expect, it } from "vitest";
import { createJourney, lerpPosition } from "../../../src/journey";

const journey = createJourney(
  {
    coords: createCoordinates({ longitude: 0, latitude: 0, heading: 1.23 }),
    timestamp: 0,
  },
  {
    coords: createCoordinates({ longitude: 10, latitude: 10, heading: 1.23 }),
    timestamp: 50,
  },
  {
    coords: createCoordinates({ longitude: 0, latitude: 0, heading: 1.23 }),
    timestamp: 150,
  },
);

it.each([
  [-25, NaN],
  [0, 44.75386197511134],
  [25, 44.75386197511134],
  [50, 225.63095885129377],
  [75, 225.63095885129377],
  [100, 225.63095885129377],
  [125, 225.63095885129377],
  [150, NaN],
  [175, NaN],
])("linearly interpolates heading for time = %s", (offsetTime, heading) => {
  const [a, b, t] = journey.segmentAtOffsetTime(offsetTime);

  if (Number.isNaN(heading)) {
    expect(lerpPosition(a, b, t).heading).toBeNaN();
  } else {
    expect(lerpPosition(a, b, t).heading).toBeCloseTo(heading, 10);
  }
});
