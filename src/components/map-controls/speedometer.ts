import type { IControl } from "mapbox-gl";
import styles from "./speedometer.module.css";

const KPH = 3.6;
const UNITS = {
  "mile-per-hour": 2.23694,
  "kilometer-per-hour": KPH,
};

type Unit = keyof typeof UNITS;

export type Mode =
  | "stopped"
  | "walking"
  | "biking"
  | "driving"
  | "flying"
  | "warp";

export class Speedometer implements IControl {
  constructor() {
    this.#speed = null;
    this.#unit =
      (window.localStorage.getItem("speedometer-unit") as Unit) ??
      (navigator.language === "en-US" ? "mile-per-hour" : "kilometer-per-hour");

    this.#container = document.createElement("div");
    this.#container.className = styles.speedometer;
    this.#container.title = "Click to toggle units";

    const icon = document.createElement("div");
    icon.role = "img";
    icon.setAttribute("aria-hidden", "true");

    this.#container.addEventListener("click", () => {
      this.#toggleUnit();
    });

    this.#container.appendChild(icon);
  }

  onAdd(): HTMLElement {
    return this.#container;
  }

  onRemove(): void {
    this.#container.parentElement?.removeChild(this.#container);
  }

  setSpeed(speed: number | null): void {
    this.#speed = speed;
    this.#update();
  }

  #update(): void {
    if (this.#speed == null) {
      this.#container.dataset.available = "false";
      this.#container.removeAttribute("data-speed");
      this.#container.removeAttribute("data-mode");
    } else {
      this.#container.dataset.available = "true";
      this.#container.dataset.speed = this.#formatSpeed(this.#speed);
      this.#container.dataset.mode = this.#mode(this.#speed);
    }
  }

  #formatSpeed(speed: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "unit",
      unit: this.#unit,
      maximumFractionDigits: 0,
    }).format(speed * UNITS[this.#unit]);
  }

  #mode(speed: number): Mode {
    if (speed === 0) {
      return "stopped";
    } else if (speed < 7 / KPH) {
      return "walking";
    } else if (speed < 30 / KPH) {
      return "biking";
    } else if (speed < 300 / KPH) {
      return "driving";
    } else if (speed < 1000 / KPH) {
      return "flying";
    } else {
      return "warp";
    }
  }

  #toggleUnit(): void {
    this.#unit =
      this.#unit === "mile-per-hour" ? "kilometer-per-hour" : "mile-per-hour";
    this.#update();
    window.localStorage.setItem("speedometer-unit", this.#unit);
  }

  #container: HTMLDivElement;
  #speed: number | null;
  #unit: Unit;
}
