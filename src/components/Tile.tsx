import React from "react";
import { motion } from "motion/react";
// import "./Tile.css";

interface TileProps {
  value: number;
  row: number;
  col: number;
  isJustMerged?: boolean;
}

/** 数字ごとの背景色マップ */
const TILE_COLORS: { [key: number]: string } = {
  0: "#cdc1b4",
  2: "#eee4da",
  4: "#ede0c8",
  8: "#f2b179",
  16: "#f59563",
  32: "#f67c5f",
  64: "#f65e3b",
  128: "#edcf72",
  256: "#edcc61",
  512: "#edc850",
  1024: "#edc53f",
  2048: "#edc22e",
  4096: "#3c3a32",
  8192: "#3c3a32",
  16384: "#3c3a32",
  32768: "#3c3a32",
  65536: "#3c3a32",
};

const Tile: React.FC<TileProps> = ({ value, row, col, isJustMerged }) => {
  const bgColor = TILE_COLORS[value] || "#3c3a32";

  return (
    <motion.div
      className="tile"
      style={{
        gridRowStart: row + 1,
        gridColumnStart: col + 1,
        backgroundColor: bgColor,
      }}
      /* マウント（新規生成）時にフェードイン＋拡大縮小アニメーション */
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{
        opacity: 1,
        scale: isJustMerged ? [1, 1.1, 1] : 1,
      }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{
        duration: isJustMerged ? 0.2 : 0.25,
        // ease: "easeInOut",
        ease: [0.68, -0.55, 0.27, 1.55],
      }}
    >
      {value !== 0 && <span className="tile-value">{value}</span>}
    </motion.div>
  );
};

export default Tile;
