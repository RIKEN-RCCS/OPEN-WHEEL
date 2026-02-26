# モックサーバ環境構築手順書
# 1. はじめに
本書は **モックを用いた Cypress テストの実行方法** をまとめた資料です。

---
# 2. 前提条件 / 事前インストール
本モック環境では以下のパッケージが必要になります：
- socket.io
- socketio-file-upload
- @mocks-server/main
- http-proxy
- cypress

上記は `open-wheel/test` で `npm install` を実行することで自動的に導入されます：

---
# 3. ディレクトリ構成（モック関連部分のみ抜粋）
```
open-wheel/
└── test/
    ├── mock_server/        # Socket.IO モック
    │   └── server.js
    ├── mocks/              # HTTP モック（Mocks Server）
    │   ├── routes/
    │   │   └── health.cjs
    │   └── collections.json
    ├── mocks.config.cjs
    ├── ws-gateway.cjs      # Gateway（振り分けプロキシ）
    ├── cypress.config.js
    ├── compose.yml
    └── cypress/
```

---
# 4. モック環境の全体構成
## 4.1 アーキテクチャ
Cypressから送られる各リクエストが、
Gatewayサーバを経由してそれぞれ適切なモックサーバに振り分けられる
仕組みを表しています。

```
 Cypress → Gatewayサーバ
   ├── /socket.io → mock-sioサーバ
   ├── /HTTP → mock-httpサーバ
   └── 静的ファイル → SPA
```
- `/socket.io`への通信は Socket.IO モックへ送られる  
- HTTP API 呼び出しはHTTPモックへ送られる  
- HTMLやJSなど静的ファイルは SPAから返さるる


---
# 5. モックサーバ（Socket.IO / HTTP）構築
## 5.1 Socket.IO モック
UIが行うほぼ全ての内部操作（createNod /updateComponentなどはSocket.IOイベントによって処理されます。

### テストからの起動
cypressテスト開始前にSocket.IO モックサーバを**自動で起動**するので手動での起動は必要ありません。
```js
# テスト実行前にSocket.IOモックサーバが起動される
before(() => {
  return cy.task("start:mock-server", 3101);
});
```
```js
# テスト終了時にSocket.IOモックサーバが停止される
after(() => {
  return cy.task("stop:mock-server");　
});
```

---
## 5.2 HTTP モック
Mocks Serverを使用して、UIがアクセスするREST APIをモック化します。  
ここでは `/health` API を例に仕組みを説明します

### 使用するファイル
- `mocks.config.cjs`  
  → Mocks Server の起動ポートや基本設定を定義します。
- `routes/health.cjs`  
  → `/health` API のルートと、返すレスポンスを定義します。
- `collections.json`  
  → どのルートにどのレスポンスを適用するかをまとめたAPIの応答パターンを管理します。


### `/health` のルート定義（例）
```
module.exports = [
  {
    id: "get-health",
    url: "/health",
    method: "GET",
    variants: [
      { id: "ok",   type: "json", options: { status: 200, body: { ok: true } } },
      { id: "down", type: "json", options: { status: 500, body: { ok: false } } }
    ]
  }
];
```

### collection の説明

Mocks Serverでは同じAPIに対して**どのレスポンス（variant）を返すかの組み合わせ**を  
「コレクション（collection）」としてまとめて管理できます。
collectionを切り替えることで、  
**正常系・異常系・データあり・データなし** など、  
API の振る舞いを一括で切り替えることができます。
以下は今回のテストで使用しているサンプル定義です
```
collections.json:
[
  { "id": "base",   "routes": ["get-health:ok"] },
  { "id": "failed", "routes": ["get-health:down"] }
]
```

- `base`   → `/health` が 200 を返す（正常系）
- `failed` → `/health` が 500 を返す（異常系 UI の確認用）  

このように、**どのルートにどの variant を適用するかをまとめたものが collection** です。

### コレクションの切り替え方法（正常系 / 異常系の切替）
Mocks Serverは`collections.json` で定義したコレクションを切り替えることで、APIの振る舞いを切り替えることが可能です。  
切替は**起動時に切り替える方法** と **実行中に切り替える方法** の 2 通りで制御します。  


## 方式①：起動時に切り替える

Mocks Serverは起動時に`--mock.collections.selected=<ID>` を指定することで  
使用する collection を上書きできます。

```
# test/mocks/collections.jsonを使用しての例
# baseで起動
npm run mocks -- --mock.collections.selected=base

# failedで起動
npm run mocks -- --mock.collections.selected=failed
```

## 方式②：起動後に切り替える
Mocks Server はデフォルトで 管理 API をポート 3110 で公開しており、
実行中でも HTTP リクエストで collection を変更できます。
```
test/mocks/collections.jsonを使用しての例
# baseへ切り替え
curl -X PATCH -H "Content-Type: application/json" \
  -d '{"mock":{"collections":{"selected":"base"}}}' \
  http://localhost:3110/api/config

# failedへ切り替え
curl -X PATCH -H "Content-Type: application/json" \
  -d '{"mock":{"collections":{"selected":"failed"}}}' \
  http://localhost:3110/api/config

```


### `/health` の動作確認手順
```
# モック起動
npm run mocks

# 正常系（base）
curl http://localhost:3102/health   # → {"ok": true}

# failed に切替 → エラー系
curl http://localhost:3102/health   # → {"ok": false}

# Gateway 経由で到達確認
npm run gateway
curl http://localhost:3001/health   # → 3102 の結果が返る
```

### cypressテストでの動作確認手順
cypressテスト内に以下の処理を追加する
```js
    cy.request({ url: "/health", failOnStatusCode: false })
      .then((r)=>{ return cy.log(`mocks-server /health status=${r.status}`); });
```
cypressログの中に選択したcollectionと同じステータスが返ってくるので確認する。

---
# 6. Gateway
## 6.1 役割
Cypress の `baseUrl` を **3001**にし、以下のように **UI / SIO / HTTP** をまとめる

## 6.2 振り分け仕様（抜粋）
```
/socket.io     → MOCK_SIO (3101)
/assets/*      → REAL_APP (8089)
/*.html, /     → REAL_APP (8089)
その他         → MOCK_HTTP (3102)
```

---
# 6.3 接続方式：本番環境 / モック環境
 `test/cypress.config.js`内、`baseUrl`を変更することで本番の環境とモック環境を切り替えられます

## 本番環境：8089 直アクセス
- 既存環境
- Cypress `baseUrl`: `http://localhost:8089`

## モック環境：Gateway 集約
- UI(8089)、SIO(3101)、HTTP(3102) を分離して運用
- Cypress `baseUrl`: `http://localhost:3001`

---
# 7. Cypress テスト実行
## 7.1 起動手順
```
# SIO モック起動
cyファイルのbeforeで起動される

# HTTP モック起動
npm run mocks

# Gateway 起動
npm run gateway

# Cypress 起動
npx cypress open
```

---
# 8. モックテスト作成ガイド
UI → Socket.IO → モック → workflow 更新という一連の流れを踏まえてテストを設計します。

### 例：drag & drop → createNode 発火
- UI の D&D 操作
- Vue が `createNode` を emit
- SIO モックが新しいノードを workflow.descendants に追加
- Gateway 経由の UI が再描画

---
# 9. トラブルシューティング
- Chrome が選べない → OS に Chrome がインストールされていない
- Gateway が 502 → モックが未起動
- drag&drop が動かない → Socket.IO 接続問題

---
