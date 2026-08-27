# 設定システムリファレンス

## 1. 概要

WHEELの設定は **c12** ライブラリを使用してロードされ、複数のソースをマージする。
優先順位は高い順に以下のとおり。

```
優先度（高）
  1. WHEEL_* 環境変数（WHEEL_CONFIG_DIR, WHEEL_TEMPD 等のインフラ変数を除く）
  2. WHEEL_CONFIG_DIR/server.json
  3. ~/.wheel/server.json
  4. server/app/db/server.json（パッケージデフォルト）
優先度（低）
```

空文字列・空白のみの `WHEEL_*` 環境変数はマージ対象から除外され（§5 の coerce 参照）、
下位のソース（設定ファイル・デフォルト）の値がそのまま使われる。
非空であれば `0` や `false` も有効な上書き値として扱われる。

## 2. 設定ファイル検索パス

設定ファイルは `getConfigFile()` 関数が以下の順序で検索する。

| 順序 | パス | 説明 |
|------|------|------|
| 1 | `$WHEEL_CONFIG_DIR/{filename}` | 環境変数で指定したディレクトリ |
| 2 | `~/.wheel/{filename}` | ユーザーホームディレクトリ |
| 3 | `server/app/db/{filename}` | パッケージ同梱のデフォルト |

`server.json` の場合: 存在しなければ検索順位1または2のディレクトリに新規作成される。
`server.key`, `server.crt` の場合: 見つからなければ起動エラー（HTTPS使用時）。

## 3. server.json プロパティ一覧

| プロパティ | 型 | デフォルト | 説明 |
|-----------|----|-----------|----|
| `port` | number | `8089` | リスンポート番号 |
| `useHttp` | boolean | `false` | `true` にすると HTTPS の代わりに HTTP を使用 |
| `acceptAddress` | string \| null | `null` | バインドするIPアドレス（null で全インターフェース） |
| `numLocalJob` | number | `1` | ローカルタスクの最大同時実行数 |
| `numLogFiles` | number | `5` | ログファイルのバックアップ数 |
| `maxLogSize` | number | `8388608` | ログファイルの最大サイズ（バイト、デフォルト8MB） |
| `compressLogFile` | boolean | `true` | ログファイルを圧縮するか |
| `logLevel` | string | `"debug"` | ログレベル（下記参照） |
| `verboseSsh` | boolean | `false` | SSH通信の詳細ログを出力するか |
| `enableAuth` | boolean | `false` | ユーザー認証を有効にするか |
| `enableWebApi` | boolean | `false` | Web API（OAuth2）を有効にするか |
| `baseURL` | string | `""` | サーバーのベースURL（リバースプロキシ配下の場合に設定） |
| `defaultTaskRetryCount` | number | `1` | タスクのデフォルト再試行回数 |
| `defaultCleanupRemoteRoot` | boolean | `true` | リモート実行後のクリーンアップデフォルト値 |
| `gitLFSSize` | number | `200` | Git LFS管理の閾値（MB） |
| `rootDir` | string | `~` | プロジェクトルートのデフォルトディレクトリ |
| `logFilename` | string | `"wheel.log"` | ログファイル名 |
| `remotehostJsonFile` | string | `"remotehost.json"` | リモートホスト設定ファイル名 |
| `jobScriptTemplateJsonFile` | string | `"jobScriptTemplate.json"` | ジョブスクリプトテンプレートファイル名 |
| `projectListJsonFile` | string | `"projectList.json"` | プロジェクト一覧ファイル名 |
| `credentialFilename` | string | `"credentials.json"` | 認証情報ファイル名 |

### ログレベルの有効値

`ALL`, `TRACE`, `DEBUG`, `INFO`, `WARN`, `ERROR`, `FATAL`, `MARK`, `OFF`
（大文字・小文字は問わない）

## 4. WHEEL_* 環境変数一覧

### 自動マッピング変数（`WHEEL_` プレフィックス → camelCase）

`WHEEL_` プレフィックスを持つ環境変数は、自動的に `server.json` プロパティへマッピングされる。
変換ルール: `WHEEL_XXX_YYY` → `xxxYyy`（UPPER_SNAKE_CASE → camelCase）

