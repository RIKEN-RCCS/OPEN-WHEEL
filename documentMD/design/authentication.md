# 認証・認可

## 1. 概要

WHEELの認証機能は **オプション** であり、`enableAuth` フラグで有効/無効を切り替える。
デフォルトは無効（匿名アクセス可）。

| 設定 | 説明 |
|------|------|
| `enableAuth: false`（デフォルト） | 認証なし。誰でもアクセス可能。 |
| `enableAuth: true` | ユーザー名・パスワードによるログイン必須。 |

## 2. 認証スタック

認証には以下のパッケージを使用する。

| パッケージ | 役割 |
|-----------|------|
| `passport` | 認証フレームワーク |
| `passport-local` | ユーザー名/パスワード認証ストラテジー |
| `connect-ensure-login` | 未ログイン時のリダイレクト |
| `connect-sqlite3` | セッションストア（SQLite） |
| `express-session` | セッション管理 |

## 3. ユーザーデータベース

### スキーマ（SQLite）

```sql
CREATE TABLE IF NOT EXISTS users (
  id          INT  PRIMARY KEY,   -- UUID (crypto.randomUUID)
  username    TEXT UNIQUE,        -- ユーザー名
  hashed_password BLOB,           -- PBKDF2ハッシュ済みパスワード
  salt        BLOB                -- ランダムソルト（16バイト）
);
```

### ファイルパス

```
${WHEEL_USER_DB_DIR}/user.db
```

`WHEEL_USER_DB_DIR` 未設定の場合は `server/app/db/user.db` に作成される。

### パスワードハッシュ化

PBKDF2（SHA-512）を使用する。

```javascript
crypto.pbkdf2(password, salt, 210000, 32, "sha512")
```

- 反復回数: **210,000回**
- 出力長: 32バイト
- アルゴリズム: SHA-512
- ソルト: `crypto.randomBytes(16)` で生成（ユーザーごとに一意）

パスワード検証には `crypto.timingSafeEqual` を使用し、タイミング攻撃を防ぐ。

### ユーザー管理API（`server/app/core/auth.js`）

| 関数 | 説明 |
|------|------|
| `initialize()` | DBを開き、テーブルを作成する（初回のみ） |
| `addUser(username, password)` | ユーザーを追加する（重複時はエラー） |
| `isValidUser(username, password)` | 認証を検証し、成功時はユーザーデータを返す |
| `listUser()` | 全ユーザー名の配列を返す |
| `delUser(username)` | ユーザーを削除する |

ユーザー管理は `passwordDBTool.js`（CLIツール）から呼び出す。

## 4. ログインフロー

```
クライアント → POST /login （username, password）
    ↓
passport-local ストラテジー
    ↓
auth.isValidUser(username, password)
    ↓ 成功
セッションにユーザー情報を保存（passport.session）
    ↓
リダイレクト → アプリケーション画面
    ↓ 失敗
リダイレクト → ログイン画面（エラーメッセージ表示）
```

### セッション管理

セッションは SQLite に永続化される。

```
${WHEEL_SESSION_DB_DIR}/session.db
```

`WHEEL_SESSION_DB_DIR` 未設定の場合は `server/app/db/session.db`。
`WHEEL_CLEAR_SESSION_DB` 環境変数が設定されている場合、起動時にセッションDBを削除してクリアする。

## 5. Socket.IO の認証保護

`enableAuth` 有効時は、Socket.IO の全イベントハンドラに `ensureLoggedIn` チェックが適用され、
未認証の場合はエラーレスポンスを返す。

## 6. IPアドレスフィルタリング

`acceptAddress` を設定すると、指定したIPアドレスのみアクセスを許可する。
`express-ipfilter` ミドルウェアが Express の最初のスタックとして適用される。

```json
{
  "acceptAddress": "192.168.1.100"
}
```

`null`（デフォルト）の場合は全IPからのアクセスを許可する。

## 7. Web API 認証（OAuth2）

`enableWebApi: true` のとき、OAuth2ベースのWeb API認証が有効になる。
詳細は `server/app/core/webAPI.js` および `server/app/core/jwtServerPassphraseManager.js` を参照。

リモートホストとの認証には JWT（JSON Web Token）を使用しており、
`jwtServerPassphraseManager.js` がパスフレーズを管理する。

## 8. セキュリティ上の注意事項

- 本番環境では必ず `enableAuth: true` を設定し、HTTPS を使用すること
- セッションシークレットは `"wheel"` にハードコードされているため、
  機密性の高い環境では変更を検討すること
- `acceptAddress` によるIPフィルタリングと組み合わせることで、
  アクセスを特定のホストに限定できる
