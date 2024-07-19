import { createCoordinates, createPosition } from "fake-geolocation";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  createJourney,
  createLerpPlayer,
  type JourneyPlayerEvent,
  type Unsubscribe,
} from "../../../src/journey";

const journey = createJourney({
  positions: [
    {
      coords: createCoordinates({ longitude: -170, latitude: 70 }),
      timestamp: 0,
    },
    {
      coords: createCoordinates({ longitude: 170, latitude: 80 }),
      timestamp: 20000,
    },
    {
      coords: createCoordinates({ longitude: 70, latitude: 90 }),
      timestamp: 40000,
    },
  ],
  chapters: [
    {
      description: "<chapter A>",
      time: 0,
    },
    {
      description: "<chapter B>",
      time: 10000,
    },
    {
      description: "<chapter C>",
      time: 30000,
    },
  ],
});

const START_TIME = 100000;
let unsubscribe: Unsubscribe | undefined;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(START_TIME);
});

afterEach(() => {
  vi.useRealTimers();
  unsubscribe?.();
});

it("plays a journey with linearly interpolated positions", () => {
  const player = createLerpPlayer(journey, 10000);
  const events: JourneyPlayerEvent[] = [];
  unsubscribe = player.subscribe((event) => {
    events.push(event);
  });
  player.play();
  vi.runAllTimers();

  let idx = 0;

  expect(events[idx++]).toEqual({ type: "PLAY", details: {} });
  expect(events[idx++]).toEqual({
    type: "POSITION",
    details: {
      offsetTime: 0,
      position: createPosition(
        createCoordinates({
          longitude: -170,
          latitude: 70,
          heading: expect.closeTo(342.05490135397787, 10) as number,
          speed: expect.closeTo(61965.40175162239, 10) as number,
        }),
        START_TIME,
      ),
    },
  });
  expect(events[idx++]).toEqual({
    type: "POSITION",
    details: {
      offsetTime: 10000,
      position: createPosition(
        createCoordinates({
          longitude: expect.closeTo(-176.70495327058325, 10) as number,
          latitude: expect.closeTo(75.19442943503938, 10) as number,
          heading: expect.closeTo(342.05490135397787, 10) as number,
          speed: expect.closeTo(61965.40175162239, 10) as number,
        }),
        START_TIME + 10000,
      ),
    },
  });
  expect(events[idx++]).toEqual({
    type: "POSITION",
    details: {
      offsetTime: 20000,
      position: createPosition(
        createCoordinates({
          longitude: 170,
          latitude: 80,
          heading: 0,
          speed: expect.closeTo(55770.44531996764, 10) as number,
        }),
        START_TIME + 20000,
      ),
    },
  });
  expect(events[idx++]).toEqual({
    type: "POSITION",
    details: {
      offsetTime: 30000,
      position: createPosition(
        createCoordinates({
          longitude: 170,
          latitude: 85,
          heading: 0,
          speed: expect.closeTo(55770.44531996764, 10) as number,
        }),
        START_TIME + 30000,
      ),
    },
  });
  expect(events[idx++]).toEqual({
    type: "POSITION",
    details: {
      offsetTime: 40000,
      position: createPosition(
        createCoordinates({
          longitude: 70,
          latitude: 90,
          heading: NaN,
          speed: 0,
        }),
        START_TIME + 40000,
      ),
    },
  });
  expect(events).toHaveLength(6);
});

