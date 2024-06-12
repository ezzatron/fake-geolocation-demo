import type { IControl } from "mapbox-gl";
import styles from "./altimeter.module.css";
import { createIcon } from "./create-icon";

const UNITS = {
  meter: 1,
  foot: 3.28084,
};
type Unit = keyof typeof UNITS;

export type Mode =
  | "stopped"
  | "walking"
  | "biking"
  | "driving"
  | "flying"
  | "warp";

export class Altimeter implements IControl {
  constructor() {
    this.#altitude = null;
    this.#unit = this.#readUnit();

    this.#container = document.createElement("div");
    this.#container.className = styles.altimeter;
    this.#container.title = "Click to toggle units";

    this.#container.appendChild(createIcon("mountain-snow"));

    this.#container.addEventListener("click", () => {
      this.#toggleUnit();
    });
  }

  onAdd(): HTMLElement {
    return this.#container;
  }

  onRemove(): void {
    this.#container.parentElement?.removeChild(this.#container);
  }

  setAltitude(altitude: number | null): void {
    this.#altitude = altitude;
    this.#update();
  }

  #update(): void {
    if (this.#altitude == null) {
      this.#container.dataset.available = "false";
      this.#container.removeAttribute("data-altitude");
    } else {
      this.#container.dataset.available = "true";
      this.#container.dataset.altitude = this.#formatAltitude(this.#altitude);
    }
  }

  #formatAltitude(altitude: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "unit",
      unit: this.#unit,
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(altitude * UNITS[this.#unit]);
  }

  #toggleUnit(): void {
    this.#unit = this.#unit === "foot" ? "meter" : "foot";
    this.#update();
    window.localStorage.setItem("altimeter-unit", this.#unit);
  }

  #readUnit(): Unit {
    const unit = window.localStorage.getItem("altimeter-unit");

    return unit && isValidUnit(unit)
      ? unit
      : navigator.language === "en-US"
        ? "foot"
        : "meter";
  }

  #container: HTMLDivElement;
  #altitude: number | null;
  #unit: Unit;
}

function isValidUnit(unit: string): unit is Unit {
  return unit in UNITS;
}
