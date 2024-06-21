import { createCoordinates, createPosition } from "fake-geolocation";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  createJourney,
  createLerpPlayer,
  type JourneyPlayerEvent,
  type Unsubscribe,
} from "../../../src/journey";

const journey = createJourney(
  {
    coords: createCoordinates({ longitude: -170, latitude: 70 }),
    timestamp: 0,
  },
  {
    coords: createCoordinates({ longitude: 170, latitude: 80 }),
    timestamp: 200,
  },
  {
    coords: createCoordinates({ longitude: 70, latitude: 90 }),
    timestamp: 400,
  },
);

const START_TIME = 1000;
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
  const player = createLerpPlayer(journey);
  const events: JourneyPlayerEvent[] = [];
  unsubscribe = player.subscribe((event) => {
    events.push(event);
  });
  player.play();
  vi.runAllTimers();

  expect(events[0]).toEqual({
    type: "POSITION",
    details: {
      position: createPosition(
        createCoordinates({
          longitude: -170,
          latitude: 70,
          heading: expect.closeTo(342.05490135397787, 10) as number,
          speed: expect.closeTo(6196540.175162239, 10) as number,
        }),
        START_TIME,
      ),
    },
  });
  expect(events[1]).toEqual({
    type: "POSITION",
    details: {
      position: createPosition(
        createCoordinates({
          longitude: expect.closeTo(-176.70495327058325, 10) as number,
          latitude: expect.closeTo(75.19442943503938, 10) as number,
          heading: expect.closeTo(342.05490135397787, 10) as number,
          speed: expect.closeTo(6196540.175162239, 10) as number,
        }),
        START_TIME + 100,
      ),
    },
  });
  expect(events[2]).toEqual({
    type: "POSITION",
    details: {
      position: createPosition(
        createCoordinates({
          longitude: 170,
          latitude: 80,
          heading: 0,
          speed: expect.closeTo(5577044.531996764, 10) as number,
        }),
        START_TIME + 200,
      ),
    },
  });
  expect(events[3]).toEqual({
    type: "POSITION",
    details: {
      position: createPosition(
        createCoordinates({
          longitude: 170,
          latitude: 85,
          heading: 0,
          speed: expect.closeTo(5577044.531996764, 10) as number,
        }),
        START_TIME + 300,
      ),
    },
  });
  expect(events[4]).toEqual({
    type: "POSITION",
    details: {
      position: createPosition(
        createCoordinates({
          longitude: 70,
          latitude: 90,
          heading: NaN,
          speed: 0,
        }),
        START_TIME + 400,
      ),
    },
  });
  expect(events).toHaveLength(5);
});

it("can be paused", () => {
  const player = createLerpPlayer(journey);
  const events: JourneyPlayerEvent[] = [];
  unsubscribe = player.subscribe((event) => {
    events.push(event);
  });
  player.play();
  vi.advanceTimersByTime(50);
  player.pause();
  vi.advanceTimersByTime(50);
  player.play();
  vi.runAllTimers();

  expect(events[0]).toEqual({
    type: "POSITION",
    details: {
      position: createPosition(
        createCoordinates({
          longitude: -170,
          latitude: 70,
          heading: expect.closeTo(342.05490135397787, 10) as number,
          speed: expect.closeTo(6196540.175162239, 10) as number,
        }),
        START_TIME,
      ),
    },
  });
  expect(events[1]).toEqual({
    type: "POSITION",
    details: {
      position: createPosition(
        createCoordinates({
          longitude: expect.closeTo(-176.70495327058325, 10) as number,
          latitude: expect.closeTo(75.19442943503938, 10) as number,
          heading: expect.closeTo(342.05490135397787, 10) as number,
          speed: expect.closeTo(6196540.175162239, 10) as number,
        }),
        START_TIME + 150,
      ),
    },
  });
  expect(events[2]).toEqual({
    type: "POSITION",
    details: {
      position: createPosition(
        createCoordinates({
          longitude: 170,
          latitude: 80,
          heading: 0,
          speed: expect.closeTo(5577044.531996764, 10) as number,
        }),
        START_TIME + 250,
      ),
    },
  });
  expect(events[3]).toEqual({
    type: "POSITION",
    details: {
      position: createPosition(
        createCoordinates({
          longitude: 170,
          latitude: 85,
          heading: 0,
          speed: expect.closeTo(5577044.531996764, 10) as number,
        }),
        START_TIME + 350,
      ),
    },
  });
  expect(events[4]).toEqual({
    type: "POSITION",
    details: {
      position: createPosition(
        createCoordinates({
          longitude: 70,
          latitude: 90,
          heading: NaN,
          speed: 0,
        }),
        START_TIME + 450,
      ),
    },
  });
  expect(events).toHaveLength(5);
});

it("can seek to a specific time", () => {
  const player = createLerpPlayer(journey);
  const events: JourneyPlayerEvent[] = [];
  unsubscribe = player.subscribe((event) => {
    events.push(event);
  });
  player.seek(300);
  player.play();
  vi.runAllTimers();

  expect(events[0]).toEqual({
    type: "POSITION",
    details: {
      position: createPosition(
        createCoordinates({
          longitude: 170,
          latitude: 85,
          heading: 0,
          speed: expect.closeTo(5577044.531996764, 10) as number,
        }),
        START_TIME,
      ),
    },
  });
  expect(events[1]).toEqual({
    type: "POSITION",
    details: {
      position: createPosition(
        createCoordinates({
          longitude: 70,
          latitude: 90,
          heading: NaN,
          speed: 0,
        }),
        START_TIME + 100,
      ),
    },
  });
  expect(events).toHaveLength(2);
});
