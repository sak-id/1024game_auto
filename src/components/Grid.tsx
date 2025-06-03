import React from "react";
import type { Grid as GridType } from "../lib/types";
import Tile from "./Tile";
interface GridProps {
  grid: GridType;
  justMergedTiles: { row: number; col: number }[];
}

const Grid: React.FC<GridProps> = ({ grid, justMergedTiles }) => {
  const size = grid.length; // 3 なら 3×3、4 なら 4×4…

  return (
    <div
      className="grid-container"
      style={{
        // "size" によって行・列を自動で同じ幅に繰り返す
        gridTemplateColumns: `repeat(${size}, 1fr)`,
        gridTemplateRows: `repeat(${size}, 1fr)`,
      }}
    >
      {grid.map((row, rIdx) =>
        row.map((cell, cIdx) => {
          const mergedHere = justMergedTiles.some(
            (pos) => pos.row === rIdx && pos.col === cIdx
          );
          return (
            <Tile
              key={`${rIdx}-${cIdx}`}
              value={cell}
              row={rIdx}
              col={cIdx}
              isJustMerged={mergedHere}
            />
          );
        })
      )}
    </div>
  );
};

export default Grid;