// src/App.tsx
import React, { useEffect } from "react";
import { useGame } from "./hooks/useGame";
import Grid from "./components/Grid";
import ScoreBoard from "./components/ScoreBoard";
import Modal from "./components/Modal";
import "./App.css";

const SIZE = 4; // グリッドサイズ固定（将来的に可変化させる）

const App: React.FC = () => {
  const { state, dispatch } = useGame(SIZE);

  // キーボード入力を監視
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
    <div className="app-container">
      <h1>1024 game</h1>
      <ScoreBoard score={state.score} bestScore={state.bestScore} />
      <Grid grid={state.grid} justMergedTiles={state.justMergedTiles}/>
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

export default App;
