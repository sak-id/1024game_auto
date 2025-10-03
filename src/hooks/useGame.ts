import { useReducer, useEffect, useCallback, useMemo, useState } from "react";
import type {
  GameOptions,
  GameState,
  Grid,
  MoveType,
  SpawnedTile,
} from "../lib/types";
import {
  canMove,
  createEmptyGrid,
  hasTargetTile,
  moveDown,
  moveLeft,
  moveRight,
  moveUp,
  spawnRandomTile,
} from "../lib/gameLogic";

const MERGE_SOUND = "/audios/カーソル移動6.mp3";
const NEW_TILE_SOUND = "/audios/カーソル移動9.mp3";

interface InternalState extends GameState {
  pendingSpawn: boolean;
  mergeSoundToken: number;
  spawnSoundToken: number;
}

type Action =
  | { type: "INIT"; payload: { grid: Grid; options: GameOptions } }
  | { type: "MOVE"; payload: { direction: MoveType } }
  | { type: "APPLY_RANDOM_TILE"; payload: { grid: Grid; spawn: SpawnedTile | null } };

const MOVE_HANDLERS: Record<MoveType, typeof moveLeft> = {
  MOVE_LEFT: moveLeft,
  MOVE_RIGHT: moveRight,
  MOVE_UP: moveUp,
  MOVE_DOWN: moveDown,
};

function gameReducer(state: InternalState, action: Action): InternalState {
  switch (action.type) {
    case "INIT": {
      const { grid, options } = action.payload;
      return {
        grid,
        score: 0,
        bestScore: state.bestScore,
        status: "playing",
        justMergedTiles: [],
        options,
        pendingSpawn: false,
        mergeSoundToken: state.mergeSoundToken,
        spawnSoundToken: state.spawnSoundToken,
      };
    }
    case "MOVE": {
      if (state.status !== "playing") {
        return state;
      }

      const handler = MOVE_HANDLERS[action.payload.direction];
      const result = handler(state.grid);

      if (!result.moved) {
        if (state.justMergedTiles.length === 0) {
          return state;
        }
        return { ...state, justMergedTiles: [] };
      }

      const nextScore = state.score + result.gainedScore;
      const bestScore = Math.max(state.bestScore, nextScore);
      const hasWon = hasTargetTile(result.newGrid, state.options.target);

      return {
        ...state,
        grid: result.newGrid,
        score: nextScore,
        bestScore,
        status: hasWon ? "won" : "playing",
        justMergedTiles: result.mergedPositions,
        pendingSpawn: true,
        mergeSoundToken:
          result.mergedPositions.length > 0
            ? state.mergeSoundToken + 1
            : state.mergeSoundToken,
      };
    }
    case "APPLY_RANDOM_TILE": {
      if (!state.pendingSpawn) {
        return state;
      }

      const { grid, spawn } = action.payload;
      const spawnCreatesTarget = hasTargetTile(grid, state.options.target);
      let nextStatus: GameState["status"];
      if (state.status === "won" || spawnCreatesTarget) {
        nextStatus = "won";
      } else {
        nextStatus = canMove(grid) ? "playing" : "over";
      }

      return {
        ...state,
        grid,
        status: nextStatus,
        pendingSpawn: false,
        spawnSoundToken: spawn
          ? state.spawnSoundToken + 1
          : state.spawnSoundToken,
      };
    }
    default:
      return state;
  }
}

function buildInitialGrid(size: number): Grid {
  let working = createEmptyGrid(size);

  const first = spawnRandomTile(working);
  working = first ? first.grid : working;

  const second = spawnRandomTile(working);
  working = second ? second.grid : working;

  return working;
}

export function useGame(size: number, target: number, soundOn: boolean) {
  const [storedBest] = useState(() => {
    if (typeof window === "undefined") {
      return 0;
    }
    return Number(window.localStorage.getItem("bestScore") || 0);
  });

  const initialOptions: GameOptions = useMemo(
    () => ({ size, target, soundOn }),
    [size, target, soundOn]
  );

  const [state, dispatch] = useReducer(
    gameReducer,
    undefined,
    (): InternalState => ({
      grid: buildInitialGrid(size),
      score: 0,
      bestScore: storedBest,
      status: "playing",
      justMergedTiles: [],
      options: initialOptions,
      pendingSpawn: false,
      mergeSoundToken: 0,
      spawnSoundToken: 0,
    })
  );

  const publicState: GameState = useMemo(
    () => ({
      grid: state.grid,
      score: state.score,
      bestScore: state.bestScore,
      status: state.status,
      justMergedTiles: state.justMergedTiles,
      options: state.options,
    }),
    [state.grid, state.score, state.bestScore, state.status, state.justMergedTiles, state.options]
  );

  const {
    size: currentSize,
    target: currentTarget,
    soundOn: currentSound,
  } = state.options;

  const initializeGame = useCallback(
    (options: GameOptions) => {
      const grid = buildInitialGrid(options.size);
      dispatch({ type: "INIT", payload: { grid, options } });
    },
    []
  );

  const handleMove = useCallback(
    (direction: MoveType) => {
      dispatch({ type: "MOVE", payload: { direction } });
    },
    []
  );

  const resetGame = useCallback(() => {
    initializeGame(state.options);
  }, [initializeGame, state.options]);

  useEffect(() => {
    if (
      currentSize === size &&
      currentTarget === target &&
      currentSound === soundOn
    ) {
      return;
    }
    initializeGame({ size, target, soundOn });
  }, [
    currentSize,
    currentTarget,
    currentSound,
    initializeGame,
    size,
    target,
    soundOn,
  ]);

  useEffect(() => {
    if (!state.pendingSpawn) {
      return;
    }

    const result = spawnRandomTile(state.grid);
    if (!result) {
      dispatch({
        type: "APPLY_RANDOM_TILE",
        payload: { grid: state.grid, spawn: null },
      });
      return;
    }

    dispatch({
      type: "APPLY_RANDOM_TILE",
      payload: result,
    });
  }, [dispatch, state.grid, state.pendingSpawn]);

  useEffect(() => {
    if (!state.options.soundOn || state.mergeSoundToken === 0) {
      return;
    }
    const audio = new Audio(MERGE_SOUND);
    audio.play().catch(() => {
      /* ignore playback errors */
    });
  }, [state.mergeSoundToken, state.options.soundOn]);

  useEffect(() => {
    if (!state.options.soundOn || state.spawnSoundToken === 0) {
      return;
    }
    const audio = new Audio(NEW_TILE_SOUND);
    audio.play().catch(() => {
      /* ignore playback errors */
    });
  }, [state.spawnSoundToken, state.options.soundOn]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem("bestScore", String(state.bestScore));
  }, [state.bestScore]);

  return {
    state: publicState,
    move: handleMove,
    reset: resetGame,
  };
}
