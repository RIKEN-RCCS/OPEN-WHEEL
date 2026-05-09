# コンポーネント実行・ディスパッチアルゴリズム

## 1. 概要

ワークフローの実行エンジンは `server/app/core/dispatcher.js` に実装されている。
`Dispatcher` クラスが中心となり、コンポーネントの依存関係を解析しながら
実行可能なコンポーネントを順次ディスパッチする。

## 2. Dispatcher クラス

### 責務

- ワークフロー内コンポーネントの実行順序制御（依存グラフ走査）
- 各コンポーネントタイプへの処理振り分け
- inputFiles / outputFiles の転送（ステージイン/アウト）
- ループ・分岐・パラメータスタディの展開制御
- 子ワークフロー（サブフロー）への委譲

### 主なフィールド

| フィールド | 説明 |
|-----------|------|
| `projectRootDir` | プロジェクトルートディレクトリ |
| `cwfDir` | 現在処理中のワークフローディレクトリ |
| `currentSearchList` | 次回 `_dispatch()` で処理するコンポーネントリスト |
| `pendingComponents` | 依存関係未解決で待機中のコンポーネントリスト |
| `runningTasks` | 現在実行中のタスク一覧 |
| `children` | 子 Dispatcher インスタンスの Set |
| `hasFailedComponent` | いずれかのコンポーネントが失敗したか |

## 3. ディスパッチサイクル

`_dispatch()` メソッドが実行の中核となる。イベント駆動で繰り返し呼ばれる。

```
[start()] → dispatch イベント発行
    ↓
[_dispatch()]
    1. 初回のみ: 子コンポーネント一覧を取得し「初期コンポーネント」を特定
       - 前依存（previous）が0件 かつ inputFiles の src が 0件のコンポーネントが初期コンポーネント
    2. currentSearchList を走査:
       a. disabled コンポーネントをスキップ
       b. _isReady() で実行可否を確認 → 未準備なら pendingComponents へ
       c. _getInputFiles() でステージイン実行
       d. _warnMissingInputFiles() で非mandatory ファイル欠落を警告
       e. _checkMandatoryInputFilesExist() で mandatory ファイル存在確認
       f. _dispatchOneComponent() で各コンポーネントの処理を呼び出す
    3. pendingComponents を次の currentSearchList に設定
    4. 全タスクが完了しリストが空になれば "done" イベントを発行
    5. 未完了なら次の "dispatch" イベントを待機
```

### イベント

| イベント | タイミング |
|---------|-----------|
| `dispatch` | ディスパッチサイクル開始の合図 |
| `taskCompleted` | タスクの実行が完了したとき |
| `done` | ワークフロー全体が完了したとき |
| `error` | 例外発生時 |
| `stop` | 実行停止要求時 |

## 4. 実行準備チェック（_isReady）

コンポーネントが実行可能かどうかは以下の条件で判定する。

- `previous` リスト内の全コンポーネントが「完了状態」であること
- `inputFiles` の全 `src` コンポーネントが「完了状態」であること
- `disable` フラグが `false` であること

無効化されたコンポーネント（`disable: true`）の上流を再帰的に辿り、
全ての依存がdisabledである場合はスキップする（`_removeComponentsWhichHasDisabledDependency`）。

## 5. コンポーネントタイプ別ハンドラ

`_cmdFactory(type)` がコンポーネントタイプに応じてハンドラメソッドを返す。

| コンポーネントタイプ | ハンドラメソッド | 説明 |
|-------------------|----------------|------|
| `task` | `_dispatchTask` | タスクの実行（ローカル/リモート） |
| `stepjobTask` | `_dispatchTask` | ステップジョブタスク |
| `bulkjobTask` | `_dispatchTask` | バルクジョブタスク |
| `if` | `_checkIf` | 条件分岐 |
| `for` | `_loopHandler`（For設定） | Forループ |
| `while` | `_loopHandler`（While設定） | Whileループ |
| `foreach` | `_loopHandler`（Foreach設定） | Foreachループ |
| `workflow` | `_delegate` | サブワークフロー委譲 |
| `stepjob` | `_delegate` | ステップジョブ委譲 |
| `parameterstudy` | `_PSHandler` | パラメータスタディ展開 |
| `viewer` | `_viewerHandler` | ビューアファイル収集 |
| `storage` | `_storageHandler` | ストレージ操作 |
| `source` | `_sourceHandler` | ソースファイル提供 |
| `break` | `_jumpHandler("break")` | ループ中断 |
| `continue` | `_jumpHandler("continue")` | 次ループへ進む |
| `hpciss` | `_hpcissHandler(false)` | HPCI共有ストレージ |
| `hpcisstar` | `_hpcissHandler(true)` | HPCI共有ストレージ（tar） |

