import { describe, expect, it } from "vitest";
import { createJourney } from "../../../src/journey";
import { createCoordinates } from "./util";

describe("when altitude accuracy data is present", () => {
  const journey = createJourney(
    {
      coords: createCoordinates({ altitudeAccuracy: 10 }),
      timestamp: 0,
    },
    {
      coords: createCoordinates({ altitudeAccuracy: 20 }),
      timestamp: 50,
    },
    {
      coords: createCoordinates({ altitudeAccuracy: 30 }),
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
  ])("linearly interpolates altitudeAccuracy for time = %s", (t, accuracy) => {
    expect(journey.coordsAtTime(t).altitudeAccuracy).toBe(accuracy);
  });
});

describe("when no altitude accuracy data is present", () => {
  let t = 50;

  const journey = createJourney(
    {
      coords: createCoordinates({}),
      timestamp: (t += 0), // 50
    },
    {
      coords: createCoordinates({}),
      timestamp: (t += 50), // 100
    },
    {
      coords: createCoordinates({}),
      timestamp: (t += 100), // 200
    },
  );

  it.each([[25], [50], [75], [100], [125], [150], [175], [200], [225]])(
    "returns null for time = %s",
    (t) => {
      expect(journey.coordsAtTime(t).altitudeAccuracy).toBeNull();
    },
  );
});

describe("when partial altitude accuracy data is present", () => {
  let t = 50;

  const journey = createJourney(
    {
      coords: createCoordinates({ altitudeAccuracy: 10 }),
      timestamp: (t += 0), // 50
    },
    {
      coords: createCoordinates({ altitudeAccuracy: null }),
      timestamp: (t += 50), // 100
    },
    {
      coords: createCoordinates({ altitudeAccuracy: 30 }),
      timestamp: (t += 100), // 200
    },
  );

  it.each([
    [25, 10],
    [50, 10],
    [75, 10],
    [100, null],
    [125, null],
    [150, null],
    [175, null],
    [200, 30],
    [225, 30],
  ])("doesn't interpolate altitudeAccuracy for time = %s", (t, accuracy) => {
    expect(journey.coordsAtTime(t).altitudeAccuracy).toBe(accuracy);
  });
});
