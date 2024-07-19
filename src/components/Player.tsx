import { PauseIcon, PlayIcon, SkipForwardIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import throttle from "throttleit";
import type { JourneyPlayer } from "../journey";
import styles from "./Player.module.css";

type Props = {
  player: JourneyPlayer;
};

export default function Player({ player }: Props) {
  return (
    <div className={styles.player}>
      <PlayPauseButton player={player} />
      <NextChapterButton player={player} />
      <Scrubber player={player} />
    </div>
  );
}

function PlayPauseButton({ player }: Props) {
  const [isPaused, setIsPaused] = useState(false);
  const label = isPaused ? "Play" : "Pause";

  useEffect(() => {
    setIsPaused(player.isPaused);

    return player.subscribe(({ type }) => {
      if (type === "PLAY") {
        setIsPaused(false);
      } else if (type === "PAUSE") {
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

function NextChapterButton({ player }: Props) {
  return (
    <button
      aria-label="Next chapter"
      title="Next chapter"
      onClick={() => player.seekToNextChapter()}
    >
      <div aria-hidden>
        <SkipForwardIcon />
      </div>
    </button>
  );
}

function Scrubber({ player }: Props) {
  const abortRef = useRef<AbortController | undefined>();
  const setInput = useCallback(
    (input: HTMLInputElement | null) => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      if (!input) return;

      let isInteracting = false;

      const unsubscribe = player.subscribe(({ type, details }) => {
        if (isInteracting) return;

        if (type === "POSITION") {
          input.value = details.offsetTime.toString();
        }
      });
      abortRef.current.signal.addEventListener(
        "abort",
        () => {
          unsubscribe();
        },
        { once: true },
      );

      input.addEventListener(
        "pointerdown",
        () => {
          isInteracting = true;
        },
        { signal: abortRef.current.signal },
      );
      input.addEventListener(
        "pointerup",
        () => {
          isInteracting = false;
        },
        { signal: abortRef.current.signal },
      );

      input.addEventListener(
        "input",
        throttle(() => {
          player.seek(Number(input.value));
        }, 100),
        { signal: abortRef.current.signal },
      );
    },
    [player],
  );

  return (
    <input
      ref={setInput}
      type="range"
      className={styles.scrubber}
      min={0}
      max={player.journey.duration}
    />
  );
}
