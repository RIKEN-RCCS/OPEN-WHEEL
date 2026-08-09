#APIガイド
本ドキュメントでは、WHEELのサーバクライアント間で発生するSocket.IOによる通信APIについて述べます。

<!-- vim-markdown-toc GitLab -->

* [全般的な注意事項](#全般的注意事項)
* [home画面で発生する通信(server -> client)](#home画面発生通信server-client)
    * [projectList(project[])](#projectlistproject)
    * [fileList(file[])](#filelistfile)
    * [showMessage(message)](#showmessagemessage)
* [home画面で発生する通信(client -> server)](#home画面発生通信client-server)
    * [getProjectList(cb)](#getprojectlistcb)
    * [getDirList(path, cb)](#getdirlistpath-cb)
    * [getDirListAndProjectJson(path, cb)](#getdirlistandprojectjsonpath-cb)
    * [addProject(projectDir, description, cb)](#addprojectprojectdir-description-cb)
    * [importProject(jsonFilename, cb)](#importprojectjsonfilename-cb)
    * [removeProject(id, cb)](#removeprojectid-cb)
    * [renameProject(renameProject, cb)](#renameprojectrenameproject-cb)
    * [reorderProject(newOrder, cb)](#reorderprojectneworder-cb)
* [workflow画面で発生する通信一覧(server -> client)](#workflow画面発生通信一覧server-client)
    * [fileList](#filelist)
    * [results(result[])](#resultsresult)
    * [workflow(Component)](#workflowcomponent)
    * [projectState(status)](#projectstatestatus)
    * [projectJson(projectJson)](#projectjsonprojectjson)
    * [taskStateList(taskState[])](#taskstatelisttaskstate)
    * [logXXXX(message)](#logxxxxmessage)
    * [askPassword(remoteHost)](#askpasswordremotehost)
    * [askSourceFilename(id, name, description, filelist)](#asksourcefilenameid-name-description-filelist)
    * [requestSourceFile(id, name, description)](#requestsourcefileid-name-description)
    * [hostList(hostInfo[])](#hostlisthostinfo)
* [workflow画面で発生する通信一覧(client -> server)](#workflow画面発生通信一覧client-server)
* [File操作関連API](#file操作関連api)
    * [getFileList(path, cb)](#getfilelistpath-cb)
    * [getSNDContents(path, name, idDir, cb)](#getsndcontentspath-name-iddir-cb)
    * [removeFile(path, cb)](#removefilepath-cb)
    * [renameFile(renameFile, cb)](#renamefilerenamefile-cb)
    * [downloadFile(downloadFile, cb)](#downloadfiledownloadfile-cb)
    * [createNewFile(filename, cb)](#createnewfilefilename-cb)
    * [createNewDir(dirname, cb)](#createnewdirdirname-cb)
* [workflow編集API](#workflow編集api)
    * [getWorkflow(ID, cb)](#getworkflowid-cb)
    * [createNode(node, cb) [検討中 引数に親コンポーネントのIDを含める]](#createnodenode-cb-検討中-引数親id含)
    * [updateNode(ID, property, value, cb)](#updatenodeid-property-value-cb)
    * [removeNode(ID, cb)](#removenodeid-cb)
    * [addLink(link, cb)](#addlinklink-cb)
    * [removeLink(link, cb)](#removelinklink-cb)
    * [addInputFile(ID, name, cb)](#addinputfileid-name-cb)
    * [addOutputFile(ID, name, cb)](#addoutputfileid-name-cb)
    * [removeInputFile(ID, name, cb)](#removeinputfileid-name-cb)
    * [removeOutputFile(ID, name, cb)](#removeoutputfileid-name-cb)
    * [renameInputFile(ID, newName, cb)](#renameinputfileid-newname-cb)
    * [renameOutputFile(ID, newName, cb)](#renameoutputfileid-newname-cb)
    * [addFileLink(srcNode, srcName, dstNode, dstName, cb)](#addfilelinksrcnode-srcname-dstnode-dstname-cb)
    * [removeFileLink(srcNode, srcName, dstNode, dstName, cb)](#removefilelinksrcnode-srcname-dstnode-dstname-cb)
    * [getHostList(cb)](#gethostlistcb)
* [Project実行、編集関連API](#project実行編集関連api)
    * [runProject(cb)](#runprojectcb)
    * [pauseProject(cb)](#pauseprojectcb)
    * [cleanProject(cb)](#cleanprojectcb)
    * [stopProject(cb)](#stopprojectcb)
    * [cleanComponent(id, cb)](#cleancomponentid-cb)
    * [password(pw, cb)](#passwordpw-cb)
    * [sourceFile(id, filename, cb)](#sourcefileid-filename-cb)
    * [getTaskStateList(cb) [変更あり 引数はcbのみになりました]](#gettaskstatelistcb-変更-引数cb)
    * [getProjectState(cb) [変更あり 引数はcbのみになりました]](#getprojectstatecb-変更-引数cb)
    * [getProjectJson( cb) [変更あり 引数はcbのみになりました]](#getprojectjson-cb-変更-引数cb)
    * [updateProjectJson(property, value, cb)](#updateprojectjsonproperty-value-cb)
    * [saveProject(null, cb)](#saveprojectnull-cb)
    * [revertProject(null, cb)](#revertprojectnull-cb)
* [remotehost画面で発生する通信一覧(server -> client)](#remotehost画面発生通信一覧server-client)
    * [hostList(hostInfo[])](#hostlisthostinfo-1)
    * [fileList](#filelist-1)
    * [JobSchedulerList(JobSchduler[])](#jobschedulerlistjobschduler)
* [remotehost画面で発生する通信一覧(client -> server)](#remotehost画面発生通信一覧client-server)
    * [getHostList(cb)](#gethostlistcb-1)
    * [addHost(hostInfo, cb)](#addhosthostinfo-cb)
    * [updateHost(hostInfo, cb)](#updatehosthostinfo-cb)
    * [removeHost(id, cb)](#removehostid-cb)
    * [getFileList(path, cb)](#getfilelistpath-cb-1)
    * [tryConnectHostById(id, passwrod, cb)](#tryconnecthostbyidid-passwrod-cb)
    * [tryConnectHost(sshTeset, passwod, cb)](#tryconnecthostsshteset-passwod-cb)
<!-- vim-markdown-toc -->

## 全般的な注意事項
WHEEL内で行なわれるSocket.IOの通信は、全てURLと同名のnamespace内で行なわれます。

各APIの説明は、イベント名を仮想的な関数名として記述しています。
したがって、 hoge(foo, bar)は、socket.emit("hoge", foo, bar)を意味します。

以降の説明において "cb" はboolean値をひとつ引数にとるコールバック関数を表します。
APIの要求が正常に処理された場合はtrue, 継続不可能なエラー発生時はfalseを引数としてこの関数を呼び出します。
なお、cb引数は全て省略可能です。

データ形式の記述はJSDocの形式に準じます。したがって"[]"がつくものは、その型のデータが0以上入った配列を意味します。

## home画面で発生する通信(server -> client)
#### projectList(project[])
登録済のプロジェクト一覧を送ります。

projectデータの形式は以下のとおり。

| property       | data type |  description
|----------------|:---------:|------------------------------------------------------
| version        | number    | 2固定
| name           | string    |
| description    | string    |
| state          | string    |
| root           | string    | プロジェクトのrootディレクトリの絶対パス
| ctime          | string    | 作成時刻
| mtime          | string    | 最終更新時刻
| componentPath  | Object    | コンポーネントIDをkey,各コンポーネントのディレクトリをvalueとしたmap
| id             | string    | プロジェクト毎に振られた一意なID文字列


#### fileList(file[])
getDirList APIで要求されたディレクトリ内のコンテンツを返します。

fileデータの形式は以下のとおり。

| property | data type |  description
|----------|:---------:|------------------------------------------------------
| path     | string    | 要求された時のディレクトリパス
| name     | string    | ファイル又はディレクトリ名
| type     | string    | {dir, file, snd, sndd, deadlink}のいずれか。
| islink   | boolean   | 送信されるデータがシンボリックリンクかどうかのフラグ

typeの値の意味は次のとおり

- dir: ディレクトリ
- file: ファイル
- snd: 連番ファイル
- sndd: 連番ディレクトリ
- deadlink: リンク先の実体が無いシンボリックリンク


#### showMessage(message)
- @param { string } message - エラーメッセージ

サーバサイドで発生したエラーメッセージを送信します。


## home画面で発生する通信(client -> server)
#### getProjectList(cb)
プロジェクト一覧の送信を要求します。
データは、projectList APIを介して送信されてきます。


#### getDirList(path, cb)
- @param { string } path - ディレクトリ一覧を要求するディレクトリ

引数で渡されたディレクトリ内に存在するディレクトリの一覧がfileList APIを介して送信されてきます。


#### getDirListAndProjectJson(path, cb)
- @param { string } path - ディレクトリ一覧を要求するディレクトリ

getDirListと同様ですが、ディレクトリ一覧に加えて、もし存在すればprojectJsonファイルも送られます。


#### addProject(projectDir, description, cb)
- @param { string } projectDir - プロジェクトrootディレクトリの絶対パス
- @param { string } description - プロジェクトの説明文

新規プロジェクトを作成します。

projectDirのデリミタは、'/'でも'\'でも受け付けます。
projectDirの末尾にsuffix(.wheel)が無い場合は付与されたディレクトリが作成されます。

descriptionにnullが指定された場合は、デフォルト値が使われます。


#### importProject(jsonFilename, cb)
- @param {string} jsonFilename - projectJsonファイルの絶対パス
- @param {string} description - インポート後のプロジェクト説明文

既存プロジェクトをインポートします。
インポート時に旧バージョンのプロジェクト(versionプロパティが存在しないもの)であればversion2の形式に変換します。

#### removeProject(id, cb)
- @param {string} name - プロジェクトID

既存プロジェクトを削除します。


#### renameProject(renameProject, cb)
- @param {Object} renameProject
- @param {string} renameProject.id      - プロジェクトID
- @param {string} renameProject.path    - プロジェクトディレクトリのパス
- @param {string} renameProject.newName - 変更後の名前

既存プロジェクトのnameを変更し、プロジェクトルートディレクトリをnameに合わせて変更します。


#### reorderProject(newOrder, cb)
- @param {number []} newOrder - 旧並び順でのindex(0 origin)のリスト

プロジェクトリストを引数に指定された順に並べ変えます。


## workflow画面で発生する通信一覧(server -> client)
#### fileList
home画面の同名のAPIと同じ

#### results(result[])
viewer コンポーネントに送られてきたファイルの情報を送ります。

resultのデータ形式は以下のとおり
| property       | data type |  description
|----------------|:---------:|------------------------------------------------------
| componentID    | string    | viewerコンポーネントのID
| filename       | string    | ファイル名
| url            | string    | 公開ファイルのURL


#### workflow(Component)
要求されたコンポーネントと、その子および孫コンポーネントを送ります。

要求されたコンポーネントが子コンポーネントを持つ時は、Componentオブジェクトに、descendantsプロパティが追加されており
同プロパティは子コンポーネントの配列を持ちます。

descendantsに含まれる各子コンポーネントがさらに子コンポーネント(要求されたコンポーネントの孫)を持つ時は、
grandsonプロパティが追加されており、同プロパティは孫コンポーネントの配列を持ちます。
ただし、孫コンポーネントのプロパティは、taskの時は、type, pos, host, useJobSchedulerのみ、それ以外はtype, posのみが保持されています。

その他のプロパティはapp/core/workflowComponent.jsを参照してください。


#### projectState(status)
実行中のprojectの状態を送ります。

statusが取り得る値は以下のとおりです。
- not-started
- running
- finished
- pause
- failed
- unknown

#### projectJson(projectJson)
project全体のメタデータを記述したJSONを送信

projectJsonデータは、home画面のprojectListAPIで送られる、projectデータからidを除いたものです。


#### taskStateList(taskState[])
実行中のtaskの状態を送ります。
送られてくる配列には全てのtaskは含まれておらず、
前回の送信時以降で、更新があった(もしくは新規に作成された)taskのみのデータが入っています。

taskStateのデータ形式は以下のとおり。

| property       | data type |  description
|----------------|:---------:|------------------------------------------------------
| name           | string    | taskの名前
| ID             | string    | task毎に固有のID文字列 (ループ,PSコンポーネント内のtaskは重複する可能性あり)
| subID          | string    | task毎に固有のID文字列 (一意だが、コンポーネントJSONファイルに書かれたIDとの紐付けなし)
| description    | string    |
| state          | string    |
| parentName     | string    | 親コンポーネントの名前
| parentType     | string    | 親コンポーネントの種類
| ancestorsName  | string    | root以降の親コンポーネントの名前を/区切りで結合したもの
| ancestorsType  | string    | root以降の親コンポーネントの種類を/区切りで結合したもの
| dispatchedTime | string    | dispatchされた時刻
| startTime      | string    | 実行開始日時(未実行のものはnull)
| endTime        | string    | 実行完了日時(未完了のものはnull)


#### logXXXX(message)
- @param {string} message - ログ出力

サーバサイドの処理中に発生したログ出力を送信します。

実際のイベント名はログのカテゴリ毎に異なる名前になっており、以下の7種類が使われます。
| event name | description
|------------|------------------------------------------------------------
| logINFO    | メッセージ
| logWARN    | ワーニング
| logERR     | エラーメッセージ
| logStdout  | ローカルホストで実行されたtaskの標準出力
| logStderr  | ローカルホストで実行されたtaskの標準エラー出力
| logSSHout  | リモートホストで実行されたtaskの標準出力
| logSSHerr  | リモートホストで実行されたtaskの標準エラー出力


#### askPassword(remoteHost, cb)
- @param {string} remoteHost - パスワードを要求するホスト名

リモートホストへアクセスする時に使うパスワード(またはパスフレーズ)の入力を要求します。
ユーザが入力したパスワードはcb関数の第一引数としてサーバに渡します。


#### askSourceFilename(id, name, description, filelist)
- @param {string} id - ファイルの選択を要求しているsourceコンポーネントのid文字列
- @param {string} name - ファイルの選択を要求しているsourceコンポーネントの名前
- @param {string} description - ファイルの選択を要求しているsourceコンポーネントのdescription
- @param {string[]} filelist - ソースコンポーネント内のファイル候補のリスト

複数ファイルが用意されているソースコンポーネントで実際に使うファイルの選択を要求します。


#### requestSourceFile(id, name, description)
- @param {string} name - ファイルのアップロードを要求しているsourceコンポーネントの名前
- @param {string} description - ファイルのアップロードを要求しているsourceコンポーネントのdescription

uploadOnDemandプロパティがtruethyなソースコンポーネントへのファイルのアップロードを要求します。


#### hostList(hostInfo[])
remotehost設定の一覧を送ります。

hostInfoのデータ形式は以下の2形式が存在します。

通常ホスト
| property              | data type      |  description
|-----------------------|:--------------:|------------------------------------------------------
| name                  | string         | 設定情報の表示名
| id                    | string         | 設定情報につける一意な識別子(サーバ側で新規作成時に付与)
| host                  | string         | ホスト名 or IPアドレス
| path                  | string         | 接続先での作業ディレクトリ
| username              | string         | ユーザ名
| keyFile               | string or null | 公開鍵接続に使う鍵のファイルパス(パスワード接続の時はnull)
| [numJob]              | number         | 接続先ホストから同時に投入できる最大ジョブ数
| [queue]               | string         | 接続先ホストからジョブを投入する時に使えるキューの一覧をカンマ区切りで並べたもの。
| [stepjob]             | boolean        | 本ホストを用いたWHEELのステップジョブ機能の有効化 ＊
| [bulkjob]             | boolean        | 本ホストを用いたWHEELのバルクジョブ機能の有効化 ＊
| [port]                | number         | ssh接続に使うポート番号 (default 22)
| [jobScheduler]        | string         | そのホストで使われているジョブスケジューラの名称
| [renewInterval]       | number         | ssh接続を再接続する間隔(単位は分)
| [renewDelay]          | number         | 再接続時に、切断後に挟む待ち時間(単位は秒)
| [execInterval]        | number         | ジョブ投入、実行時に間に挟む待ち時間(単位は秒)
| [statusCheckInterval] | number         | ジョブ投入後のステータス確認を行う間隔(単位は秒)
| [maxStatusCheckError] | number         | statusCheckに失敗した時に、ジョブ自体をfailedとするしきい値 
＊ WHEELのステップジョブ/バルクジョブ機能を使用する場合は、使用するホストがステップジョブ/バルクジョブ機能を持ち  
　ユーザがステップジョブ/バルクジョブの利用権限を持っている必要があります。

AWS

username, keyFileを除く通常版の全プロパティに加えて、以下のデータが追加されています。

各プロパティの意味などは、Cloud.mdを参照のこと
```
{
  "type": "aws",
  "os": "ubuntu16",
  "region": "ap-northeast-1",
  "numNodes": 2,
  "InstanceType": "t2.micro",
  "rootVolume": 30,
  "shareStorage": true,
  "playbook": "not used for now",
  "mpi": "not used for now",
  "compoiler": "not used for now",
  "additionalParams": {},
  "additionalParamsForHead": {},
}
```


## workflow画面で発生する通信一覧(client -> server)
## File操作関連API
#### getFileList(path, cb)
- @param {string} path - ファイル一覧の送信を要求するディレクトリの絶対パス

指定されたディレクトリ内に存在するファイル、ディレクトリ等の送信を要求します。
データはfileListAPIで送られてきます。

#### getSNDContents(path, name, idDir, cb)
- @param {string} path - 対象となるSerialNumberDataの親ディレクトリ
- @param {string} name - SNDの名前 (= globパターン)
- @param {boolean} isDir - SNDを連番ディレクトリとみなす(true)か連番ファイルとみなす(false)かのフラグ


fileList APIで送られてきたSND(SerialNumberData)に含まれるファイル名の一覧の送信を要求します。
データはfileListAPIで送られてきます。

#### removeFile(path, cb)
- @param {string} path -削除対象ファイル/ディレクトリのパス

ファイルまたはディレクトリの削除を要求します。

#### renameFile(renameFile, cb)
ファイル又はディレクトリ名の変更を要求します。

renameFileデータの形式は以下のとおり

| property | data type |  description
|----------|:---------:|------------------------------------------------------
| path     | string    |  変更対象の親ディレクトリの絶対パス
| oldName  | string    |  変更前の名前
| newName  | string    |  変更後の名前


#### downloadFile(downloadFile, cb)
- @param {string} path - ダウンロードするファイルの絶対パス

ファイルの送信を要求します。

downloadFile オブジェクトのデータ形式は以下のとおり

| property | data type |  description
|----------|:---------:|------------------------------------------------------
| path     | string    |  要求するファイルが存在するディレクトリのパス
| name     | string    |  ファイル名

#### createNewFile(filename, cb)
- @param {string} filename - 新規に作成するファイルの絶対パス

空ファイルを作成する

#### createNewDir(dirname, cb)
- @param {string} dirname - 新規に作成するディレクトリの絶対パス

空ディレクトリを作成する


## workflow編集API
#### getWorkflow(ID, cb)
- @param {string} ID - 要求するコンポーネントのID

指定されたワークフローデータおよびその子、孫コンポーネントの送信を要求します。
データはworkflowコンポーネントで送られてきます。

#### createNode(node, cb) [検討中 引数に親コンポーネントのIDを含める]
新規ノードを作成します。

nodeデータの形式は以下のとおり

| property | data type |  description
|----------|-----------|------------------------------------------------------
| type     | string    | ノードの種類
| pos      | object    | ノードの表示位置を示すオブジェクト。propertyは次の2つ
| pos.x    | number    | ノードのx座標
| pos.y    | number    | ノードのy座標

#### updateNode(ID, property, value, cb)
- @param {string} ID - 変更するコンポーネントのID
- @param {string} property - 変更するプロパティ
- @param {string} value -    変更後の値

既存ノードのプロパティを更新する汎用APIです。

#### removeNode(ID, cb)
- @param {string} ID - 削除するコンポーネントのID

既存のノードを削除します。

#### addLink(link, cb)
ノード間の依存関係を追加します。

linkデータの形式は以下のとおり
なお、src, dstのインデックスは形式が変更される予定

| property | data type |  description
|----------|-----------|------------------------------------------------------
| src      | string    | link元ノードのID
| dst      | string    | link先ノードのID
| isElse   | boolean   | (ifノードの)else側のリンクを示すフラグ

#### removeLink(link, cb)
ノード間の依存関係削除

linkデータの形式はaddLink APIと同じ

#### addInputFile(ID, name, cb)
- @param {string} ID - inputFileエントリを追加するノードのインデックス
- @param {string} name - inputFileの名前

未接続のinputFileを指定されたノードに追加します。

#### addOutputFile(ID, name, cb)
- @param {string} ID - outputFileエントリを追加するノードのインデックス
- @param {string} name - outputFileの名前

未接続のoutputFileを指定されたノードに追加します。

#### removeInputFile(ID, name, cb)
- @param {string} ID - inputFileエントリを削除するノードのインデックス
- @param {string} name - inputFileの名前

指定された名前のinputFileを削除します。同時にそのinputFileに接続されていたfileLinkも全て削除します。

#### removeOutputFile(ID, name, cb)
- @param {string} ID - outputFileエントリを削除するノードのインデックス
- @param {string} name - outputFileの名前

指定された名前のoutputFileを削除します。同時にそのoutputFileに接続されていたfileLinkも全て削除します。

#### renameInputFile(ID, newName, cb)
- @param {string} ID - inputFileの名前を変更するノードのインデックス
- @param {string} newName - 変更後のの名前

指定されたinputFileエントリの名前を変更します。

#### renameOutputFile(ID, newName, cb)
- @param {string} ID - outputFileの名前を変更するノードのインデックス
- @param {string} newName - 変更後の名前

指定されたoutputFileエントリの名前を変更します。


#### addFileLink(srcNode, srcName, dstNode, dstName, cb)
- @param {string} srcNode - 送信ノードのID
- @param {string} srcName - 送信ノードでの名前
- @param {string} dstNode - 受取ノードのID
- @param {string} dstName - 受取ノードでの名前

ファイル間の依存関係を追加します。
親階層とのファイル依存関係であれば、srcNode, dstNodeにはIDの代わりに"parent"という文字列を指定することもできます。


#### removeFileLink(srcNode, srcName, dstNode, dstName, cb)
- @param {string} srcNode - 送信ノードのID
- @param {string} srcName - 送信ノードでの名前
- @param {string} dstNode - 受取ノードのID
- @param {string} dstName - 受取ノードでの名前

ファイル間の依存関係を削除します。
親階層とのファイル依存関係であれば、srcNode, dstNodeにはIDの代わりに"parent"という文字列を指定することもできます。

#### getHostList(cb)
ホスト情報一覧をリクエストします。

## Project実行、編集関連API
#### runProject(cb)
プロジェクトの実行を開始します。

#### pauseProject(cb)
プロジェクトの実行を一時停止します。

#### cleanProject(cb)
プロジェクトを実行開始前の状態に戻します。

#### stopProject(cb)
実行中のプロジェクトを停止し、実行開始前の状態に戻します。

#### cleanComponent(id, cb)
@param {string} id - cleanするコンポーネントのID

指定されたコンポーネントおよびその子孫コンポーネントの状態をgitリポジトリ内のHEADの状態に戻し
statusをnot-startedにします。

#### sourceFile(id, filename, cb)
- @param {string} id - ファイルの選択を要求しているsourceコンポーネントのid文字列
- @param {string} filename - 使用するファイル名

askSourceFilename および requestSourceFile APIで要求されたファイルのファイル名を送信します。

requestSourceFile APIに対して応答する場合は、本APIを呼び出す前に実際にファイルをアップロードする必要があります。


#### getTaskStateList(cb) [変更あり 引数はcbのみになりました]
- @param {string} rootWorkflow - rootWorkflowのファイル名

taskStateListの送信を要求します。

#### getProjectState(cb) [変更あり 引数はcbのみになりました]
- @param {string} projectJsonFile - projectJsonファイルのファイル名(cookieのprojectの値)

projectStateの送信を要求


#### getProjectJson( cb) [変更あり 引数はcbのみになりました]
- @param {string} projectJsonFile - projectJsonファイルのファイル名(cookieのprojectの値)

projectJsonの送信を要求

#### updateProjectJson(property, value, cb)
- @param {string} property - projectJsonのうち更新するデータのプロパティ
- @param {string} value    - projectJsonのうち更新するデータの値

projectJsonを更新する

#### saveProject(null, cb)
projectをsave(commit)する

#### revertProject(null, cb)
projectの状態を直前のcommitまで戻す




## remotehost画面で発生する通信一覧(server -> client)
#### hostList(hostInfo[])
workflow画面の同名のAPIと同じ

#### fileList
home画面の同名のAPIと同じ

#### JobSchedulerList(JobSchduler[])
wheelが対応しているジョブスケジューラのリストを送る

JobSchdulerのデータ形式は以下のとおり

| property | data type |  description
|----------|-----------|------------------------------------------------------
| name     | string    | ジョブスケジューラの設定名
| queues   | string[]  | 対応しているキューの一覧


## remotehost画面で発生する通信一覧(client -> server)
#### getHostList(cb)
hotsListの送信を要求します。

#### addHost(hostInfo, cb)
新規リモートホスト設定を追加します

#### updateHost(hostInfo, cb)
既存のリモートホスト設定を上書きします。

#### removeHost(id, cb)
指定されたリモートホスト設定を削除します

#### getFileList(path, cb)
workflow画面の同名のAPIと同じ

#### tryConnectHostById(id, passwrod, cb)
@param {string} id  - テスト対象リモートホスト設定のID

@param {string} passwod - パスワードまたは公開鍵のパスフレーズ

ssh接続のテストを行います。

#### tryConnectHost(sshTeset, passwod, cb)
@param {sshTest} sshTest - テスト対象ホストの情報

@param {string} passwod - パスワードまたは公開鍵のパスフレーズ

ssh接続のテストを行います。

sshTestのデータ形式は以下のとおり

| property | data type |  description
|----------|-----------|------------------------------------------------------
| host     | string    | ホスト名 or IPアドレス
| [port]   | number    | ssh接続に使うポート番号 (default 22)
| username | string    | ユーザ名
| keyFile  | string    | 秘密鍵のファイル名、パスワード認証時はfalsyな値を設定すること

