// hooks/useGame.ts
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
      };
    }
    case "MOVE_LEFT":
    case "MOVE_RIGHT":
    case "MOVE_UP":
    case "MOVE_DOWN": {
      if (state.status !== "playing") return state;

      // 1. どの方向の move 関数を呼ぶか決定
      let result;
      if (action.type === "MOVE_LEFT") result = moveLeft(state.grid);
      else if (action.type === "MOVE_RIGHT") result = moveRight(state.grid);
      else if (action.type === "MOVE_UP") result = moveUp(state.grid);
      else result = moveDown(state.grid);

      const { newGrid, gainedScore } = result;
      const moved = JSON.stringify(newGrid) !== JSON.stringify(state.grid);
      if (!moved) {
        // 盤面に変化がなければ何もしない
        return state;
      }

      // 2. 合成後に新しいタイルを追加
      const afterAdd = addRandomTile(newGrid);
      const newScore = state.score + gainedScore;
      const newBest = Math.max(state.bestScore, newScore);

      // 3. 勝利／ゲームオーバー判定（後述）を行う
      let newStatus: GameState["status"] = state.status;
      // ── 例：2048（あるいは1024）に到達したら "won" へ
      for (let r = 0; r < afterAdd.length; r++) {
        for (let c = 0; c < afterAdd.length; c++) {
          if (afterAdd[r][c] === 1024) {
            newStatus = "won";
          }
        }
      }
      // ── 空きセルがなく＆どこにも合成可能なペアがなければ "over"
      const hasEmpty = afterAdd.some(row => row.some(val => val === 0));
      if (!hasEmpty) {
        // 上下左右いずれかに動かせるならゲームオーバーではない
        const canMove =
          JSON.stringify(moveLeft(afterAdd).newGrid) !== JSON.stringify(afterAdd) ||
          JSON.stringify(moveRight(afterAdd).newGrid) !== JSON.stringify(afterAdd) ||
          JSON.stringify(moveUp(afterAdd).newGrid) !== JSON.stringify(afterAdd) ||
          JSON.stringify(moveDown(afterAdd).newGrid) !== JSON.stringify(afterAdd);
        if (!canMove && newStatus !== "won") {
          newStatus = "over";
        }
      }

      return {
        grid: afterAdd,
        score: newScore,
        bestScore: newBest,
        status: newStatus,
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
  });

  useEffect(() => {
    dispatch({ type: "INIT", size });
  }, [size]);

  useEffect(() => {
    localStorage.setItem("bestScore", String(state.bestScore));
  }, [state.bestScore]);

  return { state, dispatch };
}
