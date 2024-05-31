import { beforeEach, describe, expect, it } from "vitest";
import { createJourney, type Journey } from "../../src/journey";

describe("createJourney()", () => {
  let journey: Journey;

  beforeEach(() => {
    journey = createJourney({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [0, 0],
          },
          properties: {
            time: "2021-01-01T00:00:00Z",
          },
        },
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [1, 1],
          },
          properties: {
            time: "2021-01-01T00:01:00Z",
          },
        },
      ],
    });
  });

  describe("positionAtRatio()", () => {
    it("should return the position at the start of the journey", () => {
      const position = journey.positionAtRatio(0);

      expect(position).toEqual([0, 0]);
    });

    it("should return the position at the end of the journey", () => {
      const position = journey.positionAtRatio(1);

      expect(position).toEqual([1, 1]);
    });

    it("should return the position at the middle of the journey", () => {
      const position = journey.positionAtRatio(0.5);

      expect(position).toEqual([0.5, 0.5]);
    });
  });
});
