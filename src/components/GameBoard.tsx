// src/components/GameBoard.tsx

import React, { useEffect } from "react";
import { useGame } from "../hooks/useGame";
import { useAutoPlayer } from "../hooks/useAutoPlayer";
import Grid from "./Grid";
import ScoreBoard from "./ScoreBoard";
import Modal from "./Modal";
import type { MoveType } from "../lib/types";
import "./GameBoard.css";

interface GameBoardProps {
  size: number;
  target: number;
  soundOn: boolean;
  onBackToSettings: () => void;
}

const KEY_TO_MOVE: Partial<Record<string, MoveType>> = {
  ArrowLeft: "MOVE_LEFT",
  ArrowRight: "MOVE_RIGHT",
  ArrowUp: "MOVE_UP",
  ArrowDown: "MOVE_DOWN",
};

const GameBoard: React.FC<GameBoardProps> = ({
  size,
  target,
  soundOn,
  onBackToSettings,
}) => {
  const { state, move, reset } = useGame(size, target, soundOn);
  const { autoMode, toggleAuto, stopAuto } = useAutoPlayer(state, move);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const direction = KEY_TO_MOVE[event.key];
      if (!direction) {
        return;
      }
      event.preventDefault();
      if (state.status !== "playing") {
        return;
      }
      stopAuto();
      move(direction);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [move, state.status, stopAuto]);

  const handleRestart = () => {
    stopAuto();
    reset();
  };

  const handleBackToSettings = () => {
    stopAuto();
    onBackToSettings();
  };

  return (
    <div className="gameboard-container">
      <div className="gameboard-header">
        <button className="back-button" onClick={handleBackToSettings}>
          設定に戻る
        </button>
        <h1>{target} を目指せ！</h1>
      </div>

      <ScoreBoard score={state.score} bestScore={state.bestScore} />

      <div className="auto-controls">
        <button
          className={`auto-button ${autoMode ? "on" : "off"}`}
          onClick={toggleAuto}
          disabled={state.status !== "playing" && !autoMode}
        >
          {autoMode ? "自動プレイ停止" : "自動プレイ開始"}
        </button>
      </div>

      <Grid grid={state.grid} justMergedTiles={state.justMergedTiles} />

      {state.status !== "playing" && (
        <Modal status={state.status} score={state.score} onRestart={handleRestart} />
      )}
    </div>
  );
};

export default GameBoard;
