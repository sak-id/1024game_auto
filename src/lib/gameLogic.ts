// src/lib/gameLogic.ts

import type { Grid, CellValue } from "./types";

/** 
 * 1行分（CellValue[]）を左スライドして合成する関数（合成時のインデックスを返す版）
 * @param row: 一次元配列 (長さ = グリッド幅)
 * @returns
 *   - newRow: 合成後の row（左寄せ＋0埋め）
 *   - gainedScore: その行で合成された合計スコア
 *   - mergedIndices: 「元の row で i と i+1 が合成されたとき」の i のインデックスを記録。
 *     例：row = [2,2,2,0] の場合、左スライド合成後 → [4,2,0,0] になり
 *       ・「最初の 2 と 2」が合成されたので i=0 を記録
 *       ・残りの [2] は合成なし　→ mergedIndices = [0]
 */
function slideAndMergeRowWithIndices(
  row: CellValue[]
): {
  newRow: CellValue[];
  gainedScore: number;
  mergedIndices: number[];
} {
  const filtered = row.filter((v) => v !== 0);
  const newRow: CellValue[] = [];
  let gainedScore = 0;
  let skip = false;

  // 「合成発生時の行内インデックス」を記録する配列
  const mergedIndices: number[] = [];

  for (let i = 0; i < filtered.length; i++) {
    if (skip) {
      skip = false;
      continue;
    }
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      // 合成が発生
      const mergedValue = filtered[i] * 2;
      newRow.push(mergedValue);
      gainedScore += mergedValue;
      mergedIndices.push(i); // 「i 番目と i+1 番目が合成された」→ i 番目を記録
      skip = true;
    } else {
      newRow.push(filtered[i]);
    }
  }

  // 残りを 0 埋めする
  while (newRow.length < row.length) {
    newRow.push(0);
  }

  return { newRow, gainedScore, mergedIndices };
}

/** 空盤面を作る（全セルを 0 に） */
export function createEmptyGrid(size: number): Grid {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => 0)
  );
}

/** ランダムにセルを選んで 2 or 4 を追加する（80%で2、20%で4） */
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
  const newGrid = grid.map((row) => row.slice());
  newGrid[r][c] = value;
  return newGrid;
}

/** 左方向にスライド＋合成し、さらに「合成されたセル位置」を返す */
export function moveLeft(grid: Grid): {
  newGrid: Grid;
  gainedScore: number;
  mergedPositions: { row: number; col: number }[];
} {
  const size = grid.length;
  let totalScore = 0;

  // 合成されたセルの (row, col) 座標を格納する配列
  const mergedPositions: { row: number; col: number }[] = [];

  // まず newGrid をゼロで初期化
  const tempGrid: Grid = Array.from({ length: size }, () =>
    Array(size).fill(0)
  );

  for (let r = 0; r < size; r++) {
    // 1行分を左スライド合成し、その行内の「合成インデックス」を得る
    const { newRow, gainedScore, mergedIndices } = slideAndMergeRowWithIndices(
      grid[r]
    );

    // 1行目として newRow を一時格納
    tempGrid[r] = newRow;
    totalScore += gainedScore;

    // mergedIndices は「行内の i 番目と i+1 番目が合成された」という情報なので、
    // newRow 上で合成後に配置される列番号（左詰めされた後の出現位置）を計算して mergedPositions に追加する。
    // 具体的には、ある i が合成されたとき、そのタイルは newRow 上の「左詰めインデックス j」になるので j を求める。
    //
    // たとえば元の row = [2,2,2,0] のとき、filtered = [2,2,2]
    // - i=0 と i+1=1 が合成 → newRow の先頭に [4, …]
    // - その後の filtered[2]=2 が newRow の 1 番目に配置
    // → mergedIndices = [0]
    // → newRow = [4,2,0,0]
    //
    // つまり「i 番目が合成された」とき newRow 上でタイルが配置される列番号 j は、
    //   j = mergedIndices の走査中に既に newRow に詰まっている要素数  のまま「左詰め順」で決定
    //
    // ひとまず簡易的に ver.1 として「mergedIndices の要素数分だけ左詰めの位置 j を割り当てる」実装：
    mergedIndices.forEach((iInRow, idxMerge) => {
      // (idxMerge) 番目に出現する合成タイルは newRow 上では列番号 = idxMerge になる想定
      // ただし、実際は mergedIndices が [0, 2] のように複数要素の場合の算出ロジックはやや複雑なので、
      // ここでは「単純に左から順に埋まっていくもの」として以下のようにします。
      //
      // j＝「その行において合成タイルが詰まる列」（0 から始まる index）
      const j = idxMerge;
      mergedPositions.push({ row: r, col: j });
    });
  }

  return {
    newGrid: tempGrid,
    gainedScore: totalScore,
    mergedPositions,
  };
}

