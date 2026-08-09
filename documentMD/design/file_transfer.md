# ファイル転送・リモートホスト管理

## 1. 概要

WHEELは、ローカルマシンとリモートホスト間でファイルを転送するための
複数のモジュールを階層的に組み合わせて使用する。

```
Dispatcher（実行エンジン）
    ↓
transferrer.js（ステージイン/アウト制御）
    ↓
transferManager.js（転送キュー・並列制御）
    ↓
sshManager.js（SSH接続プール）
    ↓
ssh-client-wrapper（SSH/rsync実行）
```

## 2. SSH接続プール（sshManager.js）

### 概要

プロジェクトごと・ホストごとにSSH接続インスタンスをキャッシュし、
接続の再利用と管理を行う。

### データ構造

```
Map<projectRootDir, Map<hostID, {
  ssh,       // SSH接続インスタンス（ssh-client-wrapper）
  hostinfo,  // リモートホスト設定オブジェクト
  pw,        // パスワード
  ph,        // パスフレーズ
  isStorage  // ストレージコンポーネントとしても使用するか
}>>
```

### 主要関数

| 関数 | 説明 |
|------|------|
| `addSsh(projectRootDir, hostinfo, ssh, pw, ph, isStorage)` | SSH接続をプールに登録する |
| `getSsh(projectRootDir, id)` | 接続インスタンスを取得する（未登録時は例外） |
| `getSshHostinfo(projectRootDir, id)` | ホスト設定情報を取得する |
| `hasEntry(projectRootDir, id)` | 接続が登録済みか確認する |

### 接続確立タイミング

SSH接続はプロジェクト実行開始時に確立され、実行終了まで維持される。
パスワードやパスフレーズが必要な場合は、Socket.IO 経由でクライアントに入力を要求する。

## 3. ファイル転送管理（transferManager.js）

### 概要

プロジェクト・ホストの組み合わせごとに転送キューを管理し、
並列転送数を制御する。SBS（Simple Batch System）パターンを採用。

### データ構造

```
Map<"projectRootDir-remotehostID", SBS転送インスタンス>
```

### 主要関数

| 関数 | 説明 |
|------|------|
| `register(hostinfo, task, direction, src, dst, opt)` | 転送を登録・実行する |
| `removeTransferrers(projectRootDir)` | プロジェクトの転送インスタンスをクリアする |

### 並列転送数

`hostinfo.maxNumParallelTransfer`（デフォルト: 1）で制御する。
同一ホストへの同時転送数がこの値を超えないようにキューイングされる。

### 転送方向

| 値 | 説明 |
|----|------|
| `"send"` | ローカル → リモート（ステージイン） |
| `"recv"` | リモート → ローカル（ステージアウト） |

## 4. 転送実行（transferrer.js / deliverFile.js）

### ステージイン/アウト

- **ステージイン**: タスク実行前に `inputFiles` で指定されたファイルを転送先に送る
- **ステージアウト**: タスク実行後に `outputFiles` で指定されたファイルを回収する

### ファイル配信パターン（deliverFile.js）

| パターン | 説明 |
|---------|------|
| ローカル→ローカル | `fs.copy` によるローカルコピー |
| ローカル→リモート | SSH経由のファイル送信（rsync） |
| リモート→ローカル | SSH経由のファイル受信（rsync） |
| リモート→リモート | SSH経由のリモート間コピー（rsync over SSH） |
| ローカル共有→* | 共有ファイルシステム経由のコピー |
| リモート共有→* | 共有ファイルシステム経由のコピー |

### rsync オプション

WHEELのシステムファイル（`*.wheel.json`, `jm.wheel.json`, `status.wheel.txt` 等）は
rsync の `--exclude` オプションで自動的に転送対象から除外される。

```javascript
export const rsyncExcludeOptionOfWheelSystemFiles = [
  `--exclude=**/${projectJsonFilename}`,
  `--exclude=**/${componentJsonFilename}`,
  `--exclude=**/${statusFilename}`,
  `--exclude=**/${jobManagerJsonFilename}`,
  `--exclude=**/${filesJsonFilename}`,
  ...
];
```

## 5. リモートホスト定義（remotehost.json）

リモートホストは `remotehost.json` の配列として定義する。
各エントリの主なプロパティは以下のとおり。

| プロパティ | 型 | 説明 |
|-----------|----|----|
| `id` | string | ホストの一意識別子（UUID） |
| `name` | string | 表示名 |
| `host` | string | ホスト名またはIPアドレス |
| `port` | number | SSHポート番号（デフォルト: 22） |
| `username` | string | SSHユーザー名 |
| `privateKeyPath` | string | 秘密鍵ファイルパス |
| `jobScheduler` | string | 使用するジョブスケジューラ名 |
| `queue` | string[] | 使用するキュー名のリスト |
| `maxNumParallelTransfer` | number | 最大並列転送数 |
| `maxNumJobs` | number | 最大同時投入ジョブ数 |
| `useGfarm` | boolean | GFarmを使用するか |
| `sharedPath` | string | 共有ファイルシステムのパス |

### queue フィールドの移行

`remotehost.json` の `queue` フィールドは旧バージョンでは文字列（カンマ区切り）だったが、
現在は文字列配列に変更されている。
サーバー起動時に `db.js` で自動的に配列形式へ変換される。

## 6. HPCI共有ストレージ（GFarm）連携

GFarmを使用するホストでは、通常のrsyncの代わりにGFarmコマンド
（`gfcp`, `gfpcopy`, `gfptar`等）を使用してファイルを転送する。

詳細は [gfarm.md](./gfarm.md) を参照。

## 7. エラーハンドリング

### 転送失敗時の挙動

- `mandatory: true` のinputFileの転送失敗はコンポーネントの失敗を引き起こす
- `mandatory: false` のinputFileの転送失敗は警告ログのみで無視される
- 複数のmandatoryファイルのうち一部が失敗した場合、全ての転送完了を待ってからコンポーネントを失敗させる

### SSH接続エラー

SSH接続が登録されていない場合（`hasEntry` が `false`）は
即座に例外がスローされ、上位の実行エンジンに伝播する。

## 8. VerboseSSH ログ

`verboseSsh: true`（または環境変数 `WHEEL_VERBOSE_SSH=true`）を設定すると、
SSH通信の詳細ログが `logSSHout` / `logSSHerr` レベルで記録される。
これらのログはSocket.IO経由でクライアントのログ画面にも表示される。
