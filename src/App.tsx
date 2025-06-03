// src/App.tsx
import React, { useState } from "react";
import Settings from "./components/Settings";
import GameBoard from "./components/GameBoard";
import "./App.css";

const SIZE = 4; // グリッドサイズ固定（将来的に可変化させる）
export type GameSettings = {
  size: number;       // 盤面サイズ（例：4 なら 4×4）
  target: number;     // 目標値（例：1024）
  soundOn: boolean;   // 効果音を鳴らすかどうか
};

const DEFAULT_SETTINGS: GameSettings = {
  size: 4,
  target: 1024,
  soundOn: true,
};

// const App: React.FC = () => {
//   const { state, dispatch } = useGame(SIZE);

//   // キーボード入力を監視
//   useEffect(() => {
//     const handleKeyDown = (e: KeyboardEvent) => {
//       if (state.status !== "playing") return;
//       switch (e.key) {
//         case "ArrowLeft":
//           dispatch({ type: "MOVE_LEFT" });
//           break;
//         case "ArrowRight":
//           dispatch({ type: "MOVE_RIGHT" });
//           break;
//         case "ArrowUp":
//           dispatch({ type: "MOVE_UP" });
//           break;
//         case "ArrowDown":
//           dispatch({ type: "MOVE_DOWN" });
//           break;
//         default:
//           break;
//       }
//     };
//     window.addEventListener("keydown", handleKeyDown);
//     return () => window.removeEventListener("keydown", handleKeyDown);
//   }, [dispatch, state.status]);

//   return (
//     <div className="app-container">
//       <h1>1024 game</h1>
//       <ScoreBoard score={state.score} bestScore={state.bestScore} />
//       <Grid grid={state.grid} justMergedTiles={state.justMergedTiles}/>
//       {state.status !== "playing" && (
//         <Modal
//           status={state.status}
//           score={state.score}
//           onRestart={() => dispatch({ type: "RESET" })}
//         />
//       )}
//     </div>
//   );
// };

const App: React.FC = () => {
  // 最初からデフォルト設定でゲームを開始
  const [settings, setSettings] = useState<GameSettings | null>(DEFAULT_SETTINGS);

  return (
    <div className="app-container">
      {settings === null ? (
        <Settings onStart={(s) => setSettings(s)} />
      ) : (
        <GameBoard
          size={settings.size}
          target={settings.target}
          soundOn={settings.soundOn}
          onBackToSettings={() => setSettings(null)}
        />
      )}
    </div>
  );
};

export default App;
