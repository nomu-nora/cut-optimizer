# カスタムサブエージェント設計

**作成日**: 2025年12月26日
**対象プロジェクト**: 取り数最適化システム (cut-optimizer)

---

## 概要

このドキュメントは、プロジェクト固有のタスクに特化したカスタムサブエージェントの設計・実装方法をまとめたものです。

---

## サブエージェントとは

Claude Codeでは、特定のタスクに特化したサブエージェント（スキル）を作成できます。
これにより、複雑なタスクを自動化し、開発効率を大幅に向上させることができます。

---

## 優先度の高いサブエージェント

### 1. デバッグ特化エージェント ⭐ 最優先

#### 目的

複雑なアルゴリズム（GA、Maximal Rectangles、編集モード）のデバッグを効率化

#### 責務

**アルゴリズムデバッグ**:

- GAの世代ごとのスコア変動を追跡
- Maximal Rectanglesのヒューリスティック比較
- 歩留まり計算の検証
- 配置の妥当性チェック（重複、はみ出し）

**フロントエンドデバッグ**:

- 編集モードの状態遷移追跡
- ドラッグ&ドロップの座標計算検証
- React Stateの不整合検出

**パフォーマンス分析**:

- GA計算時間のボトルネック特定
- メモリリーク検出
- レンダリングパフォーマンス分析

**TypeScript型エラー分析**:

- 型の不整合を検出
- 修正提案

#### 実装方法

**Option A: Claude Code スキルとして実装**

```bash
# スキル用ディレクトリを作成
mkdir -p .claude/skills/debug-agent

# スキル定義ファイルを作成
touch .claude/skills/debug-agent/skill.json
```

```json
// .claude/skills/debug-agent/skill.json
{
  "name": "debug-agent",
  "version": "1.0.0",
  "description": "最適化アルゴリズムとReactアプリのデバッグに特化したエージェント",
  "author": "cut-optimizer team",
  "tools": ["Read", "Grep", "Glob", "Bash", "Edit"],
  "mcpServers": ["supabase"],
  "systemPrompt": "You are a debugging specialist for cutting optimization algorithms and React applications.\n\nYour expertise:\n1. Genetic Algorithm debugging (score tracking, convergence analysis)\n2. Maximal Rectangles placement verification\n3. React state management debugging\n4. TypeScript type error resolution\n5. Performance profiling\n\nWhen debugging:\n- Always verify assumptions with concrete data\n- Use console.log strategically for algorithm steps\n- Check edge cases (empty arrays, single items, etc.)\n- Validate calculation results (yield, placement validity)\n- Profile performance bottlenecks\n\nPrioritize:\n1. Correctness over performance\n2. Clear error messages\n3. Reproducible test cases"
}
```

**Option B: カスタムMCPサーバーとして実装**

より高度な機能が必要な場合は、専用のMCPサーバーを作成。

```typescript
// servers/debug-agent/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

const server = new Server(
  {
    name: 'debug-agent',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

// デバッグツールの実装
server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'analyze_ga_convergence',
      description: '遺伝的アルゴリズムの収束状態を分析',
      inputSchema: {
        /* ... */
      },
    },
    {
      name: 'verify_placement',
      description: '配置の妥当性（重複、はみ出し）を検証',
      inputSchema: {
        /* ... */
      },
    },
    {
      name: 'profile_performance',
      description: 'パフォーマンスボトルネックを特定',
      inputSchema: {
        /* ... */
      },
    },
  ],
}))

// サーバー起動
const transport = new StdioServerTransport()
await server.connect(transport)
```

#### 使用例

```
> "GAの計算が遅い。ボトルネックを特定して"
→ デバッグエージェントがプロファイリングして報告

> "編集モードでドラッグ&ドロップが失敗する。原因を調べて"
→ 状態遷移を追跡して原因を特定

> "歩留まり計算が合ってるか検証して"
→ 計算ロジックをステップバイステップで検証
```

#### 期待される効果

- デバッグ時間: 30分 → 5分
- バグの再現率向上
- 型エラーの早期発見

---

### 2. Playwright E2Eテスト エージェント

#### 目的

重要なユーザーフローを自動テストし、リグレッションを防ぐ

#### 責務

**エンドツーエンドテスト**:

