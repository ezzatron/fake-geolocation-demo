import { circle } from "@turf/turf";
import type { Feature, Point, Polygon } from "geojson";
import { GeoJSONSource, Map as MapboxMap } from "mapbox-gl";
import { Component } from "react";
import styles from "./Map.module.css";

type Props = {
  mapboxToken: string;
  bounds: [number, number, number, number];
  position: GeolocationPosition | undefined;
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

        map.addSource("position", {
          type: "geojson",
          data: this.#positionFeature,
        });
        map.addLayer({
          id: "position",
          type: "circle",
          source: "position",
          paint: {
            "circle-radius": 6,
            "circle-color": "#4dabf7",
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

  componentDidUpdate({ position }: Props): void {
    if (this.props.position !== position) {
      this.#accuracySource?.setData(this.#accuracyFeature);
      this.#positionSource?.setData(this.#positionFeature);
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
}
