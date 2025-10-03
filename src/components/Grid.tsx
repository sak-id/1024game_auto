import React, { useMemo } from "react";
import type { Grid as GridType, Position } from "../lib/types";
import Tile from "./Tile";

interface GridProps {
  grid: GridType;
  justMergedTiles: Position[];
}

const Grid: React.FC<GridProps> = ({ grid, justMergedTiles }) => {
  const size = grid.length;
  const mergedSet = useMemo(() => {
    const entries = new Set<string>();
    for (const { row, col } of justMergedTiles) {
      entries.add(`${row}:${col}`);
    }
    return entries;
  }, [justMergedTiles]);

  return (
    <div
      className="grid-container"
      style={{
        gridTemplateColumns: `repeat(${size}, 1fr)`,
        gridTemplateRows: `repeat(${size}, 1fr)`,
      }}
    >
      {grid.map((row, rIdx) =>
        row.map((cell, cIdx) => {
          const mergedHere = mergedSet.has(`${rIdx}:${cIdx}`);
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
