#!/bin/bash

# GitHub API設定
# 使用方法: GITHUB_TOKEN=your_token ./create-issues.sh
GITHUB_TOKEN="${GITHUB_TOKEN:-}"
REPO_OWNER="nomu-nora"
REPO_NAME="cut-optimizer"
API_URL="https://api.github.com/repos/$REPO_OWNER/$REPO_NAME"

# ラベルを作成する関数
create_label() {
  local name=$1
  local color=$2
  local description=$3

  curl -X POST \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "$API_URL/labels" \
    -d "{\"name\":\"$name\",\"color\":\"$color\",\"description\":\"$description\"}" \
    2>/dev/null
}

# Issueを作成する関数
create_issue() {
  local title=$1
  local body=$2
  local labels=$3
  local milestone=$4

  curl -X POST \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "$API_URL/issues" \
    -d "{\"title\":\"$title\",\"body\":\"$body\",\"labels\":[$labels]}" \
    2>/dev/null

  echo "Created: $title"
}

echo "=== ラベルを作成中 ==="

# Phase labels
create_label "phase-1" "0E8A16" "Phase 1: プロジェクト設計・技術設計"
create_label "phase-2" "1D76DB" "Phase 2: 開発環境セットアップ"
create_label "phase-3" "5319E7" "Phase 3: 型定義・データ構造の実装"
create_label "phase-4" "E99695" "Phase 4: アルゴリズム実装"
create_label "phase-5" "F9D0C4" "Phase 5: UI基本構造の実装"
create_label "phase-6" "FEF2C0" "Phase 6: 入力フォーム・設定画面の実装"
create_label "phase-7" "C5DEF5" "Phase 7: 結果表示・配置図の実装"
create_label "phase-8" "BFD4F2" "Phase 8: 印刷機能の実装"
create_label "phase-9" "D4C5F9" "Phase 9: テスト・デバッグ"
create_label "phase-10" "0E8A16" "Phase 10: デプロイ・リリース"

# Category labels
create_label "design" "D73A4A" "設計関連"
create_label "implementation" "0075CA" "実装関連"
create_label "test" "E4E669" "テスト関連"
create_label "documentation" "0E8A16" "ドキュメント関連"

# Priority labels
create_label "priority-high" "B60205" "優先度：高"
create_label "priority-medium" "FBCA04" "優先度：中"
create_label "priority-low" "0E8A16" "優先度：低"

echo ""
echo "=== Issuesを作成中 ==="

# Phase 1
create_issue \
  "システムアーキテクチャ設計" \
  "## 目的
システム全体のアーキテクチャを設計する

## タスク
- [ ] コンポーネント構成の決定
- [ ] ディレクトリ構造の詳細設計
- [ ] 状態管理方針の決定（Context API or Zustand）
- [ ] データフローの設計

## 成果物
- アーキテクチャ設計書
- コンポーネント図" \
  "\"phase-1\",\"design\",\"priority-high\""

create_issue \
  "データフロー設計" \
  "## 目的
入力から計算、表示までのデータフローを設計する

## タスク
- [ ] 入力データの構造設計
- [ ] 計算処理のフロー設計
- [ ] 結果データの構造設計
- [ ] データの受け渡し方法の決定

## 成果物
- データフロー図
- データ構造定義書" \
  "\"phase-1\",\"design\",\"priority-high\""

create_issue \
  "UI/UX設計" \
  "## 目的
ユーザーインターフェースとユーザー体験を設計する

## タスク
- [ ] ワイヤーフレーム作成
- [ ] 画面遷移図作成
- [ ] レスポンシブ対応方針の決定
- [ ] カラースキームの決定

## 成果物
- ワイヤーフレーム
- 画面遷移図
- デザインガイドライン" \
  "\"phase-1\",\"design\",\"priority-high\""

# Phase 2
create_issue \
  "Next.jsプロジェクトの初期化" \
  "## 目的
Next.jsプロジェクトをセットアップする

