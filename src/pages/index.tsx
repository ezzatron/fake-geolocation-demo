import { GetServerSideProps } from "next";
import Head from "next/head";
import { useEffect, useState } from "react";
import Map from "../components/Map";

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

export default function Dashboard({ mapboxToken }: Props) {
  const [position, setPosition] = useState<GeolocationPosition>();

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition((position) => {
      setPosition(position);
    });

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return (
    <>
      <Head>
        <title>Fake Geolocation Demo</title>
      </Head>

      <Map mapboxToken={mapboxToken} position={position} />
    </>
  );
}
