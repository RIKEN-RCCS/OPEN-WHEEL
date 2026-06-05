# Webhook連携

## 1. 概要

WHEELのWebhook機能を使用すると、プロジェクトやコンポーネントの状態変化を
外部のURLにHTTP POSTで通知できる。
これにより、CIツールや外部システムとのインテグレーションが可能になる。

## 2. Webhook設定

### 設定方法

Webhookの設定はワークフローエディタのプロジェクト設定画面から行う。

### webhook オブジェクトの構造

Webhook設定は `prj.wheel.json`（プロジェクトメタデータ）内の `webhook` フィールドに保存される。

```json
{
  "webhook": {
    "URL": "https://example.com/webhook",
    "project": true,
    "component": false
  }
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `URL` | `string` | 通知先のURL |
| `project` | `boolean` | プロジェクト状態変化時に通知するか |
| `component` | `boolean` | コンポーネント状態変化時に通知するか |

## 3. 通知の仕組み

### トリガーとペイロード

Webhookはプロジェクト実行開始時に `EventEmitter`（`ee`）のリスナーとして登録される。

| トリガー | 通知の有効条件 | ペイロード |
|---------|------------|---------|
| `projectStateChanged` | `webhook.project === true` | プロジェクトJSON全体 |
| `componentStateChanged` | `webhook.component === true` | 変化したコンポーネントのオブジェクト |

### 通知の実装（projectController.js）

```js
if (typeof webhook !== "undefined" && typeof webhook.URL === "string") {
  if (webhook.project) {
    ee.on("projectStateChanged", async (projectJson) => {
      const response = await axios.post(webhook.URL, projectJson);
    });
  }
  if (webhook.component) {
    ee.on("componentStateChanged", async (component) => {
      const response = await axios.post(webhook.URL, component);
    });
  }
}
```

通知には `axios` ライブラリを使用。HTTPレスポンスはデバッグログに記録される。

## 4. Webhook設定の更新（webhook.js）

### `replaceWebhook()` 関数

```js
async function replaceWebhook(projectRootDir, newWebhook)
```

- `just-diff` / `just-diff-apply` を使って差分更新（differential update）を行う
- 完全な上書きではなく差分を適用するため、部分的な更新が可能
- 戻り値は更新後の `webhook` オブジェクト

#### 差分更新の流れ

```
1. プロジェクトJSONを読み込む
2. 現在の webhook と新しい webhook の差分（patch）を計算
   → just-diff による JSON Patch 形式
3. 差分を既存の webhook オブジェクトに適用
   → diffApply（in-place更新）
4. プロジェクトJSONを書き戻す
5. 更新後の webhook を返す
```

### Socket.IO ハンドラ

クライアントからの更新は `workflowEditor.js` の `onUpdateWebhook` で処理される。

```js
export async function onUpdateWebhook(projectRootDir, webhook, parentID, cb) {
  return generalHandler(replaceWebhook.bind(null, projectRootDir, webhook), ...);
}
```

## 5. Web API機能（enableWebApi）

`enableWebApi: true` に設定すると、リモートホストの認証（OAuth）サポートが有効になる。
これはWebhookとは独立した機能であり、OAuth 2.0によるリモートホスト認証フローを提供する。

### 有効化された場合のルート

- `GET /webAPIauth` — OAuth認証コールバック処理
- `GET /` のOAuthクエリパラメータ（`code`, `state`）の処理が有効化される

## 6. 注意事項

- Webhook URLは実行前に設定する必要がある（実行中の変更は反映されない）
- HTTPSを使用しない場合でも通知可能だが、セキュリティ上HTTPS推奨
- 通知失敗（HTTP 4xx/5xx等）はエラーログに記録されるが、プロジェクト実行は継続する
