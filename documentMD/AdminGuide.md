# WHEEL administrator's guide
## prerequisites
WHEELの実行にあたって必須のソフトウェアは以下のとおりです。
- docker

## 動作確認環境
以下の2種類のホスト環境で動作確認を行なっています。
1.  ubuntu
- Ubuntu 18.04.2 LTS (Bionic Beaver)
- Docker version 18.09.7, build 2d0083d

2.  macOS
- macOS Catalina (v10.15.5)
- docker desktop 2.3.0.3(45519)


## 初期設定
WHEELを起動する前に、設定ファイルを格納するためのディレクトリ(以下、`CONFIG_DIR`)と、
プロジェクトファイルを格納するためのディレクトリ(以下、`PROJECT_ROOT`)を用意します。
`PROJECT_ROOT`以下にはその後生成されるプロジェクトに関する全データが(実行結果ファイルなども含めて)保存されるため
十分な容量のストレージデバイス上に作成してください。

`CONFIG_DIR`にgithubから次の2つのファイルをダウンロードして保存してください。
-  [jobScheduler.json](https://raw.githubusercontent.com/RIKEN-RCCS/OPEN-WHEEL/master/server/app/config/jobScheduler.json)
-  [server.json](https://raw.githubusercontent.com/RIKEN-RCCS/OPEN-WHEEL/master/server/app/config/server.json)

jobScheduler.jsonファイルには、WHEELがバッチサーバに対してジョブを投入する際に用いる設定が記載されています。
詳細は[jobScheduler setting](#jobScheduler setting)を参照してください。

server.jsonファイルにはWHEELの動作をカスタマイズする変数が記載されています。詳細は[server setting](#server setting)を参照してください。

WHEELはhttpsおよびwssにて通信を行なうため、起動する前にサーバ証明書等を用意する必要があります。
秘密鍵ファイルを `server.key`、証明書ファイルを `server.crt`という名前で`CONFIG_DIR`内に配置してください。
テスト目的やlocalhostでの運用など、自己証明書を用いた運用を行なう場合は、[自己証明書作成ガイド](./self-signed_certification.md)を参照してください。


## 起動方法
```
> docker run -d -v PROJECT_ROOT:/root -v CONFIG_DIR:/usr/src/app/config -p 8089:8089 tmkawanabe/wheel:latest
```
この時、`PROJECT_ROOT`と`CONFIG_DIR`は絶対パスで指定する必要があります。

8089ポートへの転送を指定していますが、このポート番号は後述のserver.json内で変更することもできますので、
変更した場合は起動時のオプショも合わせって変更してください。
また、server.jsonの設定は変更せずに、ホスト側のポート番号のみを変えることで待受ポートを変更することもできます。
例えば、server.jsonはデフォルトのままでwheelの待ち受けポートを3000とする場合、-pオプションを次のように変更してください。

```
-p 3000:8089
```

また、上記の実行例では設定していませんがWHEELが外部アクセスに用いる秘密鍵を
ホストOSと共有する場合は、鍵を保存しているディレクトリをコンテナにマウントする必要があります。
その際、マウントするパスは前述の`PROJECT_ROOT`の外のディレクトリでも問題ありません。

## server setting
WHEELの動作に影響するパラメータは、`server.json`ファイルにjson形式で記述します。
設定可能なプロパティは以下のとおりです。

server.jsonの既定値

```
    "port": 8089,
    "remotehostJsonFile": "remotehost.json",
    "projectListJsonFile": "projectList.json",
    "jobScriptJsonFile": "jobScript.json",
    "interval": 1000,
    "defaultCleanupRemoteRoot": true,
    "logFilename": "wheel.log",
    "numLogFiles": 5,
    "maxLogSize": 8388608,
    "compressLogFile": true,
    "numJobOnLocal": 2,
    "defaultTaskRetryCount": 1,
    "shutdownDelay": 0,
    "rootDir": undefined,
    "gitLFSSize": 200
```

#### port (整数)
WHEELが待ち受けるポート番号を設定します。
整数値かつ、利用可能なポート番号を指定してください。

#### remotehostJsonFile (文字列)
リモートホスト設定を記載するJsonファイルのファイル名を指定します。
app/configディレクトリからの相対パスで指定します。

#### projectListJsonFile(文字列)
WHEELが管理するプロジェクトの一覧を記載するJsonファイルのファイル名を指定します。
app/configディレクトリからの相対パスで指定します。

#### jobScriptJsonFile(文字列)

#### interval (整数)
一部のイベントループを実行するインターバル(ミリ秒単位)

#### defaultCleanupRemoteRoot (真偽値)

プロジェクトのルートコンポーネントでリモート環境に作成した一時ファイルを削除するかどうかの設定が
"上位コンポーネントを参照"となっていた時に、削除する(True)として扱うか、削除しない(False)として扱うかの設定です。

#### logFilename (文字列)
ログファイルのファイル名を指定します。

#### numLogFiles (整数)
ログファイルのローテーションを行なった時に保持するファイル数を指定します。

#### maxLogSize (整数)
ログファイルのローテーションを行うファイルサイズのしきい値を指定します。

#### compressLogFile (真偽値)
ログファイルのローテーションを行なった時に古いファイルを圧縮するかどうかを指定します。

#### numJobOnLocal (整数)
localhostで実行するtaskの同時実行本数を指定します。

#### defaultTaskRetryCount (整数)
taskのリトライ機能を有効にした時にリトライする回数のデフォルト値
本設定の値にかかわらず、taskコンポーネント側でretryを指定しなければretryは行なわれない

#### shutdownDelay (整数)
workflow画面に接続するクライアントが0になってからWHEEL自身のプロセスをkillするまでの待ち時間(ミリ秒単位)

### rootDir (文字列)
プロジェクトファイル等のユーザが作成/使用するファイルを格納するディレクトリのパスを指定します。
デフォルト値は未指定ですが、指定が無い場合は環境変数HOMEが使われ、さらにHOMEが未設定の場合は/が使われます。

### gitLFSSize(整数)
グラフビューでアップロードされたファイルをgit LFSによる管理対象とするかどうかを判断するしきい値をMB単位で指定します。
この値より大きいサイズのファイルはアップロード完了時に`git lfs track`コマンドによってgit LFSの対象として指定されます。

## jobScheduler setting
ワークフローをリモートホスト上で処理する場合、Taskコンポーネントにリモートホストの設定を行います。（Taskコンポーネントに関する詳細は後述）
Taskコンポーネントは、child_process又はsshを用いて指定されたスクリプトを直接実行する以外に、ジョブスケジューラにジョブとして投入することが可能です。
本機能に関する設定は次の5つがあります。
1. Taskコンポーネントの[ useJobScheduler ]プロパティを有効にしている場合、Taskはジョブスケジューラ経由で実行されます。
1. Taskコンポーネントの[ queue ]プロパティには、投入先のキュー名を指定することができます。
null(デフォルト値)が指定されていた場合は、ジョブスケジューラ側で指定されているデフォルトキューに対してジョブが投入されます。
1. ホスト登録画面[ JobScheduler ]には、当該ホストから投入可能なジョブスケジューラの名称を設定します。
1. ホスト登録画面[ Max Job ]には、本プロパティに設定された値以下の投入本数を上限として、WHEELからのジョブ投入を抑制します。
1. ホスト登録画面[ Queue ]で登録したQueue情報は、Taskコンポーネントの[ queue ]プロパティでセレクトボックスとして表示されます。

ジョブスケジューラの定義は"app/config/jobSceduler.json"にて行います。 スケジューラの名称をkeyとし、以下の各keyを持つテーブルを値として各ジョブスケジューラを設定します。

| key | value |
|----|----|
| submit | ジョブ投入に用いるコマンド名 |
| queueOpt | 投入先キューを指定するためのsubmitコマンドのオプション |
| stat | ジョブの状態表示に用いるコマンド名 |
| del | ジョブの削除に用いるコマンド名 |
| reJobID | submitコマンドの出力からジョブIDを抽出するための正規表現 |
| reFinishdState | statコマンドの出力を正常終了と判定するための正規表現 |
| reFailedState | statコマンドの出力を異常終了と判定するための正規表現 |

reJobIDは1つ以上のキャプチャを含む正規表現でなければなりません。また、1つ目のキャプチャ文字列がjobIDを示す文字列として扱われます。
reFinishedStateとreFailedStateは、前者が先に評価され前者がマッチした場合は後者の判定は行なわずに正常終了と判定します。また、両者にマッチしない場合はジョブは実行待ちもしくは実行中と判定します。
※いずれの正規表現もプログラム内でコンパイルして利用するため、正規表現リテラル(//)は使うことができません。

> 富士通 ParallelNaviでの設定は次のようになります。
```
{
　"ParallelNavi": {
    "submit": "pjsub -X",
    "queueOpt": "-L rscgrp=",
    "stat": "pjstat -v -H day=3 --choose st,ec",
    "del": "pjdel",
    "reJobID": "pjsub Job (\\d+) submitted.",
    "reFinishedState": "^ST *EC *\\ nEXT *0",
    "reReturnCode": "^ST *EC *\\nEXT *(\\d+)",
    "reFailedState": "^ST *EC *\\n(CCL|ERR|EXT|RJT)",
    "reJobStatus": "^ST *EC *\\n(\\S+)"
　}
}
```



## WHEELが動作中に作成するファイル
WHEELが動作中に参照するユーザデータの保存先として、以下の2ファイルが使われます。
(ファイル名は、前述のserver.jsonで変更することもできます。)

- remotehost.json
- projectList.json

remotehost.jsonには、ユーザが接続する外部サーバのホスト名、IDなどの情報が平文で保存されています。
定期的にバックアップを取るなど障害への準備を行なうとともに、取り扱いに注意してください。
なお、パスワードおよび秘密鍵のパスフレーズは本ファイル以外にも一切保存しておらず、必要になる都度ユーザから入力を受け取っています。

projectList.jsonには、ユーザが使用するワークフロープロジェクトディレクトリのパスとそれを識別するためのID文字列が保存されています。
本ファイルも定期的にバックアップをとるなどして障害発生時に備えてください。

## 設定ファイル探索ポリシー
WHEELは起動時に、これまでに説明したserver.json, remotehost.json, projectList.jsonファイルの他に
ジョブスケジューラ設定ファイル(jobScheduler.json)、SSL鍵ファイル(server.key)、SSL証明書ファイル(server.crt)
を読み込みます。
これらのファイルは、

1. 起動したユーザの`${HOME}/.wheel` 以下
2. 環境変数 `WHEEL_CONFIG_DIR` で指定されたディレクトリ
3. WHEELのインストール先以下のapp/configディレクトリ

の順に探索され、最初に見つかったファイルのみが読み込まれます。

また、ログファイルの出力も同様のポリシーでディレクトリを探索し、最初に見つかったディレクトリ以下に
wheel.log(server.jsonの設定で変更可能)という名前のファイルに出力します。

## Docker imageのビルド方法
dockerhubで配布されているイメージよりも新しいバージョンを使う場合など、ソースからdocker イメージをビルドする時には
以下の手順でビルドしてください。

```
> cd WHEEL
> docker build -t wheel .
```

この方法で作成したイメージは、"wheel"というイメージ名でアクセスできるので、起動コマンドの末尾にあ
`tmkawanabe/wheel:latest`を`wheel`と変更することでdockerhubにて配布されているイメージと同様に使用できます。


## dockerを使わない起動方法 (非推奨)
### prerequisites
開発用途などでdockerを使わずに起動する場合、以下のソフトウェアがインストールされている必要があります。

- node.js (12以降)
- git
- git lfs
- bash
- python3(option)


### インストール方法
dockerを使わずにホストOSでWHEELを起動する場合は以下の手順でインストールを行ないます。
```
> git clone https://github.com/RIKEN-RCCS/OPEN-WHEEL.git
> cd WHEEL
> npm install
```

`npm install` を実行すると依存するパッケージがnode\_modules以下にインストールされますが、一部のOS(RHELおよびCentOS 7)ではnodegitのインストールに失敗する現象が確認されています。
この場合、`npm install`終了後に次の手順で、nodegitのみを再ビルドしてください。

```
> cd WHEEL/node_modules/nodegit
> BUILD_ONLY=yes npm install
```

### 起動方法
WHEELのインストールディレクトリまたは、そのサブディレクトリ内で以下のコマンドを実行してください。
```
> npm run start
```
