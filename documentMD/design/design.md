# 詳細設計書
## データ構造
wheelでは、ある解析を実行するための一連のプログラム実行や
入出力の受け渡しをまとめたものをProjectとよびます。

Projectの実体はnode.jsが動作するマシン上の任意のディレクトリ(以降はprojectRootとします)
以下のディレクトリ一式で、プロジェクト毎にgitによって管理されます。
また、projectRootのディレクトリ名は末尾に.wheelが付与されています。

projectRootにはprj.wheel.jsonという名前で、
次のような形式のJSONファイル(以降はprojectJSONとします)が
含まれている必要があります。
```
{
    "name": "Project name",
    "description": "This is new Project.",
    "state": "not-started",
    "root" : "/home/hoge/project.wheel",
    "ctime": yyyy/mm/dd-HH:MM:ss,
    "mtime": yyyy/mm/dd-HH:MM:ss,
    "componentPath":{
      "xxxx-xx-xxx1": "./foo/bar",
      "xxxx-xx-xxx2": "./foo",
      "xxxx-xx-xxx3": "./fizz",
      "xxxx-xx-xxx4": "./foo/baz",
    }
}
```

projectJSONの各プロパティに含まれる値は次のとおりです。

property      | description
--------------|--------------------------------------
name          | プロジェクト名(projectRootのディレクトリ名から.wheelを除いたもの)
description   | ユーザがプロジェクトにつける任意の説明文
state         | プロジェクトの実行状態を表す文字列
root          | projectRootディレクトリの絶対パス
ctime         | プロジェクト作成日時
mtime         | 最終更新時刻
componentPath | プロジェクトに含まれる全コンポーネントのIDとprojectRootからの相対パス
version       | データフォーマットのバージョン番号(最新は2)

プロジェクトには、プログラム実行などの個々の処理を表す複数のworkflowComponentが含まれています。
workflowComponentの詳細は後のクラス構造の章で述べます。

個々のworkflowComponentの実体は、projectRoot以下のディレクトリで
コンポーネントの属性値などは当該ディレクトリ内に"cmp.wheel.json"という名前のJSONファイルとして
保存されます。なお、projectRootディレクトリ自体は必ずworkflowコンポーネントとなっており、
プロジェクト内の全てのコンポーネントはrootのワークフローの子孫コンポーネントとなります。

コンポーネントの種類には、次の17種類があります。

- Task
- If
- Workflow
- ParameterStudy
- For
- While
- Foreach
- Viewer
- Source
- Storage
- Hpciss
- Hpcisstar
- Stepjob
- StepjobTask
- BulkjobTask
- Break
- Continue


個々のworkflowComponentの説明は、クラス構成の章を参照してください。
taskコンポーネント内で実行するスクリプトなど、処理に必要なファイルは全て
各コンポーネントのディレクトリ内に含める必要があります。

実装としては、../を使って自身のディレクトリ外のファイルを直接参照することも
禁じていませんが、リモートホストでtaskを実行する時には、コンポーネント単位での
ファイル転送を行うため、正常に動作しない可能性が高いです。
自身のコンポーネント外のファイルを使用する場合は後述のinputFile/outputFile機能を使って
ファイルを受け取ってから使うようにしてください。

## クラス構成
workflowおよびその実行に関連するクラスのクラス図は次のとおりです。

![クラス図](./classDiagram.svg)

BaseWorkflowComponentの各派生クラスのプロパティのうち、エンドユーザが設定することのできる項目は次のとおりです。
なお、parentコンポーネントは現時点では別のコンポーネント配下へ移動するAPIが用意されていないので
ユーザ操作によって変更されることはありません。

### GeneralComponent
property        | type         | description
----------------|--------------|--------------
name            | string       | コンポーネントのディレクトリ名
parent          | string       | 親コンポーネントのID
description     | string       | ユーザが指定するコンポーネントの説明文
previous        | number[]     | 先行コンポーネントのID
next            | number[]     | 後続コンポーネントのID
inputFiles      | inputFile[]  | 先行コンポーネントから受け取るファイル
outputFiles     | outputFile[] | 後続コンポーネントへ渡すファイル
cleanupFlag     | number       | リモート環境に作成した一時ファイルを削除するかどうかのフラグ *1

