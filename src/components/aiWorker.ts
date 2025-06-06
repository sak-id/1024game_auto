// src/components/aiWorker.ts

import { getBestMove } from "../lib/ai";  // AI ロジックをインポート
import type { Grid, MoveType } from "../lib/types";

/**
 * Web Worker スレッド内のグローバル処理
 * メインスレッドから受け取ったメッセージ（盤面 + depth）に対し、
 * getBestMove を呼び出して結果を返す。
 */
self.addEventListener("message", (event: MessageEvent<{ grid: Grid; depth: number }>) => {
  const { grid, depth } = event.data;
  const best: MoveType | null = getBestMove(grid, depth);
  // メインスレッドに最適手を返送
  postMessage(best);
});

// Worker のデフォルトエクスポート（空で OK: Vite のロード用）
export default null;
