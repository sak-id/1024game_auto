import { useReducer, useEffect } from "react";
import type { GameState } from "../lib/types";
import {
  createEmptyGrid,
  addRandomTile,
  moveLeft,
  moveRight,
  moveUp,
  moveDown,
} from "../lib/gameLogic";

type Action =
  | { type: "INIT"; size: number }
  | { type: "MOVE_LEFT" }
  | { type: "MOVE_RIGHT" }
  | { type: "MOVE_UP" }
  | { type: "MOVE_DOWN" }
  | { type: "RESET" };

function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "INIT": {
      const empty = createEmptyGrid(action.size);
      let withTile = addRandomTile(empty);
      withTile = addRandomTile(withTile);
      return {
        grid: withTile,
        score: 0,
        bestScore: state.bestScore,
        status: "playing",
        justMergedTiles: [], // 初期状態は合成なし
      };
    }
    case "MOVE_LEFT":
    case "MOVE_RIGHT":
    case "MOVE_UP":
    case "MOVE_DOWN": {
      if (state.status !== "playing") return state;

      // move 関数を選択して実行
      let result:
        | ReturnType<typeof moveLeft>
        | ReturnType<typeof moveRight>
        | ReturnType<typeof moveUp>
        | ReturnType<typeof moveDown>;
      if (action.type === "MOVE_LEFT") result = moveLeft(state.grid);
      else if (action.type === "MOVE_RIGHT") result = moveRight(state.grid);
      else if (action.type === "MOVE_UP") result = moveUp(state.grid);
      else result = moveDown(state.grid);

      const { newGrid, gainedScore, mergedPositions } = result;

      // グリッドに変化があったかチェック
      const moved = JSON.stringify(newGrid) !== JSON.stringify(state.grid);
      if (!moved) {
        // 変化がなければ「合成もなし」として justMergedTiles を空にする
        return {
          ...state,
          justMergedTiles: [],
        };
      }

      // 合成があったときだけ新しいタイルを追加し、スコアを更新
      const afterAdd = addRandomTile(newGrid);
      const newScore = state.score + gainedScore;
      const newBest = Math.max(state.bestScore, newScore);

      // 勝利判定（例: 1024 到達時）
      let newStatus: GameState["status"] = state.status;
      for (let r = 0; r < afterAdd.length; r++) {
        for (let c = 0; c < afterAdd.length; c++) {
          if (afterAdd[r][c] === 1024) {
            newStatus = "won";
          }
        }
      }

      // 空きセルがなく、どこにも動かせない場合はゲームオーバー
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
        justMergedTiles: mergedPositions, // 合成されたセル座標を記録
      };
    }
    case "RESET": {
      const size = state.grid.length;
      const empty = createEmptyGrid(size);
      let withTile = addRandomTile(empty);
      withTile = addRandomTile(withTile);
      return {
        grid: withTile,
        score: 0,
        bestScore: state.bestScore,
        status: "playing",
        justMergedTiles: [],
      };
    }
    default:
      return state;
  }
}

export function useGame(size: number) {
  const storedBest = Number(localStorage.getItem("bestScore") || 0);
  const [state, dispatch] = useReducer(gameReducer, {
    grid: createEmptyGrid(size),
    score: 0,
    bestScore: storedBest,
    status: "playing",
    justMergedTiles: [],
  });

  // マウント時に初期化
  useEffect(() => {
    dispatch({ type: "INIT", size });
  }, [size]);

  // ベストスコアを LocalStorage に保存
  useEffect(() => {
    localStorage.setItem("bestScore", String(state.bestScore));
  }, [state.bestScore]);

  return { state, dispatch };
}
