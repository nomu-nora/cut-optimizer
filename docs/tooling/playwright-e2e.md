# Playwright E2Eテスト環境構築

**作成日**: 2025年12月26日
**対象プロジェクト**: 取り数最適化システム (cut-optimizer)

---

## 概要

このドキュメントは、Playwrightを使ったE2E（End-to-End）テスト環境の構築手順とテストケースをまとめたものです。

---

## Playwright とは

Playwrightは、Microsoft製のブラウザ自動化ツールです。複数のブラウザ（Chromium、Firefox、WebKit）でE2Eテストを実行できます。

### メリット

- 実際のユーザー操作を自動化
- リグレッションの早期発見
- リファクタリングの安心感
- ビジュアルリグレッションテスト

---

## セットアップ

### インストール

```bash
# Playwrightと関連パッケージをインストール
npm install -D @playwright/test

# ブラウザをインストール（Chromium、Firefox、WebKit）
npx playwright install

# 依存関係もインストール（Linux環境の場合）
npx playwright install-deps
```

### 設定ファイル

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  // テストファイルの場所
  testDir: './e2e',

  // 並列実行
  fullyParallel: true,

  // CIでは失敗したテストのみ再試行
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // レポート形式
  reporter: 'html',

  // 共通設定
  use: {
    // ベースURL
    baseURL: 'http://localhost:3000',

    // 失敗時にトレースを記録
    trace: 'on-first-retry',

    // スクリーンショット
    screenshot: 'only-on-failure',

    // ビデオ
    video: 'retain-on-failure',
  },

  // テストするブラウザ
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // モバイルテスト
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // 開発サーバーの起動
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
```

### ディレクトリ構造

```
cut-optimizer/
├── e2e/
│   ├── auth/
│   │   ├── login.spec.ts
│   │   └── signup.spec.ts
│   ├── calculation/
│   │   ├── basic-flow.spec.ts
│   │   ├── template-usage.spec.ts
│   │   └── history-restore.spec.ts
│   ├── settings/
│   │   └── settings-save.spec.ts
│   ├── edit-mode/
│   │   ├── drag-and-drop.spec.ts
│   │   └── undo-redo.spec.ts
│   └── fixtures/
│       └── auth.ts
├── playwright.config.ts
└── package.json
```

---

## テストケース

### 1. 認証フロー

#### ログイン

```typescript
// e2e/auth/login.spec.ts
import { test, expect } from '@playwright/test'

test.describe('ログイン', () => {
  test('正常なログイン', async ({ page }) => {
    await page.goto('/login')

    // メールアドレスとパスワードを入力
    await page.fill('input[type="email"]', 'test@cutoptimizer.local')
    await page.fill('input[type="password"]', 'test-password')

    // ログインボタンをクリック
    await page.click('button[type="submit"]')

    // ホーム画面に遷移することを確認
    await expect(page).toHaveURL('/')

    // ユーザー名が表示されることを確認
    await expect(page.locator('text=test@cutoptimizer.local')).toBeVisible()
  })

  test('無効な認証情報でのログイン失敗', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[type="email"]', 'invalid@example.com')
    await page.fill('input[type="password"]', 'wrong-password')
    await page.click('button[type="submit"]')

    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=ログインに失敗しました')).toBeVisible()
  })
})
```

---

### 2. 計算フロー

#### 基本的な計算実行

```typescript
// e2e/calculation/basic-flow.spec.ts
import { test, expect } from '@playwright/test'
import { loginAsTestUser } from '../fixtures/auth'

