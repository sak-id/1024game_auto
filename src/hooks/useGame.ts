import { useReducer, useEffect } from "react";
import type { GameState, GameOptions } from "../lib/types";
import {
  createEmptyGrid,
  addRandomTile,
  moveLeft,
  moveRight,
  moveUp,
  moveDown,
} from "../lib/gameLogic";

// 効果音ファイルのパス（public/audios 配下に置く想定）
const MERGE_SOUND = "/audios/カーソル移動6.mp3";
const NEW_TILE_SOUND = "/audios/カーソル移動9.mp3";

type Action =
  | { type: "INIT"; options: GameOptions }
  | { type: "MOVE_LEFT" }
  | { type: "MOVE_RIGHT" }
  | { type: "MOVE_UP" }
  | { type: "MOVE_DOWN" }
  | { type: "RESET" };

function gameReducer(
  state: GameState,
  action: Action
): GameState {
  switch (action.type) {
    case "INIT": {
      const { size, target, soundOn } = action.options;
      const empty = createEmptyGrid(size);
      let withTile = addRandomTile(empty);
      withTile = addRandomTile(withTile);
      return {
        grid: withTile,
        score: 0,
        bestScore: state.bestScore,
        status: "playing",
        justMergedTiles: [],
        options: { size, target, soundOn },
      };
    }
    case "MOVE_LEFT":
    case "MOVE_RIGHT":
    case "MOVE_UP":
    case "MOVE_DOWN": {
      if (state.status !== "playing") return state;

      const { size, target, soundOn } = state.options;
      let result:
        | { newGrid: Grid; gainedScore: number; mergedPositions: { row: number; col: number }[] }
        | undefined;

      // 各方向の move 関数を呼び分け
      if (action.type === "MOVE_LEFT") {
        result = moveLeft(state.grid);
      } else if (action.type === "MOVE_RIGHT") {
        result = moveRight(state.grid);
      } else if (action.type === "MOVE_UP") {
        result = moveUp(state.grid);
      } else {
        result = moveDown(state.grid);
      }

      if (!result) return state;
      const { newGrid, gainedScore, mergedPositions } = result;
      const moved = JSON.stringify(newGrid) !== JSON.stringify(state.grid);
      if (!moved) {
        // 移動がない場合は justMergedTiles だけクリアして返す
        return { ...state, justMergedTiles: [] };
      }

      // 合成があれば効果音を鳴らす
      if (soundOn && mergedPositions.length > 0) {
        const audio = new Audio(MERGE_SOUND);
        audio.play().catch(() => {
          /* 再生エラーは無視 */
        });
      }

      // 新タイルを追加する前に addRandomTile、新規タイル生成時にも音を鳴らす
      const afterAdd = addRandomTile(newGrid);
      if (soundOn) {
        const audio = new Audio(NEW_TILE_SOUND);
        audio.play().catch(() => {
          /* 再生エラーは無視 */
        });
      }

      const newScore = state.score + gainedScore;
      const newBest = Math.max(state.bestScore, newScore);

      // 勝利判定
      let newStatus: GameState["status"] = state.status;
      for (let r = 0; r < afterAdd.length; r++) {
        for (let c = 0; c < afterAdd.length; c++) {
          if (afterAdd[r][c] === target) {
            newStatus = "won";
          }
        }
      }

      // ゲームオーバー判定
      const hasEmpty = afterAdd.some((row) => row.some((val) => val === 0));
      if (!hasEmpty) {
        const canMove =
          JSON.stringify(moveLeft(afterAdd).newGrid) !==
            JSON.stringify(afterAdd) ||
          JSON.stringify(moveRight(afterAdd).newGrid) !==
            JSON.stringify(afterAdd) ||
          JSON.stringify(moveUp(afterAdd).newGrid) !==
            JSON.stringify(afterAdd) ||
          JSON.stringify(moveDown(afterAdd).newGrid) !==
            JSON.stringify(afterAdd);
        if (!canMove && newStatus !== "won") {
          newStatus = "over";
        }
      }

      return {
        grid: afterAdd,
        score: newScore,
        bestScore: newBest,
        status: newStatus,
        justMergedTiles: mergedPositions,
        options: state.options,
      };
    }
    case "RESET": {
      const { size, target, soundOn } = state.options;
      const empty = createEmptyGrid(size);
      let withTile = addRandomTile(empty);
      withTile = addRandomTile(withTile);
      return {
        grid: withTile,
        score: 0,
        bestScore: state.bestScore,
        status: "playing",
        justMergedTiles: [],
        options: state.options,
      };
    }
    default:
      return state;
  }
}

export function useGame(
  size: number,
  target: number,
  soundOn: boolean
): {
  state: GameState;
  dispatch: React.Dispatch<Action>;
} {
  const storedBest = Number(localStorage.getItem("bestScore") || 0);
  const initialState: GameState = {
    grid: createEmptyGrid(size),
    score: 0,
    bestScore: storedBest,
    status: "playing",
    justMergedTiles: [],
    options: { size, target, soundOn },
  };

  const [state, dispatch] = useReducer(gameReducer, initialState);

  // 初回マウント時および size/target/soundOn が変わったときに再初期化
  useEffect(() => {
    dispatch({ type: "INIT", options: { size, target, soundOn } });
  }, [size, target, soundOn]);

  // ベストスコアを localStorage に保存
  useEffect(() => {
    localStorage.setItem("bestScore", String(state.bestScore));
  }, [state.bestScore]);

  return { state, dispatch };
}
