# 開発者向けオンボーディングガイド

## 1. 開発環境セットアップ

### 前提条件

| ツール | バージョン | 用途 |
|--------|-----------|------|
| Node.js | 20.x 以上 | サーバー・クライアント実行 |
| npm | 9.x 以上 | パッケージ管理（ワークスペース） |
| Docker | 最新安定版 | テスト用コンテナ |
| rsync | - | ファイル転送（必須コマンド） |
| git | - | バージョン管理 |

### 初期セットアップ

```bash
# リポジトリのクローン
git clone https://github.com/RIKEN-RCCS/OPEN-WHEEL.git
cd OPEN-WHEEL

# 依存パッケージのインストール（全ワークスペース）
npm install

# SSL証明書の作成（HTTPS使用時）
# 詳細は documentMD/design/self-signed_certification.md を参照
```

### クライアントのビルド

クライアントコードを変更した場合、または初回セットアップ時にビルドが必要。

```bash
npm run build -w client
```

ビルド成果物は `server/app/public/` に出力される。

### サーバーの起動（開発時）

```bash
# HTTPS用の自己署名証明書が必要
# ~/.wheel/server.key と ~/.wheel/server.crt を配置してから実行
npm start -w server

# または HTTP モードで起動（証明書不要）
WHEEL_USE_HTTP=true npm start -w server
```

## 2. プロジェクト構造

### モノレポ構成

```
OpenWHEEL/
├── package.json           ルートワークスペース定義
├── client/                クライアントサイド（Vue.js + Vuetify）
│   ├── src/
│   │   ├── components/    Vueコンポーネント
│   │   └── views/         ページビュー
│   └── package.json
├── common/                共有コード
│   └── （定数、ユーティリティ等）
├── server/                サーバーサイド（Node.js）
│   ├── app/
│   │   ├── index.js       エントリーポイント
│   │   ├── logSettings.js ログ設定
│   │   ├── core/          コアロジック（60+ファイル）
│   │   ├── db/            設定・データ管理
│   │   ├── handlers/      Socket.IOイベントハンドラ
│   │   └── routes/        Expressルート
│   ├── bin/               CLIツール（passwordDBTool等）
│   └── test/              サーバーサイドユニットテスト
├── test/                  E2Eテスト（Cypress）
│   └── cypress/
│       ├── e2e/           E2Eテストスペック
│       └── component/     Cypressコンポーネントテスト
└── documentMD/            ドキュメント
    ├── design/            設計ドキュメント（本ファイルのディレクトリ）
    └── user_guide/        ユーザーガイド
```

### server/app/core/ のモジュール分類

| カテゴリ | ファイル | 説明 |
|---------|---------|------|
| **実行エンジン** | `dispatcher.js` | ワークフロー実行の中核 |
| | `executerManager.js` | ジョブ実行管理 |
| | `executer.js` | ステージイン/アウト実行 |
| | `jobManager.js` | ジョブ投入・状態管理 |
| **ファイル転送** | `sshManager.js` | SSH接続プール |
| | `transferManager.js` | 転送キュー管理 |
| | `transferrer.js` | 転送実行 |
| | `deliverFile.js` | ファイル配信ロジック |
| | `rsync.js` | rsyncラッパー |
| **コンポーネント** | `componentOperations.js` | CRUD操作 |
| | `componentState.js` | 状態管理 |
| | `componentFiles.js` | ファイル処理 |
| | `componentLinks.js` | リンク管理 |
| | `workflowComponent.js` | コンポーネントモデル定義 |
| **ループ・PS** | `loopUtils.js` | ループ制御ユーティリティ |
| | `parameterParser.js` | パラメータ空間解析 |
| | `psUtils.js` | PS補助関数 |
| **プロジェクト** | `projectOperations.js` | プロジェクト管理 |
| | `projectController.js` | 実行制御 |
| | `gitOperator2.js` | Git操作 |
| **認証・設定** | `auth.js` | ユーザー認証DB |
| | `webAPI.js` | OAuth2 |
| | `jwtServerPassphraseManager.js` | JWT管理 |
| **外部連携** | `gfarmOperator.js` | GFarm操作 |
| | `webhook.js` | Webhook設定 |
| **ユーティリティ** | `fileUtils.js`, `pathUtils.js`, `taskUtil.js` 等 | 共通ユーティリティ |
| **バリデーション** | `validateComponents.js`, `taskValidator.js` 等 | 入力検証 |

