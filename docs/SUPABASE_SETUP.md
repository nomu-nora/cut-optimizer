# Supabase セットアップガイド

## 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセスして、アカウントを作成またはログインします
2. 「New Project」をクリックします
3. プロジェクト情報を入力します:
   - **Name**: `cut-optimizer` (任意の名前)
   - **Database Password**: 安全なパスワードを設定（保存しておいてください）
   - **Region**: `Northeast Asia (Tokyo)` を推奨
4. 「Create new project」をクリックします（数分かかります）

## 2. データベーススキーマの作成

1. Supabaseダッシュボードで、左サイドバーの **SQL Editor** をクリックします
2. 「New query」をクリックします
3. `/supabase/migrations/001_initial_schema.sql` の内容をコピーして貼り付けます
4. 「Run」をクリックしてSQLを実行します
5. 「Success. No rows returned」と表示されればOKです

## 3. Google OAuth の設定（オプション）

Google OAuth を使用する場合:

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセスします
2. 新しいプロジェクトを作成するか、既存のプロジェクトを選択します
3. 「APIとサービス」→「認証情報」に移動します
4. 「認証情報を作成」→「OAuthクライアントID」を選択します
5. アプリケーションの種類: 「ウェブアプリケーション」
6. 承認済みのリダイレクトURIに以下を追加:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```
   （`your-project-ref` は Supabase プロジェクトの Ref ID に置き換えてください）
7. クライアントIDとクライアントシークレットをコピーします
8. Supabaseダッシュボードで、「Authentication」→「Providers」→「Google」を選択
9. 「Enable Google provider」をオンにします
10. Google Cloud Consoleで取得したクライアントIDとシークレットを入力します
11. 「Save」をクリックします

## 4. APIキーの取得

1. Supabaseダッシュボードで、左サイドバーの **Settings** (歯車アイコン) をクリックします
2. 「API」を選択します
3. 以下の情報をコピーします:
   - **Project URL** (`https://your-project-ref.supabase.co`)
   - **anon public** key (`eyJ...` で始まる長い文字列)

## 5. 環境変数の設定

1. プロジェクトのルートディレクトリに `.env.local` ファイルを作成します
2. 以下の内容を貼り付けます:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

3. `your-project-ref` と `your-anon-key-here` を実際の値に置き換えます

## 6. テストユーザーの作成

開発環境でテストする場合:

1. Supabaseダッシュボードで、「Authentication」→「Users」に移動します
2. 「Add user」→「Create new user」をクリックします
3. 以下の情報を入力します:
   - **Email**: `test@cutoptimizer.local`
   - **Password**: `test-password-dev-only`
   - **Auto Confirm User**: オンにする
4. 「Create user」をクリックします

これで、ログインページの「テストユーザーでログイン」ボタンが使えるようになります。

## 7. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスします。
自動的にログインページ (`/login`) にリダイレクトされます。

## 8. 動作確認

1. `/signup` で新規ユーザーを作成します
2. メールに確認リンクが送信されます（Supabaseの設定でメール確認をスキップすることも可能）
3. `/login` でログインします
4. ログインに成功すると `/` （メインページ）にリダイレクトされます

## トラブルシューティング

### 「Invalid API key」エラー

- `.env.local` のAPIキーが正しいか確認してください
- 開発サーバーを再起動してください (`Ctrl+C` → `npm run dev`)

### Google OAuthが動作しない

- Google Cloud ConsoleでリダイレクトURIが正しく設定されているか確認してください
- Supabaseの Google Provider 設定が有効になっているか確認してください

### データベースエラー

- SQL Editorでスキーマが正しく実行されたか確認してください
- Supabaseダッシュボードの「Table Editor」でテーブルが作成されているか確認してください

### ログイン後に `/` にリダイレクトされない

- ミドルウェアが正しく動作しているか確認してください
- ブラウザのコンソールでエラーが出ていないか確認してください

## 次のステップ

Phase 1（認証基盤）が完了しました！次は Phase 2（ユーザー設定）の実装に進みます。

詳細は `/Users/nomurakohei/.claude/plans/quizzical-dreaming-sonnet.md` を参照してください。
