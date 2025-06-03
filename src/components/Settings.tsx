// src/components/Settings.tsx
import React, { useState } from "react";
import type { GameSettings } from "../App";
import "./Settings.css";

interface SettingsProps {
  onStart: (settings: GameSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ onStart }) => {
  // デフォルト値を 4×4 / 1024 / 効果音 ON にしておく
  const [size, setSize] = useState<number>(4);
  const [target, setTarget] = useState<number>(1024);
  const [soundOn, setSoundOn] = useState<boolean>(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart({ size, target, soundOn });
  };

  return (
    <div className="settings-container">
      <h2>ゲーム設定</h2>
      <form className="settings-form" onSubmit={handleSubmit}>
        <label>
          盤面サイズ：
          <select value={size} onChange={(e) => setSize(Number(e.target.value))}>
            <option value={3}>3 × 3</option>
            <option value={4}>4 × 4</option>
            <option value={5}>5 × 5</option>
            <option value={6}>6 × 6</option>
            <option value={7}>7 × 7</option>
          </select>
        </label>

        <label>
          目標数：
          <select
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
          >
            <option value={512}>512</option>
            <option value={1024}>1024</option>
            <option value={2048}>2048</option>
            <option value={4096}>4096</option>
          </select>
        </label>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={soundOn}
            onChange={(e) => setSoundOn(e.target.checked)}
          />
          効果音を ON にする
        </label>

        <button type="submit" className="start-button">
          ゲームを開始
        </button>
      </form>
    </div>
  );
};

export default Settings;
