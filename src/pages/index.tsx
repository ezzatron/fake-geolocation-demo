import { createWrappedAPIs } from "fake-geolocation";
import { GetServerSideProps } from "next";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import Map from "../components/Map";
import {
  boundingBox,
  createJourneyFromGeoJSON,
  findFastestSegment,
  lerpPosition,
  type GeoJSONJourney,
} from "../journey";
import journeyJSON from "../journey.json";

const journey = createJourneyFromGeoJSON(journeyJSON as GeoJSONJourney);
const journeyBounds = boundingBox(...journey.positions);
const fastestSegment = findFastestSegment(...journey.segments);

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
  const journeyTime = useRef(fastestSegment[0].timestamp - 5000);

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
      const [a, b, t] = journey.segmentAtTime((journeyTime.current += 100));
      const coords = lerpPosition(a, b, t);
      user.jumpToCoordinates(coords);

      const { altitude, heading, speed } = coords;

      console.log({ altitude, heading, speed });
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

      <Map
        mapboxToken={mapboxToken}
        bounds={journeyBounds}
        position={position}
      />
    </>
  );
}