*1 0,1,2のいずれかの値を指定することができる。
0は削除、1は削除しない、2は親ノードと同じ挙動を意味する。
初期値は2だが、rootワークフローは作成時にserver.jsonに定義された"defaultCleanupRemoteRoot"の値に変更される。

### Task
property        | type         | description
----------------|--------------|--------------
script          | string       | Task内の処理を記述したスクリプトのファイル名
host            | string       | Taskを実行するhost、localhostまたは登録済のremotehostのlabelを指定することができる
useJobScheduler | boolean      | scriptをバッチスケジューラ経由で実行するか直接実行するかのフラグ
queue           | string       | ジョブの投入先キュー(useJobSchedulerがfalseの時は使われない)
submitOption    | string       | 投入オプション
include         | string[]     | リモート環境から回収してくるファイル
exclude         | string[]     | リモート環境から回収しないファイル
retry           | number       | タスク失敗後の再試行回数
retryCondition  | string       | タスクが失敗したかどうかを判断する方法
ignoreFailure   | boolean      | このタスクの失敗後にプロジェクトを続行するかどうか

*2 include, excludeともにglobパターンまたはカンマ区切りで複数のglobを指定することができる。
includeにマッチしなおかつexcludeにマッチしないファイルを回収してくる。
ただし、outputFilesに指定されたファイルは、include/excludeの指定に関わらず全て回収される。

### If
property    | type         | description
------------|--------------|--------------
name        | string       | コンポーネンのディレクトリ名
parent      | string       | 親コンポーネントのID
description | string       | ノードの説明文
previous    | number[]     | 先行ノードのID
next        | number[]     | 後続ノードのID
inputFiles  | inputFile[]  | 先行ノードから受け取るファイル
outputFiles | outputFile[] | 後続ノードへ渡すファイル
condition   | string       | 条件判定を行うスクリプトのファイル名 *1
else        | number[]     | 条件判定が偽だった時の後続ノードのID

*1 conditionに指定されたスクリプトの終了コードが0の時は真それ以外の時は偽と判定して後続のノードへ遷移する。
conditionに指定された文字列と一致するファイルが存在しなかった時は、Javascriptの式とみなしてそのコードを実行し
評価結果がtruthyな値であれば真、falsyな値であれば偽として後続のノードへ遷移します。

### Workflow
property    | type         | description
------------|--------------|--------------
name        | string       | コンポーネンのディレクトリ名
parent      | string       | 親コンポーネントのID(ルートワークフローではundefined)
description | string       | ノードの説明文
previous    | number[]     | 先行ノードのID
next        | number[]     | 後続ノードのID
inputFiles  | inputFile[]  | 先行ノードから受け取るファイル
outputFiles | outputFile[] | 後続ノードへ渡すファイル

### ParameterStudy
property      | type         | description
--------------|--------------|--------------
name          | string       | コンポーネンのディレクトリ名
parent        | string       | 親コンポーネントのID
description   | string       | ノードの説明文
previous      | number[]     | 先行ノードのID
next          | number[]     | 後続ノードのID
inputFiles    | inputFile[]  | 先行ノードから受け取るファイル
outputFiles   | outputFile[] | 後続ノードへ渡すファイル
parameterFile | string       | パラメータスタディの設定を記述したファイル
numTotal      | number       | 総数
numFinished   | number       | 完成数
numFailed     | number       | 失敗数
forceOverwrite| boolean      | 強制的に上書きするかどうか
deleteLoopInstance | boolean | ループインスタンスを削除するかどうか

### For
property     | type         | description
-------------| -------------| --------------
name         | string       | コンポーネンのディレクトリ名
parent       | string       | 親コンポーネントのID
description  | string       | ノードの説明文
previous     | number[]     | 先行ノードのID
next         | number[]     | 後続ノードのID
inputFiles   | inputFile[]  | 先行ノードから受け取るファイル
outputFiles  | outputFile[] | 後続ノードへ渡すファイル
start        | number       | ループの始値
end          | number       | ループの終値
step         | number       | 1回のループでのインデックスの増分(負値も可)
keep         | number       | 保持するインスタンス数

### While
property    | type         | description
------------| -------------| --------------
name        | string       | コンポーネンのディレクトリ名
parent      | string       | 親コンポーネントのID
description | string       | ノードの説明文
previous    | number[]     | 先行ノードのID
next        | number[]     | 後続ノードのID
inputFiles  | inputFile[]  | 先行ノードから受け取るファイル
outputFiles | outputFile[] | 後続ノードへ渡すファイル
condition   | string       | 条件判定を行うスクリプトのファイル名 *1
keep        | number       | 保持するインスタンス数

