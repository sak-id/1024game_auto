import React from "react";
import {motion} from "motion/react"

interface TileProps {
  value: number;
  row: number;
  col: number;
}

const TILE_COLORS: { [key: number]: string } = {
  0: "#cdc1b4",
  2: "#eee4da",
  4: "#ede0c8",
  8: "#f2b179",
  16: "#f59563",
  32: "#f67c5f",
  64: "#f65e3b",
  // …以降は必要に応じて追加
};

const Tile: React.FC<TileProps> = ({ value, row, col }) => {
  const bgColor = TILE_COLORS[value] || "#3c3a32";
  return (
    <div
      className="tile"
      style={{
        backgroundColor: bgColor,
        gridRowStart: row + 1,
        gridColumnStart: col + 1,
      }}
    >
      {value !== 0 && <span className="tile-value">{value}</span>}
    </div>
    
  );
};

export default Tile;
