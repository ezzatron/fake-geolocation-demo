import { circle } from "@turf/turf";
import type {
  Feature,
  FeatureCollection,
  Geometry,
  LineString,
  Point,
  Polygon,
} from "geojson";
import { GeoJSONSource, Map as MapboxMap } from "mapbox-gl";
import { Component } from "react";
import styles from "./Map.module.css";
import { Altimeter } from "./map-controls/altimeter";
import { Speedometer } from "./map-controls/speedometer";

const EMPTY_GEOJSON: FeatureCollection<Geometry> = {
  type: "FeatureCollection",
  features: [],
};

type Props = {
  mapboxToken: string;
  bounds: [number, number, number, number];
  position: GeolocationPosition | undefined;
  route: Feature<LineString> | undefined;
};

export default class Map extends Component<Props> {
  constructor(props: Props) {
    super(props);

    this.#setRef = (container) => {
      if (!container) return;

      const map = new MapboxMap({
        accessToken: this.props.mapboxToken,
        container,
        style: "mapbox://styles/mapbox/dark-v11",
        bounds: this.props.bounds,
        fitBoundsOptions: { padding: 64 },
        center: this.#lngLat,
      });
      this.#map = map;

      this.#speedometer = new Speedometer();
      this.#altimeter = new Altimeter();

      map.addControl(this.#speedometer, "top-right");
      map.addControl(this.#altimeter, "top-right");

      map.on("load", () => {
        map.addSource("accuracy", {
          type: "geojson",
          data: this.#accuracyFeature,
        });
        map.addLayer({
          id: "accuracy",
          type: "fill",
          source: "accuracy",
          paint: {
            "fill-color": "white",
            "fill-opacity": 0.1,
          },
        });

        map.addSource("route", {
          type: "geojson",
          data: this.props.route ?? EMPTY_GEOJSON,
        });
        map.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
          paint: {
            "line-color": "#4882c5",
            "line-width": 7,
          },
        });

        map.addSource("position", {
          type: "geojson",
          data: this.#positionFeature,
        });
        map.addLayer({
          id: "position",
          type: "circle",
          source: "position",
          paint: {
            "circle-radius": 7,
            "circle-color": "#a5d8ff",
          },
        });
      });

      map.on("sourcedata", (event) => {
        if (!event.isSourceLoaded) return;

        if (event.sourceId === "accuracy") {
          if (this.#accuracySource) return;

          const source = map.getSource("accuracy");
          if (source?.type !== "geojson") return;

          this.#accuracySource = source;
        }

        if (event.sourceId === "position") {
          if (this.#positionSource) return;

          const source = map.getSource("position");
          if (source?.type !== "geojson") return;

          this.#positionSource = source;
        }
      });
    };
  }

  componentWillUnmount(): void {
    this.#map?.remove();
  }

  componentDidUpdate({ position, route }: Props): void {
    if (this.props.position !== position) {
      this.#accuracySource?.setData(this.#accuracyFeature);
      this.#positionSource?.setData(this.#positionFeature);
      this.#speedometer?.setSpeed(this.props.position?.coords.speed ?? null);
      this.#altimeter?.setAltitude(
        this.props.position?.coords.altitude ?? null,
      );
    }
    if (this.props.route !== route) {
      const routeSource = this.#map?.getSource("route");
      if (routeSource?.type === "geojson") {
        routeSource.setData(this.props.route ?? EMPTY_GEOJSON);
      }
    }
  }

  render() {
    return <div ref={this.#setRef} className={styles.map}></div>;
  }

  get #lngLat(): [number, number] {
    const { coords: { longitude = 0, latitude = 0 } = {} } =
      this.props.position ?? {};

    return [longitude, latitude];
  }

  get #accuracyFeature(): Feature<Polygon> {
    const { coords: { accuracy = 0 } = {} } = this.props.position ?? {};

    return circle(this.#lngLat, accuracy, { steps: 96, units: "meters" });
  }

  get #positionFeature(): Feature<Point> {
    return {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: this.#lngLat,
      },
      properties: {},
    };
  }

  readonly #setRef: (container: HTMLDivElement) => void;
  #map: MapboxMap | undefined;
  #accuracySource: GeoJSONSource | undefined;
  #positionSource: GeoJSONSource | undefined;
  #speedometer: Speedometer | undefined;
  #altimeter: Altimeter | undefined;
}
