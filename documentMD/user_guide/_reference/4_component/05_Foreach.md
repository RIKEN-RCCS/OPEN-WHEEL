---
title: Foreach
lang: ja
permalink: /reference/4_component/05_Foreach.html
---

![img](./img/foreach.png "foreach")

Foreachコンポーネントは、シェルスクリプトのforループのように
設定されたインデックスのリストをもとに
下位コンポーネントを繰り返し実行します。

Foreachコンポーネントに設定できるプロパティは以下のとおりです。

### indexList
![img](./img/loop_setting.png "loop setting")

インデックス値のリストを設定します。  
入力欄に任意のインデックス値を入力し、＋ボタンをクリックで追加します。 

__インデックス値の参照方法について__  
ループ実行中に下位コンポーネントから現在のインデックス値を利用する場合は、__$WHEEL_CURRENT_INDEX__ 環境変数で参照可能です。  
{: .notice--info}

### number of instances to keep
各インデックスで処理を行なった時のディレクトリを最大何個まで残すかを指定します。
無指定の時は、全てのディレクトリが保存されます。

詳しくは後述の[Foreachコンポーネント実行時の挙動](#foreachコンポーネント実行時の挙動)で説明します。


### Foreachコンポーネント実行時の挙動
ForeachコンポーネントもForコンポーネントと同様の挙動をしますが
インデックス値は計算によって求められるのではなく、
indexListに設定された値がリストの先頭から順に使われます。
リストの終端まで実行されるとコンポーネント全体の実行を終了します。

--------
[コンポーネントの詳細に戻る]({{ site.baseurl }}/reference/4_component/)

