import { describe, expect, it } from "vitest";
import { boundingBox, createJourney } from "../../../src/journey";
import { createCoordinates } from "./util";

describe("when the journey does not span the dateline", () => {
  const journey = createJourney(
    {
      coords: createCoordinates({ longitude: 20, latitude: 2 }),
      timestamp: 50,
    },
    {
      coords: createCoordinates({ longitude: 30, latitude: 3 }),
      timestamp: 150,
    },
    {
      coords: createCoordinates({ longitude: 10, latitude: 1 }),
      timestamp: 0,
    },
  );

  it("finds the bounding box of the journey", () => {
    expect(boundingBox(...journey.positions)).toMatchObject([10, 1, 30, 3]);
  });
});

describe("when the journey spans the dateline", () => {
  const journey = createJourney(
    {
      coords: createCoordinates({ longitude: 178, latitude: 2 }),
      timestamp: 50,
    },
    {
      coords: createCoordinates({ longitude: -175, latitude: 3 }),
      timestamp: 150,
    },
    {
      coords: createCoordinates({ longitude: 175, latitude: 1 }),
      timestamp: 0,
    },
  );

  it("finds the bounding box of the journey", () => {
    expect(boundingBox(...journey.positions)).toMatchObject([175, 1, 185, 3]);
  });
});
