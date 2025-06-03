import type { Grid, CellValue } from "./types";

// 空盤面を作る（全セルを0に）
export function createEmptyGrid(size: number): Grid {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
}

// ランダムにセルを選んで 2 or 4 を追加する（80%で2,20%で4）
export function addRandomTile(grid: Grid): Grid {
  const size = grid.length;
  const emptyCells: [number, number][] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 0) emptyCells.push([r, c]);
    }
  }
  if (emptyCells.length === 0) return grid;
  const idx = Math.floor(Math.random() * emptyCells.length);
  const [r, c] = emptyCells[idx];
  const value = Math.random() < 0.8 ? 2 : 4;
  const newGrid = grid.map(row => row.slice());
  newGrid[r][c] = value;
  return newGrid;
}

// 左スライド時の1行処理例
function slideAndMergeRow(row: CellValue[]): { newRow: CellValue[]; gainedScore: number } {
  const filtered = row.filter(v => v !== 0);
  const newRow: CellValue[] = [];
  let gainedScore = 0;
  let skip = false;
  for (let i = 0; i < filtered.length; i++) {
    if (skip) { skip = false; continue; }
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const merged = filtered[i] * 2;
      newRow.push(merged);
      gainedScore += merged;
      skip = true;
    } else {
      newRow.push(filtered[i]);
    }
  }
  // 残りを0で埋める
  while (newRow.length < row.length) newRow.push(0);
  return { newRow, gainedScore };
}

// グリッド全体をある方向にスライドして合成する処理（簡易版・左方向のみ）
export function moveLeft(grid: Grid): { newGrid: Grid; gainedScore: number } {
  const size = grid.length;
  let totalScore = 0;
  const newGrid: Grid = Array.from({ length: size }, () => Array(size).fill(0));
  for (let r = 0; r < size; r++) {
    const { newRow, gainedScore } = slideAndMergeRow(grid[r]);
    newGrid[r] = newRow;
    totalScore += gainedScore;
  }
  return { newGrid, gainedScore: totalScore };
}


// 右方向にスライドする → 各行を反転させてから左スライド処理、最後にまた反転して戻す
export function moveRight(grid: Grid): { newGrid: Grid; gainedScore: number } {
  const size = grid.length;
  let totalScore = 0;
  const newGrid: Grid = Array.from({ length: size }, () => Array(size).fill(0));

  for (let r = 0; r < size; r++) {
    // 1) 右スライドしたいので行を反転
    const reversed = [...grid[r]].reverse();
    const { newRow: mergedReversedRow, gainedScore } = slideAndMergeRow(reversed);
    totalScore += gainedScore;
    // 2) 合成後の行を元に戻して格納
    newGrid[r] = mergedReversedRow.reverse();
  }

  return { newGrid, gainedScore: totalScore };
}

// 上方向にスライドする → 列を1つずつ取り出して左スライドと同じロジックに流す
export function moveUp(grid: Grid): { newGrid: Grid; gainedScore: number } {
  const size = grid.length;
  let totalScore = 0;
  // 新しいグリッドを作成（丸ごと0で初期化）
  const newGrid: Grid = Array.from({ length: size }, () => Array(size).fill(0));

  for (let c = 0; c < size; c++) {
    // 1) 現在のグリッドから c列目を取り出す（例：[grid[0][c], grid[1][c], ...]）
    const column: CellValue[] = [];
    for (let r = 0; r < size; r++) {
      column.push(grid[r][c]);
    }
    // 2) それを左スライド相当で合成
    const { newRow: mergedColumn, gainedScore } = slideAndMergeRow(column);
    totalScore += gainedScore;
    // 3) 合成後の列を newGrid に書き込む
    for (let r = 0; r < size; r++) {
      newGrid[r][c] = mergedColumn[r];
    }
  }

  return { newGrid, gainedScore: totalScore };
}

// 下方向にスライドする → 列を反転してから左スライド、最後にまた元に戻す
export function moveDown(grid: Grid): { newGrid: Grid; gainedScore: number } {
  const size = grid.length;
  let totalScore = 0;
  const newGrid: Grid = Array.from({ length: size }, () => Array(size).fill(0));

  for (let c = 0; c < size; c++) {
    // 1) c列目を取り出して反転
    const column: CellValue[] = [];
    for (let r = 0; r < size; r++) {
      column.push(grid[r][c]);
    }
    const reversedColumn = [...column].reverse();
    // 2) 左スライド相当で合成
    const { newRow: mergedReversed, gainedScore } = slideAndMergeRow(reversedColumn);
    totalScore += gainedScore;
    // 3) 合成後を元に戻して newGrid に書き込む
    const mergedColumn = mergedReversed.reverse();
    for (let r = 0; r < size; r++) {
      newGrid[r][c] = mergedColumn[r];
    }
  }

  return { newGrid, gainedScore: totalScore };
}
