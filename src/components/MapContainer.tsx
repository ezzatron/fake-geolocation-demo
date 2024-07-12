import type { ReactNode } from "react";
import styles from "./MapContainer.module.css";

type Props = {
  children: ReactNode;
};

export default function MapContainer({ children }: Props) {
  return <div className={styles.container}>{children}</div>;
}
