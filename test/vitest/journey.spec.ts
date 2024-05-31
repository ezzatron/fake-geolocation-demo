import { beforeEach, describe, expect, it } from "vitest";
import { createJourney, type Journey } from "../../src/journey";

const ZERO_COORDS: GeolocationCoordinates = {
  latitude: 0,
  longitude: 0,
  altitude: null,
  accuracy: 0,
  altitudeAccuracy: null,
  heading: null,
  speed: null,
};

function createCoordinates(
  coords: Partial<GeolocationCoordinates>,
): GeolocationCoordinates {
  return { ...ZERO_COORDS, ...coords };
}

describe("createJourney()", () => {
  it("throws if no positions are provided", () => {
    expect(() => createJourney()).toThrowError("No positions provided");
    expect(() => createJourney()).toThrowError(TypeError);
  });

  describe("coordsAtTime()", () => {
    let journey: Journey;

    beforeEach(() => {
      journey = createJourney(
        {
          coords: createCoordinates({
            latitude: 90,
            longitude: -150,
            altitude: 100,
            accuracy: 100,
            altitudeAccuracy: 100,
          }),
          timestamp: 100,
        },
        {
          coords: createCoordinates({
            latitude: 90,
            longitude: 150,
            altitude: 200,
            accuracy: 200,
            altitudeAccuracy: 200,
          }),
          timestamp: 125,
        },
        {
          coords: createCoordinates({
            latitude: 90,
            longitude: 50,
            altitude: 300,
            accuracy: 300,
            altitudeAccuracy: 300,
          }),
          timestamp: 200,
        },
      );
    });

    it("returns the first position before the start time", () => {
      const coords = journey.coordsAtTime(50);

      expect(coords).toMatchObject({
        latitude: expect.closeTo(90, 10) as number,
        longitude: expect.closeTo(-150, 10) as number,
        altitude: expect.closeTo(100, 10) as number,
        accuracy: expect.closeTo(100, 10) as number,
        altitudeAccuracy: expect.closeTo(100, 10) as number,
      });
    });

    it("returns the first position at the start time", () => {
      const coords = journey.coordsAtTime(100);

      expect(coords).toMatchObject({
        latitude: expect.closeTo(90, 10) as number,
        longitude: expect.closeTo(-150, 10) as number,
        altitude: expect.closeTo(100, 10) as number,
        accuracy: expect.closeTo(100, 10) as number,
        altitudeAccuracy: expect.closeTo(100, 10) as number,
      });
    });

    it("returns a mid position when at that position's time", () => {
      const coords = journey.coordsAtTime(125);

      expect(coords).toMatchObject({
        latitude: expect.closeTo(90, 10) as number,
        longitude: expect.closeTo(150, 10) as number,
        altitude: expect.closeTo(200, 10) as number,
        accuracy: expect.closeTo(200, 10) as number,
        altitudeAccuracy: expect.closeTo(200, 10) as number,
      });
    });

    it("returns the last position at the end time", () => {
      const coords = journey.coordsAtTime(200);

      expect(coords).toMatchObject({
        latitude: expect.closeTo(90, 10) as number,
        longitude: expect.closeTo(50, 10) as number,
        altitude: expect.closeTo(300, 10) as number,
        accuracy: expect.closeTo(300, 10) as number,
        altitudeAccuracy: expect.closeTo(300, 10) as number,
      });
    });

    it("returns the last position after the end time", () => {
      const coords = journey.coordsAtTime(250);

      expect(coords).toMatchObject({
        latitude: expect.closeTo(90, 10) as number,
        longitude: expect.closeTo(50, 10) as number,
        altitude: expect.closeTo(300, 10) as number,
        accuracy: expect.closeTo(300, 10) as number,
        altitudeAccuracy: expect.closeTo(300, 10) as number,
      });
    });

    it.each`
      t        | latitude | longitude | altitude | accuracy | altitudeAccuracy
      ${112.5} | ${90}    | ${180}    | ${150}   | ${150}   | ${150}
      ${162.5} | ${90}    | ${100}    | ${250}   | ${250}   | ${250}
    `(
      "returns the interpolated position at time = $t",
      ({
        t,
        latitude,
        longitude,
        altitude,
        accuracy,
        altitudeAccuracy,
      }: {
        t: number;
        latitude: number;
        longitude: number;
        altitude: number;
        accuracy: number;
        altitudeAccuracy: number;
      }) => {
        const coords = journey.coordsAtTime(t);

        expect(coords).toMatchObject({
          latitude: expect.closeTo(latitude, 10) as number,
          longitude: expect.closeTo(longitude, 10) as number,
          altitude: expect.closeTo(altitude, 10) as number,
          accuracy: expect.closeTo(accuracy, 10) as number,
          altitudeAccuracy: expect.closeTo(altitudeAccuracy, 10) as number,
        });
      },
    );
  });
});
