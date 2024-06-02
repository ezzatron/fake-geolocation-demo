import { expect, it } from "vitest";
import {
  createJourneyFromGeoJSON,
  type GeoJSONJourney,
} from "../../../src/journey";

const geoJSON: GeoJSONJourney = {
  type: "Feature",
  properties: {
    coordinateProperties: {
      times: [
        "2002-03-09T16:22:27Z",
        null,
        "2002-03-09T16:19:57Z",
        null,
        "2002-03-09T16:22:07Z",
      ],
    },
  },
  geometry: {
    type: "LineString",
    coordinates: [
      [-71.266165, 42.049677, 62.142334],
      [1, 2, 3],
      [-71.265993, 42.049785, 47.241821],
      [4, 5, 6],
      [-71.265929, 42.049656, 61.18103],
    ],
  },
};

it("creates a journey from GeoJSON", () => {
  const journey = createJourneyFromGeoJSON(geoJSON);

  const timeA = new Date("2002-03-09T16:19:57Z").getTime();
  const timeB = new Date("2002-03-09T16:22:07Z").getTime();
  const timeC = new Date("2002-03-09T16:22:27Z").getTime();

  expect(journey.coordinatesAtOffset(0)).toMatchObject({
    longitude: expect.closeTo(-71.265993, 8) as number,
    latitude: expect.closeTo(42.049785, 8) as number,
    altitude: expect.closeTo(47.241821, 8) as number,
  });
  expect(journey.coordinatesAtOffset(timeB - timeA)).toMatchObject({
    longitude: expect.closeTo(-71.265929, 8) as number,
    latitude: expect.closeTo(42.049656, 8) as number,
    altitude: expect.closeTo(61.18103, 8) as number,
  });
  expect(journey.coordinatesAtOffset(timeC - timeA)).toMatchObject({
    longitude: expect.closeTo(-71.266165, 8) as number,
    latitude: expect.closeTo(42.049677, 8) as number,
    altitude: expect.closeTo(62.142334, 8) as number,
  });
});
