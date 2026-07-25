---
title: SSH認証の設定
lang: ja
permalink: /reference/2_remotehost_screen/ssh_auth/
toc: true
toc_sticky: true
---

本ドキュメントでは、WHEELからリモートホストへSSH接続する際の認証設定について説明します。

## 1. WHEELのSSH接続の仕組み

WHEELは `ssh-client-wrapper` ライブラリを使用してリモートホストへ接続します。
このライブラリはシステムにインストールされたOpenSSHクライアント（`ssh`コマンド）を内部で呼び出します。
そのため、OpenSSHの設定（`~/.ssh/config`）をそのまま活用することができます。

WHEELがSSH接続を確立する際には、ControlMaster機能を使用して
マスター接続を1本維持し、以後の接続はそのマスター接続を再利用します。
これにより、繰り返されるファイル転送やコマンド実行のたびに
認証処理を行う必要がなくなります。

## 2. 認証方式

WHEELは以下の認証方式をサポートしています。

### 2.1 パスワード認証

リモートホスト設定の `use public key authentication` スイッチを **無効** にすると、
パスワード認証が使用されます。

プロジェクト実行時に、パスワード入力ダイアログが表示されます。

入力されたパスワードはメモリ上に保持され、同一プロジェクト実行中は再入力不要です。
ただし、接続が切断・再接続された場合は再度入力が求められます。

### 2.2 公開鍵認証（秘密鍵ファイル指定）

リモートホスト設定の `use public key authentication` スイッチを **有効** にすると、
公開鍵認証が使用されます。

`private key path` フィールドに秘密鍵ファイルのパスを指定します。
（WHEELサーバが動作しているマシン上のパスを指定してください。）

秘密鍵にパスフレーズが設定されている場合は、プロジェクト実行時に
パスフレーズ入力ダイアログが表示されます。

公開鍵認証を使用する場合、WHEELは自動的にSSHエージェントフォワーディング（`-A`オプション）を有効にします。
これにより、リモート→リモート間のファイル転送が可能になります。

### 2.3 ssh-agent を使用した認証（パスフレーズ省略）

`ssh-agent` を使用することで、パスフレーズの繰り返し入力を省略できます。

#### 手順

1. SSHエージェントを起動します（通常はログインシェル起動時に自動起動されます）。

   ```bash
   eval "$(ssh-agent -s)"
   ```

2. 秘密鍵をエージェントに登録します。

   ```bash
   ssh-add ~/.ssh/id_ed25519
   ```

3. `~/.ssh/config` に以下を追加します。

   ```
   Host *
     AddKeysToAgent yes
   ```

   `AddKeysToAgent yes` を設定すると、初回接続時に秘密鍵がエージェントに自動登録されます。
   以後はパスフレーズを入力することなくSSH接続が行われます。

{% capture notice-ssh-agent %}
__Dockerコンテナ上でWHEELを使用する場合__

コンテナ内のWHEELプロセスがホストのssh-agentを使用するには、
SSHエージェントのソケットをコンテナにマウントする必要があります。

```bash
docker run -d \
  -v "${SSH_AUTH_SOCK}:/ssh-agent" \
  -e SSH_AUTH_SOCK=/ssh-agent \
  ... \
  tmkawanabe/wheel:latest
```

このようにすることで、コンテナ内のWHEELからホストのssh-agentが使用できるようになります。
{% endcapture %}
<div class="notice--info">{{ notice-ssh-agent | markdownify }}</div>

### 2.4 OpenOnDemand（Fugaku）の使い捨て鍵を利用した認証

