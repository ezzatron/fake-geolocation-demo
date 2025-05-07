import type { GeolocationPositionParameters } from "fake-geolocation";
import type { IControl, Map } from "mapbox-gl";
import styles from "./compass.module.css";

export class Compass implements IControl {
  constructor(toggleCamera: () => void) {
    this.#container = document.createElement("div");
    this.#container.className = styles.compass;
    this.#container.title = "Change camera";

    this.#container.appendChild(this.#createPart("ring"));
    this.#container.appendChild(this.#createPart("pointer"));

    this.#container.addEventListener("click", () => {
      toggleCamera();
    });

    this.#onMove = () => {
      this.#updateBearings();
    };
  }

  onAdd(map: Map): HTMLElement {
    this.#map = map;
    map.on("move", this.#onMove);

    return this.#container;
  }

  onRemove(map: Map): void {
    map.off("move", this.#onMove);
    this.#container.parentElement?.removeChild(this.#container);
  }

  setPosition(position: GeolocationPositionParameters | undefined): void {
    this.#position = position;
    this.#update();
  }

  #update(): void {
    const heading = this.#position?.coords.heading;

    if (heading == null) {
      this.#container.dataset.available = "false";
      this.#container.removeAttribute("data-direction");
    } else {
      this.#container.dataset.available = "true";
      this.#container.dataset.direction = this.#direction(heading);
    }

    this.#updateBearings();
  }

  #updateBearings(): void {
    const heading = this.#position?.coords.heading;
    if (heading == null) this.#container.style.removeProperty("--heading");

    if (!this.#map) return;

    const bearing = this.#map.getBearing();
    this.#container.style.setProperty("--bearing", `${bearing}deg`);
    if (heading != null) {
      this.#container.style.setProperty("--heading", `${heading}deg`);
    }
  }

  #direction(heading: number): string {
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

  #createPart(part: string): SVGSVGElement {
    const viewBox = document
      .getElementById(`compass-${part}`)
      ?.getAttribute("viewBox");

    if (!viewBox) throw new Error("Missing viewBox");

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add(styles[part]);
    svg.setAttribute("viewBox", viewBox);
    svg.role = "img";
    svg.setAttribute("aria-hidden", "true");

    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.href.baseVal = `#compass-${part}`;
    svg.appendChild(use);

    return svg;
  }

  #container: HTMLDivElement;
  #map: Map | undefined;
  #position: GeolocationPositionParameters | undefined;
  #onMove: () => void;
}
