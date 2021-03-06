# Parameter study version 2
## はじめに
本ドキュメントでは、2018年秋版より導入されたParameter study設定のversion2の仕様について解説します。

現時点では、Rapidのパラスタ設定ファイル編集機能が本仕様に対応していないため、
こちらの仕様で設定を記述するためにはエンドユーザが
テキストエディタまたは、rapidの通常編集機能で設定ファイルを直接編集する必要があります。

## Parameter study(PS)コンポーネントの挙動
PSコンポーネントは、JSON形式で書かれたパラスタ設定ファイルの記述にもとづいて
自分自身を含む全ての下位コンポーネントのコピーを作成し、全てのコピーを実行するコンポーネントです。

パラスタ設定ファイルには、パラスタ対象のパラメータ空間と、パラメータを置換するファイル(ターゲットファイル)
を記述します。ターゲットファイルには、パラメータスタディで用いる変数のプレースホルダを記述することができます。
プレースホルダは実際に実行されるディレクトリにコピーされる際にパラメータの値で置換されます。

PSコンポーネントのコピーは、パラスタ設定ファイルを除く全てのファイル、ディレクトリが再帰的にコピーされますが
パラスタ設定ファイルの記述によって、特定のパラメータのディレクトリのみにコピーさせるものもあります。
詳細は、設定ファイルの項をご参照ください。

PSコンポーネントのコピーが全て正常に終了すると、パラスタ設定ファイルで指定したファイルのみが
コピーのディレクトリから元のPSコンポーネントのディレクトリへコピーされます。
WHEELのGUIからはコピーされてきた結果ファイルしか参照することができませんので、個々のパラスタ実行結果のうち
後段のコンポーネントで必要なファイルや、結果を確認する必要があるファイルはパラスタ設定ファイルへ記述しておく必要があります。

## ターゲットファイル
ターゲットファイルには以下のように二重の中括弧( "{{" と "}}" )で囲ったプレースホルダを記述することができます。
プレースホルダには、ラベル(以下の例では"hoge")をつけることができます。ラベルとして使用できる文字は
Javascriptの変数として使えるもののみです。

```
HOGE={{ hoge }}
```

このファイルを用いて、hogeの値として1,2,3を取るようなパラスタ設定を行なうと、
プレースホルダ部分にhogeの値が展開されて、次のような内容のコピーが作成されます。

```
HOGE=1
```
```
HOGE=2
```
```
HOGE=3
```

以前のバージョンではプレースホルダとして % を使っていましたが、本バージョンからは変更されていますので
以前の設定ファイルを流用する場合は書き換えてください。

プレースホルダの置換は、外部モジュールのテンプレートエンジン(nunjucks)を用いて行ないます。
中括弧内には変数以外にも、フィルターを追加したり、Javascriptの式や関数を記述することもできますが
本ドキュメントには、詳細は記載しませんので、nunjucksのドキュメントをご参照ください。

https://mozilla.github.io/nunjucks/templating.html

## パラスタ設定ファイル
version2の設定ファイルの例を以下に示します。

```
{
  "version": 2,
  "targetFiles": [
    "input1.txt",
    {
      "targetNode": "1234-567890abcd",
      "targetName": "input2.txt"
    }
  ],
  "params": [
    {
      "keyword": "KEYWORD1",
      "min": 1,
      "max": 3,
      "step": 1
    },
    {
      "keyword": "KEYWORD3",
      "list": [
        "foo",
        "bar"
      ]
    },
    {
      "keyword": "filename",
      "files": [
        "data_*"
      ]
    },
  ],
  "scatter": [
    {
      "srcName": "testData",
      "dstNode": "1234-567890abcd",
      "dstName": "hoge{{ KEYWORD1 }}"
    }
  ],
  "gather": [
    {
      "srcName": "hoge{{ KEYWORD1 }}",
      "srcNode": "1234-567890abcd",
      "dstName": "results/{{ KEYWORD1 }}/{{ KEYWORD3 }}/{{ filename }}/hoge"
    }
  ]
}
```

この例に記載の順に、各プロパティを説明します。

### version
設定ファイルのトップレベルには"version"プロパティが記載されている必要があります。
また、その値が数値の2の時のみ、version 2のパラスタ設定ファイルとして認識されますので
必ず設定してください。

