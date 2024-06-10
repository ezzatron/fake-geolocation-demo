import type { IControl } from "mapbox-gl";
import styles from "./altimeter.module.css";

export type Mode =
  | "stopped"
  | "walking"
  | "biking"
  | "driving"
  | "flying"
  | "warp";

export class Altimeter implements IControl {
  constructor() {
    this.altitude = null;

    this.#container = document.createElement("div");
    this.#container.className = styles.altimeter;

    const icon = document.createElement("div");
    icon.role = "img";
    icon.setAttribute("aria-hidden", "true");

    this.#container.appendChild(icon);
  }

  onAdd(): HTMLElement {
    return this.#container;
  }

  onRemove(): void {
    this.#container.parentElement?.removeChild(this.#container);
  }

  setAltitude(altitude: number | null): void {
    this.altitude = altitude;
    this.#update();
  }

  #update(): void {
    if (this.altitude == null) {
      this.#container.dataset.available = "false";
      this.#container.removeAttribute("data-altitude");
    } else {
      this.#container.dataset.available = "true";
      this.#container.dataset.altitude = this.#formatAltitude(this.altitude);
    }
  }

  #formatAltitude(altitude: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "unit",
      unit: "meter",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(altitude);
  }

  #container: HTMLDivElement;
  altitude: number | null;
}