*1 設定値の取り扱いはIfと同じ

### Foreach
property    | type         | description
------------| -------------| --------------
name        | string       | コンポーネンのディレクトリ名
parent      | string       | 親コンポーネントのID
description | string       | ノードの説明文
previous    | number[]     | 先行ノードのID
next        | number[]     | 後続ノードのID
inputFiles  | inputFile[]  | 先行ノードから受け取るファイル
outputFiles | outputFile[] | 後続ノードへ渡すファイル
indexList   | string[]     | ループインデックスに指定される値のリスト
keep        | number       | 保持するインスタンス数

### Viewer
property    | type         | description
------------| -------------| --------------
name        | string       | コンポーネンのディレクトリ名
parent      | string       | 親コンポーネントのID
description | string       | ノードの説明文
inputFiles  | inputFile[]  | 先行ノードから受け取るファイル

### Source
property       | type         | description
---------------| -------------| --------------
name           | string       | コンポーネンのディレクトリ名
parent         | string       | 親コンポーネントのID
description    | string       | ノードの説明文
uploadOnDemand | boolean      | プロジェクト実行開始時にクライアントからアップロードさせるかどうかのフラグ
outputFiles    | outputFile[] | 後続ノードへ渡すファイル
cleanupFlag    | number       | リモートホスト上の一時作業ディレクトリをクリーンアップするためのフラグ

### Storage
property       | type         | description
---------------| -------------| --------------
name           | string       | コンポーネントのディレクトリ名
parent         | string       | 親コンポーネントのID
description    | string       | ノードの説明文
inputFiles     | inputFile[]  | 先行ノードから受け取るファイル
outputFiles    | outputFile[] | 後続ノードへ渡すファイル
host           | string       | Storageの存在するホスト
storagePath    | string       | Storageのパス

Storageコンポーネントは、プロジェクトの外部にあるファイルやディレクトリを参照するために使用されます。

### Hpciss
HpcissコンポーネントはStorageコンポーネントを継承しており、HPCI共用ストレージサービス(HPCI-SS)上のファイルやディレクトリを参照するために使用されます。

### Hpcisstar
HpcisstarコンポーネントはStorageコンポーネントを継承しており、HPCI共用ストレージサービス(HPCI-SS)上のtarアーカイブ内のファイルやディレクトリを参照するために使用されます。

### Stepjob
property       | type         | description
---------------| -------------| --------------
name           | string       | コンポーネントのディレクトリ名
parent         | string       | 親コンポーネントのID
description    | string       | ノードの説明文
previous       | number[]     | 先行ノードのID
next           | number[]     | 後続ノードのID
inputFiles     | inputFile[]  | 先行ノードから受け取るファイル
outputFiles    | outputFile[] | 後続ノードへ渡すファイル
host           | string       | StepjobTaskを実行するホスト
useJobScheduler| boolean      | ジョブスケジューラを使用するかどうか
queue          | string       | 投入先のキュー名
submitOption   | string       | 投入オプション

Stepjobコンポーネントは、複数のTaskコンポーネントをまとめてジョブとして投入するために使用されます。

### StepjobTask
StepjobTaskコンポーネントはTaskコンポーネントを継承しており、以下のプロパティが追加されています。
property       | type         | description
---------------| -------------| --------------
stepnum        | number       | ステップ番号
useDependency  | boolean      | 依存関係を使用するかどうか
dependencyForm | string       | 依存関係の形式

StepjobTaskコンポーネントは、Stepjobコンポーネント内で実行される個々のタスクを表します。

### BulkjobTask
BulkjobTaskコンポーネントはTaskコンポーネントを継承しており、以下のプロパティが追加されています。
property       | type         | description
---------------| -------------| --------------
usePSSettingFile| boolean      | パラメータスタディ設定ファイルを使用するかどうか
parameterFile  | string       | パラメータファイル
startBulkNumber| number       | バルクの開始番号
endBulkNumber  | number       | バルクの終了番号
manualFinishCondition | boolean | 手動で終了条件を指定するかどうか
condition      | string       | 終了条件

BulkjobTaskコンポーネントは、パラメータスタディのように、多数のジョブを一度に投入するために使用されます。

