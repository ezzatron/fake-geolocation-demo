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

  expect(
    journey.coordinatesAtTime(new Date("2002-03-09T16:19:57Z").getTime()),
  ).toMatchObject({
    longitude: -71.265993,
    latitude: 42.049785,
    altitude: 47.241821,
  });
  expect(
    journey.coordinatesAtTime(new Date("2002-03-09T16:22:07Z").getTime()),
  ).toMatchObject({
    longitude: -71.265929,
    latitude: 42.049656,
    altitude: 61.18103,
  });
  expect(
    journey.coordinatesAtTime(new Date("2002-03-09T16:22:27Z").getTime()),
  ).toMatchObject({
    longitude: -71.266165,
    latitude: 42.049677,
    altitude: 62.142334,
  });
});
