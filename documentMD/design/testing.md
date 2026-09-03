# テスト戦略

## 1. テスト構成の概要

OPEN-WHEELのテストは2つのカテゴリに分かれる。

| 種別 | 対象 | フレームワーク | ディレクトリ |
|------|------|--------------|------------|
| サーバーサイド単体テスト (UT) | サーバーJSモジュール | Mocha + Chai + Sinon | `server/test/` |
| E2Eテスト | UI全体 | Cypress | `test/cypress/e2e/` |

---

## 2. サーバーサイド単体テスト

### 概要

- テストフレームワーク: Mocha + Chai + Sinon
- テストファイル: `server/test/app/` 以下（70ファイル超）
- SSH接続テストには `naoso5/openpbs` Dockerイメージをリモートホストとして使用

### 実行コマンド

```bash
npm run test -w server
```

これは以下を順番に実行する:
1. `setup.sh` — SSHテストサーバー（Docker）を起動、テスト用設定ファイルを生成
2. Mocha でテストを実行
3. `teardown.sh` — Dockerコンテナを停止・クリーンアップ

> **注意**: Dockerが起動している必要がある。数十分かかることがある。

### 特定ファイルのみを実行（デバッグ時）

```bash
cd server
npm run UT:setup
npx mocha test/app/core/specificModule.js
npm run UT:teardown
```

`only` モディファイアを使用して特定テストのみ実行することも可能だが、
最終チェック前に `only` を必ず削除すること。

### テストのディレクトリ構成

```
server/test/
├── app/
│   ├── core/          # コアロジックのUT（dispatcher, db, migrationHelper等）
│   ├── handlers/      # ハンドラのUT
│   └── utils/         # ユーティリティのUT
└── test_setting*.txt  # テスト用設定ファイル（gitignore）
```

### 新しい単体テストの書き方

```js
import { strict as assert } from "node:assert";
import { stub, restore } from "sinon";

describe("myModule", () => {
  afterEach(() => {
    restore();
  });

  it("should do something", async () => {
    // Sinonでモジュールをスタブ
    const stubFn = stub(dependency, "method").resolves("expected");

    const result = await myFunction("input");
    assert.equal(result, "expected");
    assert(stubFn.calledOnce);
  });
});
```

**注意点:**
- `assert.strict` または `assert` （strict mode）を使用する
- 非同期関数は `async/await` で書く
- `sinon.stub` → `sinon.restore` を `afterEach` で必ず呼ぶ
- `only` を本番テストに残さない（CI失敗の原因になる）

### テスト環境変数

| 変数 | 説明 | デフォルト |
|------|------|-----------|
| `WHEEL_TEST_REMOTEHOST` | テスト用リモートホスト名 | `testServer` |
| `WHEEL_TEST_REMOTE_PASSWORD` | リモートホストパスワード | `passw0rd` |
| `WHEEL_CONFIG_DIR` | WHEEL設定ディレクトリパス | setup.shが自動生成 |
| `NODE_ENV` | Node環境 | `test` |
| `WHEEL_LOG_LEVEL` | ログレベル | `OFF` |

---

## 3. E2Eテスト

### 概要

- テストフレームワーク: Cypress
- テストファイル: `test/cypress/e2e/` 以下
- WHEELサーバーに対してブラウザ操作を自動化してテスト

### アーキテクチャ（モックサーバーモード）

```
Cypress（テスト）
    ↓ HTTP / WebSocket
Gateway (port 3001) ← ws-gateway.cjs
    ├─ Socket.IO → Mock SIO Server (port 3101) ← mock_server/server.js
    ├─ HTTP API  → Mock HTTP Server (port 3102) ← @mocks-server/main
    └─ その他    → WHEEL App (port 8089)
```

Gateway が Socket.IO と HTTP を振り分けることで、WHEELの実際の動作とモックを組み合わせたテストが可能。

### 実行コマンド

| モード | コマンド | 説明 |
|--------|---------|------|
| モックサーバー（標準） | `npm run test:e2e:mock` | Docker Compose で起動、モックあり |
| 非モック | `npm run test:e2e` | Docker Compose で起動、モックなし |
| リモート | `npm run test:e2e:remote` | 既存サーバーに対してテスト |
| インタラクティブ | `npm run test` | 開発中のデバッグ用 |

### 実行前の準備

```bash
cd test
npm install
npx cypress install
```

### 新しいE2Eテストの書き方

```js
describe("My Feature", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("should show the home page", () => {
    cy.contains("WHEEL").should("be.visible");
  });
});
```

### テスト出力

| ディレクトリ | 内容 |
|------------|------|
| `test/cypress/screenshots/` | 失敗時のスクリーンショット |
| `test/cypress/videos/` | テスト実行動画 |

---

## 4. CI/CD（GitHub Actions）

### サーバーサイド単体テスト（`run_test.yml`）

```
トリガー: main以外の全ブランチへのpush
SSHテストサーバー: naoso5/openpbs（port 4000:22）
実行コマンド: npm run test（server/）
成功後: server/app/db/version.json を自動更新
```

### E2Eテスト（`run_cypress.yml`）

```
トリガー: main以外の全ブランチへのpush
SSHテストサーバー: naoso5/openpbs（GitHub Actionsサービス, port 4000:22）

Dockerコンテナ（4台, ネットワーク: wheel-e2e-net）:
  wheel      (port 8089): WHEELアプリ本体
  wheel_auth (port 8090): 認証機能が有効なWHEEL
  mock       (port 3101/3102): Socket.IOモック + HTTPモック
  gateway    (port 3001): リバースプロキシ

失敗時のアーティファクト:
  container-logs    : コンテナログ
  cypress-screenshots: 失敗時スクリーンショット
  cypress-videos    : テスト実行動画
```

---

## 5. トラブルシューティング

### UT: Docker が起動しない

```bash
docker info
```

### UT: SSHテストサーバーへの接続失敗

```bash
ssh-keygen -R 127.0.0.1
ssh-keygen -R '[127.0.0.1]:4000'
```

### E2E: モックサーバーが起動しない

```bash
cd test
docker compose down
lsof -i :3001 -i :3101 -i :3102
```

### E2E: Chromeが見つからない

```bash
cd test
npx cypress install
```