## 6. タスク実行（_dispatchTask）

ローカルタスクとリモートタスクで実行パスが異なる。

```
_dispatchTask(component)
    ↓
isLocal(component) ?
  Yes → executerManager.exec(task) （ローカル実行）
  No  → executerManager.exec(task) + SSH経由ジョブ投入
```

`executerManager` は `numLocalJob`（ローカル同時実行数）または
`hostinfo.maxNumJobs`（リモートジョブ最大数）を超えないようにキューイングする。

## 7. ループ展開（_loopHandler）

For / While / Foreach コンポーネントを処理する汎用ループハンドラ。
引数として渡される関数群（`getNextIndex`, `isFinished` 等）でループ条件を抽象化している。

```
_loopHandler(getNextIndex, getPrevIndex, isFinished, getTripCount, keepLoopInstance, component)

1. テンプレートディレクトリを最初のインスタンスディレクトリへコピー
   - skipCopy パターンに一致するファイルは除外
2. 子Dispatcherを生成して _delegate() でサブワークフローとして実行
3. サブワークフロー完了後、isFinished() でループ終了判定
   - 終了の場合: クリーンアップしてループ完了
   - 継続の場合: 前インスタンスを次インスタンスディレクトリへコピー（skipCopy除外）
4. keepLoopInstance 設定に基づき古いインスタンスディレクトリを削除
```

## 8. パラメータスタディ展開（_PSHandler）

```
_PSHandler(component)

1. parameterSetting.json を読み込みパラメータ空間を解析
2. 全パラメータ組み合わせ（ベクター）を生成
3. 各パラメータベクターに対してインスタンスディレクトリを作成
4. targetFiles 内のプレースホルダーを Nunjucks でレンダリング
5. 各インスタンスに対して子Dispatcherを生成し並列実行
6. gather 設定に基づきリモートタスクのファイル収集先を更新
```

バルクジョブ（`bulkjobTask`）の場合は
`replaceByNunjucksForBulkjob` でテンプレートを展開し、
`writeParameterSetFile` でパラメータを環境変数形式に書き出す。

## 9. 条件分岐（_checkIf）

`if` コンポーネントは条件式（JavaScriptまたはシェルスクリプト）を評価し、
結果が `true` / `false` のどちらに対応するコンポーネントに制御を渡す。

## 10. サブワークフロー委譲（_delegate）

`workflow` / `stepjob` コンポーネントを子Dispatcherとして独立に実行する。
子Dispatcherは `this.children` に登録され、親Dispatcherと並行して実行される。

## 11. Break / Continue（_jumpHandler）

Break / Continue はループ制御のシグナルを親DispatcherにEmitする。

- `continue`: `forceFinishedLoops` に現在のループを追加し、次のイテレーションへ進む
- `break`: ループを強制終了し、`_loopHandler` の後続処理をスキップする

## 12. コンポーネント状態

| 状態 | 説明 |
|------|------|
| `notset` | 未設定（初期状態） |
| `waiting` | 依存待ち |
| `ready` | 実行準備完了 |
| `running` | 実行中 |
| `finished` | 正常完了 |
| `failed` | 失敗 |
| `unknown` | 状態不明（スクリプト戻り値が不明等） |

## 13. 並行実行制御

同一ワークフロー内で依存関係のない複数のコンポーネントは `Promise.all` で並行実行される。
子ワークフロー（`_delegate`）も非同期に実行されるため、
異なるサブフロー内のタスクは同時に実行されうる。

ローカルタスクの最大同時実行数は `numLocalJob` で制限される（デフォルト: 1）。
