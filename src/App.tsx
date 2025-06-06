// src/App.tsx
import React, { useState } from "react";
import Settings from "./components/Settings";
import GameBoard from "./components/GameBoard";
import "./App.css";

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