it("can be paused", () => {
  const player = createLerpPlayer(journey, 10000);
  const events: JourneyPlayerEvent[] = [];
  unsubscribe = player.subscribe((event) => {
    events.push(event);
  });

  expect(player.isPaused).toBe(true);

  player.play();
  vi.advanceTimersByTime(5000);

  expect(player.isPaused).toBe(false);

  player.pause();
  vi.advanceTimersByTime(5000);

  expect(player.isPaused).toBe(true);

  player.play();
  vi.runAllTimers();

  let idx = 0;

  expect(events[idx++]).toEqual({ type: "PLAY", details: {} });
  expect(events[idx++]).toEqual({
    type: "POSITION",
    details: {
      offsetTime: 0,
      position: createPosition(
        createCoordinates({
          longitude: -170,
          latitude: 70,
          heading: expect.closeTo(342.05490135397787, 10) as number,
          speed: expect.closeTo(61965.40175162239, 10) as number,
        }),
        START_TIME,
      ),
    },
  });
  expect(events[idx++]).toEqual({ type: "PAUSE", details: {} });
  expect(events[idx++]).toEqual({ type: "PLAY", details: {} });
  expect(events[idx++]).toEqual({
    type: "POSITION",
    details: {
      offsetTime: 10000,
      position: createPosition(
        createCoordinates({
          longitude: expect.closeTo(-176.70495327058325, 10) as number,
          latitude: expect.closeTo(75.19442943503938, 10) as number,
          heading: expect.closeTo(342.05490135397787, 10) as number,
          speed: expect.closeTo(61965.40175162239, 10) as number,
        }),
        START_TIME + 15000,
      ),
    },
  });
  expect(events[idx++]).toEqual({
    type: "POSITION",
    details: {
      offsetTime: 20000,
      position: createPosition(
        createCoordinates({
          longitude: 170,
          latitude: 80,
          heading: 0,
          speed: expect.closeTo(55770.44531996764, 10) as number,
        }),
        START_TIME + 25000,
      ),
    },
  });
  expect(events[idx++]).toEqual({
    type: "POSITION",
    details: {
      offsetTime: 30000,
      position: createPosition(
        createCoordinates({
          longitude: 170,
          latitude: 85,
          heading: 0,
          speed: expect.closeTo(55770.44531996764, 10) as number,
        }),
        START_TIME + 35000,
      ),
    },
  });
  expect(events[idx++]).toEqual({
    type: "POSITION",
    details: {
      offsetTime: 40000,
      position: createPosition(
        createCoordinates({
          longitude: 70,
          latitude: 90,
          heading: NaN,
          speed: 0,
        }),
        START_TIME + 45000,
      ),
    },
  });
  expect(events).toHaveLength(8);
});

it("can seek to a specific time", () => {
  const player = createLerpPlayer(journey, 10000);
  const events: JourneyPlayerEvent[] = [];
  unsubscribe = player.subscribe((event) => {
    events.push(event);
  });
  player.seek(20000);
  vi.advanceTimersByTime(2500);
  player.play();
  vi.advanceTimersByTime(2500);
  player.seek(30000);
  vi.runAllTimers();

  let idx = 0;

  expect(events[idx++]).toEqual({
    type: "POSITION",
    details: {
      offsetTime: 20000,
      position: createPosition(
        createCoordinates({
          longitude: 170,
          latitude: 80,
          heading: 0,
          speed: expect.closeTo(55770.44531996764, 10) as number,
        }),
        START_TIME,
      ),
    },
  });
  expect(events[idx++]).toEqual({ type: "PLAY", details: {} });
  expect(events[idx++]).toEqual({
    type: "POSITION",
    details: {
      offsetTime: 20000,
      position: createPosition(
        createCoordinates({
          longitude: 170,
          latitude: 80,
          heading: 0,
          speed: expect.closeTo(55770.44531996764, 10) as number,
        }),
        START_TIME + 2500,
      ),
    },
  });
  expect(events[idx++]).toEqual({
    type: "POSITION",
    details: {
      offsetTime: 30000,
      position: createPosition(
        createCoordinates({
          longitude: 170,
          latitude: 85,
          heading: 0,
          speed: expect.closeTo(55770.44531996764, 10) as number,
        }),
        START_TIME + 5000,
      ),
    },
  });
  expect(events[idx++]).toEqual({
    type: "POSITION",
    details: {
      offsetTime: 40000,
      position: createPosition(
        createCoordinates({
          longitude: 70,
          latitude: 90,
          heading: NaN,
          speed: 0,
        }),
        START_TIME + 15000,
      ),
    },
  });
  expect(events).toHaveLength(5);
});

