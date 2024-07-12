import { PauseIcon, PlayIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { JourneyPlayer } from "../journey";
import styles from "./Player.module.css";

type Props = {
  player: JourneyPlayer;
};

export default function Player({ player }: Props) {
  return (
    <div className={styles.player}>
      <PlayPauseButton player={player} />
    </div>
  );
}

function PlayPauseButton({ player }: Props) {
  const [isPaused, setIsPaused] = useState(false);
  const label = isPaused ? "Play" : "Pause";

  useEffect(() => {
    setIsPaused(player.isPaused);

    return player.subscribe((event) => {
      if (event.type === "PLAY") {
        setIsPaused(false);
      } else if (event.type === "PAUSE") {
        setIsPaused(true);
      }
    });
  }, [player]);

  function handleClick() {
    player.isPaused ? player.play() : player.pause();
  }

  return (
    <button
      className={styles.playPause}
      aria-label={label}
      title={label}
      onClick={handleClick}
      data-paused={isPaused}
    >
      <div aria-hidden className={styles.play}>
        <PlayIcon />
      </div>
      <div aria-hidden className={styles.pause}>
        <PauseIcon />
      </div>
    </button>
  );
}
