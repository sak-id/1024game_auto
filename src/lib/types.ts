// グリッドのセルは 0（空）または 2,4,8,… の数値
export type CellValue = number;
// 盤面は行数×列数の二次元配列とする
export type Grid = CellValue[][];
// ゲーム状態の型
export interface GameState {
  grid: Grid;
  score: number;
  bestScore: number;
  status: "playing" | "won" | "over";
  /** 今ターンで合成が起きたタイルの位置リスト */
  justMergedTiles: { row: number; col: number }[];
  options: GameOptions;
}
/** ゲーム設定情報をまとめた型 */
export interface GameOptions {
  size: number;      // 盤面サイズ（例：4 → 4×4）
  target: number;    // 目標値（例：1024）
  soundOn: boolean;  // 効果音を鳴らすかどうか
}