- ログイン → 製品入力 → 計算 → 結果確認
- 設定変更 → 保存 → 適用確認
- テンプレート保存 → 読み込み → 計算
- 履歴保存 → 復元 → 計算再実行
- 編集モード → ドラッグ&ドロップ → 保存

**ビジュアルリグレッションテスト**:

- 配置図のスクリーンショット比較
- UIコンポーネントの見た目チェック

**パフォーマンステスト**:

- 計算時間の測定
- ページロード時間の測定

#### 実装方法

**Playwright基本セットアップ**:

```bash
# Playwrightインストール
npm install -D @playwright/test

# ブラウザのインストール
npx playwright install
```

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

**重要フローのテスト例**:

```typescript
// e2e/calculation-flow.spec.ts
import { test, expect } from '@playwright/test'

test('製品入力から計算実行までのフロー', async ({ page }) => {
  // ログイン
  await page.goto('/login')
  await page.fill('input[type="email"]', 'test@cutoptimizer.local')
  await page.fill('input[type="password"]', 'test-password')
  await page.click('button[type="submit"]')

  // ホーム画面に遷移
  await expect(page).toHaveURL('/')

  // 製品を追加
  await page.click('text=製品を追加')
  await page.fill('[data-testid="product-width"]', '100')
  await page.fill('[data-testid="product-height"]', '200')
  await page.fill('[data-testid="product-quantity"]', '5')
  await page.click('text=保存')

  // 計算実行
  await page.click('text=計算実行')

  // 結果を待機
  await expect(page.locator('[data-testid="result-summary"]')).toBeVisible({ timeout: 30000 })

  // 歩留まりが表示されることを確認
  const yield = await page.locator('[data-testid="average-yield"]').textContent()
  expect(parseFloat(yield || '0')).toBeGreaterThan(0)

  // スクリーンショットを保存（ビジュアルリグレッション用）
  await page.screenshot({ path: 'e2e/screenshots/calculation-result.png', fullPage: true })
})
```

**カスタムMCPサーバー（高度な自動化）**:

```typescript
// servers/playwright-mcp/index.ts
import { chromium } from 'playwright'

// 自然言語でE2Eテストを実行
// "ログインして製品を3つ追加して計算実行して"
// → Playwrightで自動実行して結果を報告
```

#### 使用例

```bash
# 手動実行
npx playwright test

# 特定のテストのみ
npx playwright test e2e/calculation-flow.spec.ts

# UIモードで実行（デバッグに便利）
npx playwright test --ui
```

**エージェント経由**:

```
> "全てのE2Eテストを実行して"
→ Playwrightテストを実行して結果を報告

> "計算フローのテストが失敗した。原因を調べて"
→ スクリーンショットとログを確認して分析
```

#### 期待される効果

- 手動テスト時間: 1時間 → 5分（自動）
- リグレッションの早期発見
- リファクタリングの安心感

---

### 3. パフォーマンス分析エージェント（将来）

#### 目的

アルゴリズムとフロントエンドのパフォーマンス最適化

#### 責務

- GAの計算時間分析
- React Profilerでのレンダリング分析
- バンドルサイズの最適化提案
- メモリ使用量の監視

---

### 4. データマイグレーションエージェント（将来）

#### 目的

データベーススキーマ変更時のマイグレーション自動化

#### 責務

- Supabaseマイグレーションファイルの生成
- データの整合性チェック
- ロールバックスクリプトの作成

---

## 導入スケジュール

### 今週

1. ✅ デバッグエージェントのスキル定義作成
2. ✅ 基本的なデバッグフローで試用

### 来週

3. Playwright基本セットアップ
4. 3つの重要フローのテスト作成
   - ログイン → 計算実行
   - 設定変更 → 保存
   - テンプレート保存 → 読み込み

### 2週間後

5. Playwright MCP サーバー作成
6. ビジュアルリグレッションテスト導入

### 1ヶ月後

7. パフォーマンス分析エージェント作成
8. CI/CDにE2Eテストを統合

---

## 参考資料

- [Claude Code Skills ドキュメント](https://code.claude.com/docs/en/skills.md)
- [MCP サーバー作成ガイド](https://modelcontextprotocol.io/quickstart/server)
- [Playwright 公式ドキュメント](https://playwright.dev/)

---

**最終更新**: 2025年12月26日
**次回更新予定**: デバッグエージェント実装完了時