RIKEN-RCCSが提供するFugaku向けOpenOnDemandポータルには、WHEELをインタラクティブアプリとして起動するための
アプリ定義（[so5/ondemand_fugaku](https://github.com/so5/ondemand_fugaku/tree/main/WHEEL)）が用意されています。

このアプリの起動フォームで `Key Mode` を **`Single-use key pair`** に設定すると、
WHEELインスタンスが自動的に鍵ペアを生成し、Fugakuログインノードの `~/.ssh/authorized_keys` と
`~/.ssh/config` を更新します。生成された鍵ペアは、WHEELインスタンス終了時に自動的に無効化される
使い捨て（一度限り）の鍵です。

#### 自動的に行われる処理

`Single-use key pair` を選択して起動すると、以下の処理が自動的に行われます。

1. WHEELコンテナ起動時（`entrypoint.sh`）に ed25519 鍵ペアが生成される。
   - 秘密鍵: `/tmp_identify`
   - 公開鍵: `~/.wheel/wheel_tmp_pubkey`
2. WHEELサーバの起動が確認された後、生成された公開鍵がFugakuログインノードの
   `~/.ssh/authorized_keys` に追記される。
3. `~/.ssh/config` に以下のエントリが追記される。

   ```
   HOST login.fugaku.r-ccs.riken.jp
     IdentityFile /tmp_identify
   ```

4. WHEELインスタンス終了時、上記で追加された `authorized_keys` の1行と
   `~/.ssh/config` のエントリは自動的に削除される。

#### WHEEL側で手動設定が必要な項目（初回のみ）

上記の処理はFugaku側の認証設定のみを行うものです。「この鍵でどのリモートホストに接続するか」は、
WHEELのリモートホスト設定ダイアログから**利用者自身が登録する必要があります**。

1. [リモートホスト設定ダイアログ]({{ site.baseurl }}/reference/2_remotehost_screen/)で、
   Fugakuログインノードを次の内容で新規登録する。

   | 項目 | 設定値 |
   |------|--------|
   | Hostname | `login.fugaku.r-ccs.riken.jp` |
   | User | Fugakuのユーザ名 |
   | use public key authentication | 有効 |
   | private key path | `/tmp_identify` |

2. 秘密鍵のパス（`/tmp_identify`）は使い捨て鍵の生成先として常に固定されているため、
   一度上記の設定を行っておけば、次回以降 `Single-use key pair` モードでWHEELを起動した際にも
   同じリモートホスト設定をそのまま再利用できます
   （`remotehost.json` は `~/.wheel/` 配下に保存され、WHEELインスタンスをまたいで保持されるため）。

{% capture notice-single-use %}
__注意__

`Single-use key pair` モードで生成される鍵は、WHEELインスタンスが終了すると同時に
Fugaku側の `authorized_keys` から削除されます。そのため、この鍵を使ったリモートホスト設定は
**同じOpenOnDemandセッション中のみ**有効です。

セッションをまたいで永続的に使用したい場合は、`Your own key pair` モードを選択し、
[2.2 公開鍵認証（秘密鍵ファイル指定）](#22-公開鍵認証秘密鍵ファイル指定)の手順に従って
自分自身の鍵ペアを登録してください。
{% endcapture %}
<div class="notice--warning">{{ notice-single-use | markdownify }}</div>

## 3. `~/.ssh/config` の活用

WHEELはOpenSSHクライアントを使用するため、`~/.ssh/config` で設定した内容が反映されます。

### 3.1 基本的な設定例

```
# リモートホストの共通設定
Host hpc-cluster
  HostName hpc.example.ac.jp
  User yamada
  IdentityFile ~/.ssh/id_ed25519_hpc
  AddKeysToAgent yes
```

リモートホスト設定の `Hostname` フィールドに `hpc.example.ac.jp` を指定する代わりに、
`~/.ssh/config` で設定したエイリアス（上記例では `hpc-cluster`）をそのまま使用できます。

### 3.2 ProxyJump（多段SSH接続）

踏み台サーバ経由でリモートホストに接続する場合は、`ProxyJump` を使用します。

```
# 踏み台サーバの設定
Host bastion
  HostName bastion.example.ac.jp
  User yamada
  IdentityFile ~/.ssh/id_ed25519

# 踏み台経由でHPCに接続
Host hpc-internal
  HostName hpc-internal.example.ac.jp
  User yamada
  IdentityFile ~/.ssh/id_ed25519_hpc
  ProxyJump bastion
```

WHEELのリモートホスト設定の `Hostname` フィールドに `hpc-internal` を指定するだけで、
踏み台サーバを経由した接続が自動的に行われます。

### 3.3 よく使用する設定項目

| 設定項目 | 説明 |
|---------|------|
| `HostName` | 実際のホスト名またはIPアドレス |
| `User` | ログインユーザ名 |
| `Port` | 接続先ポート番号（デフォルト: 22） |
| `IdentityFile` | 使用する秘密鍵ファイルのパス |
| `ProxyJump` | 踏み台サーバの指定（多段SSH） |
| `AddKeysToAgent` | 初回接続時にssh-agentへ鍵を自動登録するか（`yes`/`no`） |
| `ServerAliveInterval` | 接続維持のためのKeepAlive間隔（秒） |
| `ServerAliveCountMax` | KeepAliveの最大試行回数 |
| `StrictHostKeyChecking` | ホスト鍵の確認方式（`yes`/`no`/`accept-new`） |

### 3.4 `StrictHostKeyChecking` について

初回接続時に `~/.ssh/known_hosts` にホスト鍵が登録されていない場合、
SSH接続が失敗することがあります。

事前にSSH接続を試みて `known_hosts` に登録しておくか、以下の設定を使用してください。

```
Host hpc.example.ac.jp
  StrictHostKeyChecking accept-new
```

`accept-new` は初回接続時に自動的に鍵を登録し、それ以後は変更を検出した場合に警告します。

{% capture notice-strict %}
__注意__

`StrictHostKeyChecking no` はホスト鍵の検証を完全に無効にするため、
セキュリティ上のリスクがあります。本番環境での使用は推奨しません。
{% endcapture %}
<div class="notice--warning">{{ notice-strict | markdownify }}</div>

## 4. ControlMaster / ControlPersist の動作

WHEELは内部的にOpenSSHの **ControlMaster** 機能を使用しています。
最初のSSH接続（マスター接続）を確立した後、以降の接続はそのマスター接続を再利用します。

### ControlPersist の設定

マスター接続の維持時間は、リモートホスト設定の
`connection renewal interval (min.)` フィールドで制御します。

| 設定値 | 動作 |
|-------|------|
| `0`（デフォルト） | 接続を切断しない（プロジェクト終了まで維持） |
| `N`（分） | 最後のクライアント接続終了後 N 分でマスター接続を切断 |

### ControlPath ファイルの保存先

ControlPath（マスター接続のソケットファイル）はデフォルトで `~/.ssh/` に保存されます。

保存先を変更するには、環境変数 `SSH_CONTROL_PERSIST_DIR` に
書き込み可能なディレクトリのパスを設定します。

```bash
export SSH_CONTROL_PERSIST_DIR=/tmp/ssh-sockets
mkdir -p /tmp/ssh-sockets
```

{% capture notice-control-socket %}
__Control socket creation failed エラーについて__

NFS等のネットワークファイルシステム上に `~/.ssh/` がある場合、
ControlPath ファイルの作成が失敗することがあります。

このような場合は `SSH_CONTROL_PERSIST_DIR` をローカルファイルシステム上の
ディレクトリ（`/tmp` 配下など）に設定してください。

```bash
export SSH_CONTROL_PERSIST_DIR=/tmp/wheel-ssh-sockets
```
{% endcapture %}
<div class="notice--warning">{{ notice-control-socket | markdownify }}</div>

## 5. よくある問題と対処法

### 5.1 接続テストが失敗する

リモートホスト設定ダイアログの **TEST** ボタンで接続確認が行えます。
失敗する場合は以下を確認してください。

1. **ホスト名・ポート番号・ユーザ名** が正しいか確認する
2. リモートホスト側で **公開鍵が登録されているか** 確認する（`~/.ssh/authorized_keys`）
3. ターミナルで直接 `ssh` コマンドで接続を試みる

   ```bash
   ssh -i /path/to/key user@hostname
   ```

4. `known_hosts` にホスト鍵が登録されているか確認する

   ```bash
   ssh-keygen -F hostname
   ```

### 5.2 パスフレーズ入力ダイアログが毎回表示される

ssh-agent を使用することでパスフレーズ入力を省略できます。
[2.3 ssh-agent を使用した認証](#23-ssh-agent-を使用した認証パスフレーズ省略) を参照してください。

また、`~/.ssh/config` に `AddKeysToAgent yes` を設定することで、
初回接続後は自動的にエージェントが鍵を保持します。

### 5.3 多段SSH接続でタイムアウトする

踏み台サーバの設定で `ServerAliveInterval` を設定して接続を維持してください。

```
Host bastion
  ServerAliveInterval 60
  ServerAliveCountMax 3
```

### 5.4 SSH接続のデバッグログを出力する

`server.json` の `verboseSsh` を `true` に設定（または環境変数 `WHEEL_VERBOSE_SSH=true`）すると、
SSH接続時に詳細ログ（`-vvv` オプション相当）が出力されます。

```json
{
  "verboseSsh": true
}
```

ログはWHEELのログファイル（`wheel.log`）に記録されます。
問題解決後は `false` に戻すことを推奨します（ログ量が大幅に増加するため）。

--------
[リモートホスト設定ダイアログに戻る]({{ site.baseurl }}/reference/2_remotehost_screen/)

[リファレンスマニュアルのトップページに戻る]({{ site.baseurl }}/reference/)
