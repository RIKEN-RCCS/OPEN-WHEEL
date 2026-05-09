# GFarm連携

## 1. 概要

GFarm（Grid Datafarm）は分散ファイルシステムであり、
HPCIの共有ストレージ（HPCI-SS）として使用される。
WHEELは `gfarmOperator.js` を通じてGFarmへのファイル操作を行う。

GFarmを使用するコンポーネントは以下の2種類。

| コンポーネント | 説明 |
|--------------|------|
| `hpciss` | GFarmにファイルをコピー・管理する（gfcp/gfpcopy使用） |
| `hpcisstar` | GFarmにtar形式でファイルを保存・展開する（gfptar使用） |

## 2. アーキテクチャ

GFarm操作は **CSGW（Compute Space GateWay）** ホスト経由で実行される。
WHEEL自体がGFarmコマンドを直接実行するのではなく、SSHで接続したCSGWホスト上でコマンドを実行する。

```
WHEEL（サーバー）
    ↓ SSH接続（sshManager経由）
CSGWホスト（GFarmが利用可能なホスト）
    ↓ GFarmコマンド実行（gfcp, gfpcopy, gfptar等）
HPCI共有ストレージ（GFarm）
```

## 3. ホスト設定要件

GFarmを使用するリモートホストは `remotehost.json` で `useGfarm: true` を設定する必要がある。

```json
{
  "id": "hpciss-host-uuid",
  "name": "HPCI-SS ホスト",
  "host": "csgw.example.ac.jp",
  "username": "user",
  "useGfarm": true,
  "JWTServerURL": "https://jwt-server.hpci.example.ac.jp",
  "JWTServerUser": "hpciuser"
}
```

## 4. JWT認証

GFarmへのアクセスにはHPCI JWT（JSON Web Token）認証が必要。
WHEELは `jwt-agent` コマンドを使用してJWT認証エージェントを管理する。

### 認証フロー

```
1. GFarmコマンド実行前に checkJWTAgent() でエージェントが起動中か確認
2. 未起動の場合、startJWTAgent() でエージェントを起動
   - JWTサーバーURL（JWTServerURL）とユーザー（JWTServerUser）を使用
   - パスフレーズは jwtServerPassphraseManager.js で管理
3. GFarmコマンドを実行
```

### パスフレーズ管理

`jwtServerPassphraseManager.js` がJWTサーバーへのパスフレーズを管理する。
パスフレーズが必要な場合はSocket.IO経由でユーザーに入力を要求する。

## 5. GFarm操作関数（gfarmOperator.js）

### コアユーティリティ

| 関数 | 説明 |
|------|------|
| `execOnCSGW(projectRootDir, hostID, timeout, cmd, ...args)` | CSGWホスト上でコマンドを実行する |
| `formatGfarmURL(target)` | パスを `gfarm:///path` 形式に変換する |
| `checkJWTAgent(projectRootDir, hostID)` | JWTエージェントが起動中か確認する |
| `startJWTAgent(projectRootDir, hostID, passphrase)` | JWTエージェントを起動する |
| `stopJWTAgent(projectRootDir, hostID, timeout)` | JWTエージェントを停止する |

### ファイルコピー操作

| 関数 | 使用コマンド | 説明 |
|------|------------|------|
| `gfcp(projectRootDir, hostID, src, dst, toGfarm, timeout)` | `gfcp -p -f` | 単一ファイルをGFarmとの間でコピーする |
| `gfpcopy(projectRootDir, hostID, src, dst, toGfarm, timeout)` | `gfpcopy -p -v -f` | ディレクトリをGFarmとの間でコピーする |

`toGfarm: true` の場合はGFarm方向へ、`false` の場合はGFarmから取り出す方向へコピーする。

### gfptar操作（HPCI-SS-tar用）

| 関数 | 使用コマンド | 説明 |
|------|------------|------|
| `gfptarCreate(projectRootDir, hostID, src, target, timeout)` | `gfptar -v -c` | ディレクトリをtar形式でGFarmに保存する |
| `gfptarExtract(projectRootDir, hostID, target, dst, timeout)` | `gfptar -v -x` | GFarmのtarアーカイブを展開する |
| `gfptarList(projectRootDir, hostID, target, timeout)` | `gfptar -t` | tarアーカイブ内のファイル一覧を取得する |

### ファイルシステム操作

| 関数 | 使用コマンド | 説明 |
|------|------------|------|
| `gfls(projectRootDir, hostID, target, opt, timeout)` | `gfls -l` | GFarm上のファイル一覧を取得する |
| `gfrm(projectRootDir, hostID, target, timeout)` | `gfrm` | GFarm上のファイル・ディレクトリを削除する |

## 6. GFarmパス形式

GFarmのパスは `gfarm:///` URI形式で表現される。

```
gfarm:///home/user/data          # 絶対パス
gfarm:///path/to/project/output  # プロジェクト配下
```

相対パス（`./` や `../` から始まるパス）はエラーになる。
`formatGfarmURL()` が自動的に絶対パスに変換する。

## 7. gfptarの制約

- `gfptar -c` は対象アーカイブパスが存在しない場合のみ実行可能
- アーカイブパスが既存の場合はエラーになる
- `gfptar` で作成したアーカイブはGFarm上でファイルの削除・リネームができない
- プロジェクトを複数回実行する場合は、事前にアーカイブパスを削除するか、
  別のパスを設定する必要がある（コンポーネントの "remove storage directory" ボタンで削除可能）

## 8. タイムアウト設定

各GFarm操作関数はデフォルトのタイムアウト（秒）が設定されている。
大容量ファイルを扱う場合は適切なタイムアウト値を設定すること。

| 操作 | デフォルトタイムアウト |
|------|-----------------|
| `gfcp`（単一ファイル） | 600秒 |
| `gfpcopy`（ディレクトリ） | 60秒 |
| `gfptarCreate` | 60秒 |
| `gfptarExtract` | 60秒 |
| `gfls`, `gfrm` | 60秒 |
| JWT操作 | 60秒 |
