import type { Grid, MoveType } from "./types";
import {
  cloneGrid,
  getEmptyCells,
  moveDown,
  moveLeft,
  moveRight,
  moveUp,
} from "./gameLogic";

const MOVE_EXECUTORS: { type: MoveType; exec: typeof moveLeft }[] = [
  { type: "MOVE_LEFT", exec: moveLeft },
  { type: "MOVE_RIGHT", exec: moveRight },
  { type: "MOVE_UP", exec: moveUp },
  { type: "MOVE_DOWN", exec: moveDown },
];

const PROBABILITIES = [
  { value: 2, weight: 0.9 },
  { value: 4, weight: 0.1 },
] as const;

export function getBestMove(grid: Grid, depth: number): MoveType | null {
  let bestScore = Number.NEGATIVE_INFINITY;
  let chosen: MoveType | null = null;

  for (const { type, exec } of MOVE_EXECUTORS) {
    const { newGrid, gainedScore, moved } = exec(grid, {
      trackMergedPositions: false,
    });

    if (!moved) {
      continue;
    }

    const score = expectimax(
      newGrid,
      depth - 1,
      false,
      gainedScore
    );

    if (score > bestScore) {
      bestScore = score;
      chosen = type;
    }
  }

  return chosen;
}

function expectimax(
  grid: Grid,
  depth: number,
  isPlayerTurn: boolean,
  accumulatedScore: number
): number {
  if (depth <= 0) {
    return evaluateGrid(grid) + accumulatedScore;
  }

  if (isPlayerTurn) {
    let best = Number.NEGATIVE_INFINITY;
    for (const { exec } of MOVE_EXECUTORS) {
      const { newGrid, gainedScore, moved } = exec(grid, {
        trackMergedPositions: false,
      });
      if (!moved) {
        continue;
      }
      const score = expectimax(
        newGrid,
        depth - 1,
        false,
        accumulatedScore + gainedScore
      );
      if (score > best) {
        best = score;
      }
    }
    return best === Number.NEGATIVE_INFINITY
      ? evaluateGrid(grid) + accumulatedScore
      : best;
  }

  const empty = getEmptyCells(grid);
  if (empty.length === 0) {
    return expectimax(grid, depth - 1, true, accumulatedScore);
  }

  let totalScore = 0;
  for (const cell of empty) {
    for (const { value, weight } of PROBABILITIES) {
      const cloned = cloneGrid(grid);
      cloned[cell.row][cell.col] = value;
      const contribution = expectimax(
        cloned,
        depth - 1,
        true,
        accumulatedScore
      );
      totalScore += (weight / empty.length) * contribution;
    }
  }

  return totalScore;
}

function evaluateGrid(grid: Grid): number {
  const size = grid.length;
  let emptyCount = 0;
  let maxTile = 0;
  let sum = 0;
  let monotonicity = 0;
  let smoothness = 0;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const value = grid[r][c];
      if (value === 0) {
        emptyCount++;
        continue;
      }

      sum += value;
      if (value > maxTile) {
        maxTile = value;
      }

      if (c + 1 < size) {
        const right = grid[r][c + 1];
        monotonicity += right > value ? right - value : value - right;
        if (right !== 0) {
          smoothness += Math.abs(value - right);
        }
      }

      if (r + 1 < size) {
        const down = grid[r + 1][c];
        monotonicity += down > value ? down - value : value - down;
        if (down !== 0) {
          smoothness += Math.abs(value - down);
        }
      }
    }
  }

  const W_EMPTY = 1200;
  const W_MAX = 25;
  const W_SUM = 1;
  const W_MONO = 2;
  const W_SMOOTH = 1;
  const W_CORNER = 2000;

  const cornerBonus =
    grid[0][0] === maxTile ||
    grid[0][size - 1] === maxTile ||
    grid[size - 1][0] === maxTile ||
    grid[size - 1][size - 1] === maxTile
      ? W_CORNER
      : 0;

  return (
    W_EMPTY * emptyCount +
    W_MAX * maxTile +
    W_SUM * sum -
    W_MONO * monotonicity -
    W_SMOOTH * smoothness +
    cornerBonus
  );
}
