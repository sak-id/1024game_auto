import React from "react";
import type { Grid as GridType } from "../lib/types";
import Tile from "./Tile";

interface GridProps {
  grid: GridType;
}

const Grid: React.FC<GridProps> = ({ grid }) => {
  return (
    <div className="grid-container">
      {grid.map((row, rIdx) =>
        row.map((cell, cIdx) => (
          <Tile key={`${rIdx}-${cIdx}`} value={cell} row={rIdx} col={cIdx} />
        ))
      )}
    </div>
  );
};

export default Grid;