it("can seek to the start and end of the journey", () => {
  const player = createLerpPlayer(journey, 10000);
  const events: JourneyPlayerEvent[] = [];
  unsubscribe = player.subscribe((event) => {
    events.push(event);
  });
  player.seek(journey.endTime);
  player.play();
  vi.advanceTimersByTime(10000);
  player.seek(journey.startTime);
  vi.advanceTimersByTime(10000);

  let idx = 0;

  expect(events[idx++]).toEqual({
    type: "POSITION",
    details: {
      offsetTime: 40000,
      position: createPosition(
        createCoordinates({
          longitude: 70,
          latitude: 90,
          heading: NaN,
          speed: 0,
        }),
        START_TIME,
      ),
    },
  });
  expect(events[idx++]).toEqual({ type: "PLAY", details: {} });
  expect(events[idx++]).toEqual({
    type: "POSITION",
    details: {
      offsetTime: 40000,
      position: createPosition(
        createCoordinates({
          longitude: 70,
          latitude: 90,
          heading: NaN,
          speed: 0,
        }),
        START_TIME,
      ),
    },
  });
  expect(events[idx++]).toEqual({
    type: "POSITION",
    details: {
      offsetTime: 0,
      position: createPosition(
        createCoordinates({
          longitude: -170,
          latitude: 70,
          heading: expect.closeTo(342.05490135397787, 10) as number,
          speed: expect.closeTo(61965.40175162239, 10) as number,
        }),
        START_TIME + 10000,
      ),
    },
  });
  expect(events[idx++]).toEqual({
    type: "POSITION",
    details: {
      offsetTime: 10000,
      position: createPosition(
        createCoordinates({
          longitude: expect.closeTo(-176.70495327058325, 10) as number,
          latitude: expect.closeTo(75.19442943503938, 10) as number,
          heading: expect.closeTo(342.05490135397787, 10) as number,
          speed: expect.closeTo(61965.40175162239, 10) as number,
        }),
        START_TIME + 20000,
      ),
    },
  });
  expect(events).toHaveLength(5);
});

it("can seek to the next chapter", () => {
  const player = createLerpPlayer(journey, 10000);
  const events: JourneyPlayerEvent[] = [];
  unsubscribe = player.subscribe((event) => {
    events.push(event);
  });
  player.seekToNextChapter();
  vi.advanceTimersByTime(2500);
  player.play();
  vi.advanceTimersByTime(2500);
  player.seekToNextChapter();
  vi.runAllTimers();

  let idx = 0;

  expect(events[idx++]).toEqual({
    type: "POSITION",
    details: {
      offsetTime: 10000,
      position: createPosition(
        createCoordinates({
          longitude: expect.closeTo(-176.70495327058325, 10) as number,
          latitude: expect.closeTo(75.19442943503938, 10) as number,
          heading: expect.closeTo(342.05490135397787, 10) as number,
          speed: expect.closeTo(61965.40175162239, 10) as number,
        }),
        START_TIME,
      ),
    },
  });
  expect(events[idx++]).toEqual({ type: "PLAY", details: {} });
  expect(events[idx++]).toEqual({
    type: "POSITION",
    details: {
      offsetTime: 10000,
      position: createPosition(
        createCoordinates({
          longitude: expect.closeTo(-176.70495327058325, 10) as number,
          latitude: expect.closeTo(75.19442943503938, 10) as number,
          heading: expect.closeTo(342.05490135397787, 10) as number,
          speed: expect.closeTo(61965.40175162239, 10) as number,
        }),
        START_TIME + 2500,
      ),
    },
  });
  expect(events[idx++]).toEqual({
    type: "POSITION",
    details: {
      offsetTime: 30000,
      position: createPosition(
        createCoordinates({
          longitude: 170,
          latitude: 85,
          heading: 0,
          speed: expect.closeTo(55770.44531996764, 10) as number,
        }),
        START_TIME + 5000,
      ),
    },
  });
  expect(events[idx++]).toEqual({
    type: "POSITION",
    details: {
      offsetTime: 40000,
      position: createPosition(
        createCoordinates({
          longitude: 70,
          latitude: 90,
          heading: NaN,
          speed: 0,
        }),
        START_TIME + 15000,
      ),
    },
  });
  expect(events).toHaveLength(5);
});

