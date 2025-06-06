// src/components/GameBoard.tsx

import React, { useEffect, useState, useRef } from "react";
import { useGame } from "../hooks/useGame";
import Grid from "./Grid";
import ScoreBoard from "./ScoreBoard";
import Modal from "./Modal";
import { getBestMove } from "../lib/ai";
import type { MoveType } from "../lib/types";
import "./GameBoard.css";

const createAIWorker = () =>
  new Worker(new URL("./aiWorker.ts", import.meta.url), { type: "module" });


interface GameBoardProps {
  size: number;
  target: number;
  soundOn: boolean;
  onBackToSettings: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({
  size,
  target,
  soundOn,
  onBackToSettings,
}) => {
  const { state, dispatch } = useGame(size, target, soundOn);

  // Auto Play フラグ
  const [autoMode, setAutoMode] = useState<boolean>(false);

  // Worker インスタンスを保持する ref
  const workerRef = useRef<Worker | null>(null);

  // コンポーネントマウント時に Worker を生成
  useEffect(() => {
    // createAIWorker() でインスタンスを生成
    workerRef.current = createAIWorker();
    return () => {
      // アンマウント時に必ず terminate() を呼んで Worker を終了させる
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  // 手動操作（矢印キー）の処理はそのまま
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

  // Auto Play 用 useEffect (Worker 版)
  useEffect(() => {
    if (!autoMode) return;

    const worker = workerRef.current;
    if (!worker) return;

    // Worker からメインに返ってきた最適手を受け取る
    const handleMessage = (e: MessageEvent<MoveType | null>) => {
      const bestMove = e.data;
      if (state.status !== "playing" || bestMove === null) {
        // ゲーム終了 or bestMove が null なら自動停止
        setAutoMode(false);
      } else {
        dispatch({ type: bestMove });
      }
    };
    worker.addEventListener("message", handleMessage);

    // 500ms ごとに盤面と探索深度を Worker に送信して計算してもらう
    const interval = setInterval(() => {
      if (state.status !== "playing") {
        setAutoMode(false);
        return;
      }
      // Worker に「現在の盤面」と「探索深度」を渡す
      worker.postMessage({ grid: state.grid, depth: 3 });
    }, 500);

    return () => {
      clearInterval(interval);
      worker.removeEventListener("message", handleMessage);
    };
  }, [autoMode, dispatch, state.grid, state.status]);

  return (
    <div className="gameboard-container">
      <div className="gameboard-header">
        <button className="back-button" onClick={onBackToSettings}>
          設定に戻る
        </button>
        <h1>{target} を目指せ！</h1>
      </div>

      <ScoreBoard score={state.score} bestScore={state.bestScore} />

      <div className="auto-controls">
        <button
          className={`auto-button ${autoMode ? "on" : "off"}`}
          onClick={() => setAutoMode((prev) => !prev)}
        >
          {autoMode ? "自動プレイ停止" : "自動プレイ開始"}
        </button>
      </div>

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
