# パフォーマンスチューニング

## 1. 概要

WHEELのパフォーマンスに影響する主な設定と、その最適化方法をまとめる。
設定は `~/.wheel/server.json` または対応する環境変数で行う。

---

## 2. ローカルジョブの並列数（numLocalJob）

### 設定

| 設定方法 | キー/変数名 |
|---------|-----------|
| server.json | `numLocalJob` |
| 環境変数 | `WHEEL_NUM_LOCAL_JOB` |
| デフォルト値 | `1` |

### 説明

ローカルマシン上で同時実行できるタスクの最大数。
タスクとは「Task」コンポーネントを実行する処理を指す。

```json
{
  "numLocalJob": 4
}
```

**推奨値:** ローカルマシンのCPUコア数 - 1 程度。
ただし、タスクがI/Oバウンドの場合はコア数以上に増やしても効果がある場合がある。

---

## 3. リモートジョブの並列数（numJob）

### 設定

`remotehost.json` の各ホスト定義内で設定する。

```json
{
  "id": "...",
  "name": "HPCクラスタ",
  "host": "cluster.example.ac.jp",
  "numJob": 10
}
```

| フィールド | 説明 | デフォルト |
|-----------|------|-----------|
| `numJob` | リモートホストへの同時ジョブ投入数の上限 | `1` |

### 動作

`getMaxNumJob()` 関数が上限を決定する:
- ホストが `null`（ローカル実行）の場合 → `numLocalJob` を使用
- `hostinfo.numJob` が数値の場合 → `max(numJob, 1)` を使用
- それ以外 → `1`

### 動的調整（フィードバック制御）

ジョブ投入時にキューが満杯のエラーが返ってきた場合、
`maxConcurrent` を自動的に1つ減らす（下限1まで）。
逆に正常投入が続いた場合、徐々に元の値に戻す。

---

## 4. ファイル転送の並列数（maxNumParallelTransfer）

### 設定

`remotehost.json` の各ホスト定義内で設定する。

```json
{
  "id": "...",
  "name": "リモートホスト",
  "host": "remote.example.ac.jp",
  "maxNumParallelTransfer": 4
}
```

| フィールド | 説明 | デフォルト |
|-----------|------|-----------|
| `maxNumParallelTransfer` | 同一ホストへの同時ファイル転送数の上限 | `1` |

### 動作

`transferManager.js` の `SBS`（Simple Batch System）がこの値を使用して
並列転送数を制御する。キーは `"projectRootDir-remotehostID"` で管理され、
プロジェクトとリモートホストの組み合わせごとに独立したキューを持つ。

---

## 5. ログ設定

### server.json でのログ設定

```json
{
  "logLevel": "info",
  "numLogFiles": 5,
  "maxLogSize": 8388608,
  "compressLogFile": true
}
```

| プロパティ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| `logLevel` | `string` | `"debug"` | ログレベル（`trace`/`debug`/`info`/`warn`/`error`/`fatal`/`off`） |
| `numLogFiles` | `number` | `5` | ログファイルのローテーション世代数 |
| `maxLogSize` | `number` | `8388608`（8MB） | 1ファイルの最大サイズ（バイト） |
| `compressLogFile` | `boolean` | `true` | 古いログファイルをgzip圧縮するか |

### 環境変数

| 変数 | 対応プロパティ |
|------|-------------|
| `WHEEL_LOG_LEVEL` | `logLevel` |
| `WHEEL_NUM_LOG_FILES` | `numLogFiles` |
| `WHEEL_MAX_LOG_SIZE` | `maxLogSize` |
| `WHEEL_COMPRESS_LOG_FILE` | `compressLogFile` |

### ログレベルの選択指針

| ログレベル | 用途 |
|-----------|------|
| `debug` | 開発中・問題調査 |
| `info` | 本番環境の標準 |
| `warn` | 最小限のログ出力（警告以上のみ） |
| `off` | ログを完全に無効化（テスト時） |

`verboseSsh: true` を設定すると、SSH接続の詳細ログが追加される。

---

## 6. タスクリトライ設定

### server.json

```json
{
  "defaultTaskRetryCount": 1
}
```

| プロパティ | デフォルト | 説明 |
|-----------|-----------|------|
| `defaultTaskRetryCount` | `1` | タスク失敗時のデフォルトリトライ回数 |

個別のタスクコンポーネントでも上書き設定が可能。

---

## 7. チューニングの実践ガイド

### 大量ファイル転送が遅い場合

1. `maxNumParallelTransfer` を増やす（例: 4〜8）
2. ネットワーク帯域が十分あるか確認
3. `rsync` の圧縮オプション（`-z`）は帯域幅が制限されている場合に有効

### ローカルCPU使用率が低い場合

1. `numLocalJob` を現在の値より増やす
2. タスクがCPUバウンドか確認（CPUバウンドなら超過設定は逆効果）

### ログが大量に出力される場合

1. `logLevel` を `info` または `warn` に変更
2. `maxLogSize` を増やして頻繁なローテーションを抑制
3. `compressLogFile: true` でディスク使用量を削減

### リモートジョブの投入が制限される場合

1. `numJob` の設定がジョブスケジューラの制限以下になっているか確認
2. ジョブスケジューラ（PBSなど）の最大投入数ポリシーを確認
3. 自動フィードバック制御に任せる（WHEELが自動調整する）
