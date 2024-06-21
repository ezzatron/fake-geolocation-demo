import { createCoordinates } from "fake-geolocation";
import { describe, expect, it } from "vitest";
import { createJourney } from "../../../src/journey";

describe("when two positions occur at the exact same time", () => {
  const journey = createJourney(
    {
      coords: createCoordinates({ accuracy: 1 }),
      timestamp: 0,
    },
    {
      coords: createCoordinates({ accuracy: 2 }),
      timestamp: 10,
    },
    {
      coords: createCoordinates({ accuracy: 3 }),
      timestamp: 10,
    },
    {
      coords: createCoordinates({ accuracy: 4 }),
      timestamp: 20,
    },
  );

  it("picks the first position before the overlapping time", () => {
    expect(journey.segmentAtOffsetTime(5)).toMatchObject([
      {
        coords: createCoordinates({ accuracy: 1 }),
        timestamp: 0,
      },
      {
        coords: createCoordinates({ accuracy: 2 }),
        timestamp: 10,
      },
      0.5,
    ]);
  });

  it("picks the last position for the overlapping time", () => {
    expect(journey.segmentAtOffsetTime(10)).toMatchObject([
      {
        coords: createCoordinates({ accuracy: 3 }),
        timestamp: 10,
      },
      {
        coords: createCoordinates({ accuracy: 4 }),
        timestamp: 20,
      },
      0,
    ]);
  });

  it("picks the last position after the overlapping time", () => {
    expect(journey.segmentAtOffsetTime(15)).toMatchObject([
      {
        coords: createCoordinates({ accuracy: 3 }),
        timestamp: 10,
      },
      {
        coords: createCoordinates({ accuracy: 4 }),
        timestamp: 20,
      },
      0.5,
    ]);
  });
});
