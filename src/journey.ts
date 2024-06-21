import { createCoordinates, createPosition } from "fake-geolocation";
import type { Feature, GeoJsonProperties, LineString, Position } from "geojson";
import {
  apply,
  degrees,
  delta,
  fromGeodeticCoordinates,
  norm,
  normalize,
  radians,
  toGeodeticCoordinates,
  toRotationMatrix,
  transform,
  transpose,
} from "nvector-geodesy";

// TODO: Implement a "player" that can play back a journey
//       Support seeking, looping, time scaling, jitter, disabling
//       speed/altitude/heading, etc.
// TODO: Altimeter and compass
// TODO: Dynamic journey via geocoding inputs
// TODO: Fake accuracy from API journeys
// TODO: Display travel mode from API-based journeys

export type AtLeastTwoPositions = [
  GeolocationPosition,
  GeolocationPosition,
  ...GeolocationPosition[],
];

export type AtLeastOneSegment = [JourneySegment, ...JourneySegment[]];

export type Journey = {
  readonly startTime: number;
  readonly endTime: number;
  readonly duration: number;
  readonly positions: AtLeastTwoPositions;
  readonly startPosition: GeolocationPosition;
  readonly endPosition: GeolocationPosition;
  readonly positionTimes: number[];
  readonly positionOffsetTimes: number[];
  readonly segments: AtLeastOneSegment;
  segmentAtOffsetTime: (offsetTime: number) => JourneySegmentWithT;
  segmentAtTime: (time: number) => JourneySegmentWithT;
  timeToOffsetTime: (time: number) => number;
  offsetTimeToTime: (offsetTime: number) => number;
};

export type JourneySegment = [a: GeolocationPosition, b: GeolocationPosition];

export type JourneySegmentWithT = [
  a: GeolocationPosition,
  b: GeolocationPosition,
  t: number,
];

export function createJourney(...positions: AtLeastTwoPositions): Journey {
  positions.sort(({ timestamp: a }, { timestamp: b }) => a - b);

  const count = positions.length;
  const startPosition = positions[0];
  const endPosition = positions[count - 1];
  const startTime = startPosition.timestamp;
  const endTime = endPosition.timestamp;
  const duration = endTime - startTime;
  const start: JourneySegment = [startPosition, positions[1]] as const;
  const end: JourneySegment = [positions[count - 2], endPosition] as const;

  const positionTimes = [];
  const positionOffsetTimes = [];

  for (const { timestamp } of positions) {
    positionTimes.push(timestamp);
    positionOffsetTimes.push(timestamp - startTime);
  }

  const segments: AtLeastOneSegment = [[positions[0], positions[1]]];

  for (let i = 2; i < count; ++i) {
    segments.push([positions[i - 1], positions[i]]);
  }

  const segmentAtTime: Journey["segmentAtTime"] = (time: number) => {
    if (time < startTime) return [...start, -Infinity];
    if (time >= endTime) return [...end, Infinity];

    // Find the index of the first position after t, or count if t is after
    // the last position, using a binary search.
    let idx = 0;

    for (let j = count; idx < j; ) {
      // Fast integer division by 2
      const h = (idx + j) >> 1;

      if (positions[h].timestamp <= time) {
        idx = h + 1;
      } else {
        j = h;
      }
    }

    const b = positions[idx];
    const a = positions[idx - 1];

    return [a, b, (time - a.timestamp) / (b.timestamp - a.timestamp)];
  };

  return {
    startTime,
    endTime,
    duration,
    positions,
    startPosition,
    endPosition,
    positionTimes,
    positionOffsetTimes,
    segments,

    segmentAtOffsetTime: (offsetTime) => {
      return segmentAtTime(startTime + offsetTime);
    },

    segmentAtTime,

    timeToOffsetTime(time) {
      return time - startTime;
    },

    offsetTimeToTime(offsetTime) {
      return offsetTime + startTime;
    },
  };
}

type BoundingBox = [west: number, south: number, east: number, north: number];

/**
 * @see https://stackoverflow.com/a/58859132/736156
 */
