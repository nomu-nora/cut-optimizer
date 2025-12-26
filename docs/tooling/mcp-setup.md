# MCP環境構築ガイド

**作成日**: 2025年12月26日
**対象プロジェクト**: 取り数最適化システム (cut-optimizer)

---

## 概要

このドキュメントは、Model Context Protocol (MCP) サーバーを使った開発環境の構築手順をまとめたものです。
MCPを活用することで、データベース操作、デプロイ、モニタリング等を自然言語で実行できるようになります。

---

## MCP とは

**Model Context Protocol (MCP)** は、AIがツール、データベース、APIと統合するためのオープンスタンダードです。

### メリット

- 自然言語でデータベースクエリを実行
- デプロイ操作の自動化
- エラーログの簡単な確認
- チーム全体で設定を共有可能

### 公式リソース

- [Claude Code MCP ドキュメント](https://code.claude.com/docs/en/mcp.md)
- [MCP 公式サイト](https://modelcontextprotocol.io)
- [MCP サーバーレジストリ](https://github.com/modelcontextprotocol/servers)

---

## 導入フェーズ

### Phase 1: 基本MCP（高ROI、即効性高い）

#### 1. Supabase (PostgreSQL) MCP ⭐ 最優先

**目的**: データベース操作を自然言語で実行

**セットアップ**:

```bash
# プロジェクト全体で共有
claude mcp add --scope project --transport stdio supabase \
  -- npx -y @bytebase/dbhub \
  --dsn "postgresql://postgres:${SUPABASE_PASSWORD}@db.supabase.co:5432/postgres"
```

**環境変数の設定**:

```bash
# .env.local に追加
SUPABASE_PASSWORD=your-database-password
```

**使用例**:

```
> "calculation_historyテーブルの最新10件を表示して"
> "user_settingsテーブルのスキーマを見せて"
> "スター付きの計算履歴は何件ある？"
> "RLSポリシーを確認して"
```

**期待される効果**:

- マイグレーション作成が楽に
- データ確認が一瞬
- デバッグ時間の削減

---

#### 2. GitHub MCP ⭐ 高優先

**目的**: Issue管理、PR作成の自動化

**セットアップ**:

```bash
claude mcp add --scope project --transport http github \
  https://api.githubcopilot.com/mcp/ \
  --header "Authorization: Bearer ${GITHUB_TOKEN}"
```

**環境変数の設定**:

```bash
# .env.local に追加
GITHUB_TOKEN=ghp_your_personal_access_token
```

**使用例**:

```
> "v1.7のIssueを作成して"
> "PRを作成してmainにマージ"
> "最近のコミット履歴を分析"
```

**期待される効果**:

- Issue作成の手間削減
- PR作成の自動化
- コミット履歴の簡単な分析

---

#### 3. Sentry MCP（エラーモニタリング）

**目的**: 本番環境のエラー監視

**前提**: Sentryプロジェクトの作成が必要

**セットアップ**:

```bash
# まずSentryをプロジェクトに導入
npm install @sentry/nextjs

# Sentry MCP追加
claude mcp add --scope project --transport http sentry \
  https://sentry.io/api/mcp/ \
  --header "Authorization: Bearer ${SENTRY_AUTH_TOKEN}"
```

**使用例**:

```
> "過去24時間のエラーを表示"
> "最も頻繁に発生しているエラーは？"
> "特定のユーザーのエラーログを確認"
```

---

### Phase 2: デプロイ自動化

#### 4. Vercel MCP

**目的**: デプロイ操作の自動化

**セットアップ**:

```bash
claude mcp add --scope project --transport http vercel \
  https://api.vercel.com/mcp \
  --header "Authorization: Bearer ${VERCEL_TOKEN}"
```

**環境変数の設定**:

```bash
# Vercelトークンを取得: https://vercel.com/account/tokens
VERCEL_TOKEN=your-vercel-token
```

**使用例**:

```
> "プレビュー環境を作成して"
> "本番にデプロイ"
> "最新のデプロイログを確認"
```

---

### Phase 3: 分析・モニタリング

#### 5. Google Analytics MCP（将来）

**目的**: ユーザー行動分析

実家での使用状況を分析する際に有効。

---

## MCP管理コマンド

### 一覧表示

```bash
# すべてのMCPサーバーを表示
claude mcp list
```

### 詳細確認

```bash
# 特定のサーバーの詳細
claude mcp get supabase
```

### 削除

```bash
# サーバーを削除
claude mcp remove supabase
```

### ステータス確認

Claude Code内で:

```
/mcp
```

---

## プロジェクト共有設定

### `.mcp.json` の管理

プロジェクトルートに `.mcp.json` が作成されます。このファイルはGitにコミットして、チーム全体で共有します。

**重要**: 認証情報は直接書かず、環境変数を使用してください。

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@bytebase/dbhub",
        "--dsn",
        "postgresql://postgres:${SUPABASE_PASSWORD}@db.supabase.co:5432/postgres"
      ],
      "env": {
        "SUPABASE_PASSWORD": "${SUPABASE_PASSWORD}"
      }
    }
  }
}
```

### 環境変数の管理

**ローカル開発**:

```bash
# .env.local に記載（Gitにコミットしない）
SUPABASE_PASSWORD=your-password
GITHUB_TOKEN=your-token
VERCEL_TOKEN=your-token
SENTRY_AUTH_TOKEN=your-token
```

**本番環境**:

- Vercelの環境変数設定で管理

---

## セキュリティ上の注意

### 基本原則

1. **信頼できるMCPサーバーのみ使用**
   - 公式MCPサーバーを優先
   - カスタムサーバーはコードレビュー必須

2. **認証情報の管理**
   - `.mcp.json` に直接パスワードを書かない
   - 環境変数を使用
   - `.env.local` は `.gitignore` に追加

3. **アクセス権限**
   - 本番データベースは読み取り専用推奨
   - 必要最小限の権限のみ付与

4. **プロンプトインジェクション対策**
   - 不信頼なコンテンツを取得するサーバーは慎重に使用

---

## トラブルシューティング

### MCPサーバーが起動しない

```bash
# サーバーのログを確認
claude mcp get supabase

# 削除して再追加
claude mcp remove supabase
claude mcp add --scope project --transport stdio supabase ...
```

### 環境変数が認識されない

```bash
# .env.local を確認
cat .env.local

# 環境変数を手動でエクスポート
export SUPABASE_PASSWORD=your-password

# Claude Codeを再起動
```

### データベース接続エラー

- Supabaseダッシュボードで接続情報を確認
- IPアドレス制限がかかっていないか確認
- パスワードに特殊文字が含まれている場合はURLエンコード

---

## 次のステップ

1. [カスタムサブエージェント設計](./subagents.md)
2. [Playwright E2Eテスト環境構築](./playwright-e2e.md)
3. [開発ワークフロー最適化](./development-workflow.md)

---

## 参考資料

- [Claude Code MCP ドキュメント](https://code.claude.com/docs/en/mcp.md)
- [MCP サーバーレジストリ](https://github.com/modelcontextprotocol/servers)
- [MCP 公式サイト](https://modelcontextprotocol.io)
- [Supabase 接続情報](https://supabase.com/docs/guides/database/connecting-to-postgres)

---

**最終更新**: 2025年12月26日
**次回更新予定**: Phase 1 完了時
