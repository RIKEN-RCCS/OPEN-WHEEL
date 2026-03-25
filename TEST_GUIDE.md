# テスト実行ガイド

## 概要

OPEN-WHEELのテストは以下の2種類があります。

| 種別 | 対象 | ディレクトリ |
|------|------|-------------|
| 単体テスト (UT) | サーバーサイドJS | `server/` |
| E2Eテスト | UI全体 (Cypress) | `test/` |

---

## 1. 単体テスト (UT)

### 1.1 概要

- テストフレームワーク: [Mocha](https://mochajs.org/) + [Chai](https://www.chaijs.com/) + [Sinon](https://sinonjs.org/)
- テストファイル: `server/test/app/` 以下 (70ファイル超)
- テスト対象: サーバーコアロジック、ハンドラー、ユーティリティ
- SSH接続テスト用のリモートホストとして `naoso5/openpbs` Dockerイメージを使用

### 1.2 前提条件

- Node.js 20.x
- Docker (SSHテストサーバー起動に必要)
- プロジェクトルートで `npm install` 済み

### 1.3 実行モード

| モード | コマンド | 説明 |
|--------|----------|------|
| ネイティブ | `npm run test` | Mochaをホストマシンで直接実行。SSHテストサーバーのみDockerで起動 |
| Docker | `npm run testDocker` | WHEELサーバーとテストをすべてDockerコンテナ内で実行 |
| カバレッジ | `npm run coverage` | ネイティブモードでカバレッジレポートを生成 |

### 1.4 ネイティブモード (ローカル実行)

```bash
npm run -w server test
```

内部では以下を順番に実行します:

1. `UT:setup` — `test/setup.sh` を実行
   - SSHテストサーバー (`wheel_release_test_server`) を Docker で起動
   - テスト用設定ファイル (`test/.env`) を生成
   - 接続先: `127.0.0.1:4000` (ローカル設定)
2. `UT:local` — Mocha でテストを実行
3. `UT:teardown` — `test/teardown.sh` でDocker停止・クリーンアップ

> **注意**: Dockerが起動している必要があります。

### 1.5 Dockerモード (ローカル実行)

```bash
npm run -w server testDocker
```

内部では以下を順番に実行します:

1. `UT:setupDocker` — `test/setup.sh test_setting_docker.txt` を実行
   - SSHテストサーバーをDocker Composeで起動
   - 接続先: `wheel_release_test_server:22` (コンテナ名解決)
2. `UT:docker` — WHEELコンテナ内でMochaを実行 (`server/test/compose.yml`)
3. `UT:teardown` — クリーンアップ

### 1.6 個別スクリプトを使った実行

セットアップとテストを分けて実行することもできます:

```bash
cd server

# ネイティブモード
npm run UT:setup
npm run UT:local
npm run UT:teardown

# 特定テストのみ
npm run UT:local -- --spec test/app/core/someModule.js

# Gfarmテストのみ実行
npm run UT:local-gfarm
```

### 1.7 GitHub Actions (CI)

#### Linux (`run_test.yml`)

ネイティブモードで実行。GitHub Actions サービスコンテナ (`naoso5/openpbs`) を SSHテストサーバーとして使用します。

```
トリガー: master以外の全ブランチへのpush
SSH テストサーバー: naoso5/openpbs (port 4000:22)
実行コマンド: npm run test (server/)
成功後: server/app/db/version.json を自動更新
```

#### Windows (`run_test_windows.yml`)

WSL2 + Docker環境でDockerモードを実行します。

```
トリガー: master以外の全ブランチへのpush
環境: Windows Server 2022 + WSL2 (Ubuntu 22.04)
実行コマンド: docker compose run --build wheel_release_test (server/test/)
```

---

## 2. E2Eテスト

### 2.1 概要

- テストフレームワーク: [Cypress](https://www.cypress.io/)
- テストファイル: `test/cypress/e2e/` 以下
- WHEELサーバーに対してブラウザ操作を自動化してテスト

### 2.2 アーキテクチャ (モックサーバーモード)

モックサーバーモードでは以下の3コンポーネントが連携します:

```
Cypress (テスト)
    ↓ HTTP/WebSocket
Gateway (port 3001) ← ws-gateway.cjs
    ├─ Socket.IO →  Mock SIO Server (port 3101) ← mock_server/server.js
    ├─ HTTP API  →  Mock HTTP Server (port 3102) ← @mocks-server/main
    └─ その他    →  WHEEL App (port 8089)
```

### 2.3 前提条件

```bash
# test/ ディレクトリで依存モジュールをインストール
cd test
npm install
npx cypress install
```

### 2.4 実行モード

| モード | コマンド | WHEELサーバー | モック | 主な用途 |
|--------|----------|--------------|--------|---------|
| 非モック | `npm run test:e2e` | Docker Compose で起動 | なし | モックなし全体テスト |
| モックサーバー (デフォルト) | `npm run test:e2e:mock` | Docker Compose で起動 | あり (Docker) | ローカル開発・標準テスト |
| Qualifying | `npm run test:e2e:qualifying` | 事前起動済みを使用 | なし | 既存サーバーへの評価テスト |
| インタラクティブ | `npm run test` | 手動で起動が必要 | 設定依存 | 開発中のデバッグ |

### 2.5 モックサーバーモード — ローカルデフォルト

```bash
npm run -w test test:e2e:mock
```

**フロー:**
1. `docker compose up -d --build` — WHEEL・Gateway・モックの3コンテナをビルドして起動
   - `wheel_release_test` (port 8089): WHEELアプリ本体
   - `mock` (port 3101/3102): Socket.IOモック + HTTPモック
   - `gateway` (port 3001): WHEELとモックへのリバースプロキシ
2. 各サービスの起動完了を待機 (`wait-on`)
3. `test:e2e:mock:run` — Cypress をヘッドレスモードで実行
4. `test:e2e:mock:stop` — `docker compose down` で全コンテナを停止

**個別スクリプト:**
```bash
npm run test:e2e:mock:start   # 全コンテナ起動 + 起動完了待機
npm run test:e2e:mock:run     # Cypressのみ実行
npm run test:e2e:mock:stop    # 全コンテナ停止
```

### 2.6 Qualifying モード — CI / 評価テスト

WHEELサーバーがすでに起動済みの場合に、モックを使わず実サーバーに対してそのままCypressを実行します。
`--env USE_MOCK=false` を渡すことで、Cypressが Gateway (port 3001) を経由せず、WHEELサーバーに直接接続します。

```bash
cd test
npm run test:e2e:qualifying
```

**フロー:**
1. Cypress をヘッドレスモードで実行 (`baseUrl: http://localhost:8089` に直接接続、モックなし)

> **注意**: WHEELサーバーが起動していない場合、Cypressの接続確認でタイムアウトします。

#### WHEELサーバーのアドレス・ポートを変更する

デフォルトの接続先は `http://localhost:8089` です。
別のホストやポートで動作するWHEELに対してテストする場合は、`CYPRESS_BASE_URL` 環境変数で上書きできます。

```bash
cd test

# 別ポートで動作するWHEELへのテスト
CYPRESS_BASE_URL=http://localhost:8090 npm run test:e2e:qualifying

# 別のホストで動作するWHEELへのテスト
CYPRESS_BASE_URL=http://your-wheel-server:8089 npm run test:e2e:qualifying
```

#### HTTPSで動作するWHEELに対してテストする

**有効な証明書 (Let's Encrypt等) の場合:** `CYPRESS_BASE_URL` をhttpsスキームで指定するだけで動作します。

```bash
cd test
CYPRESS_BASE_URL=https://your-wheel-server:8089 npm run test:e2e:qualifying
```

**自己署名証明書の場合:** ChromeがSSL証明書を拒否するため、`chromeWebSecurity=false` を追加する必要があります。

```bash
cd test
CYPRESS_BASE_URL=https://your-wheel-server:8089 \
  npx cypress run --browser chrome \
    --config "requestTimeout=300000,defaultCommandTimeout=300000,retries=2,chromeWebSecurity=false" \
    --env USE_MOCK=false
```

### 2.7 非モックモード

モックを使わずにDockerでWHEELを起動してテストします。

```bash
npm run -w test test:e2e
```

### 2.8 インタラクティブモード (開発時)

Cypress UIを開いてテストを個別に実行・デバッグできます。
あらかじめWHEELサーバーとモックサーバーを起動しておく必要があります。

```bash
# 別ターミナルでWHEELとモックを起動
cd test
npm run test:e2e:mock:start   # または test:e2e:qualifying:start

# Cypress UIを起動
npm run test       # npx cypress open
```

### 2.9 GFarm テスト

GFarm連携テストは専用の環境設定が必要です。

```bash
# GFarm用環境変数ファイルを用意
cp test/cypress/e2e/gfarm/gfarm-e2e.env.example test/cypress/e2e/gfarm/gfarm-e2e.env
# (ファイルを編集して接続情報を設定)

cd test
npm run test:e2e:gfarm        # ヘッドレス実行
npm run test:e2e:gfarm:open   # インタラクティブ実行
```

### 2.10 テスト実行時のログ

失敗時のデバッグ用に以下のコマンドでコンテナログを確認できます:

```bash
docker logs gateway   # Gateway (ws-gateway.cjs) のログ
docker logs mock      # Socket.IO / HTTPモックサーバーのログ
docker logs wheel     # WHEELアプリのログ
```

スクリーンショット・動画は以下のディレクトリに出力されます:

| ディレクトリ | 内容 |
|------------|------|
| `test/cypress/screenshots/` | 失敗時のスクリーンショット |
| `test/cypress/videos/` | テスト実行動画 |

### 2.11 GitHub Actions (CI)

#### E2Eテスト (`run_cypress.yml`)

モックサーバーモードで実行します。WHEEL・Gateway・モックの3コンテナをDockerでビルド・起動します。

```
トリガー: master以外の全ブランチへのpush
SSHテストサーバー: naoso5/openpbs (GitHub Actionsサービス, port 4000:22)
Docker ネットワーク: wheel-e2e-net (コンテナ間通信用)
  wheel    (port 8089): WHEELアプリ本体
  mock     (port 3101/3102): Socket.IOモック + HTTPモック
  gateway  (port 3001): リバースプロキシ (WHEELとモックへ振り分け)
テスト: npm run test:e2e:mock:run (test/)
失敗時: 各コンテナのログ・スクリーンショット・動画をアーティファクトとして保存
```

---

## 3. 環境変数一覧

### 単体テスト (server/test/.env で管理)

| 変数 | 説明 | デフォルト |
|------|------|-----------|
| `WHEEL_TEST_REMOTEHOST` | テスト用リモートホスト名 | `testServer` |
| `WHEEL_TEST_REMOTE_PASSWORD` | リモートホストパスワード | `passw0rd` |
| `WHEEL_CONFIG_DIR` | WHEEL設定ディレクトリパス | (setup.shが自動生成) |
| `NODE_ENV` | Node環境 | `test` |
| `WHEEL_LOGLEVEL` | ログレベル | `OFF` |

### E2Eテスト

| 変数 | 説明 | デフォルト |
|------|------|-----------|
| `REAL_APP` | Gatewayからみた転送先WHEELサーバーURL (モックモード用) | `http://localhost:8089` |
| `GW_PORT` | GatewayポートVAR | `3001` |
| `MOCK_SIO` | Socket.IOモックサーバーURL | `http://localhost:3101` |
| `MOCK_HTTP` | HTTPモックサーバーURL | `http://localhost:3102` |

---

## 4. トラブルシューティング

### UT: Docker が起動しない
```bash
# Dockerデーモンが起動しているか確認
docker info
```

### UT: SSHテストサーバーへの接続失敗
```bash
# known_hostsのエントリをクリア
ssh-keygen -R 127.0.0.1
ssh-keygen -R '[127.0.0.1]:4000'
```

### E2E: WHEELサーバーがタイムアウト
```bash
# サーバーの起動状態を確認
docker ps
curl http://localhost:8089
```

### E2E: モックサーバーが起動しない (port が使用中)
```bash
# 残留コンテナを停止
cd test
docker compose down
# またはポートを使用しているプロセスを確認
lsof -i :3001 -i :3101 -i :3102
```

### E2E: Chromeが見つからない
```bash
cd test
npx cypress install
```
