import { expect, it } from "vitest";
import { createJourney } from "../../../src/journey";
import { createCoordinates } from "./util";

const journey = createJourney(
  {
    coords: createCoordinates({ latitude: 70, longitude: -170 }),
    timestamp: 0,
  },
  {
    coords: createCoordinates({ latitude: 80, longitude: 170 }),
    timestamp: 50,
  },
  {
    coords: createCoordinates({ latitude: 90, longitude: 70 }),
    timestamp: 150,
  },
);

it.each([
  [-25, 70, -170],
  [0, 70, -170],
  [25, 75.19442943503938, -176.70495327058325],
  [50, 80, 170],
  [75, 82.4952312784634, 170],
  [100, 85, 170],
  [125, 87.5047687215366, 170],
  [150, 90, 70],
  [175, 90, 70],
])(
  "linearly interpolates the coordinates for time = %s",
  (t, latitude, longitude) => {
    expect(journey.coordsAtTime(t)).toMatchObject({
      latitude: expect.closeTo(latitude, 10) as number,
      longitude: expect.closeTo(longitude, 10) as number,
    });
  },
);