export function boundingBox(...positions: AtLeastTwoPositions): BoundingBox {
  const count = positions.length;
  const lons = positions
    .map(({ coords: { longitude } }) => longitude)
    .sort((a, b) => a - b);

  let w = NaN,
    s = Infinity,
    e = NaN,
    n = -Infinity,
    maxD = -Infinity;

  for (let i = 0; i < count; ++i) {
    const lat = positions[i].coords.latitude;

    if (lat < s) s = lat;
    if (lat > n) n = lat;

    const j = (i + 1) % count;

    const lonA = lons[i];
    const lonB = lons[j];

    const d = (lonB - lonA + 360) % 360;

    if (d > maxD) {
      maxD = d;
      e = lonA;
      w = lonB;
    }
  }

  // Mapbox won't render a bounding box correctly if the east bound is less
  // than the west bound.
  if (e < w) e += 360;

  return [w, s, e, n];
}

export function findFastestSegment(
  ...segments: AtLeastOneSegment
): JourneySegment {
  let maxSpd = -Infinity;
  let fastest: JourneySegment = segments[0];

  for (const seg of segments) {
    const spd = coordinateSpeed(...seg);

    if (spd > maxSpd) {
      maxSpd = spd;
      fastest = seg;
    }
  }

  return fastest;
}

export function coordinateDistance(
  a: GeolocationCoordinates,
  b: GeolocationCoordinates,
): number {
  return norm(
    delta(
      fromGeodeticCoordinates(radians(a.longitude), radians(a.latitude)),
      fromGeodeticCoordinates(radians(b.longitude), radians(b.latitude)),
      -(a.altitude ?? -0),
      -(b.altitude ?? -0),
    ),
  );
}

export function geoJSONPositionDistance(
  [aLon, aLat, aAlt = 0]: Position,
  [bLon, bLat, bAlt = 0]: Position,
): number {
  return norm(
    delta(
      fromGeodeticCoordinates(radians(aLon), radians(aLat)),
      fromGeodeticCoordinates(radians(bLon), radians(bLat)),
      -(aAlt || -0),
      -(bAlt || -0),
    ),
  );
}

export function coordinateSpeed(
  a: GeolocationPosition,
  b: GeolocationPosition,
): number {
  return (
    coordinateDistance(a.coords, b.coords) /
    ((b.timestamp - a.timestamp) / 1000)
  );
}

