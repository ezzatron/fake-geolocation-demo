import { circle } from "@turf/turf";
import type {
  Feature,
  FeatureCollection,
  Geometry,
  LineString,
  Point,
  Polygon,
} from "geojson";
import { AttributionControl, GeoJSONSource, Map as MapboxMap } from "mapbox-gl";
import { Component } from "react";
import throttle from "throttleit";
import styles from "./Map.module.css";
import { Altimeter } from "./map-controls/altimeter";
import { Compass } from "./map-controls/compass";
import { Speedometer } from "./map-controls/speedometer";

const EMPTY_GEOJSON: FeatureCollection<Geometry> = {
  type: "FeatureCollection",
  features: [],
};

type Props = {
  mapboxToken: string;
  bounds: [number, number, number, number];
  position?: GeolocationPosition;
  route: Feature<LineString>;
};

const fitBoundsOptions = { padding: 64 };

export default class Map extends Component<Props> {
  constructor(props: Props) {
    super(props);

    this.#camera = "follow";

    this.#updateFollowCamera = throttle(() => {
      if (!this.#map || !this.props.position || this.#camera !== "follow") {
        return;
      }

      this.#map.easeTo({
        center: [
          this.props.position.coords.longitude,
          this.props.position.coords.latitude,
        ],
        bearing: this.props.position.coords.heading ?? 0,
        pitch: 60,
        zoom: 18,
      });
    }, 100);

    this.#setRef = (container) => {
      if (!container) return;

      const map = new MapboxMap({
        accessToken: this.props.mapboxToken,
        container,
        style: "mapbox://styles/mapbox/dark-v11",
        bounds: this.props.bounds,
        fitBoundsOptions,
        center: this.#lngLat,
        logoPosition: "top-left",
        attributionControl: false,
      });
      this.#map = map;
      this.#container = container;

      this.#camera = this.#readCamera();
      this.#setInteractivity();

      this.#speedometer = new Speedometer();
      this.#altimeter = new Altimeter();
      this.#compass = new Compass(() => {
        this.#toggleCamera();
        this.#updateFollowCamera();
      });

      map.addControl(this.#speedometer, "top-right");
      map.addControl(this.#altimeter, "top-right");
      map.addControl(this.#compass, "bottom-right");
      map.addControl(new AttributionControl(), "bottom-left");

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

      map.on("movestart", ({ originalEvent }) => {
        if (originalEvent) {
          this.#camera = "free";
          this.#setInteractivity();
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
      this.#compass?.setPosition(this.props.position);

      this.#updateFollowCamera();
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

  #toggleCamera(): void {
    if (this.#camera === "bounds") {
      this.#camera = "follow";
    } else {
      this.#camera = "bounds";
      this.#map?.fitBounds(this.props.bounds, fitBoundsOptions);
    }

    this.#setInteractivity();

    window.localStorage.setItem("camera", this.#camera);
  }

  #readCamera(): Camera {
    const camera = window.localStorage.getItem("camera");

    return isValidCamera(camera) ? camera : "follow";
  }

  #setInteractivity() {
    if (!this.#map || !this.#container) return;

    const enableDisable = this.#camera === "follow" ? "disable" : "enable";

    this.#map.scrollZoom[enableDisable]();
    this.#map.boxZoom[enableDisable]();
    this.#map.dragRotate[enableDisable]();
    this.#map.dragPan[enableDisable]();
    this.#map.keyboard[enableDisable]();
    this.#map.doubleClickZoom[enableDisable]();
    this.#map.touchZoomRotate[enableDisable]();
    this.#map.touchPitch[enableDisable]();

    const addRemove = this.#camera === "follow" ? "remove" : "add";

    this.#container
      .querySelector(".mapboxgl-canvas-container")
      ?.classList[addRemove]("mapboxgl-interactive");
  }

  readonly #setRef: (container: HTMLDivElement) => void;
  #map: MapboxMap | undefined;
  #container: HTMLDivElement | undefined;
  #accuracySource: GeoJSONSource | undefined;
  #positionSource: GeoJSONSource | undefined;
  #speedometer: Speedometer | undefined;
  #altimeter: Altimeter | undefined;
  #compass: Compass | undefined;
  #camera: Camera;
  #updateFollowCamera: () => void;
}

function isValidCamera(camera: unknown): camera is Camera {
  return camera === "bounds" || camera === "follow" || camera === "free";
}

type Camera = "bounds" | "follow" | "free";
