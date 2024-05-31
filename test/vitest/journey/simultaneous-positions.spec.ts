import { describe, expect, it } from "vitest";
import { createJourney } from "../../../src/journey";
import { createCoordinates } from "./util";

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

  it("interpolates with the first position before the overlapping time", () => {
    expect(journey.coordsAtTime(5).accuracy).toBe(1.5);
  });

  it("returns the last position for the overlapping time", () => {
    expect(journey.coordsAtTime(10).accuracy).toBe(3);
  });

  it("interpolates with the last position after the overlapping time", () => {
    expect(journey.coordsAtTime(15).accuracy).toBe(3.5);
  });
});