export function lerpPosition(
  a: GeolocationPosition,
  b: GeolocationPosition,
  t: number,
): GeolocationCoordinates {
  const ca = a.coords;
  const cb = b.coords;

  if (t < 0) return { ...ca, heading: NaN, speed: 0 };
  if (t >= 1) return { ...cb, heading: NaN, speed: 0 };

  // Position n-vectors
  const va = fromGeodeticCoordinates(
    radians(ca.longitude),
    radians(ca.latitude),
  );
  const vb = fromGeodeticCoordinates(
    radians(cb.longitude),
    radians(cb.latitude),
  );

  // From n-vector example 6, interpolated position
  const vi = normalize(apply((va, vb) => lerp(va, vb, t), va, vb));
  const [lon, lat] = toGeodeticCoordinates(vi);

  // From n-vector example 1, A and B to delta
  const d = delta(va, vb, -(ca.altitude ?? -0), -(cb.altitude ?? -0));
  const [north, east] = transform(transpose(toRotationMatrix(va)), d);
  const az = Math.atan2(east, north);
  const dist = norm(d);

  return createCoordinates({
    longitude: degrees(lon),
    latitude: degrees(lat),
    accuracy: lerp(ca.accuracy, cb.accuracy, t),
    altitude: lerpNullable(ca.altitude, cb.altitude, t),
    altitudeAccuracy: lerpNullable(ca.altitudeAccuracy, cb.altitudeAccuracy, t),
    heading: (degrees(az) + 360) % 360,
    speed: dist / ((b.timestamp - a.timestamp) / 1000),
  });
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpNullable(
  a: number | null,
  b: number | null,
  t: number,
): number | null {
  return a == null ? null : b == null ? a : a + (b - a) * t;
}

export type GeoJSONPropertiesWithCoordinateProperties =
  NonNullable<GeoJsonProperties> & {
    coordinateProperties: {
      times: (number | string | null)[];
    };
  };

export type GeoJSONJourney = Feature<
  LineString,
  GeoJSONPropertiesWithCoordinateProperties
>;

export function createJourneyFromGeoJSON({
  geometry: { coordinates },
  properties: {
    coordinateProperties: { times },
  },
}: GeoJSONJourney): Journey {
  const positions: GeolocationPosition[] = [];

  for (let i = 0; i < coordinates.length; ++i) {
    const time = times[i];

    // Skip positions without a time
    if (time == null) continue;

    positions.push({
      coords: coordinatesFromGeoJSONPosition(coordinates[i]),
      timestamp: new Date(time).getTime(),
    });
  }

  const a = positions.shift();
  const b = positions.shift();

  if (!a || !b) throw new Error("Not enough positions");

  return createJourney(a, b, ...positions);
}

export function geoJSONFromPositions(
  ...positions: AtLeastTwoPositions
): GeoJSONJourney {
  const times: number[] = [];
  const coordinates: Position[] = [];

  for (const {
    coords: { longitude, latitude, altitude },
    timestamp,
  } of positions) {
    times.push(timestamp);

    if (altitude == null) {
      coordinates.push([longitude, latitude]);
    } else {
      coordinates.push([longitude, latitude, altitude]);
    }
  }

  return {
    type: "Feature",
    properties: { coordinateProperties: { times } },
    geometry: { type: "LineString", coordinates },
  };
}

export type MapboxRoute = {
  geometry: LineString;
  legs: {
    annotation: {
      duration: number[];
    };
  }[];
};

export function createJourneyFromMapboxRoute(
  { geometry: { coordinates }, legs }: MapboxRoute,
  startTime: number = 0,
): Journey {
  const durations = legs.flatMap(({ annotation: { duration } }) => duration);
  const positions: GeolocationPosition[] = [];
  let time = startTime;

  for (let i = 0; i < coordinates.length; ++i) {
    positions.push({
      coords: coordinatesFromGeoJSONPosition(coordinates[i]),
      timestamp: time,
    });

    time += (durations[i] ?? 0) * 1000;
  }

  const a = positions.shift();
  const b = positions.shift();

  if (!a || !b) throw new Error("Not enough positions");

  return createJourney(a, b, ...positions);
}

export type GoogleRoute = {
  legs: {
    steps: {
      staticDuration: string;
      polyline: {
        geoJsonLinestring: LineString;
      };
    }[];
  }[];
};

export function createJourneyFromGoogleRoute(
  { legs }: GoogleRoute,
  startTime: number = 0,
): Journey {
  const positions: GeolocationPosition[] = [];
  let time = startTime;
  let final: Position | undefined;

  for (let legNum = 0; legNum < legs.length; ++legNum) {
    const { steps } = legs[legNum];

    for (let stepNum = 0; stepNum < steps.length; ++stepNum) {
      const {
        staticDuration,
        polyline: {
          geoJsonLinestring: { coordinates },
        },
      } = steps[stepNum];

      // Never seen, but just in case
      if (coordinates.length < 1) continue;

      const duration = parseFloat(staticDuration) * 1000;

      // Deal with single-position steps, which can actually happen.
      // I've only seen them be 0 duration so far.
      if (coordinates.length < 2) {
        if (duration === 0) continue;

        throw new Error(
          `Single-position step with duration in leg ${legNum}, step ${stepNum}`,
        );
      }

      const distances: number[] = [];
      let distance = 0;

      for (let i = 1; i < coordinates.length; ++i) {
        const a = coordinates[i - 1];
        const b = coordinates[i];

        const dist = geoJSONPositionDistance(a, b);
        distances.push(dist);
        distance += dist;

        final = b;
      }

      if (distance === 0) {
        positions.push({
          coords: coordinatesFromGeoJSONPosition(coordinates[0]),
          timestamp: time,
        });

        time += duration;

        continue;
      }

      for (let i = 0; i < coordinates.length - 1; ++i) {
        const dur = (distances[i] / distance) * duration;

        positions.push({
          coords: coordinatesFromGeoJSONPosition(coordinates[i]),
          timestamp: time,
        });

        time += dur;
      }
    }
  }

  if (final) {
    positions.push({
      coords: coordinatesFromGeoJSONPosition(final),
      timestamp: time,
    });
  }

  const a = positions.shift();
  const b = positions.shift();

  if (!a || !b) throw new Error("Not enough positions");

  return createJourney(a, b, ...positions);
}

export function coordinatesFromGeoJSONPosition([
  longitude,
  latitude,
  altitude,
]: Position): GeolocationCoordinates {
  return createCoordinates({
    longitude,
    latitude,
    altitude,
  });
}

export function geoJSONPositionFromCoordinates({
  longitude,
  latitude,
  altitude,
}: GeolocationCoordinates): Position {
  return altitude == null
    ? [longitude, latitude]
    : [longitude, latitude, altitude];
}

export type JourneyPlayer = {
  play: () => void;
  pause: () => void;
  seek: (toOffsetTime: number) => void;

  subscribe: (subscriber: JourneyPlayerSubscriber) => Unsubscribe;
};

export type JourneyPlayerSubscriber = (event: JourneyPlayerEvent) => void;
export type JourneyPlayerEvent = JourneyPlayerPositionEvent;
export type Unsubscribe = () => void;

export type JourneyPlayerPositionEvent = {
  type: "POSITION";
  details: {
    position: GeolocationPosition;
  };
};

export function createLerpPlayer(journey: Journey): JourneyPlayer {
  const subscribers = new Set<JourneyPlayerSubscriber>();

  // The frequency at which the player ticks
  const tickDuration = 100;
  // The clock time at which the last tick occurred
  let tickTime = 0;
  // The time until the next tick
  let tickDelay = 0;
  // The timeout ID of the next tick
  let tickTimeout: ReturnType<typeof setTimeout> | undefined;
  // The time offset into the journey
  let offsetTime = 0;

  return {
    play,
    pause,
    seek,

    subscribe(subscriber) {
      subscribers.add(subscriber);

      return () => {
        subscribers.delete(subscriber);
      };
    },
  };

  function play() {
    tickTime = Date.now();

    // If already playing, do nothing
    if (!tickTimeout) scheduleTick();
  }

  function pause() {
    // If already paused, do nothing
    if (!tickTimeout) return;

    const elapsed = Date.now() - tickTime;
    offsetTime += elapsed;
    tickDelay -= elapsed;

    // Pause the player by clearing the tick timeout
    clearTimeout(tickTimeout);
    tickTimeout = undefined;
  }

  function seek(toOffsetTime: number) {
    const wasPlaying = Boolean(tickTimeout);

    clearTimeout(tickTimeout);
    tickTimeout = undefined;

    tickTime = Date.now();
    tickDelay = 0;
    offsetTime = toOffsetTime;
    if (wasPlaying) scheduleTick();
  }

  function scheduleTick() {
    tickTimeout = setTimeout(() => {
      offsetTime += tickDelay;
      tickDelay = tickDuration;

      if (offsetTime >= journey.duration) {
        offsetTime = journey.duration;
      } else {
        scheduleTick();
      }

      dispatchPosition((tickTime = Date.now()));
    }, tickDelay);
  }

  function dispatchPosition(time: number) {
    const [a, b, t] = journey.segmentAtOffsetTime(offsetTime);
    const coords = lerpPosition(a, b, t);

    dispatch(subscribers, {
      type: "POSITION",
      details: { position: createPosition(coords, time) },
    });
  }
}

function dispatch<T>(subscribers: Set<(event: T) => void>, event: T) {
  for (const subscriber of subscribers) {
    try {
      subscriber(event);
    } catch {
      // Deliberately ignored
    }
  }
}
