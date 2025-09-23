---
title: Stepjob
lang: ja
permalink: /reference/4_component/11_Stepjob.html
---

![img](./img/stepjob.png)

Stepjob/StepjobTaskコンポーネントは、HPCミドルウェア「FUJITSU Software Technical Computing Suite（TCS）」のステップジョブ機能に基づいた機能です。
ステップジョブを利用できるリモートホストが設定されている場合のみ使用することができます。

本機能は、StepjobコンポーネントとStepjobコンポーネント内でのみ使用できるStepjobTaskコンポーネントを組み合わせて使用します。

Stepjobコンポーネントは、特殊なworkflowコンポーネントとして機能し、内部にはStepjobTaskコンポーネントのみを配置することができます。

StepjobTaskコンポーネントは、実行順と依存関係式を指定することができます。
これらの設定に基づき、TCSのステップジョブ機能を用いてサブジョブとして投入されます。

ステップジョブ機能の詳細に関しては、HPCミドルウェア「FUJITSU Software Technical Computing Suite（TCS）」のドキュメントをご確認ください。

Stepjob/StepjobTaskコンポーネントに設定できるプロパティは以下のとおりです。

## Stepjob
###  host
Taskコンポーネントと同様ですが、Stepjob機能を利用できるリモートホストを選択する必要があります。

### use job scheduler
デフォルトで有効になっており、無効に設定するとプロジェクトが正常に実行されなくなります。

### queue
Taskコンポーネントと同様、ジョブの投入先キューを設定します。

### submit command
[リモートホスト設定]({{ site.baseurl }}/for_admins/how_to_boot/#リモートホスト設定) で指定されたバッチシステムにジョブを投入するときのコマンド名が表示されます。
そのため、ここでは変更することはできません。

### submit option
ジョブ投入時に追加で指定するオプションを設定します。

## StepjobTask
Stepjobコンポーネント内でのみ使用できるコンポーネントです。
Stepjobコンポーネントをダブルクリックして表示すると、StepjobTaskを配置することができます。

### script
バッチシステムに投入するジョブスクリプトを設定します。

### step number
StepjobTaskの実行順を決める番号が設定されます。
この値は、コンポーネント間の接続状況から、WHEELが自動的に計算して設定します。
変更することはできません。

### use dependency
有効にすると、次のdependencyFormを設定できるようになり、そこで設定された依存関係式に従ってステップジョブが実行されます。

### dependencyForm
ジョブ実行を行うにあたっての依存関係式を設定できます。

依存関係式は、実行済みStepjobTaskコンポーネントのジョブスクリプトの終了ステータス（ec）、もしくはジョブの終了コード（pc）に基づいて実行の可否を判断するための式です。

依存関係式の定義は次のとおりです。

```
sd=form[:[deletetype][:stepno[:stepno[...]]]]
```

| 式要素 | 必須 | 説明 |
| ---- | ---- |---- |
| sd= | 〇 | 接頭辞 |
| form |  |  投入するサブジョブを実行するかどうかを判断する条件を示す式。<br />詳細は、[form](#form)をご確認ください |
| deletetype |  |  サブジョブを実行しない場合の詳細動作。詳細は、[deletetype](#deletetype)をご確認ください |
| stepno |  |  どのサブジョブの実行結果に対して適用するかを示すステップナンバー |

#### form

formは以下の要素で指定します。

param
: ec：依存するサブジョブのジョブスクリプトの終了コード
: pc：依存するサブジョブのジョブ終了コード

演算子
: ==, !=, <, > , <=, >=

値
: 演算子==や!=を指定した場合、値はコンマ（,）で区切ることで複数指定できます。


以下にFormの指定例を示します。
```
ec==0
```

#### deletetype
deletetypeは、以下の3種類指定できます。

| deletetype | 説明 |
| ---- | ---- |
| one | このサブジョブのみ削除します。このサブジョブの結果に依存する後続のサブジョブは削除されません |
| after | このサブジョブ、及びそれに依存する後続のサブジョブのみを削除します|
| all | このサブジョブ、及び後続のサブジョブを全て削除します |


<br />
以下にdependencyFormプロパティに設定する依存関係式の例を示します。
以下は、ステップナンバー0のサブジョブのジョブスクリプトの終了コードが0以外の場合、このサブジョブ以降は実行しないという依存関係式の例となります。

```
sd=ec!=0:all:0
```

--------
[コンポーネントの詳細に戻る]({{ site.baseurl }}/reference/4_component/)
