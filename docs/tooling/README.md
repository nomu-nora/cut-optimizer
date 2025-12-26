# 開発ツール・環境構築ドキュメント

**作成日**: 2025年12月26日
**対象プロジェクト**: 取り数最適化システム (cut-optimizer)

---

## 📚 ドキュメント一覧

このディレクトリには、開発効率化のためのツール・環境構築に関するドキュメントをまとめています。

### 1. [MCP環境構築ガイド](./mcp-setup.md) ⭐ まずここから

Model Context Protocol (MCP) サーバーを使った開発環境の構築手順。

**含まれる内容**:

- Supabase (PostgreSQL) MCP
- GitHub MCP
- Vercel MCP
- Sentry MCP
- セキュリティ上の注意事項

**対象者**: 全開発者

---

### 2. [カスタムサブエージェント設計](./subagents.md)

プロジェクト固有のタスクに特化したサブエージェント（スキル）の設計・実装方法。

**含まれる内容**:

- デバッグ特化エージェント
- Playwright E2Eテスト エージェント
- パフォーマンス分析エージェント
- データマイグレーションエージェント

**対象者**: 効率化に興味がある開発者

---

### 3. [Playwright E2Eテスト環境構築](./playwright-e2e.md)

E2E（End-to-End）テスト環境の構築手順とテストケース。

**含まれる内容**:

- Playwrightセットアップ
- 認証フローのテスト
- 計算フローのテスト
- 編集モードのテスト
- ビジュアルリグレッションテスト
- CI/CD統合

**対象者**: テスト担当者、QA担当者

---

### 4. [開発ワークフロー最適化](./development-workflow.md)

MCP・サブエージェント・自動化ツールを統合した効率的な開発ワークフロー。

**含まれる内容**:

- 現状の課題分析
- 最適化後のワークフロー
- 実装ロードマップ
- メトリクス（効果測定）
- ベストプラクティス

**対象者**: プロジェクトリーダー、全開発者

---

## 🎯 推奨される導入順序

### Week 1: 基本MCP導入 ⭐ 今週

**目標**: データベース操作とGitHub連携を効率化

1. ✅ [MCP環境構築ガイド](./mcp-setup.md) の Phase 1 を完了
   - Supabase MCP
   - GitHub MCP
2. 実際の開発で試用
3. 効果測定

**期待される効果**: 開発時間を20%削減

---

### Week 2-3: サブエージェント導入

**目標**: デバッグとテストの自動化

1. [カスタムサブエージェント設計](./subagents.md) のデバッグエージェントを作成
2. [Playwright E2Eテスト環境構築](./playwright-e2e.md) を完了
3. 重要フローのテスト作成

**期待される効果**: 開発時間を50%削減

---

### Week 4: デプロイ自動化

**目標**: デプロイフローの完全自動化

1. Vercel MCP セットアップ
2. Sentry 導入 + MCP統合
3. CI/CD統合

**期待される効果**: デプロイ時間を80%削減

---

## 📊 期待される効果

### 測定指標

| 指標               | 現状    | Phase 1 | Phase 2 | Phase 3 |
| ------------------ | ------- | ------- | ------- | ------- |
| 1機能開発時間      | 3日     | 2.5日   | 1.5日   | 1日     |
| デバッグ時間       | 30分/回 | 30分/回 | 5分/回  | 5分/回  |
| E2Eテスト時間      | 1時間   | 1時間   | 5分     | 5分     |
| デプロイ時間       | 10分    | 5分     | 5分     | 2分     |
| バグ発見までの時間 | 1日     | 1日     | 1時間   | 10分    |

### 目標

- **Phase 1 (Week 1)**: 開発時間を20%削減
- **Phase 2 (Week 2-3)**: 開発時間を50%削減
- **Phase 3 (Week 4)**: 開発時間を70%削減

---

## 🔧 クイックスタート

### 1. Supabase MCP を追加（5分）

```bash
# プロジェクトルートで実行
claude mcp add --scope project --transport stdio supabase \
  -- npx -y @bytebase/dbhub \
  --dsn "postgresql://postgres:${SUPABASE_PASSWORD}@db.supabase.co:5432/postgres"
```

### 2. 試しに使ってみる

Claude Code内で:

```
> "calculation_historyテーブルの最新10件を表示して"
```

### 3. 効果を実感したら次のMCP追加

[MCP環境構築ガイド](./mcp-setup.md) を参照

---

## 🛡️ セキュリティ上の注意

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

---

## 📁 ファイル構成

```
docs/tooling/
├── README.md                      # このファイル（概要・導入ガイド）
├── mcp-setup.md                   # MCP環境構築ガイド ⭐ まずここから
├── subagents.md                   # カスタムサブエージェント設計
├── playwright-e2e.md              # Playwright E2Eテスト環境構築
└── development-workflow.md        # 開発ワークフロー最適化
```

---

## 🔗 関連リソース

### 公式ドキュメント

- [Claude Code ドキュメント](https://code.claude.com/docs)
- [MCP 公式サイト](https://modelcontextprotocol.io)
- [MCP サーバーレジストリ](https://github.com/modelcontextprotocol/servers)
- [Playwright 公式ドキュメント](https://playwright.dev/)

### プロジェクト内ドキュメント

- [ROADMAP.md](../../ROADMAP.md) - プロジェクトのロードマップ
- [README.md](../../README.md) - プロジェクト概要
- [CHANGELOG.md](../../CHANGELOG.md) - 変更履歴
- [docs/versions/](../versions/) - 各バージョンの詳細設計書

---

## 💬 フィードバック

このドキュメントや環境構築について質問・提案がある場合は、プロジェクトのメインリポジトリでIssueを作成してください。

---

## 📝 メンテナンス

### 更新ルール

- 新しいMCPサーバーを追加したら、[mcp-setup.md](./mcp-setup.md) を更新
- 新しいサブエージェントを作成したら、[subagents.md](./subagents.md) を更新
- テストケースを追加したら、[playwright-e2e.md](./playwright-e2e.md) を更新
- ワークフローを変更したら、[development-workflow.md](./development-workflow.md) を更新

### 定期レビュー

- **月1回**: 使用していないツールを削除
- **四半期ごと**: 効果測定と見直し
- **年1回**: 大規模な改善

---

**最終更新**: 2025年12月26日
**次回更新予定**: Phase 1 完了時
**管理者**: cut-optimizer team
