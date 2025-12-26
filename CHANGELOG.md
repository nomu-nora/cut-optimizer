# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] - 2025-12-26

### Added

#### データベース基盤

- Supabaseデータベース導入（PostgreSQL）
- ユーザー認証機能（メール/パスワード + Google OAuth）
- Row Level Security (RLS) による完全なユーザーデータ分離
- マイグレーションファイル管理

#### 設定管理

- ユーザーごとのデフォルト設定保存機能
- 設定画面の実装 (`/settings`)
- 元板設定、カット設定、最適化設定の一元管理
- Enterキーでフィールド間移動

#### テンプレート機能

- 製品テンプレートの保存・読み込み・削除
- 端材テンプレートの保存・読み込み・削除
- 名前と説明付きでテンプレート管理
- 重複名チェック
- タブUIで統合表示

#### 計算履歴管理

- 全計算結果の自動保存（バックグラウンド）
- スター/お気に入り機能
- 自動クリーンアップ（スター付き: 無制限、未スター: 30件）
- ワンクリックで過去の設定・結果を復元
- 履歴一覧表示（`/history`）

#### UX改善

- 製品・端材の1クリック選択、2クリック編集
- Enterキーでフォーム間移動
- 元板単価 → カット幅へスムーズに移動
- ダブルクリック編集による誤操作防止

### Deployment

- Vercel本番環境デプロイ
- Supabase本番データベース連携
- 継続的デプロイ（CD）設定

### Changed

- アプリケーション全体がステートレスからステートフル（永続化）に移行
- プリセット機能をテンプレート機能に置き換え

### Technical Details

- 新規テーブル: `user_settings`, `product_templates`, `offcut_templates`, `calculation_history`
- 新規コンポーネント: `AuthContext`, `TemplateManager`, `CalculationHistoryList`, 設定画面
- データベース関数層: `src/lib/database/` 以下に整理

---

## [1.5.1] - 2025-12-22

### Added

- 2段階最適化フレームワーク（two-stage-optimizer.ts）
  - Stage 1: Maximal Rectanglesで最小元板枚数を決定
  - Stage 2: 目的に応じた再編成
- 歩留まり優先モード（reorganize-yield.ts）
  - N-1枚の歩留まり最大化
  - 最後の元板は調整用として柔軟に対応
- スペース優先モード（reorganize-space.ts）
  - 端材サイズの最適化
  - 端材品質スコアリング

### Changed

- OptimizationGoal拡張（'yield-reorganize', 'space-reorganize'）
- より柔軟な最適化戦略の選択が可能に

---

## [1.5.0] - 2025-12-19

### Added

- 新メトリクス追加と表示
  - `calculateYieldExcludingLast()` - 最後のパターンを除いた平均歩留まり計算
  - `getLastPatternYield()` - 最後のパターンの歩留まり取得
  - `meetsYieldTarget()` - 85%目標達成判定
  - 歩留まり詳細表示セクション（ResultSummary.tsx）
- アルゴリズムレベル改善
  - 全ヒューリスティック比較とスコアリング
  - 目標達成判定の強化（adaptive strategies）
  - 適応的グリッド生成（4次元スコアリング）
  - スペース使用率最適化（best-fit heuristic）

### Changed

- 最後以外のパターンで85%以上の歩留まり達成を目指す最適化戦略
- 適応的な配置戦略（aggressive/balanced/conservative）

---

## [1.4.3] - 2025-12-23

### Added

- マルチ選択機能
  - Ctrl/Cmd+Click: 個別の製品を選択/解除（トグル）
  - Shift+Click: 選択に追加
  - Escapeキーで選択解除
- キーボード位置調整
  - 矢印キー: 1mmずつ移動
  - Shift+矢印キー: 10mmずつ移動
  - 複数選択時は全ての製品が同時に移動

---

## [1.4.2.1] - 2025-12-23

### Added

- 行クリックで編集モード開始（製品・端材一覧）
- Enterキーでフィールド移動
- 編集開始時の自動フォーカス

### Changed

- より直感的なUI操作
- キーボードのみでの操作が可能に

---

## [1.4.2] - 2025-12-22

### Added

- 製品編集のインライン化
  - テーブル内で直接編集
  - 色選択を完全自動化
- 端材編集のインライン化
- 製品・端材一覧の合計行追加
- パターン配置図のナビゲーション（前/次ボタン）
- 編集モードの選択状態維持

### Changed

- ProductFormダイアログを廃止
- OffcutFormダイアログを廃止
- ダイアログ不要でスムーズな編集フローに

---

## [1.4.1] - 2025-12-19

### Added

- 手動調整機能の基本実装
  - EditableResult型定義（Copy-on-Write）
  - 編集モード状態管理
  - 編集モードツールバー
  - 仮置き場UI
  - SVG上でのドラッグ&ドロップ
  - Undo/Redo機能

---

## [1.3.1] - 2025-12-11

### Fixed

- エッジケース修正（空端材、回転処理など）
- 型定義の整理
- コード品質の改善

### Changed

- テストカバレッジの向上

---

## [1.3.0] - 2025-12-11

### Added

- 端材活用機能
  - 端材の手動登録（名前、サイズ、数量）
  - 端材プリセット機能
  - 端材に製品を配置するアルゴリズム
  - グリッド配置（1×1〜4×4の明示的テスト）
  - Maximal Rectanglesアルゴリズムとの併用
- 端材消費モード / 全体最適モードの切り替え
- 端材パターンのグループ化
- 端材配置図の表示
- サマリー表示（使用/未使用端材、削減コスト計算）

---

## [1.2.1] - 2025-12-10

### Added

- アルゴリズム選択をアコーディオン形式に変更
- 計算実行セクションを結果エリアの上部に移動
- 新規コンポーネント（AlgorithmSelector, CalculationControl）

### Changed

- UIレイアウトの改善
- ユーザーワークフローの最適化

---

## [1.2.0] - 2025-12-10

### Added

- 遺伝的アルゴリズム（GA）の実装
  - 配置順序とソート戦略の進化的最適化
- グリッド配置機能
  - 同じサイズの製品を格子状に配置
  - 動的グリッド生成
- 最適化目標の強化
  - 歩留まり優先
  - 余りスペース優先
- 余りスペース品質評価
  - 集中度・形状・サイズの3要素で評価
- バックトラッキング機能

---

## [1.1.0] - 2025-12-09

### Added

- Maximal Rectangles アルゴリズムの実装
- 4つのヒューリスティックを自動試行
  - Best Short Side Fit
  - Best Long Side Fit
  - Best Area Fit
  - Bottom Left
- ギロチンカットとの切り替え機能
- 回転考慮の改善

### Changed

- 歩留まり率が大幅に向上
- L字型などの複雑な空きスペースを活用

---

## [1.0.0] - 2025-12-03

### Added

- Guillotine Cut + First Fit Decreasing アルゴリズム
- 元板設定（幅、高さ、単価）
- 切断設定（カット幅、余白）
- 製品入力（名前、サイズ、個数、色）
- 配置計算
- 結果表示（パターン一覧、配置図）
- 印刷機能
- プリセット機能

---

## Link to Detailed Documentation

- [ROADMAP.md](./ROADMAP.md) - 詳細な開発ロードマップ
- [README.md](./README.md) - プロジェクト概要と使い方
- [docs/versions/](./docs/versions/) - 各バージョンの詳細設計書
