# システムアーキテクチャ設計書

**プロジェクト**: 取り数最適化システム v1.0
**作成日**: 2025年12月2日
**Issue**: #1

---

## 1. 技術スタック

### フロントエンド
- **フレームワーク**: Next.js 14+ (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **UI描画**: Canvas API or SVG

### 開発環境
- **エディタ**: Cursor
- **パッケージマネージャー**: npm
- **バージョン管理**: Git + GitHub

### デプロイ
- **ホスティング**: Vercel

---

## 2. アプリケーション構成

### 2.1 全体構成

```
┌─────────────────────────────────────────┐
│         Next.js App (CSR/SSG)           │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐   ┌───────────────┐  │
│  │  入力画面     │   │  結果表示画面  │  │
│  │              │   │               │  │
│  │ - 元板設定    │   │ - サマリー     │  │
│  │ - 切断設定    │───│ - パターン一覧 │  │
│  │ - 製品入力    │   │ - 配置図       │  │
│  └──────────────┘   └───────────────┘  │
│         │                    │          │
│         ▼                    ▼          │
│  ┌─────────────────────────────────┐   │
│  │    アルゴリズムエンジン          │   │
│  │  (Guillotine Cut + FFD)        │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
         │
         ▼
  ┌──────────────┐
  │ Local Storage │
  │  (入力データ)  │
  └──────────────┘
```

### 2.2 主要モジュール

#### 入力モジュール
- 元板設定フォーム
- 切断設定フォーム
- 製品入力フォーム
- バリデーション

#### 計算モジュール
- ソート処理
- 配置判定ロジック
- スペース分割ロジック
- パターングループ化
- 歩留まり計算

#### 表示モジュール
- サマリー表示
- パターンカード
- 配置図描画 (Canvas/SVG)
- 印刷レイアウト

---

## 3. コンポーネント構成

### 3.1 ページコンポーネント

```
app/
├── page.tsx                 # メインページ（入力 + 結果表示）
├── layout.tsx               # ルートレイアウト
└── globals.css              # グローバルスタイル
```

### 3.2 UIコンポーネント階層

```
App
├── Header
├── MainContent
│   ├── InputSection
│   │   ├── PlateConfigForm        # 元板設定
│   │   ├── CutConfigForm          # 切断設定
│   │   └── ItemInputSection       # 製品入力
│   │       ├── ItemForm           # 製品追加フォーム
│   │       └── ItemList           # 登録済み製品リスト
│   │           └── ItemCard       # 製品カード
│   │
│   └── ResultSection              # 計算結果表示
│       ├── ResultSummary          # サマリー
│       ├── PatternList            # パターン一覧
│       │   └── PatternCard        # パターンカード
│       │       └── PlateVisualization  # 配置図
│       └── PrintButton            # 印刷ボタン
│
└── Footer (オプション)
```

### 3.3 共通コンポーネント

```
components/ui/
├── Button.tsx              # ボタン
├── Input.tsx               # 入力フィールド
├── Label.tsx               # ラベル
├── Card.tsx                # カード
├── Badge.tsx               # バッジ
├── Loading.tsx             # ローディング
└── ErrorMessage.tsx        # エラーメッセージ
```

---

## 4. ディレクトリ構造

```
cut-optimizer/
├── docs/                          # ドキュメント
│   ├── torikazu_app_requirements_v1.0.md
│   ├── development-plan.md
│   └── architecture.md            # このファイル
│
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── page.tsx               # メインページ
│   │   ├── layout.tsx             # ルートレイアウト
│   │   ├── globals.css            # グローバルスタイル
│   │   └── print/                 # 印刷用ページ (オプション)
│   │       └── page.tsx
│   │
│   ├── components/                # Reactコンポーネント
│   │   ├── ui/                    # 共通UIコンポーネント
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── ...
│   │   │
│   │   ├── input/                 # 入力関連コンポーネント
│   │   │   ├── PlateConfigForm.tsx
│   │   │   ├── CutConfigForm.tsx
│   │   │   ├── ItemForm.tsx
│   │   │   └── ItemList.tsx
│   │   │
│   │   ├── result/                # 結果表示コンポーネント
│   │   │   ├── ResultSummary.tsx
│   │   │   ├── PatternList.tsx
│   │   │   ├── PatternCard.tsx
│   │   │   └── PlateVisualization.tsx
│   │   │
│   │   └── layout/                # レイアウトコンポーネント
│   │       ├── Header.tsx
│   │       └── MainContent.tsx
│   │
│   ├── lib/                       # ビジネスロジック・ユーティリティ
│   │   ├── algorithm/             # アルゴリズム
│   │   │   ├── guillotine.ts     # メインアルゴリズム
│   │   │   ├── sort.ts           # ソート処理
│   │   │   ├── placement.ts      # 配置判定
│   │   │   ├── space.ts          # スペース分割
│   │   │   ├── pattern.ts        # パターングループ化
│   │   │   └── yield.ts          # 歩留まり計算
│   │   │
│   │   ├── validation.ts          # バリデーション
│   │   ├── storage.ts             # ローカルストレージ
│   │   └── utils.ts               # ユーティリティ関数
│   │
│   ├── types/                     # TypeScript型定義
│   │   ├── config.ts              # 設定型
│   │   ├── item.ts                # 製品型
│   │   ├── algorithm.ts           # アルゴリズム型
│   │   └── result.ts              # 結果型
│   │
│   └── hooks/                     # カスタムフック (オプション)
│       ├── useCalculation.ts      # 計算ロジック
│       └── useLocalStorage.ts     # ローカルストレージ
│
├── public/                        # 静的ファイル
│   └── (画像などの静的アセット)
│
├── scripts/                       # スクリプト
│   ├── create-issues.py
│   ├── setup-milestones.py
│   └── create-issues.sh
│
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

---

## 5. 状態管理方針

### 5.1 状態管理戦略

**v1.0では、シンプルさを優先し、React Hooks（useState, useReducer）を使用**

理由：
- アプリケーションの規模が小さい（単一ページ）
- コンポーネント間の状態共有が限定的
- 複雑な状態管理ライブラリは不要

### 5.2 状態の分類

#### ローカル状態（useState）
各コンポーネント内で完結する状態
- フォーム入力値
- UI表示状態（開閉、選択など）

#### グローバル状態（Context API）
複数コンポーネントで共有する状態
- 元板設定 (PlateConfig)
- 切断設定 (CutConfig)
- 製品リスト (Item[])
- 計算結果 (CalculationResult)

#### 永続化状態（LocalStorage）
ブラウザに保存する状態
- 入力データの自動保存

### 5.3 Context構成

```typescript
// AppContext: アプリケーション全体の状態を管理
const AppContext = React.createContext<{
  // 入力データ
  plateConfig: PlateConfig;
  cutConfig: CutConfig;
  items: Item[];

  // 計算結果
  result: CalculationResult | null;

  // アクション
  setPlateConfig: (config: PlateConfig) => void;
  setCutConfig: (config: CutConfig) => void;
  addItem: (item: Item) => void;
  updateItem: (id: string, item: Item) => void;
  deleteItem: (id: string) => void;
  calculate: () => void;
  clearAll: () => void;
}>();
```

### 5.4 将来の拡張性

v2.0以降でデータベース対応やログイン機能を追加する際は、以下を検討：
- **Zustand**: より高度な状態管理
- **React Query**: サーバー状態管理
- **Jotai/Recoil**: アトミックな状態管理

---

## 6. データフロー

### 6.1 入力 → 計算 → 表示の流れ

```
┌─────────────────┐
│  1. ユーザー入力  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. バリデーション│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  3. 状態更新      │
│  (Context/State) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  4. 計算実行      │
│  (Algorithm)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  5. 結果生成      │
│  (Result Data)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  6. UI更新        │
│  (Re-render)     │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  7. 結果表示      │
└─────────────────┘
```

### 6.2 計算処理フロー

```typescript
// 計算処理の流れ
function calculate(
  plateConfig: PlateConfig,
  cutConfig: CutConfig,
  items: Item[]
): CalculationResult {

  // 1. 入力データの検証
  validate(plateConfig, cutConfig, items);

  // 2. 製品をソート（面積順）
  const sortedItems = sortByArea(items);

  // 3. 配置計算
  const plates = guillotineCut(
    plateConfig,
    cutConfig,
    sortedItems
  );

  // 4. パターングループ化
  const patterns = groupPatterns(plates);

  // 5. 統計情報の計算
  const totalPlates = plates.length;
  const averageYield = calculateAverageYield(plates);
  const totalCost = totalPlates * plateConfig.unitPrice;

  // 6. 結果を返す
  return {
    patterns,
    totalPlates,
    averageYield,
    totalCost
  };
}
```

---

## 7. レンダリング戦略

### 7.1 Next.js App Router の活用

- **Client Component**: インタラクティブなUI
  - フォーム入力
  - 計算結果表示
  - 配置図描画

- **Server Component**: 静的コンテンツ（v1.0では最小限）
  - ヘッダー
  - フッター

### 7.2 パフォーマンス最適化

- **React.memo**: 不要な再レンダリングを防止
- **useMemo**: 計算結果のメモ化
- **useCallback**: 関数のメモ化
- **動的インポート**: 大きなコンポーネントの遅延読み込み

---

## 8. エラーハンドリング

### 8.1 エラーの種類

1. **バリデーションエラー**: 入力値の不正
2. **計算エラー**: アルゴリズムの失敗
3. **システムエラー**: 予期しないエラー

### 8.2 エラー表示方針

- フォームレベル: 各入力フィールドの下にエラーメッセージ
- ページレベル: トースト通知またはアラート
- グローバルレベル: エラーバウンダリ

---

## 9. アクセシビリティ

### 9.1 基本方針

- **セマンティックHTML**: 適切なタグの使用
- **キーボード操作**: Tab/Enterでの操作サポート
- **スクリーンリーダー**: ARIA属性の適切な設定
- **色覚対応**: コントラスト比の確保

---

## 10. 将来の拡張性

### v1.0の設計で考慮すべき拡張ポイント

1. **端材管理機能** (v2.0)
   - 端材データの型定義を追加
   - アルゴリズムに端材優先配置を追加

2. **手動配置調整機能** (v1.5)
   - ドラッグ&ドロップ用の状態管理
   - Canvas操作の拡張

3. **複雑形状対応** (v5.0)
   - ポリゴンベースの型定義
   - アルゴリズムの抽象化層

4. **データベース対応** (v2.0)
   - API層の追加
   - サーバー状態管理の導入

---

## 11. 技術的な意思決定

### 11.1 Canvas vs SVG

**選択: Canvas**

理由：
- 大量の矩形描画でパフォーマンスが良い
- 印刷時の解像度制御が容易
- インタラクティブ機能は最小限（v1.0）

### 11.2 状態管理: Context API vs Zustand

**選択: Context API**

理由：
- アプリケーション規模が小さい
- 追加ライブラリなしで実装可能
- 学習コストが低い

### 11.3 スタイリング: Tailwind CSS vs CSS Modules

**選択: Tailwind CSS**

理由：
- 高速な開発が可能
- レスポンシブ対応が簡単
- ユーティリティクラスで一貫性を保てる

---

## 12. 成果物

### このIssueで作成するドキュメント

- ✅ このアーキテクチャ設計書 (architecture.md)
- ⏭ コンポーネント図（次のIssueで詳細化）
- ⏭ データフロー図（次のIssueで詳細化）

---

**Issue #1 完了条件**:
- [x] コンポーネント構成の決定
- [x] ディレクトリ構造の詳細設計
- [x] 状態管理方針の決定
- [x] データフローの設計
- [x] アーキテクチャ設計書の作成
