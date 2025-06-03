import React from "react";
import type { Grid as GridType } from "../lib/types";
import Tile from "./Tile";

interface GridProps {
  /** 現在の盤面（4×4 など） */
  grid: GridType;
  /** このターンで合成されたセル座標のリスト */
  justMergedTiles: { row: number; col: number }[];
}

const Grid: React.FC<GridProps> = ({ grid, justMergedTiles }) => {
  return (
    <div className="grid-container">
      {grid.map((row, rIdx) =>
        row.map((cell, cIdx) => {
          // このセル (rIdx, cIdx) が合成された位置リストに含まれているかをチェック
          const mergedHere = justMergedTiles.some(
            (pos) => pos.row === rIdx && pos.col === cIdx
          );
          return (
            <Tile
              key={`${rIdx}-${cIdx}`}
              value={cell}
              row={rIdx}
              col={cIdx}
              isJustMerged={mergedHere} // 合成セルなら true、そうでなければ false
            />
          );
        })
      )}
    </div>
  );
};

export default Grid;