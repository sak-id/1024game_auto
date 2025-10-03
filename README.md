# 1024 Game Auto

## 主な機能
- 3×3〜7×7 の任意サイズで遊べる 1024 パズル
- 目標タイルと効果音のオン / オフ設定
- 期待値探索 (Expectimax) ベースの自動プレイモード
- 直感的なスコア / ベストスコア表示と勝敗モーダル
- TypeScript + Vite 構成による高速なホットリロード

## ディレクトリ構成
```
src/
  components/   UI コンポーネントと aiWorker
  hooks/        ゲーム状態管理用のカスタムフック
  lib/          盤面ロジックと AI 評価関数
  main.tsx      エントリポイント
public/         静的アセット (効果音など)
```

## 開発環境のセットアップ
1. Node.js 18 以上をインストールします。
2. 依存関係を取得します。
   ```bash
   npm install
   ```
3. 開発サーバーを起動します。
   ```bash
   npm run dev
   ```
   ブラウザで `http://localhost:5173` にアクセスしてください。

### ビルド / テスト関連コマンド
```bash
npm run build    # TypeScript ビルド + Vite 本番ビルド
npm run preview  # 本番ビルドをローカルで確認
npm run lint     # ESLint による静的解析
```
現状ユニットテストは未整備です。テストを追加する場合は `src/lib` や `src/hooks` を中心に Vite 対応のテスティングフレームワークを導入してください。

## アプリのカスタマイズ
- AI の探索深さや評価関数の重みは `src/lib/ai.ts` で調整できます。
- ゲームロジックの挙動は `src/lib/gameLogic.ts` 内のユーティリティを編集してください。
- 効果音ファイルは `public/audios` に配置されます。差し替える際は `src/hooks/useGame.ts` の定数を更新します。

## React 初心者向けガイド

- **主要フォルダと役割**
  - `src/components`
    - `GameBoard.tsx`: 盤面・スコア・モーダル・自動再生ボタンを束ねるメインコンポーネント
    - `Settings.tsx`: ゲーム開始前の設定フォーム
    - `Grid.tsx` → `Tile.tsx`: 2 次元配列をグリッド表示に変換
    - `Modal.tsx`, `ScoreBoard.tsx`: 補助 UI
  - `src/hooks`
    - `useGame.ts`: ゲーム状態の reducer と副作用 (`useEffect`) を管理
    - `useAutoPlayer.ts`: Web Worker を制御し自動プレイを仲介
  - `src/lib`
    - `gameLogic.ts`: 盤面操作 (`moveLeft` 等) とユーティリティ
    - `ai.ts`: Expectimax を使った最適手探索
    - `types.ts`: 共有型定義

- **コンポーネント階層のイメージ**
  ```text
  <App>
  └─<GameBoard>
     ├─<ScoreBoard>
     ├─<Grid>
     │  └─<Tile>...
     ├─<Modal> (勝敗時のみ)
     └─auto-play button
  ```

- **状態管理 (Hooks)**
  - `useGame`
    - `useReducer` で `MOVE_*` / `INIT` / `APPLY_RANDOM_TILE` を処理
    - `useEffect` でランダムタイル生成・効果音・localStorage 反映
  - `useAutoPlayer`
    - `useState` で自動プレイ ON/OFF を管理
    - `useEffect` + Web Worker で AI 探索を非同期実行

- **イベント処理の流れ**
  - `GameBoard` の `useEffect` で `keydown` を監視 → `move(direction)` を呼び出し
  - Worker の `message` イベントでも同じ `move` を経由
  - 登録したイベントリスナーはクリーンアップ関数で必ず解除

- **Web Worker 連携**
  - `useAutoPlayer` が `postMessage({ grid, depth })` を送信
  - `src/components/aiWorker.ts` で `getBestMove` を計算して `postMessage(bestMove)`
  - 受信側で `move(bestMove)` を実行し盤面を更新

- **JSX とスタイリング**
  - JSX では `className` で CSS クラスを付与し、動的な値は `{ }` で埋め込み
  - グリッドレイアウトは `Grid.tsx` の `style={{ gridTemplateColumns: ... }}` のように計算結果を渡す
  - 共通スタイル: `src/App.css`, `src/index.css` / 個別スタイル: 各コンポーネントの `.css`
