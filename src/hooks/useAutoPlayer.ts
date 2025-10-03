import { useCallback, useEffect, useRef, useState } from "react";
import type { GameState, MoveType } from "../lib/types";

const DEFAULT_SEARCH_DEPTH = 3;
const DEFAULT_INTERVAL_MS = 450;

const createAIWorker = () =>
  new Worker(new URL("../components/aiWorker.ts", import.meta.url), {
    type: "module",
  });

type AutoPlayerDeps = Pick<GameState, "grid" | "status">;

type MoveFn = (direction: MoveType) => void;

export function useAutoPlayer(
  state: AutoPlayerDeps,
  move: MoveFn,
  searchDepth: number = DEFAULT_SEARCH_DEPTH,
  intervalMs: number = DEFAULT_INTERVAL_MS
) {
  const [autoMode, setAutoMode] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const latestState = useRef(state);

  latestState.current = state;

  useEffect(() => {
    workerRef.current = createAIWorker();
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const stopAuto = useCallback(() => {
    setAutoMode(false);
  }, []);

  const startAuto = useCallback(() => {
    setAutoMode(true);
  }, []);

  const toggleAuto = useCallback(() => {
    setAutoMode((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!autoMode) {
      return;
    }

    const worker = workerRef.current;
    if (!worker) {
      stopAuto();
      return;
    }

    const handleMessage = (event: MessageEvent<MoveType | null>) => {
      const bestMove = event.data;
      const { status } = latestState.current;
      if (status !== "playing" || bestMove === null) {
        stopAuto();
        return;
      }
      move(bestMove);
    };

    worker.addEventListener("message", handleMessage);

    const intervalId = window.setInterval(() => {
      const { grid, status } = latestState.current;
      if (status !== "playing") {
        stopAuto();
        return;
      }
      worker.postMessage({ grid, depth: searchDepth });
    }, intervalMs);

    return () => {
      window.clearInterval(intervalId);
      worker.removeEventListener("message", handleMessage);
    };
  }, [autoMode, intervalMs, move, searchDepth, stopAuto]);

  useEffect(() => {
    if (state.status !== "playing" && autoMode) {
      stopAuto();
    }
  }, [autoMode, state.status, stopAuto]);

  return {
    autoMode,
    toggleAuto,
    stopAuto,
    startAuto,
  };
}
