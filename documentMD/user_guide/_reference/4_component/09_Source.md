---
title: Source
---

![img](./img/source.png "source")

Sourceコンポーネントは、プロジェクト実行に関する
入力ファイルに相当するファイルを扱うためのコンポーネントです。

Sourceコンポーネントに設定できるプロパティは以下のとおりです。
なお、Sourceコンポーネントにはinput filesプロパティは指定することができません。


### upload on demand
プロジェクトの実行時に、ブラウザから実際に使うファイルをWHEELにアップロードするかどうかを指定します。


### Sourceコンポーネントの挙動
プロジェクト実行時にSourceコンポーネントのoutputFileに指定されたファイルが
ディレクトリ内に存在する場合、Sourceコンポーネントは特に何も処理せず
正常終了します。

ファイルが存在せずupload on demandが無効なときは、
ディレクトリ内のファイルのリストがブラウザ上に表示され
ユーザが選択したファイルをoutputFileとして扱います。

ファイルが存在せずupload on demandが有効なときは、
ブラウザ上にファイルアップロードダイアログが表示され
ユーザがアップロードしたファイルがoutputFileとして扱われます。
![img](./img/upload_source_file_dialog.png "upload source file dialog")


--------
[コンポーネントの詳細に戻る]({{ site.baseurl }}/reference/4_component/)