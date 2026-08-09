# システムアーキテクチャ概要

## 1. 全体構成

WHEELは、科学技術計算ワークフローを管理・実行するWebアプリケーションである。
モノレポ構成で3つのパッケージから成り、それぞれ以下の役割を担う。

```
OpenWHEEL/
├── client/      クライアントサイド（Vue.js SPA）
├── server/      サーバーサイド（Node.js + Express + Socket.IO）
└── common/      クライアント・サーバー間で共有するコード
```

## 2. ディレクトリ構成

### server/

```
server/
└── app/
    ├── index.js              サーバーエントリーポイント
    ├── logSettings.js        ログ設定（log4js）
    ├── core/                 コアロジック（ワークフロー実行エンジン等）
    ├── db/                   設定・データ管理
    │   ├── db.js             設定ロード・エクスポート
    │   ├── server.json       デフォルト設定値
    │   ├── jobScheduler.json ジョブスケジューラ定義
    │   └── jsonSchemas.js    JSONスキーマ検証定義
    ├── routes/               Expressルーティング
    └── handlers/             Socket.IOイベントハンドラ
```

### client/

クライアントはVue.js（Vuetify UI）を使用したSPAである。
ビルド成果物は `server/app/public/` に出力され、Expressが静的ファイルとして配信する。

### common/

クライアントとサーバーで共有するユーティリティ（定数定義、バリデーションヘルパー等）が含まれる。

## 3. サーバー起動シーケンス

`server/app/index.js` を起点として、以下の順序で初期化が行われる。

```
1. db.js ロード（設定ファイル読み込み）
   └── runMigrations()        マイグレーション実行（旧設定ファイルの自動変換）
   └── loadWheelConfig()      c12 による設定マージ
   └── JsonArrayManager 初期化（remotehost.json, projectList.json 等）

2. logSettings.js ロード
   └── log4js の設定（コンソール・ファイル・Socket.IO アペンダー設定）

3. index.js 初期化
   ├── 必須コマンド存在確認（checkAllCommands）
   ├── セッションDB クリア（WHEEL_CLEAR_SESSION_DB 指定時）
   ├── Express アプリ生成
   ├── HTTP / HTTPS サーバー生成（useHttp フラグで切替）
   ├── Socket.IO サーバー生成
   ├── バージョン情報・環境変数ログ出力（aboutWheel）
   ├── ミドルウェア設定（CORS, JSON, Cookie, セッション, 認証）
   ├── Socket.IO 接続ハンドラ登録（registerHandlers）
   ├── Expressルート登録（ログイン, ファイルアップロード, 静的ファイル等）
   └── サーバー起動（listen）
```

## 4. Express + Socket.IO 構成

### HTTP/HTTPS サーバー

| 設定項目 | デフォルト | 説明 |
|----------|-----------|------|
| `useHttp` | `false` | `true` の場合 HTTP（ポート80相当）、`false` の場合 HTTPS |
| `port` | `8089` | リスンポート番号 |
| `acceptAddress` | `null` | バインドするIPアドレス（null の場合は全インターフェース） |

HTTPS の場合、`server.key` と `server.crt` を設定ファイル検索パスから読み込む。

### Express ミドルウェアスタック（順序）

1. `IpFilter`（`acceptAddress` 設定時のみ）— IPアドレスによるアクセス制限
2. `cors()` — クロスオリジン設定
3. `express.json()` / `express.urlencoded()` — リクエストボディパース
4. `cookieParser()` — クッキーパース
5. `Siofu.router` — Socket.IO ファイルアップロード（socketio-file-upload）
6. `session()` — セッション管理（connect-sqlite3 バックエンド）
7. `passport.*`（`enableAuth` 有効時）— 認証ミドルウェア

### Socket.IO 接続ハンドラ

クライアントが Socket.IO で接続すると、`socket.handshake.auth.projectRootDir` に基づいてルームに参加する。
プロジェクトルートディレクトリが指定されている場合はそのディレクトリ名のルームへ、
未指定の場合は `"default"` ルームへ参加する。

全イベントに対して `prependAny` ハンドラが登録されており、
`siofu_*` プレフィックス以外のイベントはサーバーサイドでログに記録される。

## 5. クライアント・サーバー間通信

WHEELはほぼ全ての機能を **Socket.IO** 経由で実装する。REST APIはログインとファイルアップロードのみ。

### Socket.IO イベント方向

| 方向 | 説明 |
|------|------|
| クライアント → サーバー | 操作要求（プロジェクト操作、ワークフロー編集、実行制御等） |
| サーバー → クライアント | 状態更新（ログ、タスク状態、ファイルリスト等） |

### 主なサーバー → クライアント通知イベント

| イベント名 | 内容 |
|-----------|------|
| `WHEEL_LOG` | ワークフロー実行ログ（INFO/ERROR/stdout/stderr/SSH出力） |
| `projectState` | プロジェクト実行状態の変化通知 |
| `taskStateList` | タスク状態一覧の更新 |
| `fileList` | ファイルリストの更新 |
| `projectList` | プロジェクト一覧の更新 |

詳細なAPIリファレンスは [APIGuide.md](./APIGuide.md) を参照。

## 6. モジュール依存関係（概略）

```
index.js
  ├── db/db.js           ← 設定値・定数のハブ（全モジュールが参照）
  ├── logSettings.js     ← ログAPI（db.jsの設定を参照）
  ├── core/global.js     ← グローバル状態（baseURL, Socket.IOインスタンス）
  ├── handlers/          ← Socket.IOイベントハンドラ群
  │   └── core/dispatcher.js ← ワークフロー実行エンジン（最も複雑なモジュール）
  └── routes/            ← Expressルート（ログイン、ファイルアップロード等）
```

`db/db.js` は設定値の唯一のソースとして機能し、ほぼ全てのモジュールがここから
設定をインポートする。直接 `process.env` を読んではならない（インフラ系変数を除く）。

## 7. データフロー概略

```
ユーザー操作（ブラウザ）
    ↓ Socket.IO イベント
handlers/ （イベントハンドラ）
    ↓ 実行指示
core/dispatcher.js （ワークフロー実行エンジン）
    ├── ローカルタスク実行
    │   └── executerManager.js → child_process
    └── リモートタスク実行
        └── executerManager.js → sshManager → SSH接続
            └── transferManager → transferrer → rsync/SCP
```

## 8. 主要な設定ファイル

| ファイル | 場所 | 説明 |
|---------|------|------|
| `server.json` | 設定検索パス | サーバー動作設定 |
| `remotehost.json` | 設定検索パス | リモートホスト定義 |
| `jobScheduler.json` | 設定検索パス | ジョブスケジューラコマンド定義 |
| `jobScriptTemplate.json` | 設定検索パス | ジョブスクリプトテンプレート |
| `projectList.json` | 設定検索パス | 管理対象プロジェクト一覧 |
| `user.db` | `WHEEL_USER_DB_DIR` or `server/app/db/` | ユーザー認証DB（SQLite） |
| `session.db` | `WHEEL_SESSION_DB_DIR` or `server/app/db/` | セッションDB（SQLite） |

設定ファイルの検索順序については [configuration.md](./configuration.md) を参照。