test.describe('基本的な計算フロー', () => {
  test.beforeEach(async ({ page }) => {
    // テストユーザーでログイン
    await loginAsTestUser(page)
  })

  test('製品入力 → 計算実行 → 結果表示', async ({ page }) => {
    // 製品を追加
    await page.click('[data-testid="add-product-button"]')

    // 1行目（直接編集モードで開始）
    await page.fill('[data-testid="product-name-0"]', '製品A')
    await page.fill('[data-testid="product-width-0"]', '100')
    await page.fill('[data-testid="product-height-0"]', '200')
    await page.fill('[data-testid="product-quantity-0"]', '5')
    await page.keyboard.press('Enter') // 保存

    // 2つ目の製品を追加
    await page.click('[data-testid="add-product-button"]')
    await page.fill('[data-testid="product-name-1"]', '製品B')
    await page.fill('[data-testid="product-width-1"]', '150')
    await page.fill('[data-testid="product-height-1"]', '300')
    await page.fill('[data-testid="product-quantity-1"]', '3')
    await page.keyboard.press('Enter')

    // 計算実行
    await page.click('[data-testid="calculate-button"]')

    // 計算完了を待機（最大30秒）
    await expect(page.locator('[data-testid="result-summary"]')).toBeVisible({ timeout: 30000 })

    // 結果が表示されることを確認
    const totalPlates = await page.locator('[data-testid="total-plates"]').textContent()
    expect(parseInt(totalPlates || '0')).toBeGreaterThan(0)

    const averageYield = await page.locator('[data-testid="average-yield"]').textContent()
    expect(parseFloat(averageYield || '0')).toBeGreaterThan(0)

    // 配置図が表示されることを確認
    await expect(page.locator('[data-testid="placement-diagram"]')).toBeVisible()

    // スクリーンショットを保存（ビジュアルリグレッション用）
    await page.screenshot({
      path: 'e2e/screenshots/calculation-result.png',
      fullPage: true,
    })
  })

  test('GAを使った最適化', async ({ page }) => {
    // 製品を追加（省略）

    // GAオプションを有効化
    await page.click('[data-testid="use-ga-checkbox"]')

    // 計算実行
    await page.click('[data-testid="calculate-button"]')

    // GAの場合は時間がかかるので60秒待機
    await expect(page.locator('[data-testid="result-summary"]')).toBeVisible({ timeout: 60000 })

    // 歩留まりが向上していることを期待
    const yield = await page.locator('[data-testid="average-yield"]').textContent()
    expect(parseFloat(yield || '0')).toBeGreaterThan(70)
  })
})
```

---

### 3. テンプレート機能

```typescript
// e2e/calculation/template-usage.spec.ts
import { test, expect } from '@playwright/test'
import { loginAsTestUser } from '../fixtures/auth'

test.describe('テンプレート機能', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page)
  })

  test('製品テンプレートの保存と読み込み', async ({ page }) => {
    // 製品を追加
    await page.click('[data-testid="add-product-button"]')
    await page.fill('[data-testid="product-name-0"]', '製品A')
    await page.fill('[data-testid="product-width-0"]', '100')
    await page.fill('[data-testid="product-height-0"]', '200')
    await page.fill('[data-testid="product-quantity-0"]', '5')
    await page.keyboard.press('Enter')

    // テンプレートとして保存
    await page.click('[data-testid="save-template-button"]')
    await page.fill('[data-testid="template-name"]', 'テストテンプレート')
    await page.fill('[data-testid="template-description"]', 'E2Eテスト用')
    await page.click('[data-testid="save-template-confirm"]')

    // 保存成功メッセージを確認
    await expect(page.locator('text=テンプレートを保存しました')).toBeVisible()

    // 製品リストをクリア
    await page.click('[data-testid="clear-products-button"]')

    // テンプレートを読み込み
    await page.click('[data-testid="templates-tab"]')
    await page.click('[data-testid="template-テストテンプレート"]')

    // 製品が復元されることを確認
    await expect(page.locator('[data-testid="product-name-0"]')).toHaveValue('製品A')
  })
})
```

---

### 4. 設定画面

```typescript
// e2e/settings/settings-save.spec.ts
import { test, expect } from '@playwright/test'
import { loginAsTestUser } from '../fixtures/auth'

test.describe('設定画面', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page)
  })

  test('設定の変更と保存', async ({ page }) => {
    // 設定画面に移動
    await page.click('[data-testid="settings-link"]')
    await expect(page).toHaveURL('/settings')

    // デフォルト元板サイズを変更
    await page.fill('[data-testid="default-plate-width"]', '1200')
    await page.fill('[data-testid="default-plate-height"]', '2400')

    // 保存ボタンをクリック
    await page.click('[data-testid="save-settings-button"]')

    // ホーム画面に戻る（フルリロード）
    await page.waitForURL('/')

    // 設定が反映されていることを確認
    const plateWidth = await page.locator('[data-testid="plate-width"]').inputValue()
    expect(plateWidth).toBe('1200')
  })
})
```

---

### 5. 編集モード

```typescript
// e2e/edit-mode/drag-and-drop.spec.ts
import { test, expect } from '@playwright/test'
import { loginAsTestUser } from '../fixtures/auth'

