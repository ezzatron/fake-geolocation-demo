import { destination } from "@turf/turf";
import {
  createWrappedAPIs,
  type GeolocationCoordinatesParameters,
} from "fake-geolocation";
import type { BBox } from "geojson";
import { GetServerSideProps } from "next";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import Map from "../components/Map";

const bbox: BBox = [
  -74.06457278183707, 40.73088334317342, -74.03501416729776, 40.71368521621004,
];
const bestAccuracy = 5;
const worstAccuracy = 20;
const speed = 1.5;

const initCoords: GeolocationCoordinatesParameters = {
  longitude: (bbox[0] + bbox[2]) / 2,
  latitude: (bbox[1] + bbox[3]) / 2,
  altitude: 0,
  accuracy: bestAccuracy,
  altitudeAccuracy: 0,
  heading: 0,
  speed,
};

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

  const coords = useRef<GeolocationCoordinatesParameters>(initCoords);

  useEffect(() => {
    const { geolocation, handle, permissions, user } = createWrappedAPIs({
      geolocation: navigator.geolocation,
      permissions: navigator.permissions,
      userParams: {
        handleAccessRequest: async (dialog) => {
          dialog.allow();
        },
      },
    });

    user.jumpToCoordinates(coords.current);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGeolocation(geolocation);
    setPermissions(permissions);

    const coordsIntervalId = setInterval(() => {
      const currentHeading = coords.current.heading ?? 0;
      const heading = (currentHeading + 315 + Math.random() * 90) % 360;

      const {
        geometry: {
          coordinates: [longitude, latitude],
        },
      } = destination(
        [coords.current.longitude, coords.current.latitude],
        speed,
        heading - 180,
        { units: "meters" },
      );

      const accuracy = Math.max(
        bestAccuracy,
        Math.min(
          worstAccuracy,
          coords.current.accuracy + (Math.random() - 0.5) * 2,
        ),
      );

      coords.current = {
        ...coords.current,
        longitude,
        latitude,
        accuracy,
        heading,
        speed,
      };

      user.jumpToCoordinates(coords.current);
    }, 1000);

    const switchAPIsIntervalId = setInterval(() => {
      handle.selectAPIs(!handle.isUsingSuppliedAPIs());
    }, 15000);

    return () => {
      clearInterval(coordsIntervalId);
      clearInterval(switchAPIsIntervalId);
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

      <Map mapboxToken={mapboxToken} position={position} />
    </>
  );
}