## 3. コーディング規約

### 必須ルール
1. コード変更後は必ずlintを実行する
2. 関数には JSDoc コメントを付ける
3. `server/app/db/version.json` は変更しない（GitHub Workflowが自動更新）

### 実装スタイル

- **async/await** スタイルで記述する（`Promise.then()` を使わない）
- **try/catch** で全ての非同期関数のエラーを処理する
- ログには **debugモジュール** ではなく `logSettings.js` の関数を使用する
- 一時デバッグ用の `console.log` はコミット前に必ず削除する
- 環境変数は `process.env` から直接読まず、`db.js` からインポートする

### ログの書き方

```javascript
import { logInfo, logWarn, logError, logDebug, logStdout, logStderr } from "../logSettings.js";

// 第1引数: projectRootDir（プロジェクトルートパス）
// 第2引数: componentDir（コンポーネントディレクトリパス）
// 第3引数以降: メッセージ
logInfo(projectRootDir, componentDir, "処理開始:", target.name);
logError(projectRootDir, componentDir, "エラー発生:", err);
```

### JSDoc コメントの書き方

```javascript
/**
 * 関数の説明を日本語または英語で記述する。
 * @param {string} projectRootDir - プロジェクトルートディレクトリ
 * @param {object} options - オプション設定
 * @returns {Promise<boolean>} - 成功時 true
 */
async function myFunction(projectRootDir, options) {
  try {
    // 実装
  } catch (e) {
    logError(projectRootDir, null, "エラー:", e);
    throw e;
  }
}
```

## 4. 新しいコンポーネントタイプの追加手順

新しいコンポーネントタイプを追加する場合、以下のファイルを変更する。

### 1. コンポーネントモデルの定義（workflowComponent.js）

新しいコンポーネントクラスを定義し、プロパティのデフォルト値を設定する。

### 2. ディスパッチハンドラの追加（dispatcher.js）

`_cmdFactory()` メソッドに新しいタイプのケースを追加し、
対応するハンドラメソッド（`_myNewHandler`）を実装する。

### 3. コンポーネントタイプバリデーター（componentTypeValidator.js）

有効なコンポーネントタイプのリストを更新する。

### 4. JSONスキーマ（db/jsonSchemas.js）

新しいプロパティのスキーマを定義する。

### 5. Socket.IOハンドラ（handlers/）

クライアントからの操作を受け付けるハンドラを追加する。

### 6. クライアントUI（client/src/components/）

コンポーネントのプロパティパネルを実装する。

### 7. テストの追加

- `server/test/app/core/dispatcher.js` にユニットテストを追加
- `test/cypress/component/` にコンポーネントテストを追加
- `test/cypress/e2e/` にE2Eテストを追加

### 8. ドキュメントの更新

- `documentMD/design/design.md` にコンポーネントの設計を追記
- `documentMD/user_guide/_reference/4_component/` にユーザーガイドを追加（JP/EN両方）
- `documentMD/user_guide/_reference/4_component/index.md` と `index.en.md` にリンクを追加

## 5. テストの実行

### リント

```bash
npm run lint -w server
npm run lint -w client
```

### サーバーサイドユニットテスト

```bash
# 全テスト（Dockerが必要）
npm run test -w server

# 特定ファイルのみ（デバッグ時）
# .only を使用して対象テストを絞る（コミット前に必ず .only を削除）
```

### E2Eテスト

```bash
npm run test:e2e:mock -w test
```

詳細は [testing.md](./testing.md) および `TEST_GUIDE.md` を参照。
