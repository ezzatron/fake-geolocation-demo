import { expect, it } from "vitest";
import { createJourney } from "../../../src/journey";
import { createCoordinates } from "./util";

let t = 50;

const journey = createJourney(
  {
    coords: createCoordinates({ accuracy: 10 }),
    timestamp: (t += 0), // 50
  },
  {
    coords: createCoordinates({ accuracy: 20 }),
    timestamp: (t += 50), // 100
  },
  {
    coords: createCoordinates({ accuracy: 30 }),
    timestamp: (t += 100), // 200
  },
);

it.each([
  [25, 10],
  [50, 10],
  [75, 15],
  [100, 20],
  [125, 22.5],
  [150, 25],
  [175, 27.5],
  [200, 30],
  [225, 30],
])("linearly interpolates accuracy for time = %s", (t, accuracy) => {
  expect(journey.coordsAtTime(t).accuracy).toBe(accuracy);
});
