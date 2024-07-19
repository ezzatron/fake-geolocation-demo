import { createCoordinates } from "fake-geolocation";
import { describe, expect, it } from "vitest";
import { createJourney, lerpPosition } from "../../../src/journey";

describe("when altitude accuracy data is present", () => {
  const journey = createJourney({
    positions: [
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
    ],
  });

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
  ])(
    "linearly interpolates altitudeAccuracy for time = %s",
    (offsetTime, altitudeAccuracy) => {
      const [a, b, t] = journey.segmentAtOffsetTime(offsetTime);

      expect(lerpPosition(a, b, t).altitudeAccuracy).toBe(altitudeAccuracy);
    },
  );
});

describe("when no altitude accuracy data is present", () => {
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

      expect(lerpPosition(a, b, t).altitudeAccuracy).toBeNull();
    },
  );
});

describe("when partial altitude accuracy data is present", () => {
  const journey = createJourney({
    positions: [
      {
        coords: createCoordinates({ altitudeAccuracy: 10 }),
        timestamp: 0,
      },
      {
        coords: createCoordinates({ altitudeAccuracy: null }),
        timestamp: 50,
      },
      {
        coords: createCoordinates({ altitudeAccuracy: 30 }),
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
  ])(
    "doesn't interpolate altitudeAccuracy for time = %s",
    (offsetTime, altitudeAccuracy) => {
      const [a, b, t] = journey.segmentAtOffsetTime(offsetTime);

      expect(lerpPosition(a, b, t).altitudeAccuracy).toBe(altitudeAccuracy);
    },
  );
});
