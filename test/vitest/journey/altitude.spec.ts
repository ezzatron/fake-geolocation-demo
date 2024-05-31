import { describe, expect, it } from "vitest";
import { createJourney } from "../../../src/journey";
import { createCoordinates } from "./util";

describe("when altitude data is present", () => {
  let t = 50;

  const journey = createJourney(
    {
      coords: createCoordinates({ altitude: 10 }),
      timestamp: (t += 0), // 50
    },
    {
      coords: createCoordinates({ altitude: -20 }),
      timestamp: (t += 50), // 100
    },
    {
      coords: createCoordinates({ altitude: 30 }),
      timestamp: (t += 100), // 200
    },
  );

  it.each([
    [25, 10],
    [50, 10],
    [75, -5],
    [100, -20],
    [125, -7.5],
    [150, 5],
    [175, 17.5],
    [200, 30],
    [225, 30],
  ])("linearly interpolates altitude for time = %s", (t, altitude) => {
    expect(journey.coordsAtTime(t).altitude).toBe(altitude);
  });
});

describe("when no altitude data is present", () => {
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
      expect(journey.coordsAtTime(t).altitude).toBeNull();
    },
  );
});

describe("when partial altitude data is present", () => {
  const journey = createJourney(
    {
      coords: createCoordinates({ altitude: 10 }),
      timestamp: 0,
    },
    {
      coords: createCoordinates({ altitude: null }),
      timestamp: 50,
    },
    {
      coords: createCoordinates({ altitude: 30 }),
      timestamp: 150,
    },
  );

  it.each([
    [-25, 10],
    [0, 10],
    [25, 10],
    [50, null],
    [75, null],
    [100, null],
    [125, null],
    [150, 30],
    [175, 30],
  ])("doesn't interpolate altitude for time = %s", (t, altitude) => {
    expect(journey.coordsAtTime(t).altitude).toBe(altitude);
  });
});
