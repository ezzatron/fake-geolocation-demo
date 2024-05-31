import { describe, expect, it } from "vitest";
import { createJourney } from "../../../src/journey";
import { createCoordinates } from "./util";

describe("when latitude is constant", () => {
  let t = 50;

  const journey = createJourney(
    {
      coords: createCoordinates({ latitude: 90, longitude: -170 }),
      timestamp: (t += 0), // 50
    },
    {
      coords: createCoordinates({ latitude: 90, longitude: 170 }),
      timestamp: (t += 50), // 100
    },
    {
      coords: createCoordinates({ latitude: 90, longitude: 70 }),
      timestamp: (t += 100), // 200
    },
  );

  it.each([
    [25, -170],
    [50, -170],
    [75, 180],
    [100, 170],
    [125, 150.78973302883216],
    [150, 120],
    [175, 89.21026697116784],
    [200, 70],
    [225, 70],
  ])("linearly interpolates the coordinates for time = %s", (t, longitude) => {
    expect(journey.coordsAtTime(t)).toMatchObject({
      latitude: 90,
      longitude: expect.closeTo(longitude, 10) as number,
    });
  });
});

describe("when longitude is constant", () => {
  let t = 50;

  const journey = createJourney(
    {
      coords: createCoordinates({ latitude: 70, longitude: 180 }),
      timestamp: (t += 0), // 50
    },
    {
      coords: createCoordinates({ latitude: 80, longitude: 180 }),
      timestamp: (t += 50), // 100
    },
    {
      coords: createCoordinates({ latitude: 90, longitude: 180 }),
      timestamp: (t += 100), // 200
    },
  );

  it.each([
    [25, 70],
    [50, 70],
    [75, 75],
    [100, 80],
    [125, 82.4952312784634],
    [150, 85],
    [175, 87.5047687215366],
    [200, 90],
    [225, 90],
  ])("linearly interpolates the coordinates for time = %s", (t, latitude) => {
    expect(journey.coordsAtTime(t)).toMatchObject({
      latitude: expect.closeTo(latitude, 10) as number,
      longitude: 180,
    });
  });
});
