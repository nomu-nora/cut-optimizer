# 取り数最適化システム v1.0

元板から製品を効率的に切り出す配置計算アプリケーション

## 📋 概要

ノムラ合成株式会社向けに開発された、元板から製品を最適に配置・切り出すための計算システムです。
**Guillotine Cut + First Fit Decreasing** アルゴリズムを使用して、材料の無駄を最小限に抑え、歩留まり率を最大化します。

### 主な機能

- ✅ 元板サイズと製品情報を入力
- ✅ 自動配置計算（回転対応）
- ✅ 配置図の視覚的表示
- ✅ 同じパターンのグループ化
- ✅ 歩留まり率とコスト計算
- ✅ 印刷機能

## 🚀 技術スタック

- **フレームワーク**: [Next.js 15](https://nextjs.org/) (App Router)
- **言語**: [TypeScript](https://www.typescriptlang.org/)
- **スタイリング**: [Tailwind CSS](https://tailwindcss.com/)
- **デプロイ**: [Vercel](https://vercel.com/)

## 📦 セットアップ

### 必要要件

- Node.js 18.0.0以上
- npm または yarn

### インストール

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションを確認できます。

## 💡 使い方

### 基本的な流れ

1. **元板設定**: 元板の幅、高さ、単価を入力
2. **カット設定**: カット幅と余白を設定
3. **製品追加**: 製品名、サイズ、数量、色を入力して追加
4. **計算実行**: 「計算実行」ボタンをクリック
5. **結果確認**: 配置図とパターン一覧を確認
6. **印刷**: 必要に応じて印刷プレビューから印刷

### プリセット機能

テスト用のプリセットデータを読み込むことができます。プリセットボタンをクリックすると、サンプルデータが自動的に読み込まれます。

### 配置図の見方

- **パターンID**: A, B, C... で識別
- **枚数**: 同じパターンの元板の枚数
- **歩留まり率**: 有効面積に対する使用面積の割合
- **配置図**: 製品の配置を視覚的に表示（回転も表示）

## 🛠️ 開発

### 利用可能なスクリプト

```bash
# 開発サーバーの起動
npm run dev

# 本番ビルド
npm run build

# 本番サーバーの起動
npm run start

# ESLintチェック
npm run lint

# ESLintの自動修正
npm run lint:fix

# Prettierフォーマット
npm run format

# Prettierチェック
npm run format:check

# TypeScriptの型チェック
npm run type-check
```

### コードフォーマット

このプロジェクトでは、Prettier と ESLint を使用してコード品質を保っています。
Git commit時に自動的にフォーマットが適用されます（Husky + lint-staged）。

## 📁 プロジェクト構造

```
cut-optimizer/
├── docs/                      # ドキュメント
│   ├── torikazu_app_requirements_v1.0.md  # 要件定義書
│   ├── architecture.md        # システムアーキテクチャ
│   ├── data-flow.md           # データフロー設計
│   ├── ui-ux-design.md        # UI/UX設計
│   └── algorithm-details.md   # アルゴリズム詳細仕様
│
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── page.tsx           # メインページ
│   │   ├── layout.tsx         # ルートレイアウト
│   │   ├── globals.css        # グローバルスタイル
│   │   └── print.css          # 印刷用スタイル
│   │
│   ├── components/            # Reactコンポーネント
│   │   ├── ui/                # 共通UIコンポーネント (Button, Input, Card, etc.)
│   │   ├── forms/             # 入力フォーム関連
│   │   ├── results/           # 結果表示関連
│   │   ├── print/             # 印刷機能関連
│   │   └── layout/            # レイアウトコンポーネント
│   │
│   ├── lib/                   # ビジネスロジック
│   │   ├── algorithm/         # 配置計算アルゴリズム
│   │   │   ├── guillotine.ts  # メインアルゴリズム
│   │   │   ├── placement.ts   # 配置判定ロジック
│   │   │   ├── sort.ts        # ソート処理
│   │   │   ├── pattern.ts     # パターングループ化
│   │   │   ├── yield.ts       # 歩留まり計算
│   │   │   └── __tests__/     # ユニットテスト
│   │   └── presets.ts         # プリセットデータ
│   │
│   └── types/                 # TypeScript型定義
│       ├── config.ts          # 設定関連の型
│       ├── item.ts            # 製品関連の型
│       ├── algorithm.ts       # アルゴリズム関連の型
│       └── result.ts          # 計算結果関連の型
│
├── public/                    # 静的ファイル
└── scripts/                   # スクリプト
```

## 📖 ドキュメント

詳細な設計書は `docs/` ディレクトリを参照してください：

- [要件定義書](./docs/torikazu_app_requirements_v1.0.md) - システムの要件と仕様
- [アーキテクチャ設計書](./docs/architecture.md) - システム構成と技術選定
- [データフロー設計書](./docs/data-flow.md) - データの流れとロジック
- [UI/UX設計書](./docs/ui-ux-design.md) - 画面設計とインタラクション
- [アルゴリズム詳細仕様書](./docs/algorithm-details.md) - 実装の詳細仕様

## 🎯 開発方針

### MVP思考

v1.0は「動くこと」を最優先し、実家で使えることを目標としています。
- 荒くても実用的に
- フィードバックを重視
- 段階的な改善

### Phase別開発

開発は10のPhaseに分かれており、すべて完了しました：

- ✅ **Phase 1**: プロジェクト設計・技術設計
- ✅ **Phase 2**: 開発環境セットアップ
- ✅ **Phase 3**: 型定義・データ構造の実装
- ✅ **Phase 4**: アルゴリズム実装
- ✅ **Phase 5**: UI基本構造の実装
- ✅ **Phase 6**: 入力フォーム・設定画面の実装
- ✅ **Phase 7**: 結果表示・配置図の実装
- ✅ **Phase 8**: 印刷機能の実装
- ✅ **Phase 9**: テスト・デバッグ
- ✅ **Phase 10**: デプロイ・リリース準備

詳細は [development-plan.md](./docs/development-plan.md) を参照してください。

## 🐛 トラブルシューティング

### よくある問題

**問題**: `npm run dev`が起動しない
**解決**: `node_modules`を削除して再インストール
```bash
rm -rf node_modules package-lock.json
npm install
```

**問題**: 型エラーが発生する
**解決**: TypeScriptの型チェックを実行
```bash
npm run type-check
```

## 📝 ライセンス

このプロジェクトはプライベートプロジェクトです。

## 👥 開発者

- **開発**: こうへい
- **対象企業**: ノムラ合成株式会社

---

**v1.0 リリース済み** ✅

Generated with [Claude Code](https://claude.com/claude-code)
