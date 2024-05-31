import { expect, it } from "vitest";
import { createJourney } from "../../../src/journey";
import { createCoordinates } from "./util";

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
])("linearly interpolates heading for time = %s", (t, heading) => {
  if (Number.isNaN(heading)) {
    expect(journey.coordsAtTime(t).heading).toBeNaN();
  } else {
    expect(journey.coordsAtTime(t).heading).toBeCloseTo(heading, 10);
  }
});
