import { createWrappedAPIs } from "fake-geolocation";
import { GetServerSideProps } from "next";
import Head from "next/head";
import { useEffect, useState } from "react";
import Map from "../components/Map";
import {
  boundingBox,
  createJourneyFromMapboxRoute,
  createLerpPlayer,
  findFastestSegment,
  geoJSONFromPositions,
  type MapboxRoute,
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
import CompassPointer from "../components/CompassPointer";
import CompassRing from "../components/CompassRing";
// import googleRoutesDrivingJSON from "../google-routes-driving.json";
// import googleRoutesTransitJSON from "../google-routes-transit.json";
// import geoJSON from "../journey.json";
import mapboxDirectionsJSON from "../mapbox-directions.json";

// const journey = createJourneyFromGoogleRoute(
//   googleRoutesDrivingJSON.routes[0] as GoogleRoute,
// );
// const journey = createJourneyFromGoogleRoute(
//   googleRoutesTransitJSON.routes[0] as GoogleRoute,
// );
const journey = createJourneyFromMapboxRoute(
  mapboxDirectionsJSON.routes[0] as MapboxRoute,
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

  useEffect(() => {
    const { geolocation, permissions, user } = createWrappedAPIs({
      geolocation: navigator.geolocation,
      permissions: navigator.permissions,
      handlePermissionRequest: () => "granted",
    });

    setGeolocation(geolocation);
    setPermissions(permissions);

    const player = createLerpPlayer(journey);
    const unsubscribe = player.subscribe((event) => {
      if (event.type === "POSITION") {
        user.jumpToCoordinates(event.details.position.coords);
      }
    });

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

      <Map
        mapboxToken={mapboxToken}
        bounds={journeyBounds}
        position={position}
        route={route}
      />
    </>
  );
}