### Break
property       | type         | description
---------------| -------------| --------------
name           | string       | コンポーネントのディレクトリ名
parent         | string       | 親コンポーネントのID
description    | string       | ノードの説明文
previous       | number[]     | 先行ノードのID
next           | number[]     | 後続ノードのID
inputFiles     | inputFile[]  | 先行ノードから受け取るファイル
outputFiles    | outputFile[] | 後続ノードへ渡すファイル
condition      | string       | 中断条件

Breakコンポーネントは、ループコンポーネント(For, While, Foreach)内で使用され、指定された条件が満たされた場合にループを中断します。

### Continue
property       | type         | description
---------------| -------------| --------------
name           | string       | コンポーネントのディレクトリ名
parent         | string       | 親コンポーネントのID
description    | string       | ノードの説明文
previous       | number[]     | 先行ノードのID
next           | number[]     | 後続ノードのID
inputFiles     | inputFile[]  | 先行ノードから受け取るファイル
outputFiles    | outputFile[] | 後続ノードへ渡すファイル
condition      | string       | 次のステップに進む条件

Continueコンポーネントは、ループコンポーネント(For, While, Foreach)内で使用され、指定された条件が満たされた場合に現在のループをスキップし、次のループに進みます。

## inputFileおよびoutputFile
前章に示したworkflow componentのinputFilesおよびoutputFilesプロパティに格納する
inputFileおよびoutputFileオブジェクトは次のプロパティを持つ

### inputFile
property    | type     | description
------------|----------|--------------------------------------------
name        | string   | ファイルまたはディレクトリ名
src         | string[] | 
src.srcNode | string   | 送信元ノードのID
src.srcName | string   | 送信元ノードでのファイルまたはディレクトリ名
src.transit | string   | 他階層からファイルを受け取る時に経由するコンポーネント(画面表示用)

### outputFile
property    | type     | description
------------|----------| --------------------------------------------
name        | string   | ファイル,ディレクトリ名またはglobパターン
dst         | string[] | 
dst.dstNode | string   | 送信先ノードのID
dst.dstName | string   | 送信先ノードでのファイルまたはディレクトリ名
dst.transit | string   | 他階層からファイルを受け取る時に経由するコンポーネント(画面表示用)


## ノード間のファイル受け渡し処理について
inputFileおよびoutputFileのnameプロパティには、以下の4種類の文字列を指定することができます。
- 空文字列(inputのみ)
- path.sep('\\'でも'/'でも良い)を含む文字列
- path.sep('\\'でも'/'でも良い)を含まない文字列
- globパターン(outputのみ)

### inputが空文字列の時
inputは後続ノードのrootディレクトリ(そのノードのpathプロパティが指定されたディレクトリ)が
指定されてものとして扱われます。

### inputがpath.sepを含まない文字列の時
outputが単一のファイルだった時は、inputはファイル名として扱われ別名でのシンボリックリンクが作成されます。

outputがディレクトリだった時は、inputはディレクトリ名として扱われその名前でディレクトリへのシンボリックリンクが作成されます。

outputがglobパターンだった時は、inputはディレクトリ名として扱われ、
そのディレクトリの下にglobパターンで指定されたファイルへのシンボリックリンクが作成されます。

いずれの場合でも、outputの指定文字列にpath.sepが含まれた場合は後続ノード側でも同じディレクトリが作成された上で
シンボリックリンクが作成されます。


### inputがpath.sepを含む文字列の時
最後のpath.sepまでを後続ノードのrootディレクトリからの相対ディレクトリ名として扱います。

先頭と末尾のpath.sepは無視され、それぞれ取り除いた値が指定されたものとして扱います。
例えば'/foo/bar/'という指定がされた時は、'foo/bar'が指定されたものとして扱います。

(もしあれば)末尾のものを除いて最後のpath.sep以降に続く文字列は"inputがpath.sepを含まない文字列の時"に準じて
outputの指定に応じた取り扱いを行ないます。


## プロジェクト実行時の挙動
runProject APIが呼ばれると次の順に処理が行なわれます。

1. プロジェクトファイルの読込み
2. validataion check
3. git commit
4. Sourceコンポーネントのファイル確認およびonDemanndUploadが指定された場合のアップロード要求
5. クラウドインスタンスの起動およびsshパスワード(orパスフレーズ)の要求とssh接続の作成
6. プロジェクトの実行