it("can seek to the previous chapter", () => {
  const player = createLerpPlayer(journey, 10000);
  const events: JourneyPlayerEvent[] = [];
  unsubscribe = player.subscribe((event) => {
    events.push(event);
  });
  player.seek(10000);
  player.play();
  vi.advanceTimersByTime(10000);
  player.seekToPreviousChapter();
  vi.advanceTimersByTime(2999);
  player.seekToPreviousChapter();
  vi.runAllTimers();

  let idx = 0;

  expect(events[idx++]).toEqual({
    type: "POSITION",
    details: {
      offsetTime: 10000,
      position: createPosition(
        createCoordinates({
          longitude: expect.closeTo(-176.70495327058325, 10) as number,
          latitude: expect.closeTo(75.19442943503938, 10) as number,
          heading: expect.closeTo(342.05490135397787, 10) as number,
          speed: expect.closeTo(61965.40175162239, 10) as number,
        }),
        START_TIME,
      ),
    },
  });
  expect(events[idx++]).toEqual({ type: "PLAY", details: {} });
  expect(events[idx++]).toEqual({
    type: "POSITION",
    details: {
      offsetTime: 10000,
      position: createPosition(
        createCoordinates({
          longitude: expect.closeTo(-176.70495327058325, 10) as number,
          latitude: expect.closeTo(75.19442943503938, 10) as number,
          heading: expect.closeTo(342.05490135397787, 10) as number,
          speed: expect.closeTo(61965.40175162239, 10) as number,
        }),
        START_TIME,
      ),
    },
  });
  expect(events[idx++]).toEqual({
    type: "POSITION",
    details: {
      offsetTime: 20000,
      position: createPosition(
        createCoordinates({
          longitude: 170,
          latitude: 80,
          heading: 0,
          speed: expect.closeTo(55770.44531996764, 10) as number,
        }),
        START_TIME + 10000,
      ),
    },
  });
  expect(events[idx++]).toEqual({
    type: "POSITION",
    details: {
      offsetTime: 10000,
      position: createPosition(
        createCoordinates({
          longitude: expect.closeTo(-176.70495327058325, 10) as number,
          latitude: expect.closeTo(75.19442943503938, 10) as number,
          heading: expect.closeTo(342.05490135397787, 10) as number,
          speed: expect.closeTo(61965.40175162239, 10) as number,
        }),
        START_TIME + 10000,
      ),
    },
  });
  expect(events[idx++]).toEqual({
    type: "POSITION",
    details: {
      offsetTime: 0,
      position: createPosition(
        createCoordinates({
          longitude: -170,
          latitude: 70,
          heading: expect.closeTo(342.05490135397787, 10) as number,
          speed: expect.closeTo(61965.40175162239, 10) as number,
        }),
        START_TIME + 12999,
      ),
    },
  });
  expect(events[idx++]).toEqual({
    type: "POSITION",
    details: {
      offsetTime: 10000,
      position: createPosition(
        createCoordinates({
          longitude: expect.closeTo(-176.70495327058325, 10) as number,
          latitude: expect.closeTo(75.19442943503938, 10) as number,
          heading: expect.closeTo(342.05490135397787, 10) as number,
          speed: expect.closeTo(61965.40175162239, 10) as number,
        }),
        START_TIME + 22999,
      ),
    },
  });
  expect(events[idx++]).toEqual({
    type: "POSITION",
    details: {
      offsetTime: 20000,
      position: createPosition(
        createCoordinates({
          longitude: 170,
          latitude: 80,
          heading: 0,
          speed: expect.closeTo(55770.44531996764, 10) as number,
        }),
        START_TIME + 32999,
      ),
    },
  });
  expect(events[idx++]).toEqual({
    type: "POSITION",
    details: {
      offsetTime: 30000,
      position: createPosition(
        createCoordinates({
          longitude: 170,
          latitude: 85,
          heading: 0,
          speed: expect.closeTo(55770.44531996764, 10) as number,
        }),
        START_TIME + 42999,
      ),
    },
  });
  expect(events[idx++]).toEqual({
    type: "POSITION",
    details: {
      offsetTime: 40000,
      position: createPosition(
        createCoordinates({
          longitude: 70,
          latitude: 90,
          heading: NaN,
          speed: 0,
        }),
        START_TIME + 52999,
      ),
    },
  });
  expect(events).toHaveLength(10);
});
