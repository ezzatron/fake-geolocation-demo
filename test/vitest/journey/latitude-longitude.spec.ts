import { expect, it } from "vitest";
import { createJourney } from "../../../src/journey";
import { createCoordinates } from "./util";

const journey = createJourney(
  {
    coords: createCoordinates({ longitude: -170, latitude: 70 }),
    timestamp: 0,
  },
  {
    coords: createCoordinates({ longitude: 170, latitude: 80 }),
    timestamp: 50,
  },
  {
    coords: createCoordinates({ longitude: 70, latitude: 90 }),
    timestamp: 150,
  },
);

it.each([
  [-25, -170, 70],
  [0, -170, 70],
  [25, -176.70495327058325, 75.19442943503938],
  [50, 170, 80],
  [75, 170, 82.4952312784634],
  [100, 170, 85],
  [125, 170, 87.5047687215366],
  [150, 70, 90],
  [175, 70, 90],
])(
  "linearly interpolates the coordinates for time = %s",
  (t, longitude, latitude) => {
    expect(journey.coordsAtTime(t)).toMatchObject({
      longitude: expect.closeTo(longitude, 10) as number,
      latitude: expect.closeTo(latitude, 10) as number,
    });
  },
);
