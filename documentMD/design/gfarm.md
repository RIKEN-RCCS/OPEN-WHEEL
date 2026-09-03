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

## 8. GFarm拡張属性（gfxattr）によるメタデータ付与

### 概要

`hpciss` / `hpcisstar` コンポーネントへのファイル転送時、GFarmの拡張属性機能（`gfxattr`）を使って
ワークフロー全体のコンポーネント情報をXML形式でファイルに埋め込む。

- **属性名**：`wheel.workflow`
- **目的**：GFarm上に保存されたファイルの来歴（プロビナンス）追跡

### 処理フロー

`dispatcher.js` の `_hpcissHandler()` がファイル転送後に以下を実行する。

```
1. gatherComponentMetadata(projectRootDir)
      → プロジェクト内の全コンポーネントをJSONツリーとして収集
        （server/app/core/projectMetadataExporter.js）

2. componentMetadataToXml(metadata)
      → JSONツリーをXML文字列に変換
        （server/app/core/projectMetadataExporter.js）

3. setGfarmXattr(projectRootDir, hostID, gfarmPath, "wheel.workflow", xml)
      → GFarm上のファイルに属性として書き込み
        （server/app/core/gfarmOperator.js）
```

### gfxattr操作関数

| 関数 | 使用コマンド | 説明 |
|------|------------|------|
| `setGfarmXattr(projectRootDir, hostID, path, attrName, xmlString)` | `gfxattr -s -x -f` | GFarmファイルにXML拡張属性を書き込む |
| `getGfarmXattr(projectRootDir, hostID, path, attrName)` | `gfxattr -g -x` | GFarmファイルからXML拡張属性を読み取る |

`setGfarmXattr` の内部処理：
1. XML文字列をBase64エンコード
2. CSGW上の一時ファイル（`/tmp/wheel_xattr_<timestamp>.xml`）に書き込み
3. `gfxattr -s -x -f <tmpfile> <gfarm_path> <attrName>` で属性をセット
4. 一時ファイルを削除

### XMLデータ構造

`<workflow>` をルートとし、各コンポーネントを `<component>` 要素で表現する。
子コンポーネントは `<children>` 要素にネストされ、階層構造を反映する。

`<component>` の `type`/`name`/`id` 属性以外は、**そのコンポーネントのJSON
（`cmp.wheel.json`）が持つプロパティを一切の許可リストなしで全て出力する**
（`server/app/core/projectMetadataExporter.js` の `componentToXmlObject`/
`reshapeForXmlBuilder`、[fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser)
の `XMLBuilder` を使用）。これには実行中に `dispatcher.js`/`executerManager.js`
が書き込む実行時プロパティ（`jobID`、`rt`、`startTime`/`endTime`、
`dispatchedTime`、`remotehostID` など）や、以前は出力対象外だった
`previous`/`next`（実行順序グラフのエッジ）、`if`の`else`（false分岐先）、
`pos`/`parent` なども含まれる。変換規則は次の通り、完全に汎用的（フィールド名に
よる特別扱いは一切ない）：

- オブジェクト（例：`env`）→ キーごとに1つの子要素
- 配列（例：`previous`、`inputFiles`）→ ラッパー要素なしで、プロパティ名と
  同じタグ名を持つ兄弟要素を配列の要素数だけ繰り返す
- 改行を含む文字列（例：`scriptContent`）→ `<![CDATA[...]]>` で囲む
  （`]]>` を含む場合はライブラリが自動的に隣接するCDATAセクションに分割する）
- `null`/`undefined` → 出力しない（フィールド自体が現れない）

```xml
<?xml version="1.0" encoding="UTF-8"?>
<workflow>
  <component type="workflow" name="root" id="wf-uuid">
    <children>
      <component type="task" name="myTask" id="task-uuid">
        <script>run.sh</script>
        <jobID>12345</jobID>
        <rt>0</rt>
        <next>hpciss-uuid</next>
        <outputFiles>
          <name>result.dat</name>
        </outputFiles>
      </component>
      <component type="hpciss" name="storage" id="hpciss-uuid">
        <host>csgw.example.ac.jp</host>
        <storagePath>/home/user/gfarm/result</storagePath>
        <previous>task-uuid</previous>
        <inputFiles>
          <name>result.dat</name>
          <mandatory>false</mandatory>
          <src>
            <srcNode>myTask</srcNode>
            <srcName>result.dat</srcName>
          </src>
        </inputFiles>
      </component>
    </children>
  </component>
</workflow>
```

### 属性ビューアーUI

ユーザーはWHEEL UI上でGFarm上のファイルに付与された属性を確認できる。

- **remoteFileBrowser.vue**（hpciss）：ファイル選択中に「inspect gfarm attributes」ボタンが有効化
- **gfarmTarBrowser.vue**（hpcisstar）：「inspect gfarm attributes」ボタンでtarアーカイブ全体の属性を表示
- **gfarmAttributeViewer.vue**：属性ビューアーダイアログ
  - 左パネル：コンポーネントツリービュー（検索フィルタ付き。検索はコンポーネント名/種別だけでなく、
    プロパティツリー内の全ての文字列値を対象とする）
  - 右パネル：選択コンポーネントの詳細 — XML内に存在する全プロパティを、決め打ちの項目リストなしで
    汎用的に（ネストしたオブジェクト/配列はインデント表示で）一覧表示する
  - パンくずリスト：ルートからhpcissコンポーネントまでの来歴を表示

### デバッグ用メタデータ書き出し

以下の**環境変数のみ**で設定する（`server.json` では設定不可 — 実運用中に設定ファイル経由で
誤って有効化されたままにならないよう、意図的に環境変数専用としている）。

| 環境変数 | 説明 |
|---------|------|
| `WHEEL_DEBUG_METADATA_JSON` | `gatherComponentMetadata` の出力JSONを指定パスに書き出す |
| `WHEEL_DEBUG_METADATA_XML` | `componentMetadataToXml` の出力XMLを指定パスに書き出す |

値はファイルパス（文字列）。未設定（デフォルト）の場合は書き出しなし。

```bash
# 例：XMLデバッグ出力を有効化
WHEEL_DEBUG_METADATA_XML=/tmp/debug_metadata.xml npm start -w server
```

#### 上書き挙動

書き出し先は環境変数で指定した**固定パス**で、コンポーネント名や連番は付与されない。
`writeFile`（`node:fs/promises`、フラグ `w` = truncate）で書き込むため、既存内容は毎回上書きされる。

- **1つの HPCI-SS / HPCISS-tar コンポーネント内に `inputFiles` が複数ある場合** — 書き出しは
  **1回だけ**。`gatherComponentMetadata` / `componentMetadataToXml` は `_hpcissHandler`
  （`dispatcher.js`）内で1回のみ呼ばれ、複数の `inputFiles` は Gfarm 拡張属性
  `wheel.workflow` の付与先が増えるだけで、生成される JSON/XML は共通。
- **プロジェクト内に HPCI-SS / HPCISS-tar コンポーネントが2つ以上ある場合、または同一コンポーネントが
  loop 内・再実行で複数回実行される場合** — 実行のたびに同じパスへ書き出すため上書きされ、
  **最後の実行分だけが残る**。
- 各書き出しはその時点の**プロジェクト全体のスナップショット**（対象コンポーネントだけではない）。
  実行タイミングが異なれば各コンポーネントの `state` 等が変わり、内容も異なり得る。

複数コンポーネント分をすべて残したい場合は、パスへ連番／コンポーネントID／タイムスタンプを
付与する改修が必要（現状の実装では非対応）。

## 9. タイムアウト設定

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
