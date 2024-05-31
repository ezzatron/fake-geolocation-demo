import { beforeEach, describe, expect, it } from "vitest";
import { createJourney, type Journey } from "../../src/journey";

describe("createJourney()", () => {
  let journey: Journey;

  beforeEach(() => {
    journey = createJourney(
      {
        latitude: 0,
        longitude: 0,
        altitude: 0,
        accuracy: 10,
        altitudeAccuracy: 10,
        heading: null,
        speed: null,
      },
      {
        latitude: 1,
        longitude: 1,
        altitude: 1,
        accuracy: 10,
        altitudeAccuracy: 10,
        heading: null,
        speed: null,
      },
    );
  });

  describe("coordsAtRatio()", () => {
    it("should return the position at the start of the journey", () => {
      const coords = journey.coordsAtRatio(0);

      expect(coords.latitude).toBeCloseTo(0, 10);
      expect(coords.longitude).toBeCloseTo(0, 10);
      expect(coords.altitude).toBeCloseTo(0, 10);
    });

    it("should return the position at the end of the journey", () => {
      const coords = journey.coordsAtRatio(1);

      expect(coords.latitude).toBeCloseTo(1, 10);
      expect(coords.longitude).toBeCloseTo(1, 10);
      expect(coords.altitude).toBeCloseTo(1, 10);
    });

    it("should return the position at the middle of the journey", () => {
      const coords = journey.coordsAtRatio(0.5);

      expect(coords.latitude).toBeCloseTo(0.5509374423857688, 10);
      expect(coords.longitude).toBeCloseTo(0.33838006814982347, 10);
      expect(coords.altitude).toBeCloseTo(0.5, 10);
    });
  });
});