/** 右方向にスライド＋合成 → 左スライドと反転処理を組み合わせて行う */
export function moveRight(grid: Grid): {
  newGrid: Grid;
  gainedScore: number;
  mergedPositions: { row: number; col: number }[];
} {
  const size = grid.length;
  let totalScore = 0;
  const mergedPositions: { row: number; col: number }[] = [];
  // 一旦左スライド用に変換した一時グリッド
  const tempGrid: Grid = Array.from({ length: size }, () =>
    Array(size).fill(0)
  );

  for (let r = 0; r < size; r++) {
    // 1) 行を反転してから左スライド合成を行う
    const reversedRow = [...grid[r]].reverse();
    const {
      newRow: mergedReversedRow,
      gainedScore,
      mergedIndices,
    } = slideAndMergeRowWithIndices(reversedRow);
    totalScore += gainedScore;

    // 2) 合成後の行を元に戻して tempGrid に格納（右スライド後の状態）
    tempGrid[r] = mergedReversedRow.reverse();

    // 3) mergedIndices は「反転後の配列 indices」。反転前のオリジナルに戻すときの座標計算：
    //   反転前の元の列位置 i は、反転後の配列の位置 → newCol = size - 1 - i
    //   ただし mergedIndices は「反転後の iInRow」に対して記録されているので、
    //   (反転前における列番号) = size - 1 - (mergedIndices の iInRow)
    mergedIndices.forEach((iInReversedRow, idxMerge) => {
      const newCol = size - 1 - iInReversedRow;
      // newRow 上で右詰めされた結果、合成タイルがどの列に落ちるかを求めるのは少し複雑なので、
      // ここでは「列は newCol の位置に合成されたものが入る」と仮定して mergedPositions に保存します。
      mergedPositions.push({ row: r, col: newCol });
    });
  }

  return {
    newGrid: tempGrid,
    gainedScore: totalScore,
    mergedPositions,
  };
}

/** 上方向にスライド＋合成 → 列ごとに左スライド合成を適用 */
export function moveUp(grid: Grid): {
  newGrid: Grid;
  gainedScore: number;
  mergedPositions: { row: number; col: number }[];
} {
  const size = grid.length;
  let totalScore = 0;
  const mergedPositions: { row: number; col: number }[] = [];
  const tempGrid: Grid = Array.from({ length: size }, () =>
    Array(size).fill(0)
  );

  for (let c = 0; c < size; c++) {
    // 1) 列を取り出して左スライド合成
    const column: CellValue[] = [];
    for (let r = 0; r < size; r++) {
      column.push(grid[r][c]);
    }
    const {
      newRow: mergedColumn,
      gainedScore,
      mergedIndices,
    } = slideAndMergeRowWithIndices(column);
    totalScore += gainedScore;

    // 2) 合成後の列を tempGrid に書き込む
    for (let r = 0; r < size; r++) {
      tempGrid[r][c] = mergedColumn[r];
    }

    // 3) mergedIndices（列内で iInColumn が合成された）をグリッド上の (row, col) に変換
    mergedIndices.forEach((iInColumn, idxMerge) => {
      // 左スライド後の列では「詰められた位置 = idxMerge（0 から始まる）」として扱う
      const newRow = idxMerge;
      mergedPositions.push({ row: newRow, col: c });
    });
  }

  return {
    newGrid: tempGrid,
    gainedScore: totalScore,
    mergedPositions,
  };
}

/** 下方向にスライド＋合成 → 列を反転してから左スライド、元に戻す */
export function moveDown(grid: Grid): {
  newGrid: Grid;
  gainedScore: number;
  mergedPositions: { row: number; col: number }[];
} {
  const size = grid.length;
  let totalScore = 0;
  const mergedPositions: { row: number; col: number }[] = [];
  const tempGrid: Grid = Array.from({ length: size }, () =>
    Array(size).fill(0)
  );

  for (let c = 0; c < size; c++) {
    // 1) c列目を取り出して反転
    const column: CellValue[] = [];
    for (let r = 0; r < size; r++) {
      column.push(grid[r][c]);
    }
    const reversedColumn = [...column].reverse();

    // 2) 左スライド合成を行う（反転後）
    const {
      newRow: mergedReversed,
      gainedScore,
      mergedIndices,
    } = slideAndMergeRowWithIndices(reversedColumn);
    totalScore += gainedScore;

    // 3) 合成後の列を元に戻しつつ tempGrid に書き込む
    const mergedColumn = mergedReversed.reverse();
    for (let r = 0; r < size; r++) {
      tempGrid[r][c] = mergedColumn[r];
    }

    // 4) 反転前のオリジナル座標に戻す
    mergedIndices.forEach((iInReversedColumn, idxMerge) => {
      // 反転前の元の位置 = size - 1 - iInReversedColumn
      const originalRow = size - 1 - iInReversedColumn;
      mergedPositions.push({ row: originalRow, col: c });
    });
  }

  return {
    newGrid: tempGrid,
    gainedScore: totalScore,
    mergedPositions,
  };
}
