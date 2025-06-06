// src/lib/ai.ts

import type { Grid, CellValue, MoveType } from "./types";
import {
  moveLeft,
  moveRight,
  moveUp,
  moveDown,
} from "./gameLogic";

/**
 * α–βプルーニング付き Expectimax を使って最適な手（MoveType）を返す
 * @param grid  現在の盤面
 * @param depth  残り探索深度（player+chance のノード数）
 * @returns     "MOVE_LEFT" | "MOVE_RIGHT" | "MOVE_UP" | "MOVE_DOWN" | null
 */
export function getBestMove(
  grid: Grid,
  depth: number
): MoveType | null {
  const moves: MoveType[] = [
    "MOVE_LEFT",
    "MOVE_RIGHT",
    "MOVE_UP",
    "MOVE_DOWN",
  ];

  let bestScore = -Infinity;
  let bestMove: MoveType | null = null;

  // α と β の初期値
  const initialAlpha = -Infinity;
  const initialBeta = Infinity;

  for (const mv of moves) {
    // ① moveXXX() を呼んで新しい盤面を取得
    let result;
    switch (mv) {
      case "MOVE_LEFT":
        result = moveLeft(grid);
        break;
      case "MOVE_RIGHT":
        result = moveRight(grid);
        break;
      case "MOVE_UP":
        result = moveUp(grid);
        break;
      case "MOVE_DOWN":
        result = moveDown(grid);
        break;
    }

    const newGrid = result.newGrid;

    // ② 盤面が変わらない（移動できない）場合はスキップ
    if (JSON.stringify(newGrid) === JSON.stringify(grid)) {
      continue;
    }

    // ③ Expectimax（Chance ノードから開始）を呼び出し
    const score = expectimax(
      newGrid,
      depth - 1,
      false,
      initialAlpha,
      initialBeta
    );

    // ④ 最良スコアを更新
    if (score > bestScore) {
      bestScore = score;
      bestMove = mv;
    }
  }

  return bestMove;
}

/**
 * α–βプルーニング付き Expectimax 再帰関数
 * @param grid          現局面の盤面
 * @param depth         残り探索階層数
 * @param isPlayerTurn  true: プレイヤーノード (Max), false: チャンスノード
 * @param alpha         α の値（下限）
 * @param beta          β の値（上限）
 * @returns             その盤面の期待値または評価値
 */
function expectimax(
  grid: Grid,
  depth: number,
  isPlayerTurn: boolean,
  alpha: number,
  beta: number
): number {
  // 1) 探索深度 0 なら評価関数を返す
  if (depth === 0) {
    return evaluateGrid(grid);
  }

  // 2) プレイヤーノード (Max Node)
  if (isPlayerTurn) {
    let maxScore = -Infinity;
    let currentAlpha = alpha;

    // 4 方向の移動を試す
    const directions: {
      fn: (g: Grid) => { newGrid: Grid; gainedScore: number };
    }[] = [
      { fn: moveLeft },
      { fn: moveRight },
      { fn: moveUp },
      { fn: moveDown },
    ];

    for (const { fn } of directions) {
      const { newGrid } = fn(grid);

      // 盤面が変わらないならスキップ
      if (JSON.stringify(newGrid) === JSON.stringify(grid)) {
        continue;
      }

      // 次はチャンスノードなので isPlayerTurn = false
      const score = expectimax(
        newGrid,
        depth - 1,
        false,
        currentAlpha,
        beta
      );

      // Max ノードなので最大値を取る
      if (score > maxScore) {
        maxScore = score;
      }

      // α–βプルーニング：α を更新して β 以上なら打ち切る
      currentAlpha = Math.max(currentAlpha, maxScore);
      if (currentAlpha >= beta) {
        break;
      }
    }

    // どこも移動できない場合は評価関数にフォールバック
    if (maxScore === -Infinity) {
      return evaluateGrid(grid);
    }
    return maxScore;
  }

  // 3) チャンスノード (Chance Node)
  let totalScore = 0;
  let totalWeight = 0;

  const size = grid.length;
  const emptyCells: { r: number; c: number }[] = [];

  // 空セルを列挙
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 0) {
        emptyCells.push({ r, c });
      }
    }
  }

  // 空セルが 0 個なら、次はプレイヤーノード
  if (emptyCells.length === 0) {
    return expectimax(grid, depth - 1, true, alpha, beta);
  }

  // タイル生成の確率分布: 2 → 0.9, 4 → 0.1
  const probs: { tile: CellValue; prob: number }[] = [
    { tile: 2, prob: 0.9 },
    { tile: 4, prob: 0.1 },
  ];

  // 各空セル、各タイル値で子ノードを評価
  for (const { r, c } of emptyCells) {
    for (const { tile, prob } of probs) {
      // 重みは確率 / 空セル数
      const weight = prob / emptyCells.length;
      // コピーを作ってタイルをセット
      const childGrid = grid.map((row) => row.slice());
      childGrid[r][c] = tile;
      // 次はプレイヤーノード
      const score = expectimax(childGrid, depth - 1, true, alpha, beta);
      totalScore += weight * score;
      totalWeight += weight;
    }
  }

  // 重み付き平均を返す
  return totalWeight > 0 ? totalScore / totalWeight : evaluateGrid(grid);
}

