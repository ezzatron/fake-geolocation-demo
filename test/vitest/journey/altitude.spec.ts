import { createCoordinates } from "fake-geolocation";
import { describe, expect, it } from "vitest";
import { createJourney, lerpPosition } from "../../../src/journey";

describe("when altitude data is present", () => {
  const journey = createJourney({
    positions: [
      {
        coords: createCoordinates({ altitude: 10 }),
        timestamp: 0,
      },
      {
        coords: createCoordinates({ altitude: -20 }),
        timestamp: 50,
      },
      {
        coords: createCoordinates({ altitude: 30 }),
        timestamp: 150,
      },
    ],
  });

  it.each([
    [-25, 10],
    [0, 10],
    [25, -5],
    [50, -20],
    [75, -7.5],
    [100, 5],
    [125, 17.5],
    [150, 30],
    [175, 30],
  ])("linearly interpolates altitude for time = %s", (offsetTime, altitude) => {
    const [a, b, t] = journey.segmentAtOffsetTime(offsetTime);

    expect(lerpPosition(a, b, t).altitude).toBe(altitude);
  });
});

describe("when no altitude data is present", () => {
  const journey = createJourney({
    positions: [
      {
        coords: createCoordinates({}),
        timestamp: 0,
      },
      {
        coords: createCoordinates({}),
        timestamp: 50,
      },
      {
        coords: createCoordinates({}),
        timestamp: 150,
      },
    ],
  });

  it.each([[-25], [0], [25], [50], [75], [100], [125], [150], [175]])(
    "returns null for time = %s",
    (offsetTime) => {
      const [a, b, t] = journey.segmentAtOffsetTime(offsetTime);

      expect(lerpPosition(a, b, t).altitude).toBeNull();
    },
  );
});

describe("when partial altitude data is present", () => {
  const journey = createJourney({
    positions: [
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
    ],
  });

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
  ])("doesn't interpolate altitude for time = %s", (offsetTime, altitude) => {
    const [a, b, t] = journey.segmentAtOffsetTime(offsetTime);

    expect(lerpPosition(a, b, t).altitude).toBe(altitude);
  });
});
