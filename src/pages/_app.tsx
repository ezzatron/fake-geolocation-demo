import "mapbox-gl/dist/mapbox-gl.css";
import type { AppProps } from "next/app";
import "open-props/style";
import "../styles/global.css";

export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