## validation checkの処理内容
validation checkでは以下の内容を確認し、全ての条件を満たしていない時はプロジェクトの実行を行なわず
error終了します。
- 全てのTaskコンポーネントにscriptプロパティが指定されており、実際にscriptファイルが存在するか?
- リモートジョブのTaskでTaskコンポーネントに指定されたjobSchdulerがremoteHostで指定された値に含まれているか?
- 全てのIfおよびWhileコンポーネントにconditionプロパティが指定されているか?
- 全てのForコンポーネントに、start/end/stepの値が設定されており、無限ループになっていないか?
- 全てのForeachコンポーネントのindexListプロパティに1以上の要素を含む配列が指定されているか?
- 全てのParameterStudyコンポーネントにparameterFileプロパティが指定されており、実際にファイルが存在するか?
- 1つ以上の初期コンポーネントが含まれているか

## Sourceコンポーネントの処理内容
Sourceコンポーネントは、実際のプロジェクト実行に先立って
outputFileプロパティに指定されたファイルの実体を用意する処理を行ないます。
uploadOnDemandフラグが指定されている場合は、"requestSourceFile"APIを通じて
クライアントにファイルのアップロードを要求します。
コンポーネントディレクトリ内に、cmp.wheel.json以外のファイルが1つしか存在しない時は
そのファイルを同コンポーネントのファイルとして扱います。
cmp.wheel.json以外に複数のファイルが存在した場合は、"askSourceFile"APIを通じて
どのファイルを使うかをクライアントに指定させます。
また、cmp.wheel.json以外にファイルが存在しなかった時は、"requestSourceFile"APIを通じて
クライアントにファイルのアップロードを要求します。
                                      

## プロジェクト実行処理の概要
プロジェクトの実行が始まると、まずroot workflowコンポーネントが読み込まれて
Dispatcherクラスのインスタンスが作成されます。

Dispatcherクラスは対応するコンポーネントの直接の子コンポーネントのcmp.wheel.jsonファイルを読込んで
初期コンポーネントをcurrentSearchListに入れ、順に処理していきます。
初期コンポーネントとは次の2つの条件を満たすコンポーネントのことです。

- previousに指定された先行コンポーネントが存在しない
- inputFilesに指定されたファイルのうち同階層のコンポーネントから受け取るものが存在しない

ただし、sourceおよびviewerコンポーネントは自動的に初期コンポーネントとして扱われます。

子コンポーネントのtype毎の処理内容は次のとおりです。
### task
hostおよびjobScheduler(使うか使わないか)の設定に応じて対応するExecuterクラスヘ渡され
設定に応じてスクリプトの実行、ジョブ投入などの処理が行なわれます。

### If
conditionプロパティに設定された値を評価し、真であればnextに指定されたコンポーネントを
偽の場合はelseに指定されたコンポーネントを、後続タスクとしてnextSearchListに登録して終了します。
conditionプロパティの値は、まずファイル名として解釈され、ファイルが存在した場合にはそのファイルを
スクリプトと見做して実行し、戻り値が0の場合を真、非0の場合を偽とします。
ファイルが存在しなかった時は、戻り値をJavascriptの式として評価し、
truthyな値であれば真、falsyな値であれば偽とします。

### Workflow
workflowコンポーネントのcmp.wheel.jsonを読み込んで新しいDispatcherクラスのインスタンスを作成し
そちらに処理を移譲します。

### ループ系(For, While, Foreach)
自身と同じ階層に、ループインデックスの値に応じたsuffixをつけてディレクトリ全体のコピーを作成し
コピーされたディレクトリのcmp.wheel.jsonファイルを読み込んでWorkflow同様に移譲します。
生成されたDispatcher側の処理が完了したら、ループインデックスを進めて終了判定を行ない
ループが終了してなければ前のtrip countで使われたディレクトリのコピーを作成して再度移譲します。
ループが終了条件を満たした時点で、これらのコンポーネントは終了となります。

これらのコンポーネントが作成したコピー内のcmp.wheel.jsonでは
parentやprevious/next等の値に使われているIDがコピー元とコピー先で重複しています。
したがって、IDからディレクトリ名を解決する時には相対パスを使う必要があることに留意してください。

