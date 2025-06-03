// src/components/Modal.tsx
import React from "react";

interface ModalProps {
  /** "won"：目標タイル到達（クリア） / "over"：盤面に動かせるところがなくなった（ゲームオーバー） */
  status: "won" | "over";
  /** 現在のスコア */
  score: number;
  /** 「もう一度プレイ」ボタンを押したときに呼ばれる関数 */
  onRestart: () => void;
}

const Modal: React.FC<ModalProps> = ({ status, score, onRestart }) => {
  // モーダル内に表示するメッセージをステータスに応じて設定
  const titleText = status === "won" ? "🎉 クリア！おめでとうございます 🎉" : "💥 ゲームオーバー 💥";
  const descriptionText =
    status === "won"
      ? "目標のタイルを作成しました。続けますか？"
      : "これ以上動かせる場所がありません。";

  return (
    // オーバーレイ部分（背景を半透明にして中央にモーダルを配置）
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">{titleText}</h2>
        <p className="modal-description">{descriptionText}</p>
        <p className="modal-score">あなたのスコア：{score}</p>
        <button className="modal-button" onClick={onRestart}>
          もう一度プレイ
        </button>
      </div>
    </div>
  );
};

export default Modal;
