// src/components/Modal.tsx
import React from "react";
import "./Modal.css";


interface ModalProps {
  /** "won"：目標タイル到達（クリア） / "over"：盤面に動かせるところがなくなった（ゲームオーバー） */
  status: "won" | "over";
  /** 現在のスコア */
  score: number;
  /** 「もう一度プレイ」ボタンを押したときに呼ばれる関数 */
  onRestart: () => void;
}

const Modal: React.FC<ModalProps> = ({ status, score, onRestart }) => {
  const title = status === "won" ? "おめでとう！クリア！" : "ゲームオーバー";
  const message = status === "won"
    ? `あなたのスコア: ${score}`
    : `残念、負けちゃいました。スコア: ${score}`;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h2>{title}</h2>
        <p>{message}</p>
        <button className="restart-button" onClick={onRestart}>
          もう一度遊ぶ
        </button>
      </div>
    </div>
  );
};

export default Modal;