なお、コピー後のコンポーネントは、プロジェクト再実行時の重複を避けるため、"subComponent"フラグがTrueに設定されます。


### ParameterStudy
parmeterFileプロパティに設定されたファイルを読み込んで、そのファイルに指定されたパラメータ展開を行ない
ループ系コンポーネントと同様にディレクトリのコピーを作成して移譲します。
ループ系コンポーネントとは異なり、移譲された各ディレクトリの処理は並行して行なわれます。

コピー処理はparameterFile内の指定に応じて次のように行なわれます。
targetFilesプロパティに指定されたファイル:
  nunjucksによりファイル内に記述されたplace holderの置換が行なわれた上で、対応するパラメータのディレクトリへ
  コピーされます。
  
scatterプロパティに指定されたファイル:
  scatterに指定された値に対して、nunjucksによるplace holderの置換を行ない、対応するパスへファイルのコピーを行ないます。
  
parameterFile自身:
  どのディレクトリにもコピーされません。

移譲した全てのDispatcherの処理が完了した時点で、parameterStudyコンポーネント終了となります。

### Viewer
ViewerクラスはinputFilesに指定されたファイルを全て元のコンポーネントから受け取った後、
一時ディレクトリを作成してそこにコピーをファイルを配置し、URL,ファイル名、自身のIDをまとめたオブジェクトの
配列を"resultFilesReady"イベント経由でクライアントへ送ります。

### Source
SourceコンポーネントはDispatcherクラス内では処理されません。



Dispatcherクラスは各コンポーネントの処理が終わる毎に、後続コンポーネントをnextSearchListに入れ
currentSearchList内のコンポーネントの処理が終わった時点で、nextSearchListを
次のcurrentSearchListとして再実行します。
currentSearchListとnextSearchListの両方が空になり、処理した全てのTaskコンポーネントの実行が終了した時点で
dispatcherクラスの処理は完了します。

### プロジェクトおよび各コンポーネントのstatus表示について
プロジェクトの状態は以下6つのうちいずれかの状態を取ります。

- not-started 
- running
- paused
- finished
- unknown
- failed

初期状態は"not-started"で実行を開始すると"running"に遷移し、実行終了時にはfailed/unknown/finishedのいずれかの状態になります。
終了時の状態は、プロジェクトに含まれるコンポーネントのうち1つ以上failedのものがあればfailed, failedが1つも無いが
1つ以上のunknownがあればunknown、全てfinishedであればfinishedとなります。
また、実行中にpause操作が行なわれるとpausedに遷移します。

各コンポーネントのstatusは以下の8種類の状態を取ります。

- not-started
- stage-in   (task only)
- waiting    (task only)
- running    running
- queued     (task only)
- stage-out  (task only)
- finished
- unknown
- failed

"stage-in"はリモートで実行もしくはリモートでジョブ投入を行なうtaskのみが取る状態で、リモートサーバへ必要なファイルを転送している状態を示します。

"waiting"は同時実行task数の制限により待ち状態となっていることを示します。

"queued"はジョブスケジューラに投入し実行開始を待っている状態を示します。

"stage-out"はリモートサーバでのtaskの実行が終了し必要なファイルを転送している状態を示します。

これらのstatusはジョブスケジューラが返すものとは異なりますので、ステージング方式を使用しているようなシステムへジョブを投入する場合、
ジョブスケジューラ上でstage-inやstage-out状態であってもwheelのstatusはququedとなります。
逆にwheelのstatus表示がstage-inまたはstage-out状態の時は、ジョブスケジューラ上では投入前もしくは完了後となります。

"unknown"ステータスはジョブスケジューラ経由で投入したtaskが、ステータスチェックに失敗するなどで正常終了か異常終了かの判定ができなかった場合に
発生します。
親コンポーネントのstatusは、自身および全ての子孫コンポーネントを対象にプロジェクトのステータスと同様の判定方法によって決められます。


## JobSchdulerの設定方法
Taskノードは、child\_process又はsshを用いて指定されたスクリプトを直接実行する以外に、ジョブスケジューラにジョブとして投入することもできます。
本機能に関する設定は次の6つがあります。

1. TaskクラスのuseJobSchedulerプロパティ {boolean}
  本プロパティがtrueの時、当該taskはジョブスケジューラ経由で実行されます。

