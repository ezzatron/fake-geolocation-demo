import { createWrappedAPIs } from "fake-geolocation";
import { GetServerSideProps } from "next";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import Map from "../components/Map";
import {
  boundingBox,
  createJourneyFromMapboxRoute,
  findFastestSegment,
  geoJSONFromPositions,
  lerpPosition,
  type MapboxRouteWithDurations,
} from "../journey";
import styles from "./index.module.css";

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
import directionsJSON from "../mapbox-directions.json";
// import geoJSON from "../journey.json";

const journey = createJourneyFromMapboxRoute(
  directionsJSON.routes[0] as MapboxRouteWithDurations,
);
// const journey = createJourneyFromGeoJSON(geoJSON as GeoJSONJourney);
// const startTime = 0;
const fastestSegment = findFastestSegment(...journey.segments);
const startTime = journey.timeToOffsetTime(fastestSegment[0].timestamp);

const journeyBounds = boundingBox(...journey.positions);
const route = geoJSONFromPositions(...journey.positions);

type Props = {
  mapboxToken: string;
};

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const mapboxToken = process.env.MAPBOX_TOKEN;

  if (typeof mapboxToken !== "string" || !mapboxToken) {
    throw new Error("MAPBOX_TOKEN is not set");
  }

  return {
    props: {
      mapboxToken,
    },
  };
};

export default function Demo({ mapboxToken }: Props) {
  const [geolocation, setGeolocation] = useState<Geolocation>();
  const [permissions, setPermissions] = useState<Permissions>();
  const [position, setPosition] = useState<GeolocationPosition>();
  const journeyTime = useRef(startTime);

  useEffect(() => {
    const { geolocation, permissions, user } = createWrappedAPIs({
      geolocation: navigator.geolocation,
      permissions: navigator.permissions,
      handlePermissionRequest: () => "granted",
    });

    user.jumpToCoordinates(journey.startPosition.coords);

    setGeolocation(geolocation);
    setPermissions(permissions);

    const coordsIntervalId = setInterval(() => {
      const [a, b, t] = journey.segmentAtOffsetTime(
        (journeyTime.current += 100),
      );
      const coords = lerpPosition(a, b, t);
      user.jumpToCoordinates(coords);

      const { altitude, heading } = coords;

      console.log({ altitude, heading });
    }, 100);

    // const switchAPIsIntervalId = setInterval(() => {
    //   selectAPIs(!isUsingSuppliedAPIs());
    // }, 15000);

    return () => {
      clearInterval(coordsIntervalId);
      // clearInterval(switchAPIsIntervalId);
    };
  }, []);

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

      <div className={styles.icons}>
        <BikeIcon id="bike-icon" />
        <CarIcon id="car-icon" />
        <Footprints id="footprints-icon" />
        <GaugeIcon id="gauge-icon" />
        <MountainSnowIcon id="mountain-snow-icon" />
        <OctagonXIcon id="octagon-x-icon" />
        <PlaneIcon id="plane-icon" />
        <RocketIcon id="rocket-icon" />
      </div>

      <Map
        mapboxToken={mapboxToken}
        bounds={journeyBounds}
        position={position}
        route={route}
      />
    </>
  );
}
