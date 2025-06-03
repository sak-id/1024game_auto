// src/components/GameBoard.tsx
import React, { useEffect } from "react";
import { useGame } from "../hooks/useGame";
import Grid from "./Grid";
import ScoreBoard from "./ScoreBoard";
import Modal from "./Modal";
import type { GameSettings } from "../App";
import "./GameBoard.css";

interface GameBoardProps extends GameSettings {
  onBackToSettings: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({
  size,
  target,
  soundOn,
  onBackToSettings,
}) => {
  const { state, dispatch } = useGame(size, target, soundOn);

  // キーボード入力のハンドリング
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (state.status !== "playing") return;
      switch (e.key) {
        case "ArrowLeft":
          dispatch({ type: "MOVE_LEFT" });
          break;
        case "ArrowRight":
          dispatch({ type: "MOVE_RIGHT" });
          break;
        case "ArrowUp":
          dispatch({ type: "MOVE_UP" });
          break;
        case "ArrowDown":
          dispatch({ type: "MOVE_DOWN" });
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch, state.status]);

  return (
    <div className="gameboard-container">
      <div className="gameboard-header">
        <button className="back-button" onClick={onBackToSettings}>
          設定に戻る
        </button>
        <h1>{target} を目指せ！</h1>
      </div>

      <ScoreBoard score={state.score} bestScore={state.bestScore} />
      <Grid grid={state.grid} justMergedTiles={state.justMergedTiles} />

      {state.status !== "playing" && (
        <Modal
          status={state.status}
          score={state.score}
          onRestart={() => dispatch({ type: "RESET" })}
        />
      )}
    </div>
  );
};

export default GameBoard;
