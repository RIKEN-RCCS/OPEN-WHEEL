# エラーハンドリングと回復

## 1. 概要

WHEELのエラーハンドリングは複数の層で構成される。

```
コンポーネント実行エラー
    ↓ throw
Dispatcher._dispatchOneComponent() の try/catch
    ↓ コンポーネント状態を "failed" に設定
Dispatcher.emit("error", e)
    ↓
projectController.js の エラーハンドラ
    ↓ プロジェクト状態を "failed" に設定
Socket.IO イベントでクライアントへ通知
```

## 2. コンポーネントレベルのエラー処理

### _dispatchOneComponent() の例外処理

```javascript
async _dispatchOneComponent(target) {
  try {
    await this._cmdFactory(target.type).call(this, target);
  } catch (err) {
    await this._setComponentState(target, "failed");
    this.hasFailedComponent = true;
    throw err;      // 上位の _dispatch() へ再スロー
  } finally {
    this.setStateFlag(target.state);
    if (isFinishedState(target.state)) {
      logInfo(...);
    }
    this._reserveDispatch();  // 次のディスパッチサイクルを予約
  }
}
```

コンポーネントの実行で例外が発生した場合：
1. コンポーネントの状態を `"failed"` に設定する
2. `hasFailedComponent` フラグを `true` にする
3. 例外を再スローして `_dispatch()` の catch ブロックで捉える

### _dispatch() の例外処理

`_dispatch()` の catch ブロックは `this.emit("error", e)` を呼び出すだけであり、
プロジェクト全体の状態変更は上位のコントローラに委ねられる。

## 3. タスクレベルのエラー処理

### ローカルタスク

- プロセスの終了コードが非0の場合は失敗として扱う
- `defaultTaskRetryCount` 回まで自動リトライする
- `try/catch` で例外を捕捉し、タスク状態を `"failed"` に設定する

### リモートタスク（ジョブスケジューラ）

- ジョブスケジューラのリターンコードを `jobScheduler.json` の `acceptableReturnCode` と照合する
- 状態パターン（正規表現）でジョブの終了状態を判定する
- 意図しない終了状態は `"unknown"` として扱う

### ファイル転送エラー（inputFiles）

inputFiles の転送失敗は `mandatory` フラグで挙動が異なる。

| mandatory | 挙動 |
|-----------|------|
| `true` | コンポーネントを失敗させる（全mandatory転送完了後に判定） |
| `false` | 警告ログのみ出力し、処理を継続する |

実装: `Promise.allSettled` を使用し、全転送の完了を待ってから失敗を判定する。

## 4. ログシステム（logSettings.js）

### ログレベルと Socket.IO イベントの対応

| ログレベル | Socket.IO イベント | 説明 |
|-----------|------------------|------|
| `TRACE` | （なし） | トレース詳細（ファイルのみ） |
| `DEBUG` | （なし） | デバッグ情報（ファイルのみ） |
| `INFO` | `WHEEL_LOG` | 一般的な情報 |
| `WARN` | （なし） | 警告（ファイルのみ） |
| `ERROR` | `WHEEL_LOG` | エラー情報 |
| `FATAL` | `WHEEL_LOG` | 致命的エラー |
| `STDOUT` | `WHEEL_LOG` | タスクの標準出力 |
| `STDERR` | `WHEEL_LOG` | タスクの標準エラー出力 |
| `SSHOUT` | `WHEEL_LOG` | SSH標準出力 |
| `SSHERR` | `WHEEL_LOG` | SSH標準エラー出力 |

`WHEEL_LOG` イベント内の `level` フィールドでレベルを区別する。
クライアントはこのイベントを受信してログ画面に表示する。

### ログ関数の使い方

全てのログ関数は `projectRootDir` と `componentDir` を第1・第2引数に取る。
これにより、プロジェクト別のログファイルに自動的に振り分けられる。

```javascript
import { logInfo, logWarn, logError, logDebug, logStdout, logStderr } from "../logSettings.js";

logInfo(projectRootDir, componentDir, "メッセージ");
logWarn(projectRootDir, componentDir, "警告メッセージ");
logError(projectRootDir, componentDir, "エラー:", error);
logStdout(projectRootDir, componentDir, "タスク出力:", line);
```

### ログファイルの保存先

```
{projectRootDir}/wheel.log        プロジェクトのログファイル
```

ログファイル名は `logFilename` 設定で変更可能。
`numLogFiles` 世代分のバックアップが保持され、`compressLogFile` で圧縮可能。

### ログアペンダー構成

| アペンダー | 出力先 | フィルター |
|-----------|--------|-----------|
| `console` | コンソール | なし |
| `socketIO` | Socket.IO クライアント | logLevel以上 |
| `multi` | プロジェクト別ファイル | logLevel以上 |

## 5. 未処理例外のハンドリング

```javascript
process.on("unhandledRejection", logger.debug.bind(logger));
process.on("uncaughtException", logger.debug.bind(logger));
```

予期しない例外はデバッグレベルでログに記録されるが、サーバープロセスは停止しない。
本番環境では `logLevel` を適切に設定して重要なエラーを見逃さないようにすること。

## 6. SSH接続エラー

SSH接続が見つからない場合（`sshManager.getSsh()` でエラー）は
例外が即座にスローされ、タスクの実行が中断される。
エラーには `projectRootDir` と `id`（ホストID）が含まれる。

## 7. コマンド存在確認

起動時に `commandCheck.js` が必須コマンド（`rsync`, `ssh`, `git` 等）の存在を確認する。
いずれかが見つからない場合は `process.exit(1)` でサーバーが停止する。

## 8. エラー回復・再実行

### プロジェクトの再実行

失敗したプロジェクトは状態をリセットして再実行できる。
WHEEL はコンポーネントの状態ファイル（`status.wheel.txt`）を参照し、
既に `"finished"` 状態のコンポーネントはスキップして続きから実行する。

### リワインド

`askRewindState.js` を使用してプロジェクトの状態を以前のチェックポイントに巻き戻すことができる。
クライアントからのリワインド要求時にユーザーへ対話的に確認を求める。

## 9. 注意事項（既知の制限）

- `_dispatch()` で例外が発生した場合、`component.files` が未設定のままになる可能性がある
- ファイル転送の部分的な失敗後にリモート宛先に不完全なファイルが残る場合があるが、
  ロールバック機構は現時点では未実装
- `Promise.all` で並行実行中のコンポーネントのうち1つが失敗しても、
  他のコンポーネントは実行を継続する
