# デプロイ・運用手順

## 1. デプロイ方式

WHEELは以下の2つの方式でデプロイできる。

| 方式 | 説明 | 推奨用途 |
|------|------|---------|
| **Dockerコンテナ** | 公式イメージまたはDockerfileからビルド | 本番環境・CI/CD |
| **直接インストール** | Node.js環境に直接インストール | 開発・デバッグ |

## 2. Dockerコンテナによるデプロイ

### Dockerfile の構成

マルチステージビルドで複数のターゲットが定義されている。

| ターゲット | 用途 |
|-----------|------|
| `base` | 共通ベースイメージ（Node.js + システムパッケージ） |
| `run_base` | npm install済みのベースイメージ |
| `builder` | クライアントビルド専用 |
| `ut` | ユニットテスト実行用 |
| `exec` | 本番実行用（デフォルト） |

### 本番用イメージのビルド

```bash
docker build --target exec -t wheel:latest .
```

### コンテナの起動

```bash
docker run -d \
  -p 8089:8089 \
  -v ~/.wheel:/root/.wheel \
  -v /path/to/projects:/root \
  -e WHEEL_USE_HTTP=true \
  wheel:latest
```

### 主要なマウントポイント

| ホストパス | コンテナパス | 用途 |
|-----------|------------|------|
| `~/.wheel/` | `/root/.wheel/` | 設定ファイル（server.json, remotehost.json等） |
| プロジェクトディレクトリ | `/root/` | WORKFLOWプロジェクトの格納先 |
| SSL証明書 | `/root/.wheel/server.key`, `/root/.wheel/server.crt` | HTTPS使用時 |

### entrypoint.sh の処理

コンテナ起動時に以下の処理が実行される。

```
1. WHEEL_GENERATE_KEYPAIR=YES の場合:
   - ed25519鍵ペアを生成（/tmp_identify, ~/.wheel/wheel_tmp_pubkey）
   
2. WHEEL_ANONYMOUS_LOGIN=YES の場合:
   - anonymousユーザーを作成（WHEEL_ANONYMOUS_PASSWORD が設定されていればそのパスワードで）
   - WHEEL_ENABLE_AUTH=YES を設定して認証を有効化

3. SSH エージェントの起動

4. npm start でサーバー起動
```

### Docker Compose の例

```yaml
version: "3.8"
services:
  wheel:
    build:
      context: .
      target: exec
    ports:
      - "8089:8089"
    volumes:
      - ./wheel_config:/root/.wheel
      - ./projects:/root/projects
    environment:
      - WHEEL_USE_HTTP=true
      - WHEEL_LOG_LEVEL=info
      - WHEEL_NUM_LOCAL_JOB=4
    restart: unless-stopped
```

## 3. 設定ファイルの配置

### ディレクトリ構成例

```
~/.wheel/
├── server.json        # サーバー設定
├── remotehost.json    # リモートホスト定義
├── jobScheduler.json  # ジョブスケジューラ設定
├── server.key         # SSL秘密鍵（HTTPS使用時）
├── server.crt         # SSL証明書（HTTPS使用時）
└── wheel.log          # ログファイル
```

### server.json の初期設定例（本番環境）

```json
{
  "port": 443,
  "useHttp": false,
  "enableAuth": true,
  "logLevel": "info",
  "numLocalJob": 4,
  "numLogFiles": 10,
  "maxLogSize": 10485760,
  "acceptAddress": null
}
```

## 4. ユーザー管理

### ユーザーの追加

```bash
# コンテナ内で実行
node bin/passwordDBTool.js -u <username> -p <password> -c

# コンテナ外から実行
docker exec wheel node bin/passwordDBTool.js -u <username> -p <password> -c
```

### 主要オプション

| オプション | 説明 |
|-----------|------|
| `-u <username>` | ユーザー名 |
| `-p <password>` | パスワード |
| `-c` | ユーザーを作成 |
| `-d` | ユーザーを削除 |
| `-l` | ユーザー一覧を表示 |
| `-A` | 匿名ユーザーを作成（ランダムパスワード） |

## 5. バージョンアップ手順

### 一般的な手順

```bash
# 1. 新バージョンのイメージをビルド
docker build --target exec -t wheel:new .

# 2. 設定ファイルのバックアップ
cp -r ~/.wheel ~/.wheel.backup

# 3. 旧コンテナの停止
docker stop wheel_container

# 4. 新コンテナの起動
docker run -d ... wheel:new

# 5. 動作確認後、旧バックアップを削除
```

### server.json のマイグレーション

サーバー起動時に `migrationHelper.js` が自動的に旧プロパティ名を新名称に変換する。
手動での変更は不要。ただし起動ログの `console.warn` メッセージを確認すること。

### 廃止環境変数の確認

起動時に廃止された環境変数が設定されている場合、`console.warn` で警告が表示される。
警告メッセージに従って環境変数を新しい名称に変更する。

現在の廃止変数:
| 旧変数名 | 新変数名 |
|---------|---------|
| `WHEEL_LOGLEVEL` | `WHEEL_LOG_LEVEL` |

## 6. SSL証明書の管理

### 自己署名証明書の作成

```bash
openssl req -x509 -newkey rsa:4096 \
  -keyout ~/.wheel/server.key \
  -out ~/.wheel/server.crt \
  -days 365 -nodes
```

詳細は [self-signed_certification.md](./self-signed_certification.md) を参照。

### Let's Encrypt 証明書の使用

Let's Encrypt で取得した証明書を `server.key` / `server.crt` として配置する。
証明書の更新時はコンテナを再起動する必要がある。

## 7. ログ管理

### ログファイルの場所

- デフォルト: `{projectRootDir}/wheel.log`
- ログファイルは `numLogFiles` 世代分保存される
- `compressLogFile: true` で古いファイルをgzip圧縮

### ログレベルの変更（再起動不要・環境変数経由）

```bash
# コンテナの再起動なしには変更できない（起動時に設定が読み込まれるため）
docker restart wheel_container
```

### ログの確認

```bash
# コンテナのコンソールログ
docker logs wheel_container

# プロジェクトのログファイル
tail -f /path/to/project/wheel.log
```

## 8. バックアップ

### バックアップすべき対象

| 対象 | 説明 |
|------|------|
| `~/.wheel/*.json` | 全設定ファイル |
| `~/.wheel/user.db` | ユーザー認証DB |
| プロジェクトディレクトリ | 全プロジェクトファイル |

### セッションDBについて

`session.db` はセッション情報のみであり、バックアップ不要。
`WHEEL_CLEAR_SESSION_DB=1` 環境変数でクリアできる（ユーザーの強制ログアウト）。

## 9. リバースプロキシ設定

nginxやApacheの後ろにWHEELを配置する場合、`baseURL` を設定する。

```json
{
  "baseURL": "/wheel"
}
```

#### nginx の設定例

```nginx
location /wheel {
  proxy_pass http://localhost:8089;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
}
```

Socket.IO の WebSocket 通信のために `Upgrade` ヘッダーの転送が必須。

## 10. トラブルシューティング

### サーバーが起動しない

1. SSL証明書のパスを確認（HTTPS使用時）
2. ポートが使用中でないか確認: `lsof -i :8089`
3. 必須コマンドの存在を確認: `which rsync ssh git`
4. `WHEEL_USE_HTTP=true` で HTTP モードを試す

### ログが出力されない

- `logLevel` が `OFF` になっていないか確認
- ログファイルへの書き込み権限を確認

### 認証でログインできない

- `user.db` のパスを確認（`WHEEL_USER_DB_DIR`）
- ユーザーが作成されているか確認: `node bin/passwordDBTool.js -l`