/**
 * 盤面を評価するヒューリスティック関数
 * - 空セル数 × W_empty
 * - 最大タイル値 × W_max
 * - タイル総和 × W_sum
 * - モノトニック性（差分総和） × (-W_mono)
 * - 滑らかさ（隣接差分総和） × (-W_smooth)
 * - 隅に最大タイルがある場合にボーナス W_corner
 *
 * これらを合計して最終的なスコアを返す。深さ 0 や打ち切り局面で呼び出される。
 */
function evaluateGrid(grid: Grid): number {
  const size = grid.length;
  let emptyCount = 0;
  let maxValue = 0;
  let sumValue = 0;

  // ① 空セル数, 最大タイル, タイル総和 の計算
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const v = grid[r][c];
      if (v === 0) {
        emptyCount++;
      }
      if (v > maxValue) {
        maxValue = v;
      }
      sumValue += v;
    }
  }

  // ② モノトニック性 (行方向・列方向の隣接差分を合計)
  let monotonicity = 0;
  // 行方向
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size - 1; c++) {
      monotonicity += Math.abs(grid[r][c] - grid[r][c + 1]);
    }
  }
  // 列方向
  for (let c = 0; c < size; c++) {
    for (let r = 0; r < size - 1; r++) {
      monotonicity += Math.abs(grid[r][c] - grid[r + 1][c]);
    }
  }

  // ③ 滑らかさ (Smoothness、左右・上下の隣接差分)
  let smoothness = 0;
  // すでに上で行方向・列方向を足しているため、滑らかさを兼ねる場合は同じ値を使ってもよいが、
  // ここではさらに加重する形にしても OK。この例では行／列を合計したものを smoothness として再利用。
  smoothness = monotonicity;

  // ④ 隅への最大タイル寄せボーナス: 例として左上 ([0][0]) にあるかチェック
  const W_corner = 2000;
  let cornerBonus = 0;
  if (grid[0][0] === maxValue) {
    cornerBonus = W_corner;
  }

  // ⑤ 重みづけ
  const W_empty = 1000;  // 空セル数の重み
  const W_max = 10;      // 最大タイル値の重み
  const W_sum = 1;       // タイル総和の重み
  const W_mono = 1;      // モノトニック性の重み（差分を小さくしたいので減点）
  const W_smooth = 1;    // 滑らかさの重み（差分を小さくしたいので減点）

  // ⑥ 最終スコアを計算して返す
  // 空セルと最大タイルはプラス、モノトニック性と滑らかさはマイナス、隅ボーナスを加算
  return (
    W_empty * emptyCount +
    W_max * maxValue +
    W_sum * sumValue -
    W_mono * monotonicity -
    W_smooth * smoothness +
    cornerBonus
  );
}
