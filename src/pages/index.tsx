import { createWrappedAPIs } from "fake-geolocation";
import {
  BikeIcon,
  CarIcon,
  Footprints,
  GaugeIcon,
  MountainSnowIcon,
  OctagonXIcon,
  PlaneIcon,
  RocketIcon,
} from "lucide-react";
import { GetServerSideProps } from "next";
import Head from "next/head";
import { useEffect, useState } from "react";
import CompassPointer from "../components/CompassPointer";
import CompassRing from "../components/CompassRing";
import Map from "../components/Map";
import MapContainer from "../components/MapContainer";
import Player from "../components/Player";
import googleRoutesDrivingJSON from "../google-routes-driving.json";
import googleRoutesTransitJSON from "../google-routes-transit.json";
import goProJSON from "../gopro.json";
import {
  boundingBox,
  createJourneyFromGeoJSON,
  createJourneyFromGoogleRoute,
  createJourneyFromMapboxRoute,
  createLerpPlayer,
  findFastestSegment,
  geoJSONFromPositions,
  type GeoJSONJourney,
  type GoogleRoute,
  type Journey,
  type JourneyPlayer,
  type MapboxRoute,
} from "../journey";
import mapboxDirectionsJSON from "../mapbox-directions.json";
import styles from "./index.module.css";

const TIME_DESCRIPTOR_PATTERN =
  /(?:([1-9]\d*(?:\.\d+)?)h)?(?:([1-9]\d*(?:\.\d+)?)m)?(?:([1-9]\d*(?:\.\d+)?)s)?/;
const ONE_SECOND = 1000;
const ONE_MINUTE = 60 * ONE_SECOND;
const ONE_HOUR = 60 * ONE_MINUTE;

type Props = {
  mapboxToken: string;
  journeyName: string;
  bounds: [number, number, number, number];
  route: GeoJSONJourney;
  startTime: number;
};

export const getServerSideProps: GetServerSideProps<Props> = async (
  context,
) => {
  const mapboxToken = process.env.MAPBOX_TOKEN;

  if (typeof mapboxToken !== "string" || !mapboxToken) {
    throw new Error("MAPBOX_TOKEN is not set");
  }

  let { journey: journeyName, t: timeDescriptor } = context.query;

  if (typeof journeyName !== "string") journeyName = "mapbox";
  if (typeof timeDescriptor !== "string") timeDescriptor = "0s";

  const journey = journeyByName(journeyName);
  const bounds = boundingBox(...journey.positions);
  const route = geoJSONFromPositions(...journey.positions);

  let startTime;

  if (timeDescriptor === "fastest") {
    const fastestSegment = findFastestSegment(...journey.segments);
    startTime = journey.timeToOffsetTime(fastestSegment[0].timestamp);
  } else {
    startTime = parseTimeDescriptor(timeDescriptor) ?? 0;
  }

  return {
    props: {
      mapboxToken,
      journeyName,
      bounds,
      route,
      startTime,
    },
  };
};

export default function Demo({
  mapboxToken,
  journeyName,
  bounds,
  route,
  startTime,
}: Props) {
  const [geolocation, setGeolocation] = useState<Geolocation>();
  const [permissions, setPermissions] = useState<Permissions>();
  const [player, setPlayer] = useState<JourneyPlayer>();
  const [position, setPosition] = useState<GeolocationPosition>();

  useEffect(() => {
    const { geolocation, permissions, user } = createWrappedAPIs({
      geolocation: navigator.geolocation,
      permissions: navigator.permissions,
      userParams: {
        handleAccessRequest: async (dialog) => {
          dialog.remember(true);
          dialog.allow();
        },
      },
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGeolocation(geolocation);
    setPermissions(permissions);

    const journey = journeyByName(journeyName);
    const player = createLerpPlayer(journey);
    const unsubscribe = player.subscribe((event) => {
      if (event.type === "POSITION") {
        user.jumpToCoordinates(event.details.position.coords);
      }
    });

    setPlayer(player);

    player.seek(startTime);
    player.play();

    // const switchAPIsIntervalId = setInterval(() => {
    //   selectAPIs(!isUsingSuppliedAPIs());
    // }, 15000);

    return () => {
      unsubscribe();
      player.pause();
      // clearInterval(switchAPIsIntervalId);
    };
  }, [journeyName, startTime]);

  useEffect(() => {
    if (!geolocation || !permissions) return;

    const watchId = geolocation.watchPosition(
      (position) => {
        setPosition(position);
      },
      (error) => {
        console.error(error);
      },
    );

    return () => {
      geolocation.clearWatch(watchId);
    };
  }, [geolocation, permissions]);

  return (
    <>
      <Head>
        <title>Fake Geolocation Demo</title>
      </Head>

      <div className={styles.sprites}>
        <CompassRing />
        <CompassPointer />

        <BikeIcon id="bike-icon" />
        <CarIcon id="car-icon" />
        <Footprints id="footprints-icon" />
        <GaugeIcon id="gauge-icon" />
        <MountainSnowIcon id="mountain-snow-icon" />
        <OctagonXIcon id="octagon-x-icon" />
        <PlaneIcon id="plane-icon" />
        <RocketIcon id="rocket-icon" />
      </div>

      <MapContainer>
        {bounds && route && (
          <Map
            mapboxToken={mapboxToken}
            bounds={bounds}
            route={route}
            position={position}
          />
        )}
        {player && <Player player={player} />}
      </MapContainer>
    </>
  );
}

function journeyByName(name: string): Journey {
  switch (name) {
    case "google-driving":
      return createJourneyFromGoogleRoute(
        googleRoutesDrivingJSON.routes[0] as GoogleRoute,
      );
    case "google-transit":
      return createJourneyFromGoogleRoute(
        googleRoutesTransitJSON.routes[0] as GoogleRoute,
      );
    case "gopro":
      return createJourneyFromGeoJSON(goProJSON as GeoJSONJourney);
  }

  return createJourneyFromMapboxRoute(
    mapboxDirectionsJSON.routes[0] as MapboxRoute,
  );
}

function parseTimeDescriptor(descriptor: string): number | undefined {
  const match = TIME_DESCRIPTOR_PATTERN.exec(descriptor);

  if (!match || match[0] === "") return undefined;

  const hours = parseFloat(match[1] ?? "0");
  const minutes = parseFloat(match[2] ?? "0");
  const seconds = parseFloat(match[3] ?? "0");

  return hours * ONE_HOUR + minutes * ONE_MINUTE + seconds * ONE_SECOND;
}
