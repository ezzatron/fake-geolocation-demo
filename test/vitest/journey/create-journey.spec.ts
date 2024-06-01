import { expect, it } from "vitest";
import { createJourney } from "../../../src/journey";

it("throws if no positions are provided", () => {
  expect(() => createJourney()).toThrowError("No positions provided");
  expect(() => createJourney()).toThrowError(TypeError);
});
