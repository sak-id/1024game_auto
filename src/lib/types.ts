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
}
