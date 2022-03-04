# While

![img](./img/while/while.png "while")  

Whileコンポーネントは、[ condition ]プロパティに設定した条件判定スクリプトによって終了判定する繰り返し計算の実行に使用します。  
Whileコンポーネントのプロパティは以下です。

| プロパティ | 入力値 | プロパティ説明 |
|----|----|----|
| name | 文字列 |  コンポーネント |
| description | 文字列 | コンポーネントの説明文 |
| inputFiles | ファイルまたはディレクトリ名 | 先行コンポーネントから受け取るファイル |
| outputFiles | ファイル, ディレクトリ名またはglobパターン | 後続コンポーネントへ渡すファイル |
| condition | ファイル名,またはJavaScriptの式 | 条件判定を行うスクリプトのファイル名、またはJavaScriptの式 |
| last loop instance to keep | 整数値 | 残しておくループインスタンスの数（デフォルトではすべて保存される。） |
| state clean | ボタン | コンポーネントの進行状態を初期状態に戻す *1 |

*1 コンポーネントの進行状態が"finished"もしくは"failed"の時のみ表示されます。  

## Whileループの終了条件

[ condition ]プロパティの条件判定要素として環境変数`$WHEEL_CURRENT_INDEX`（ループ系コンポーネントのループカウンタインデックス）が使用できます。  
Whileコンポーネントにおける環境変数`$WHEEL_CURRENT_INDEX`は、初期値0,増加率1として扱われます。  
[ condition ]プロパティに指定されたスクリプトファイルの終了コードが0の場合は真、それ以外の場合は、偽と判定してループ継続となります。  
ただし、conditionに指定された文字列と一致するファイルが存在しなかった場合は、Javascriptの式とみなしてそのコードを実行します。  
この場合、実行結果がtruthyな値の場合を真、falseyな値の場合を偽とします。  
例として、$WHEEL_CURRENT_INDEXの値が3より小さい場合に継続するスクリプト、Javascript判定式を下記に示します。

#### スクリプトファイル

```
#!/bin/bash
if [ $WHEEL_CURRENT_INDEX -lt 3 ] ; then
  exit 0
else
  exit 1
fi
```

#### Javascript

```
WHEEL_CURRENT_INDEX < 3　　*1
```

*1 JavaScript判定式では`$`は不要です


## ループ系コンポーネント（While/Foreach/For）

Whileコンポーネントは、For/Foreachコンポーネントと同様に**ループ系コンポーネント**としてカテゴライズされ、  
ループカウンタインデックスを環境変数`$WHEEL_CURRENT_INDEX`に持ちます。  
ループ処理では、プロジェクト実行開始時に自身と同じ階層にループカウンタインデックスの値に応じたsuffixをつけてコンポーネント内に存在する全てのコンポーネントのコピーを作成します。  
生成処理が完了したら、ループカウンタインデックスを進めて終了判定を行い、ループが終了してなければ再度コピーを作成します。  
このときコピーされるコンポーネントは、**1つ前のループ処理後のコンポーネント** です。  
以下に例を示します。

### Whileコンポーネント名が「While」、conditionの設定が「$WHEEL_CURRENT_INDEXの値が3より小さいときループ継続する」という場合

#### 実行前のプロジェクトのディレクトリ構造

```
While
```

#### 実行開始ループカウンタ0 ($WHEEL_CURRENT_INDEX：0)

```
While
While_0 ←ループカウンタaのため、While_0コンポーネントが生成します
```

#### 実行開始ループカウンタ1 ($WHEEL_CURRENT_INDEX：1)

```
While
While_0
While_1 ←「1」増加したWhile_1を生成します  
　　　　　このとき、While_1コンポーネントは、カウンタ0のWhile_0コンポーネントをコピーしたものです
```

以降、ループが終了するまでコンポーネントのコピー/実行を繰り返します。  
ループが終了条件を満たした時点で、これらのコンポーネントは終了となります。  
ループの条件判定は、コピーされたコンポーネント（While_*）ではなく、コピー元のコンポーネント（While）上で実行されます。

# Whileコンポーネントの使用例

Whileコンポーネントのサンプルを示します。

このワークフローは下記の処理を行います。  

1. calcTaskコンポーネントにより、面積算出ソルバーを実行する
1. 実行結果をloopCalcTaskコンポーネントに渡す
1. 「1の結果（面積の値）×ループインデックス＋3の結果」 を実行する *1
1. 3の計算結果をファイルとして出力する
1. Whileコンポーネントに設定された条件判定スクリプトで、ループ継続判定をする
1. ループ継続であればループインデックスに1を加算し処理1に戻り、ループ終了であればワークフローを終了する

*1　ループ回数2回目以降の計算にて使用する

## While ワークフロー構成図

![img](./img/while/While_workflow.png "While_workflow")

> sampleWhile（whileコンポーネント）

| プロパティ名 | 設定値 |
| ---- | ---- |
| Name | sampleWhile |
| InputFiles | - |
| OutputFiles | - |
| Condition | condition.sh |
| last loop instance to keep | - |
| Files | condition.sh |

#### ・condition.sh

```
#!/bin/bash
if [ $WHEEL_CURRENT_INDEX -lt 6 ] ; then
  exit 0
else
  exit 1
fi
```

## While ワークフロー子階層　構成図

![img](./img/while/While_child_workflow.png "While_child_workflow")

> calkTask（Taskコンポーネント）

| プロパティ名 | 設定値 |
| ---- | ---- |
| Name | calcTask |
| Script | calc.sh |
| InputFiles | - |
| OutputFiles | result.txt |
| Remotehost | localhost |
| Files | calc.sh , wheel_tutorial_solver.cc, inputdata.txt |  

#### ・calc.sh

```
#!/bin/bash
g++ wheel_tutorial_solver.cc -o wheel_tutorial_solver  
./wheel_tutorial_solver
exit 0
```

#### ・inputData.txt

```
0, 0, 0
0, 10, 0
10, 0, 0
```

> loopCalkTask（Taskコンポーネント）

| プロパティ名 | 設定値 |
| ---- | ---- |
| Name | loopCalcTask |
| Script | resultRead.sh |
| InputFiles | input.txt |
| OutputFiles | - |
| Remotehost | localhost |
| Files | resultRead.sh, value.txt *2 |

*2 result.shの計算結果ファイル、loopCalcTask内でインプットデータとして利用  

#### ・resultRead.sh

```
#!/bin/bash
result=$(cut -f 2 -d "=" input.txt)
if [ ! $WHEEL_CURRENT_INDEX = 0 ] ; then
    value=$(cut -f 2 -d "=" value.txt)
else
    value=0
fi
x=$(($result * $WHEEL_CURRENT_INDEX + $value))
echo $WHEEL_CURRENT_INDEX
echo value=$x
echo value=$x > value.txt
exit 0
```

## ワークフロー実行結果

![img](./img/while/While_finished.png "While_finished")

## ループインスタンスの削除
(参考：[ループインスタンスの削除](../4_component/3_For.md))