## タスク
- [ ] \`npx create-next-app@latest\` 実行
- [ ] TypeScript設定
- [ ] Tailwind CSS設定
- [ ] App Router構成確認

## 成果物
- 動作するNext.jsプロジェクト" \
  "\"phase-2\",\"implementation\",\"priority-high\""

create_issue \
  "開発ツールの設定" \
  "## 目的
開発効率を上げるツールをセットアップする

## タスク
- [ ] ESLint設定
- [ ] Prettier設定
- [ ] Git hooks設定（Husky）
- [ ] VS Code設定ファイル作成

## 成果物
- 設定ファイル一式" \
  "\"phase-2\",\"implementation\",\"priority-medium\""

create_issue \
  "基本的なフォルダ構成の整備" \
  "## 目的
プロジェクトのフォルダ構成を整備する

## タスク
- [ ] components/ ディレクトリ整備
- [ ] lib/ ディレクトリ整備
- [ ] types/ ディレクトリ整備
- [ ] README.md作成

## 成果物
- 整備されたフォルダ構造
- README.md" \
  "\"phase-2\",\"documentation\",\"priority-medium\""

# Phase 3
create_issue \
  "基本型の定義" \
  "## 目的
基本的なTypeScript型を定義する

## タスク
- [ ] PlateConfig型（元板設定）
- [ ] CutConfig型（切断設定）
- [ ] Item型（製品）

## 成果物
- types/config.ts
- types/item.ts" \
  "\"phase-3\",\"implementation\",\"priority-high\""

create_issue \
  "計算用の型定義" \
  "## 目的
アルゴリズム計算に使用する型を定義する

## タスク
- [ ] Placement型（配置された製品）
- [ ] FreeSpace型（空きスペース）
- [ ] Plate型（元板）

## 成果物
- types/algorithm.ts" \
  "\"phase-3\",\"implementation\",\"priority-high\""

create_issue \
  "結果表示用の型定義" \
  "## 目的
計算結果の表示に使用する型を定義する

## タスク
- [ ] PatternGroup型（パターングループ）
- [ ] CalculationResult型（計算結果）

## 成果物
- types/result.ts" \
  "\"phase-3\",\"implementation\",\"priority-high\""

# Phase 4
create_issue \
  "ソート機能の実装" \
  "## 目的
製品を面積順にソートする機能を実装する

## タスク
- [ ] 面積計算関数
- [ ] ソート関数
- [ ] 単体テスト

## 成果物
- lib/sort.ts
- 単体テスト" \
  "\"phase-4\",\"implementation\",\"priority-high\""

create_issue \
  "配置判定ロジックの実装" \
  "## 目的
製品が配置可能か判定するロジックを実装する

## タスク
- [ ] canPlace()関数の実装
- [ ] 90度回転判定の実装
- [ ] 単体テスト

## 成果物
- lib/placement.ts
- 単体テスト" \
  "\"phase-4\",\"implementation\",\"priority-high\""

create_issue \
  "スペース分割ロジックの実装" \
  "## 目的
配置後の空きスペースを分割するロジックを実装する

## タスク
- [ ] splitSpace()関数の実装
- [ ] 横分割・縦分割のロジック
- [ ] 単体テスト

## 成果物
- lib/space.ts
- 単体テスト" \
  "\"phase-4\",\"implementation\",\"priority-high\""

create_issue \
  "配置計算のメインロジック" \
  "## 目的
Guillotine Cutアルゴリズムのメインロジックを実装する

## タスク
- [ ] 元板への配置ループ
- [ ] カット幅の考慮
- [ ] 余白の考慮
- [ ] 次の元板への移行ロジック

## 成果物
- lib/algorithm.ts" \
  "\"phase-4\",\"implementation\",\"priority-high\""

create_issue \
  "パターングループ化ロジック" \
  "## 目的
同じ配置パターンをグループ化するロジックを実装する

## タスク
- [ ] 配置パターンのハッシュ化
- [ ] パターンの比較ロジック
- [ ] グループ化関数

## 成果物
- lib/pattern.ts" \
  "\"phase-4\",\"implementation\",\"priority-medium\""

create_issue \
  "歩留まり計算" \
  "## 目的
元板の歩留まり率を計算する機能を実装する

## タスク
- [ ] calculateYield()関数の実装
- [ ] 有効エリアの計算
- [ ] 単体テスト

## 成果物
- lib/yield.ts
- 単体テスト" \
  "\"phase-4\",\"implementation\",\"priority-high\""

create_issue \
  "アルゴリズムの単体テスト" \
  "## 目的
アルゴリズム全体の精度を検証する

## タスク
- [ ] テストケース作成
- [ ] 精度検証
- [ ] エッジケーステスト

## 成果物
- テストスイート
- テスト結果レポート" \
  "\"phase-4\",\"test\",\"priority-high\""

# Phase 5
create_issue \
  "メインレイアウトの実装" \
  "## 目的
アプリケーションの基本レイアウトを実装する

## タスク
- [ ] ヘッダーコンポーネント
- [ ] 入力エリア・結果表示エリアの配置
- [ ] レスポンシブ対応

## 成果物
- app/layout.tsx
- components/Header.tsx" \
  "\"phase-5\",\"implementation\",\"priority-high\""

create_issue \
  "共通コンポーネントの実装" \
  "## 目的
再利用可能な共通コンポーネントを実装する

## タスク
- [ ] Buttonコンポーネント
- [ ] Inputコンポーネント
- [ ] Cardコンポーネント
- [ ] Labelコンポーネント

## 成果物
- components/ui/*.tsx" \
  "\"phase-5\",\"implementation\",\"priority-high\""

create_issue \
  "ローディング・エラー表示" \
  "## 目的
ローディングとエラー表示を実装する

## タスク
- [ ] ローディングスピナー
- [ ] エラーメッセージ表示
- [ ] トースト通知

## 成果物
- components/Loading.tsx
- components/ErrorMessage.tsx" \
  "\"phase-5\",\"implementation\",\"priority-medium\""

# Phase 6
create_issue \
  "元板設定フォームの実装" \
  "## 目的
元板サイズと単価を入力するフォームを実装する

## タスク
- [ ] 幅・高さ入力フィールド
- [ ] 単価入力フィールド
- [ ] デフォルト値設定
- [ ] バリデーション

## 成果物
- components/PlateConfigForm.tsx" \
  "\"phase-6\",\"implementation\",\"priority-high\""

create_issue \
  "切断設定フォームの実装" \
  "## 目的
カット幅と余白を入力するフォームを実装する

## タスク
- [ ] カット幅入力フィールド
- [ ] 余白入力フィールド
- [ ] デフォルト値設定

## 成果物
- components/CutConfigForm.tsx" \
  "\"phase-6\",\"implementation\",\"priority-medium\""

create_issue \
  "製品入力フォームの実装" \
  "## 目的
製品情報を入力するフォームを実装する

## タスク
- [ ] 製品名・サイズ・個数入力
- [ ] 色選択機能
- [ ] 追加・編集・削除機能
- [ ] リスト表示

## 成果物
- components/ItemForm.tsx
- components/ItemList.tsx" \
  "\"phase-6\",\"implementation\",\"priority-high\""

create_issue \
  "入力バリデーション" \
  "## 目的
入力値のバリデーションを実装する

## タスク
- [ ] 必須項目チェック
- [ ] 数値範囲チェック
- [ ] エラーメッセージ表示

## 成果物
- lib/validation.ts" \
  "\"phase-6\",\"implementation\",\"priority-high\""

create_issue \
  "ローカルストレージ保存機能" \
  "## 目的
入力内容をローカルストレージに保存する

## タスク
- [ ] 自動保存機能
- [ ] 復元機能
- [ ] クリア機能

## 成果物
- lib/storage.ts" \
  "\"phase-6\",\"implementation\",\"priority-medium\""

# Phase 7
create_issue \
  "サマリー表示の実装" \
  "## 目的
計算結果のサマリーを表示する

## タスク
- [ ] 必要元板枚数表示
- [ ] 平均歩留まり率表示
- [ ] 総コスト表示

## 成果物
- components/ResultSummary.tsx" \
  "\"phase-7\",\"implementation\",\"priority-high\""

create_issue \
  "パターン一覧表示" \
  "## 目的
配置パターンの一覧を表示する

## タスク
- [ ] グリッドレイアウト
- [ ] パターンごとのカード表示
- [ ] パターン情報の表示

## 成果物
- components/PatternList.tsx
- components/PatternCard.tsx" \
  "\"phase-7\",\"implementation\",\"priority-high\""

create_issue \
  "配置図の描画（Canvas/SVG）" \
  "## 目的
配置図を視覚的に描画する

## タスク
- [ ] 元板の枠表示
- [ ] 製品の矩形表示（色分け）
- [ ] 製品名の表示
- [ ] カット線の表示

## 成果物
- components/PlateVisualization.tsx" \
  "\"phase-7\",\"implementation\",\"priority-high\""

create_issue \
  "配置図のインタラクティブ機能" \
  "## 目的
配置図にインタラクティブ機能を追加する

## タスク
- [ ] ホバー時の情報表示
- [ ] 拡大縮小機能（オプション）

## 成果物
- 更新されたPlateVisualization.tsx" \
  "\"phase-7\",\"implementation\",\"priority-low\""

# Phase 8
create_issue \
  "印刷用CSSの実装" \
  "## 目的
印刷用のスタイルを実装する

## タスク
- [ ] @media print スタイル
- [ ] ページ区切り設定
- [ ] 印刷時のレイアウト調整

## 成果物
- styles/print.css" \
  "\"phase-8\",\"implementation\",\"priority-medium\""

create_issue \
  "印刷プレビュー機能" \
  "## 目的
印刷前のプレビュー機能を実装する

## タスク
- [ ] プレビューモード
- [ ] 印刷ボタン

## 成果物
- components/PrintPreview.tsx" \
  "\"phase-8\",\"implementation\",\"priority-medium\""

create_issue \
  "PDF出力対応" \
  "## 目的
PDF出力機能を実装する

## タスク
- [ ] ブラウザの印刷機能活用
- [ ] A4サイズ対応

## 成果物
- 印刷機能の完成" \
  "\"phase-8\",\"implementation\",\"priority-medium\""

# Phase 9
create_issue \
  "単体テストの追加" \
  "## 目的
各関数の単体テストを追加する

## タスク
- [ ] アルゴリズムのテスト
- [ ] ユーティリティ関数のテスト
- [ ] カバレッジ確認

## 成果物
- テストスイート" \
  "\"phase-9\",\"test\",\"priority-high\""

create_issue \
  "統合テスト" \
  "## 目的
システム全体の統合テストを実施する

## タスク
- [ ] 入力→計算→表示の流れテスト
- [ ] エッジケースの確認

## 成果物
- 統合テストスイート" \
  "\"phase-9\",\"test\",\"priority-high\""

create_issue \
  "実データでの検証" \
  "## 目的
実際の業務データで検証する

## タスク
- [ ] 実家の業務データで試験
- [ ] 歩留まり率の検証
- [ ] フィードバック収集

## 成果物
- 検証レポート" \
  "\"phase-9\",\"test\",\"priority-high\""

create_issue \
  "バグ修正" \
  "## 目的
発見されたバグを修正する

## タスク
- [ ] バグリストの作成
- [ ] 優先度付け
- [ ] 修正実施

## 成果物
- バグ修正コミット" \
  "\"phase-9\",\"implementation\",\"priority-high\""

create_issue \
  "パフォーマンス最適化" \
  "## 目的
アプリケーションのパフォーマンスを最適化する

## タスク
- [ ] 計算速度の改善
- [ ] レンダリング最適化
- [ ] パフォーマンス計測

## 成果物
- 最適化されたコード" \
  "\"phase-9\",\"implementation\",\"priority-medium\""

# Phase 10
create_issue \
  "Vercelプロジェクトの作成" \
  "## 目的
Vercelでプロジェクトをセットアップする

## タスク
- [ ] Vercelアカウント設定
- [ ] プロジェクト連携
- [ ] ビルド設定

## 成果物
- Vercelプロジェクト" \
  "\"phase-10\",\"implementation\",\"priority-high\""

create_issue \
  "環境変数の設定" \
  "## 目的
本番環境の環境変数を設定する

## タスク
- [ ] 必要な環境変数の洗い出し
- [ ] Vercelでの設定

## 成果物
- 設定済み環境変数" \
  "\"phase-10\",\"implementation\",\"priority-medium\""

create_issue \
  "本番デプロイ" \
  "## 目的
本番環境にデプロイする

## タスク
- [ ] 初回デプロイ
- [ ] 動作確認
- [ ] ドメイン設定（オプション）

## 成果物
- デプロイ済みアプリケーション" \
  "\"phase-10\",\"implementation\",\"priority-high\""

create_issue \
  "ドキュメント整備" \
  "## 目的
プロジェクトのドキュメントを整備する

## タスク
- [ ] README.md完成
- [ ] 使い方ガイド作成
- [ ] 開発ドキュメント作成

## 成果物
- 完成したドキュメント" \
  "\"phase-10\",\"documentation\",\"priority-medium\""

create_issue \
  "v1.0リリース" \
  "## 目的
バージョン1.0をリリースする

## タスク
- [ ] リリースノート作成
- [ ] タグ付け
- [ ] リリース公開

## 成果物
- v1.0リリース" \
  "\"phase-10\",\"documentation\",\"priority-high\""

echo ""
echo "=== 完了 ==="
echo "41個のIssuesを作成しました！"
echo "https://github.com/$REPO_OWNER/$REPO_NAME/issues で確認できます"
