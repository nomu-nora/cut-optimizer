#!/usr/bin/env python3
import json
import urllib.request
import urllib.error

# GitHub API設定
# 使用方法: GITHUB_TOKEN=your_token python3 create-issues.py
import os
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
REPO_OWNER = "nomu-nora"
REPO_NAME = "cut-optimizer"
API_URL = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}"

def create_issue(title, body, labels):
    """Issueを作成する"""
    url = f"{API_URL}/issues"
    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json"
    }
    data = {
        "title": title,
        "body": body,
        "labels": labels
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers=headers,
        method='POST'
    )

    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            print(f"✓ Created: #{result['number']} {title}")
            return result
    except urllib.error.HTTPError as e:
        print(f"✗ Failed: {title} - {e.code} {e.reason}")
        return None

# Issuesデータ
issues = [
    # Phase 1
    {
        "title": "システムアーキテクチャ設計",
        "body": """## 目的
システム全体のアーキテクチャを設計する

## タスク
- [ ] コンポーネント構成の決定
- [ ] ディレクトリ構造の詳細設計
- [ ] 状態管理方針の決定（Context API or Zustand）
- [ ] データフローの設計

## 成果物
- アーキテクチャ設計書
- コンポーネント図""",
        "labels": ["phase-1", "design", "priority-high"]
    },
    {
        "title": "データフロー設計",
        "body": """## 目的
入力から計算、表示までのデータフローを設計する

## タスク
- [ ] 入力データの構造設計
- [ ] 計算処理のフロー設計
- [ ] 結果データの構造設計
- [ ] データの受け渡し方法の決定

## 成果物
- データフロー図
- データ構造定義書""",
        "labels": ["phase-1", "design", "priority-high"]
    },
    {
        "title": "UI/UX設計",
        "body": """## 目的
ユーザーインターフェースとユーザー体験を設計する

## タスク
- [ ] ワイヤーフレーム作成
- [ ] 画面遷移図作成
- [ ] レスポンシブ対応方針の決定
- [ ] カラースキームの決定

## 成果物
- ワイヤーフレーム
- 画面遷移図
- デザインガイドライン""",
        "labels": ["phase-1", "design", "priority-high"]
    },

    # Phase 2
    {
        "title": "Next.jsプロジェクトの初期化",
        "body": """## 目的
Next.jsプロジェクトをセットアップする

## タスク
- [ ] `npx create-next-app@latest` 実行
- [ ] TypeScript設定
- [ ] Tailwind CSS設定
- [ ] App Router構成確認

## 成果物
- 動作するNext.jsプロジェクト""",
        "labels": ["phase-2", "implementation", "priority-high"]
    },
    {
        "title": "開発ツールの設定",
        "body": """## 目的
開発効率を上げるツールをセットアップする

## タスク
- [ ] ESLint設定
- [ ] Prettier設定
- [ ] Git hooks設定（Husky）
- [ ] VS Code設定ファイル作成

## 成果物
- 設定ファイル一式""",
        "labels": ["phase-2", "implementation", "priority-medium"]
    },
    {
        "title": "基本的なフォルダ構成の整備",
        "body": """## 目的
プロジェクトのフォルダ構成を整備する

## タスク
- [ ] components/ ディレクトリ整備
- [ ] lib/ ディレクトリ整備
- [ ] types/ ディレクトリ整備
- [ ] README.md作成

## 成果物
- 整備されたフォルダ構造
- README.md""",
        "labels": ["phase-2", "documentation", "priority-medium"]
    },

    # Phase 3
    {
        "title": "基本型の定義",
        "body": """## 目的
基本的なTypeScript型を定義する

## タスク
- [ ] PlateConfig型（元板設定）
- [ ] CutConfig型（切断設定）
- [ ] Item型（製品）

## 成果物
- types/config.ts
- types/item.ts""",
        "labels": ["phase-3", "implementation", "priority-high"]
    },
    {
        "title": "計算用の型定義",
        "body": """## 目的
アルゴリズム計算に使用する型を定義する

## タスク
- [ ] Placement型（配置された製品）
- [ ] FreeSpace型（空きスペース）
- [ ] Plate型（元板）

## 成果物
- types/algorithm.ts""",
        "labels": ["phase-3", "implementation", "priority-high"]
    },
    {
        "title": "結果表示用の型定義",
        "body": """## 目的
計算結果の表示に使用する型を定義する

## タスク
- [ ] PatternGroup型（パターングループ）
- [ ] CalculationResult型（計算結果）

## 成果物
- types/result.ts""",
        "labels": ["phase-3", "implementation", "priority-high"]
    },

    # Phase 4
    {
        "title": "ソート機能の実装",
        "body": """## 目的
製品を面積順にソートする機能を実装する

## タスク
- [ ] 面積計算関数
- [ ] ソート関数
- [ ] 単体テスト

## 成果物
- lib/sort.ts
- 単体テスト""",
        "labels": ["phase-4", "implementation", "priority-high"]
    },
    {
        "title": "配置判定ロジックの実装",
        "body": """## 目的
製品が配置可能か判定するロジックを実装する

## タスク
- [ ] canPlace()関数の実装
- [ ] 90度回転判定の実装
- [ ] 単体テスト

## 成果物
- lib/placement.ts
- 単体テスト""",
        "labels": ["phase-4", "implementation", "priority-high"]
    },
    {
        "title": "スペース分割ロジックの実装",
        "body": """## 目的
配置後の空きスペースを分割するロジックを実装する

## タスク
- [ ] splitSpace()関数の実装
- [ ] 横分割・縦分割のロジック
- [ ] 単体テスト

## 成果物
- lib/space.ts
- 単体テスト""",
        "labels": ["phase-4", "implementation", "priority-high"]
    },
    {
        "title": "配置計算のメインロジック",
        "body": """## 目的
Guillotine Cutアルゴリズムのメインロジックを実装する

## タスク
- [ ] 元板への配置ループ
- [ ] カット幅の考慮
- [ ] 余白の考慮
- [ ] 次の元板への移行ロジック

## 成果物
- lib/algorithm.ts""",
        "labels": ["phase-4", "implementation", "priority-high"]
    },
    {
        "title": "パターングループ化ロジック",
        "body": """## 目的
同じ配置パターンをグループ化するロジックを実装する

## タスク
- [ ] 配置パターンのハッシュ化
- [ ] パターンの比較ロジック
- [ ] グループ化関数

## 成果物
- lib/pattern.ts""",
        "labels": ["phase-4", "implementation", "priority-medium"]
    },
    {
        "title": "歩留まり計算",
        "body": """## 目的
元板の歩留まり率を計算する機能を実装する

## タスク
- [ ] calculateYield()関数の実装
- [ ] 有効エリアの計算
- [ ] 単体テスト

## 成果物
- lib/yield.ts
- 単体テスト""",
        "labels": ["phase-4", "implementation", "priority-high"]
    },
    {
        "title": "アルゴリズムの単体テスト",
        "body": """## 目的
アルゴリズム全体の精度を検証する

## タスク
- [ ] テストケース作成
- [ ] 精度検証
- [ ] エッジケーステスト

## 成果物
- テストスイート
- テスト結果レポート""",
        "labels": ["phase-4", "test", "priority-high"]
    },

    # Phase 5
    {
        "title": "メインレイアウトの実装",
        "body": """## 目的
アプリケーションの基本レイアウトを実装する

## タスク
- [ ] ヘッダーコンポーネント
- [ ] 入力エリア・結果表示エリアの配置
- [ ] レスポンシブ対応

## 成果物
- app/layout.tsx
- components/Header.tsx""",
        "labels": ["phase-5", "implementation", "priority-high"]
    },
    {
        "title": "共通コンポーネントの実装",
        "body": """## 目的
再利用可能な共通コンポーネントを実装する

## タスク
- [ ] Buttonコンポーネント
- [ ] Inputコンポーネント
- [ ] Cardコンポーネント
- [ ] Labelコンポーネント

## 成果物
- components/ui/*.tsx""",
        "labels": ["phase-5", "implementation", "priority-high"]
    },
    {
        "title": "ローディング・エラー表示",
        "body": """## 目的
ローディングとエラー表示を実装する

## タスク
- [ ] ローディングスピナー
- [ ] エラーメッセージ表示
- [ ] トースト通知

## 成果物
- components/Loading.tsx
- components/ErrorMessage.tsx""",
        "labels": ["phase-5", "implementation", "priority-medium"]
    },

    # Phase 6
    {
        "title": "元板設定フォームの実装",
        "body": """## 目的
元板サイズと単価を入力するフォームを実装する

## タスク
- [ ] 幅・高さ入力フィールド
- [ ] 単価入力フィールド
- [ ] デフォルト値設定
- [ ] バリデーション

## 成果物
- components/PlateConfigForm.tsx""",
        "labels": ["phase-6", "implementation", "priority-high"]
    },
    {
        "title": "切断設定フォームの実装",
        "body": """## 目的
カット幅と余白を入力するフォームを実装する

## タスク
- [ ] カット幅入力フィールド
- [ ] 余白入力フィールド
- [ ] デフォルト値設定

## 成果物
- components/CutConfigForm.tsx""",
        "labels": ["phase-6", "implementation", "priority-medium"]
    },
    {
        "title": "製品入力フォームの実装",
        "body": """## 目的
製品情報を入力するフォームを実装する

## タスク
- [ ] 製品名・サイズ・個数入力
- [ ] 色選択機能
- [ ] 追加・編集・削除機能
- [ ] リスト表示

## 成果物
- components/ItemForm.tsx
- components/ItemList.tsx""",
        "labels": ["phase-6", "implementation", "priority-high"]
    },
    {
        "title": "入力バリデーション",
        "body": """## 目的
入力値のバリデーションを実装する

## タスク
- [ ] 必須項目チェック
- [ ] 数値範囲チェック
- [ ] エラーメッセージ表示

## 成果物
- lib/validation.ts""",
        "labels": ["phase-6", "implementation", "priority-high"]
    },
    {
        "title": "ローカルストレージ保存機能",
        "body": """## 目的
入力内容をローカルストレージに保存する

## タスク
- [ ] 自動保存機能
- [ ] 復元機能
- [ ] クリア機能

## 成果物
- lib/storage.ts""",
        "labels": ["phase-6", "implementation", "priority-medium"]
    },

    # Phase 7
    {
        "title": "サマリー表示の実装",
        "body": """## 目的
計算結果のサマリーを表示する

## タスク
- [ ] 必要元板枚数表示
- [ ] 平均歩留まり率表示
- [ ] 総コスト表示

## 成果物
- components/ResultSummary.tsx""",
        "labels": ["phase-7", "implementation", "priority-high"]
    },
    {
        "title": "パターン一覧表示",
        "body": """## 目的
配置パターンの一覧を表示する

## タスク
- [ ] グリッドレイアウト
- [ ] パターンごとのカード表示
- [ ] パターン情報の表示

## 成果物
- components/PatternList.tsx
- components/PatternCard.tsx""",
        "labels": ["phase-7", "implementation", "priority-high"]
    },
    {
        "title": "配置図の描画（Canvas/SVG）",
        "body": """## 目的
配置図を視覚的に描画する

## タスク
- [ ] 元板の枠表示
- [ ] 製品の矩形表示（色分け）
- [ ] 製品名の表示
- [ ] カット線の表示

## 成果物
- components/PlateVisualization.tsx""",
        "labels": ["phase-7", "implementation", "priority-high"]
    },
    {
        "title": "配置図のインタラクティブ機能",
        "body": """## 目的
配置図にインタラクティブ機能を追加する

## タスク
- [ ] ホバー時の情報表示
- [ ] 拡大縮小機能（オプション）

## 成果物
- 更新されたPlateVisualization.tsx""",
        "labels": ["phase-7", "implementation", "priority-low"]
    },

    # Phase 8
    {
        "title": "印刷用CSSの実装",
        "body": """## 目的
印刷用のスタイルを実装する

## タスク
- [ ] @media print スタイル
- [ ] ページ区切り設定
- [ ] 印刷時のレイアウト調整

## 成果物
- styles/print.css""",
        "labels": ["phase-8", "implementation", "priority-medium"]
    },
    {
        "title": "印刷プレビュー機能",
        "body": """## 目的
印刷前のプレビュー機能を実装する

## タスク
- [ ] プレビューモード
- [ ] 印刷ボタン

## 成果物
- components/PrintPreview.tsx""",
        "labels": ["phase-8", "implementation", "priority-medium"]
    },
    {
        "title": "PDF出力対応",
        "body": """## 目的
PDF出力機能を実装する

## タスク
- [ ] ブラウザの印刷機能活用
- [ ] A4サイズ対応

## 成果物
- 印刷機能の完成""",
        "labels": ["phase-8", "implementation", "priority-medium"]
    },

    # Phase 9
    {
        "title": "単体テストの追加",
        "body": """## 目的
各関数の単体テストを追加する

## タスク
- [ ] アルゴリズムのテスト
- [ ] ユーティリティ関数のテスト
- [ ] カバレッジ確認

## 成果物
- テストスイート""",
        "labels": ["phase-9", "test", "priority-high"]
    },
    {
        "title": "統合テスト",
        "body": """## 目的
システム全体の統合テストを実施する

## タスク
- [ ] 入力→計算→表示の流れテスト
- [ ] エッジケースの確認

## 成果物
- 統合テストスイート""",
        "labels": ["phase-9", "test", "priority-high"]
    },
    {
        "title": "実データでの検証",
        "body": """## 目的
実際の業務データで検証する

## タスク
- [ ] 実家の業務データで試験
- [ ] 歩留まり率の検証
- [ ] フィードバック収集

## 成果物
- 検証レポート""",
        "labels": ["phase-9", "test", "priority-high"]
    },
    {
        "title": "バグ修正",
        "body": """## 目的
発見されたバグを修正する

## タスク
- [ ] バグリストの作成
- [ ] 優先度付け
- [ ] 修正実施

## 成果物
- バグ修正コミット""",
        "labels": ["phase-9", "implementation", "priority-high"]
    },
    {
        "title": "パフォーマンス最適化",
        "body": """## 目的
アプリケーションのパフォーマンスを最適化する

## タスク
- [ ] 計算速度の改善
- [ ] レンダリング最適化
- [ ] パフォーマンス計測

## 成果物
- 最適化されたコード""",
        "labels": ["phase-9", "implementation", "priority-medium"]
    },

    # Phase 10
    {
        "title": "Vercelプロジェクトの作成",
        "body": """## 目的
Vercelでプロジェクトをセットアップする

## タスク
- [ ] Vercelアカウント設定
- [ ] プロジェクト連携
- [ ] ビルド設定

## 成果物
- Vercelプロジェクト""",
        "labels": ["phase-10", "implementation", "priority-high"]
    },
    {
        "title": "環境変数の設定",
        "body": """## 目的
本番環境の環境変数を設定する

## タスク
- [ ] 必要な環境変数の洗い出し
- [ ] Vercelでの設定

## 成果物
- 設定済み環境変数""",
        "labels": ["phase-10", "implementation", "priority-medium"]
    },
    {
        "title": "本番デプロイ",
        "body": """## 目的
本番環境にデプロイする

## タスク
- [ ] 初回デプロイ
- [ ] 動作確認
- [ ] ドメイン設定（オプション）

## 成果物
- デプロイ済みアプリケーション""",
        "labels": ["phase-10", "implementation", "priority-high"]
    },
    {
        "title": "ドキュメント整備",
        "body": """## 目的
プロジェクトのドキュメントを整備する

## タスク
- [ ] README.md完成
- [ ] 使い方ガイド作成
- [ ] 開発ドキュメント作成

## 成果物
- 完成したドキュメント""",
        "labels": ["phase-10", "documentation", "priority-medium"]
    },
    {
        "title": "v1.0リリース",
        "body": """## 目的
バージョン1.0をリリースする

## タスク
- [ ] リリースノート作成
- [ ] タグ付け
- [ ] リリース公開

## 成果物
- v1.0リリース""",
        "labels": ["phase-10", "documentation", "priority-high"]
    },
]

print("=== GitHub Issuesを作成中 ===\n")

for i, issue in enumerate(issues, 1):
    create_issue(issue["title"], issue["body"], issue["labels"])

print(f"\n=== 完了 ===")
print(f"{len(issues)}個のIssuesを作成しました！")
print(f"https://github.com/{REPO_OWNER}/{REPO_NAME}/issues で確認できます")
