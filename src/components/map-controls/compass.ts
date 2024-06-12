import type {
  EaseToOptions,
  FitBoundsOptions,
  IControl,
  Map,
  MapMouseEvent,
  MapTouchEvent,
} from "mapbox-gl";
import styles from "./compass.module.css";

export class Compass implements IControl {
  constructor(
    bounds: [number, number, number, number],
    fitBoundsOptions: FitBoundsOptions,
  ) {
    this.#camera = this.#readCamera();
    this.#bounds = bounds;
    this.#fitBoundsOptions = fitBoundsOptions;
    this.#followZoom = 16;
    this.#isInteracting = false;

    this.#container = document.createElement("div");
    this.#container.className = styles.compass;
    this.#container.title = "Change camera";

    this.#container.addEventListener("click", () => {
      this.#toggleCamera();
    });

    this.#onInteractStart = () => {
      this.#isInteracting = true;
    };

    this.#onInteractEnd = () => {
      this.#isInteracting = false;
    };

    this.#onMoveStart = ({ originalEvent }) => {
      if (this.#isInteracting && originalEvent && this.#camera === "follow") {
        this.#camera = "free";
      }
    };

    this.#onZoomEnd = ({ originalEvent }) => {
      if (!originalEvent || !this.#map || this.#camera !== "follow") return;

      this.#followZoom = this.#map.getZoom();
    };
  }

  onAdd(map: Map): HTMLElement {
    this.#map = map;
    map.on("mousedown", this.#onInteractStart);
    map.on("mouseup", this.#onInteractEnd);
    map.on("touchstart", this.#onInteractStart);
    map.on("touchend", this.#onInteractEnd);
    map.on("movestart", this.#onMoveStart);
    map.on("zoomend", this.#onZoomEnd);

    return this.#container;
  }

  onRemove(map: Map): void {
    map.off("mousedown", this.#onInteractStart);
    map.off("mouseup", this.#onInteractEnd);
    map.off("touchstart", this.#onInteractStart);
    map.off("touchend", this.#onInteractEnd);
    map.off("movestart", this.#onMoveStart);
    map.off("zoomend", this.#onZoomEnd);
    this.#container.parentElement?.removeChild(this.#container);
  }

  setPosition(position: GeolocationPosition | undefined): void {
    this.#position = position;
    this.#update();
  }

  #update(): void {
    const heading = this.#position?.coords.heading;

    if (heading == null) {
      this.#container.dataset.available = "false";
      this.#container.removeAttribute("data-heading");
    } else {
      this.#container.dataset.available = "true";
      this.#container.dataset.heading = this.#formatHeading(heading);
    }

    if (
      this.#isInteracting ||
      !this.#map ||
      !this.#position ||
      this.#camera !== "follow"
    ) {
      return;
    }

    const target: EaseToOptions = {
      center: [this.#position.coords.longitude, this.#position.coords.latitude],
      bearing: heading ?? 0,
      pitch: 60,
    };
    if (this.#map.getZoom() !== this.#followZoom) {
      target.zoom = this.#followZoom;
    }

    this.#map.easeTo(target);
  }

  #formatHeading(heading: number): string {
    heading = (heading + 360) % 360;

    if (heading < 22.5) return "N";
    if (heading < 67.5) return "NE";
    if (heading < 112.5) return "E";
    if (heading < 157.5) return "SE";
    if (heading < 202.5) return "S";
    if (heading < 247.5) return "SW";
    if (heading < 292.5) return "W";
    if (heading < 337.5) return "NW";
    return "N";
  }

  #toggleCamera(): void {
    if (this.#camera === "follow") {
      this.#camera = "bounds";
      this.#map?.fitBounds(this.#bounds, this.#fitBoundsOptions);
    } else {
      this.#camera = "follow";
    }

    this.#update();
    window.localStorage.setItem("camera", this.#camera);
  }

  #readCamera(): Camera {
    const camera = window.localStorage.getItem("camera");

    return isValidCamera(camera) ? camera : "follow";
  }

  #container: HTMLDivElement;
  #map: Map | undefined;
  #position: GeolocationPosition | undefined;
  #camera: Camera;
  #bounds: [number, number, number, number];
  #fitBoundsOptions: FitBoundsOptions;
  #followZoom: number;
  #isInteracting: boolean;
  #onInteractStart: (event: MapMouseEvent | MapTouchEvent) => void;
  #onInteractEnd: (event: MapMouseEvent | MapTouchEvent) => void;
  #onMoveStart: (event: MapMouseEvent | MapTouchEvent) => void;
  #onZoomEnd: (event: MapMouseEvent | MapTouchEvent) => void;
}

function isValidCamera(camera: unknown): camera is Camera {
  return camera === "bounds" || camera === "follow" || camera === "free";
}

type Camera = "bounds" | "follow" | "free";