### targetFiles(target_file)
パラメータ置換を行う対象のファイル名を文字列のリストとして与えます。
設定ファイル内に"targetFiles"というプロパティが存在しない場合に限り、旧バージョンで使われていた"target_file"プロパティの値も参照されます。
また、文字列のリストではなく文字列が与えられた時は、与えられた文字列1つのみを含むリストとして扱います。
文字列の代わりに、"targetName"というプロパティを持つオブジェクトを指定することもできます。
この場合は、"targetNode"というプロパティに、PSコンポーネント以下のコンポーネントを指定することで
下位コンポーネントに存在するファイルをパラメータ置換の対象として扱うことができます。

2021年版のクライアントでは、前者の文字列配列形式のデータを含むパラメータスタディ設定ファイルを開いた時に
自動的に後者のオブジェクト形式に変換します。

### params (target_param)
パラメータ空間を定義するオブジェクトのリストを記述します。
設定ファイル内に"params"というプロパティが存在しない場合に限り、旧バージョンで使われていた"target_param"プロパティの値も参照されます。

各パラメータ空間を定義するオブジェクトには次の3パターンがあります。

1. min/max/step 型

パラメータの取る値がmin(最小値)、max(最大値)、step(ステップ幅)の3つの値で定義できる
等間隔な数列の場合に使えるパターンです。
min, max, stepのいずれも、JSON形式で認められている数値形式であればどのような形式でも記述できます。
具体的には、整数、固定小数点数、浮動小数点数(ex. 1.0e-2)で、負の値(-で始まる値)も使えます。

2. list 型

パラメータの取る値をリストとして陽に定義します。

3. files 型

list型と同様にパラメータの取る値をリストとして陽に定義します。
ただし、リスト内の値にglobパターンを指定することもでき、実行時に存在するファイルのみが
実際にパラメータとして使われます。
また、このパターンのパラメータとして指定されたファイルは、実際に使われるディレクトリにしかコピーされません。

### scatter
PSディレクトリ以下にあるファイルをパラメータ展開後の特定のコンポーネント配下にコピーするための設定を行なうプロパティです。
以下に示す3つのプロパティを含むオブジェクトのリストとして与えます。

- srcName
- dstNode
- dstName

srcNameはコピー元のファイル名、dstNodeはコピー先のコンポーネントのID、dstNameはコピー先の名前です。

### gather
PS終了後に元のコンポーネントディレクトリにファイルをコピーするための設定を行うプロパティです。
以下に示す3つのプロパティを含むオブジェクトのリストとして与えます。

- srcName
- srcNode
- dstName

srcNameはコピー元のファイル名、srcNodeはコピー元のコンポーネントのID、dstNameはコピー先での名前です。


### gather/scatter 共通の注意事項
#### srcName
srcNameにはglobパターンおよびparamsプロパティで設定したパラメータ変数をターゲットファイルと同様の書式で指定することができます。
ファイル名ではなくディレクトリ名を指定することもできますが、その場合は指定されたディレクトリ以下の全てのディレクトリ、ファイルが再帰的に
コピーされます。

#### dstName
dstNameにもsrcNameと同様paramsプロパティで設定したパラメータ変数を用いることができますが、こちらはglobパターンは使えません。
また、末尾に'/'または'\'が指定された場合はディレクトリとして扱われ、srcNameで指定されたファイルはdstNameディレクトリの下へコピーされます。
もしコピー先のディレクトリが存在しなかった場合は、新しく作成した上でファイルコピーを行います。

なお、dstNameに固定のファイル名を設定した場合は複数のパラスタ結果のファイルを同じファイルに対してコピーしようとします。
このため、wheelを実行している環境(OS, ファイルシステムなど)とコピー処理が行なわれるタイミングによっては
コピー後のファイルが壊れる可能性もあります。したがって、同じ名前のファイルをコピーする際は
dstNameにパラメータを使った名前を指定することを推奨します。

#### srcNode/dstNode
srcNodeまたはdstNodeに下位コンポーネントのIDを指定することで、srcName/dstNameのパス解釈の起点を
PSコンポーネントではなく、下位コンポーネントのディレクトリとすることができます。
srcNameやdstNameに直接、下位コンポーネントのディレクトリ名を含めて記述することもできますが、
その場合下位コンポーネントの名前が変わると動作しなくなるため、なるべくsrcNode/dstNodeを使って
コンポーネントのIDを指定することを推奨します。