2. Taskクラスのqueueプロパティ {string=null}
  本プロパティには、投入先のキュー名を指定することができます。
  null(デフォルト値)が指定されていた場合はジョブスケジューラ側で指定されているデフォルトキューに対してジョブが投入されます。

3. remotehost設定内のqueueプロパティ {string}
  本プロパティには当該ホストで使用可能なキューの一覧をカンマ区切りの文字列としてエンドユーザが指定することができます。
  本リストはTaskノードのproperty設定画面でエンドユーザに対して設定値の選択肢として呈示されます。
  ジョブ投入時にTaskクラスのqueueプロパティに設定された値が本リスト内に存在しない場合は、リストの先頭要素が指定されたものとして扱います。
  また、本リストが空の場合Taskの設定に関わらず、ジョブスケジューラ側で設定されたデフォルトキューに対してジョブを投入します。

4. remotehost設定内のjobSchedulerプロパティ {string}
  本プロパティには当該ホストから投入可能なジョブスケジューラの名称を指定します。

5. remotehost設定内のnumJobプロパティ {number}
  本プロパティに設定された値以下の投入本数を上限として、wheelからのジョブ投入を抑制します。

6. config/server.json内のqueueプロパティおよびjobSchedulerプロパティ
  node.jsが動作しているマシンからジョブを投入する際の利用可能キューリストおよびジョブスケジューラの名称を指定します。
  内容はそれぞれ3.および4と同様です。

ジョブスケジューラの定義は"app/db/jobSceduler.json"にて行ないます。
スケジューラの名称をkeyとし、以下の各keyを持つテーブルを値として各ジョブスケジューラを列挙します。
なお、全ての値は文字列型とする必要があります。

key             | value
----------------|-----------------------
submit          | ジョブ投入に用いるコマンド名
queueOpt        | 投入先キューを指定するためのsubmitコマンドのオプション
stat            | ジョブの状態表示に用いるコマンド名
del             | ジョブの削除に用いるコマンド名
reJobID         | submitコマンドの出力からジョブIDを抽出するための正規表現
reReturnCode    | statコマンドの出力からスクリプトの戻り値を抽出するための正規表現
reFinishdState  | statコマンドの出力を正常終了と判定するための正規表現
reFailedState   | statコマンドの出力を異常終了と判定するための正規表現

reFinishedStateとreFailedStateは、前者が先に評価され前者がマッチした場合は後者の判定は行なわずに正常終了と判定します。
また、両者にマッチしない場合はジョブは実行待ちもしくは実行中と判定します。

reJobIDおよびreReturnCodeは1つ以上のキャプチャを含む正規表現でなければなりません。また1つ目のキャプチャ文字列は
それぞれjobIDおよびスクリプトの戻り値を示す文字列として扱われます。
なお、reReturnCodeによる戻り値の取得は、reFinishedStateにマッチせず、reFailedStateにマッチした時のみに行なわれます。
また、reReturnCodeによる戻り値の取得に失敗した場合は、仮の戻り値として"-1"が設定されます。

いずれの正規表現もプログラム内でコンパイルして利用するため、正規表現リテラル(//)は使えないことに留意してください。

京のマイクロキュー用にカスタマイズしたparallel naviの設定は次のようになります。
```
  "ParallelNavi": {
    "submit": "pjsub -X -Lelapse=00:30:00",
    "queueOpt": "-Lrscgrp=",
    "stat": "pjstat -H day=3 --choose st,ec",
    "del": "pjdel",
    "reJobID": "pjsub Job (\\d+) submitted.",
    "reFinishedState": "^ST *EC\\nEXT *0",
    "reReturnCode": "^ST *EC\\nEXT (\\d+)",
    "reFailedState": "^ST *EC\\n(CCL|ERR|EXT|RJT)"
  }
```

## gitによる履歴管理
wheelではgitを用いたファイル履歴の管理を行なっています。
ユーザが行なう操作に対応して以下のコマンドに相当する処理が実行されます。

ユーザ操作                | gitコマンド
--------------------------|---------------
プロジェクト新規作成      | git init
プロジェクトのインポート  | git clone
ファイルのアップロード    | git add
ファイルの新規作成        | git add
編集したファイルの保存    | git add
saveボタンの押下          | git commit
revertボタンの押下        | git reset HEAD --hard
cleanボタンの押下         | rm -fr && git reset HEAD --hard


## 画面遷移
![画面遷移図](./screen_transition.svg)

