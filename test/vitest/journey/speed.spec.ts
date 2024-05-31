import { expect, it } from "vitest";
import { createJourney } from "../../../src/journey";
import { createCoordinates } from "./util";

const ONE_MINUTE = 60 * 1000;
const ONE_HOUR = 60 * ONE_MINUTE;
const ONE_DAY = 24 * ONE_HOUR;

const journey = createJourney(
  {
    coords: createCoordinates({
      longitude: -170,
      latitude: 70,
      altitude: 0,
      speed: 123,
    }),
    timestamp: 0,
  },
  {
    coords: createCoordinates({
      longitude: 170,
      latitude: 80,
      altitude: 500,
      speed: 123,
    }),
    timestamp: ONE_HOUR,
  },
  {
    coords: createCoordinates({
      longitude: 70,
      latitude: 90,
      altitude: 0,
      speed: 123,
    }),
    timestamp: ONE_DAY,
  },
);

it.each([
  [-ONE_HOUR, 0],
  [0, 344.2657141922235],
  [30 * ONE_MINUTE, 344.2657141922235],
  [ONE_HOUR, 13.471649730619555],
  [ONE_DAY / 3, 13.471649730619555],
  [(ONE_DAY / 3) * 2, 13.471649730619555],
  [ONE_DAY, 0],
  [ONE_DAY + ONE_HOUR, 0],
])("linearly interpolates speed for time = %s", (t, speed) => {
  expect(journey.coordsAtTime(t).speed).toBe(speed);
});