test.describe('編集モード - ドラッグ&ドロップ', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page)
    // 計算済みの状態を作る（省略）
  })

  test('製品を仮置き場に移動', async ({ page }) => {
    // 編集モードを開始
    await page.click('[data-testid="edit-mode-button"]')

    // 製品をクリック
    const product = page.locator('[data-testid="product-placement-0"]')
    await product.click()

    // 仮置き場に移動されることを確認
    await expect(page.locator('[data-testid="staging-area"]')).toContainText('製品A')

    // 歩留まりが再計算されることを確認
    const yield = await page.locator('[data-testid="pattern-yield"]').textContent()
    expect(parseFloat(yield || '0')).toBeGreaterThan(0)
  })

  test('Undo/Redo機能', async ({ page }) => {
    await page.click('[data-testid="edit-mode-button"]')

    // 製品を仮置き場に移動
    await page.locator('[data-testid="product-placement-0"]').click()

    // Undoボタンをクリック
    await page.click('[data-testid="undo-button"]')

    // 製品が元の位置に戻ることを確認
    await expect(page.locator('[data-testid="product-placement-0"]')).toBeVisible()

    // Redoボタンをクリック
    await page.click('[data-testid="redo-button"]')

    // 製品が再び仮置き場に移動することを確認
    await expect(page.locator('[data-testid="staging-area"]')).toContainText('製品A')
  })
})
```

---

## Fixtures（共通処理）

### 認証ヘルパー

```typescript
// e2e/fixtures/auth.ts
import { Page } from '@playwright/test'

export async function loginAsTestUser(page: Page) {
  await page.goto('/login')
  await page.fill('input[type="email"]', 'test@cutoptimizer.local')
  await page.fill('input[type="password"]', 'test-password')
  await page.click('button[type="submit"]')
  await page.waitForURL('/')
}

export async function logout(page: Page) {
  await page.click('[data-testid="settings-link"]')
  await page.click('[data-testid="logout-button"]')
  await page.waitForURL('/login')
}
```

---

## ビジュアルリグレッションテスト

### スクリーンショット比較

```typescript
// e2e/visual/placement-diagram.spec.ts
import { test, expect } from '@playwright/test'
import { loginAsTestUser } from '../fixtures/auth'

test.describe('ビジュアルリグレッション', () => {
  test('配置図のスクリーンショット比較', async ({ page }) => {
    await loginAsTestUser(page)

    // 固定された製品データで計算
    // （省略）

    // 配置図のスクリーンショットを撮って比較
    const diagram = page.locator('[data-testid="placement-diagram"]')
    await expect(diagram).toHaveScreenshot('placement-diagram.png', {
      maxDiffPixels: 100, // 許容する差分ピクセル数
    })
  })
})
```

---

## 実行方法

### 全テスト実行

```bash
# 全ブラウザで実行
npx playwright test

# 特定のブラウザのみ
npx playwright test --project=chromium

# 特定のテストファイルのみ
npx playwright test e2e/calculation/basic-flow.spec.ts
```

### UIモード（デバッグに便利）

```bash
npx playwright test --ui
```

### レポート確認

```bash
# HTMLレポートを開く
npx playwright show-report
```

### トレース確認（失敗時）

```bash
# トレースビューアーで確認
npx playwright show-trace trace.zip
```

---

## CI/CD統合

### GitHub Actions

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npx playwright test
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

---

## ベストプラクティス

### 1. data-testid属性を使う

```tsx
// ❌ Bad: CSSセレクターに依存
await page.click('button.btn-primary:nth-child(2)')

// ✅ Good: data-testid属性を使う
await page.click('[data-testid="calculate-button"]')
```

### 2. waitForを適切に使う

```typescript
// ❌ Bad: 固定時間待機
await page.waitForTimeout(5000)

// ✅ Good: 条件を満たすまで待機
await expect(page.locator('[data-testid="result"]')).toBeVisible({ timeout: 30000 })
```

### 3. テストデータを固定する

```typescript
// ❌ Bad: ランダムなデータ
const productName = `製品${Math.random()}`

// ✅ Good: 固定されたデータ
const productName = 'テスト製品A'
```

### 4. Page Object Modelを使う

```typescript
// e2e/pages/CalculationPage.ts
export class CalculationPage {
  constructor(private page: Page) {}

  async addProduct(name: string, width: number, height: number, quantity: number) {
    await this.page.click('[data-testid="add-product-button"]')
    await this.page.fill('[data-testid="product-name"]', name)
    // ...
  }

  async calculate() {
    await this.page.click('[data-testid="calculate-button"]')
    await this.page.waitForSelector('[data-testid="result-summary"]')
  }
}
```

---

## トラブルシューティング

### テストが不安定（フレーク）

- `waitFor` のタイムアウトを増やす
- `retry` を設定する
- ネットワーク待機を追加

### スクリーンショットが一致しない

- 固定されたデータを使う
- アニメーションを無効化
- タイムスタンプを除外

### CI でのみ失敗する

- ローカルとCIのブラウザバージョンを統一
- タイムゾーンの違いに注意
- `--headed` モードで確認

---

## 参考資料

- [Playwright 公式ドキュメント](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Next.js with Playwright](https://nextjs.org/docs/testing#playwright)

---

**最終更新**: 2025年12月26日
**次回更新予定**: テスト実装完了時
