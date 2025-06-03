// src/components/ScoreBoard.tsx
import React from "react";

interface ScoreBoardProps {
  score: number;
  bestScore: number;
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({ score, bestScore }) => {
  return (
    <div className="scoreboard-container">
      <div className="scorebox">
        <div className="score-title">SCORE</div>
        <div className="score-value">{score}</div>
      </div>
      <div className="scorebox">
        <div className="score-title">BEST</div>
        <div className="score-value">{bestScore}</div>
      </div>
    </div>
  );
};

export default ScoreBoard;
