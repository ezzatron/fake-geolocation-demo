import { describe, expect, it } from "vitest";
import { createJourney } from "../../../src/journey";
import { createCoordinates } from "./util";

describe("when latitude is constant", () => {
  const journey = createJourney(
    {
      coords: createCoordinates({ latitude: 90, longitude: -170 }),
      timestamp: 0,
    },
    {
      coords: createCoordinates({ latitude: 90, longitude: 170 }),
      timestamp: 50,
    },
    {
      coords: createCoordinates({ latitude: 90, longitude: 70 }),
      timestamp: 150,
    },
  );

  it.each([
    [-25, -170],
    [0, -170],
    [25, 180],
    [50, 170],
    [75, 150.78973302883216],
    [100, 120],
    [125, 89.21026697116784],
    [150, 70],
    [175, 70],
  ])("linearly interpolates the coordinates for time = %s", (t, longitude) => {
    expect(journey.coordsAtTime(t)).toMatchObject({
      latitude: 90,
      longitude: expect.closeTo(longitude, 10) as number,
    });
  });
});

describe("when longitude is constant", () => {
  const journey = createJourney(
    {
      coords: createCoordinates({ latitude: 70, longitude: 180 }),
      timestamp: 0,
    },
    {
      coords: createCoordinates({ latitude: 80, longitude: 180 }),
      timestamp: 50,
    },
    {
      coords: createCoordinates({ latitude: 90, longitude: 180 }),
      timestamp: 150,
    },
  );

  it.each([
    [-25, 70],
    [0, 70],
    [25, 75],
    [50, 80],
    [75, 82.4952312784634],
    [100, 85],
    [125, 87.5047687215366],
    [150, 90],
    [175, 90],
  ])("linearly interpolates the coordinates for time = %s", (t, latitude) => {
    expect(journey.coordsAtTime(t)).toMatchObject({
      latitude: expect.closeTo(latitude, 10) as number,
      longitude: 180,
    });
  });
});