| 環境変数 | マッピング先 | 説明 |
|---------|------------|------|
| `WHEEL_PORT` | `port` | リスンポート番号 |
| `WHEEL_USE_HTTP` | `useHttp` | HTTP使用フラグ |
| `WHEEL_ACCEPT_ADDRESS` | `acceptAddress` | バインドIPアドレス |
| `WHEEL_NUM_LOCAL_JOB` | `numLocalJob` | ローカル同時実行数 |
| `WHEEL_LOG_LEVEL` | `logLevel` | ログレベル |
| `WHEEL_VERBOSE_SSH` | `verboseSsh` | SSH詳細ログ |
| `WHEEL_ENABLE_AUTH` | `enableAuth` | 認証有効化 |
| `WHEEL_ENABLE_WEB_API` | `enableWebApi` | Web API有効化 |
| `WHEEL_BASE_URL` | `baseURL` | ベースURL |

### インフラ変数（自動マッピング対象外）

以下の変数は起動処理で特別に扱われるため、`server.json` にはマッピングされない。

| 環境変数 | 説明 |
|---------|------|
| `WHEEL_CONFIG_DIR` | 設定ファイルの検索・保存先ディレクトリ |
| `WHEEL_TEMPD` | 一時ディレクトリのルート |
| `WHEEL_USER_DB_DIR` | ユーザーDB（`user.db`）の保存先ディレクトリ |
| `WHEEL_SESSION_DB_DIR` | セッションDB（`session.db`）の保存先ディレクトリ |
| `WHEEL_CLEAR_SESSION_DB` | 起動時にセッションDBを削除する（値は問わない） |
| `WHEEL_CERT_FILENAME` | SSL証明書ファイルパス（個別指定） |
| `WHEEL_CERT_PASSPHRASE` | SSL証明書パスフレーズ（個別指定） |

### Docker/entrypoint 専用変数

| 環境変数 | 説明 |
|---------|------|
| `WHEEL_GENERATE_KEYPAIR` | `YES` に設定するとSSH鍵ペアを自動生成 |
| `WHEEL_ANONYMOUS_LOGIN` | `YES` に設定すると匿名ログインユーザーを作成し認証を有効化 |
| `WHEEL_ANONYMOUS_PASSWORD` | 匿名ユーザーのパスワード（省略時はランダム生成） |

## 5. 型の自動変換（coerce）

環境変数はすべて文字列として渡されるため、以下のルールで自動変換される。

| 値 | 変換後 |
|----|--------|
| `"true"` | `true`（boolean） |
| `"false"` | `false`（boolean） |
| `""` / `"  "` | `undefined`（デフォルト値にフォールバック） |
| 数値文字列（`"8089"` 等） | `number` |
| その他の文字列 | `string`（そのまま） |

空文字列を設定した場合はデフォルト値が使用される点に注意。

## 6. 設定ファイルのエクスポートされる定数

`db.js` からエクスポートされる主な定数（コード内での参照用）。

| 定数名 | 説明 |
|--------|------|
| `suffix` | `.wheel`（WHEELファイルの拡張子） |
| `projectJsonFilename` | `prj.wheel.json` |
| `componentJsonFilename` | `cmp.wheel.json` |
| `statusFilename` | `status.wheel.txt` |
| `jobManagerJsonFilename` | `jm.wheel.json` |
| `filesJsonFilename` | `files.wheel.json` |
| `defaultPSconfigFilename` | `parameterSetting.json` |
| `rsyncExcludeOptionOfWheelSystemFiles` | WHEELシステムファイルのrsync除外オプション配列 |

## 7. マイグレーションヘルパー

サーバー起動時（`db.js` のロード時）に `migrationHelper.js` の `runMigrations()` が自動実行される。

### 機能

1. **server.json プロパティ名の自動リネーム**
   - `~/.wheel/server.json` と `$WHEEL_CONFIG_DIR/server.json` を対象に実行
   - 旧プロパティ名を新プロパティ名に書き換え、ファイルを上書き保存
   - `console.warn` で変更内容を通知

2. **非推奨環境変数の警告**
   - 廃止された環境変数が設定されている場合に `console.warn` で警告

### 現在の移行ルール

| 種別 | 旧 | 新 |
|------|----|----|
| server.json プロパティ | `numJobOnLocal` | `numLocalJob` |
| 環境変数 | `WHEEL_LOGLEVEL` | `WHEEL_LOG_LEVEL` |

> **注意**: `console.warn` を使用するのは、マイグレーションが `log4js` 初期化より前に実行されるため（循環依存を避けるため）。

## 8. その他の設定ファイル

### remotehost.json

リモートホストの定義を配列形式で記述する。スキーマは `server/app/db/remotehostJsonSchema.js` を参照。

### jobScheduler.json

ジョブスケジューラのコマンド定義。詳細は [JS.md](./JS.md) を参照。

### jobScriptTemplate.json

ジョブスクリプトテンプレートの定義。詳細は [JobScriptEditor.md](./JobScriptEditor.md) を参照。
