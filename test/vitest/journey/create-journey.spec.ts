import { createCoordinates } from "fake-geolocation";
import { expect, it } from "vitest";
import { createJourney } from "../../../src/journey";

const journey = createJourney({
  positions: [
    {
      coords: createCoordinates({ accuracy: 2 }),
      timestamp: 150,
    },
    {
      coords: createCoordinates({ accuracy: 3 }),
      timestamp: 250,
    },
    {
      coords: createCoordinates({ accuracy: 1 }),
      timestamp: 100,
    },
  ],
  chapters: [
    {
      description: "<chapter B>",
      time: 150,
    },
    {
      description: "<chapter A>",
      time: 100,
    },
  ],
});

it("finds the start position", () => {
  expect(journey.startPosition).toMatchObject({
    coords: { accuracy: 1 },
  });
});

it("finds the end position", () => {
  expect(journey.endPosition).toMatchObject({
    coords: { accuracy: 3 },
  });
});

it("finds the chapter at a given time", () => {
  expect(journey.chapterAtTime(99)).toBeUndefined();
  expect(journey.chapterAtTime(100)).toEqual({
    description: "<chapter A>",
    time: 100,
    offsetTime: 0,
    duration: 50,
  });
  expect(journey.chapterAtTime(149)).toMatchObject({
    description: "<chapter A>",
  });
  expect(journey.chapterAtTime(150)).toEqual({
    description: "<chapter B>",
    time: 150,
    offsetTime: 50,
    duration: 100,
  });
  expect(journey.chapterAtTime(250)).toMatchObject({
    description: "<chapter B>",
  });
  expect(journey.chapterAtTime(251)).toBeUndefined();
});

it("finds the chapter at a given offset time", () => {
  expect(journey.chapterAtOffsetTime(-1)).toBeUndefined();
  expect(journey.chapterAtOffsetTime(0)).toMatchObject({
    description: "<chapter A>",
  });
  expect(journey.chapterAtOffsetTime(49)).toMatchObject({
    description: "<chapter A>",
  });
  expect(journey.chapterAtOffsetTime(50)).toMatchObject({
    description: "<chapter B>",
  });
  expect(journey.chapterAtOffsetTime(150)).toMatchObject({
    description: "<chapter B>",
  });
  expect(journey.chapterAtOffsetTime(151)).toBeUndefined();
});
