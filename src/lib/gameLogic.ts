// src/lib/gameLogic.ts

import type { CellValue, Grid, Position, SpawnedTile } from "./types";

export interface MoveOptions {
  trackMergedPositions?: boolean;
}

export interface MoveResult {
  newGrid: Grid;
  gainedScore: number;
  mergedPositions: Position[];
  moved: boolean;
}

type Direction = "left" | "right" | "up" | "down";

const TILE_VALUES = { two: 2, four: 4 } as const;

export function createEmptyGrid(size: number): Grid {
  return Array.from({ length: size }, () => Array(size).fill(0));
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => row.slice());
}

export function gridsEqual(a: Grid, b: Grid): boolean {
  if (a.length !== b.length) return false;
  for (let r = 0; r < a.length; r++) {
    const rowA = a[r];
    const rowB = b[r];
    if (rowA.length !== rowB.length) return false;
    for (let c = 0; c < rowA.length; c++) {
      if (rowA[c] !== rowB[c]) return false;
    }
  }
  return true;
}

export function getEmptyCells(grid: Grid): Position[] {
  const cells: Position[] = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] === 0) {
        cells.push({ row: r, col: c });
      }
    }
  }
  return cells;
}

export function hasTargetTile(grid: Grid, target: number): boolean {
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] === target) {
        return true;
      }
    }
  }
  return false;
}

export function canMove(grid: Grid): boolean {
  if (getEmptyCells(grid).length > 0) {
    return true;
  }

  const size = grid.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const current = grid[r][c];
      if (c + 1 < size && grid[r][c + 1] === current) {
        return true;
      }
      if (r + 1 < size && grid[r + 1][c] === current) {
        return true;
      }
    }
  }
  return false;
}

export function spawnRandomTile(
  grid: Grid,
  rng: () => number = Math.random
): { grid: Grid; spawn: SpawnedTile } | null {
  const emptyCells = getEmptyCells(grid);
  if (emptyCells.length === 0) {
    return null;
  }

  const cellIndex = Math.floor(rng() * emptyCells.length);
  const { row, col } = emptyCells[cellIndex];
  const value = rng() < 0.9 ? TILE_VALUES.two : TILE_VALUES.four;

  const nextGrid = cloneGrid(grid);
  nextGrid[row][col] = value;

  return {
    grid: nextGrid,
    spawn: { row, col, value },
  };
}

function slideAndMergeLine(
  line: CellValue[],
  trackMergedPositions: boolean
): {
  mergedLine: CellValue[];
  gainedScore: number;
  mergedAt: number[];
} {
  const compacted = line.filter((value) => value !== 0);
  const mergedLine: CellValue[] = Array(line.length).fill(0);
  const mergedAt: number[] = [];

  let writeIndex = 0;
  let gainedScore = 0;

  for (let i = 0; i < compacted.length; i++) {
    const current = compacted[i];
    const next = compacted[i + 1];
    if (next !== undefined && current === next) {
      const mergedValue = current * 2;
      mergedLine[writeIndex] = mergedValue;
      gainedScore += mergedValue;
      if (trackMergedPositions) {
        mergedAt.push(writeIndex);
      }
      writeIndex++;
      i++; // Skip the next value because it has been merged.
    } else {
      mergedLine[writeIndex] = current;
      writeIndex++;
    }
  }

  return { mergedLine, gainedScore, mergedAt };
}

function moveGrid(
  grid: Grid,
  direction: Direction,
  options: MoveOptions = {}
): MoveResult {
  const { trackMergedPositions = true } = options;
  const size = grid.length;
  const nextGrid = createEmptyGrid(size);
  const mergedPositions: Position[] = [];

  let totalScore = 0;
  let moved = false;

  const useRows = direction === "left" || direction === "right";
  const reversed = direction === "right" || direction === "down";

  for (let index = 0; index < size; index++) {
    const line: CellValue[] = [];
    for (let inner = 0; inner < size; inner++) {
      if (useRows) {
        const col = reversed ? size - 1 - inner : inner;
        line.push(grid[index][col]);
      } else {
        const row = reversed ? size - 1 - inner : inner;
        line.push(grid[row][index]);
      }
    }

    const { mergedLine, gainedScore, mergedAt } = slideAndMergeLine(
      line,
      trackMergedPositions
    );
    totalScore += gainedScore;

    const restoredLine = reversed ? mergedLine.slice().reverse() : mergedLine;

    for (let inner = 0; inner < size; inner++) {
      if (useRows) {
        nextGrid[index][inner] = restoredLine[inner];
      } else {
        nextGrid[inner][index] = restoredLine[inner];
      }
    }

    if (!moved) {
      for (let inner = 0; inner < size; inner++) {
        const originalValue = useRows
          ? grid[index][inner]
          : grid[inner][index];
        if (originalValue !== restoredLine[inner]) {
          moved = true;
          break;
        }
      }
    }

    if (trackMergedPositions) {
      for (const mergedIndex of mergedAt) {
        const actualIndex = reversed ? size - 1 - mergedIndex : mergedIndex;
        if (useRows) {
          mergedPositions.push({ row: index, col: actualIndex });
        } else {
          mergedPositions.push({ row: actualIndex, col: index });
        }
      }
    }
  }

  return {
    newGrid: nextGrid,
    gainedScore: totalScore,
    mergedPositions,
    moved,
  };
}

export function moveLeft(grid: Grid, options?: MoveOptions): MoveResult {
  return moveGrid(grid, "left", options);
}

export function moveRight(grid: Grid, options?: MoveOptions): MoveResult {
  return moveGrid(grid, "right", options);
}

export function moveUp(grid: Grid, options?: MoveOptions): MoveResult {
  return moveGrid(grid, "up", options);
}

export function moveDown(grid: Grid, options?: MoveOptions): MoveResult {
  return moveGrid(grid, "down", options);
}
