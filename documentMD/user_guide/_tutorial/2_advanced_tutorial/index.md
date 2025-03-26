---
title: チュートリアル 応用編
lang: ja
permalink: /tutorial/2_advanced_tutorial/
---

本チュートリアルでは、基礎編では触れなかった機能を扱います。

基礎編とは違い全ての項目は独立しています。
個々に新規プロジェクトを作成してからチュートリアルを実行してください。

### 1. 条件分岐
ワークフローの中で、ある処理の実行結果に応じて後続の処理を変えることがあります。

WHEELでは、このような条件分岐を実現するために ifコンポーネントを用意しています。

![img](./img/component_library_if.png "ifコンポーネント")

ここではifコンポーネントを使って、スクリプトの実行結果の成否に応じてそれぞれ異なるスクリプトを実行してみましょう。

まず、新規プロジェクトを作成してください。
続いて、ワークフローに、taskコンポーネントを2つとifコンポーネントを1つ追加してください。
以降はそれぞれ、task0, task1, if0 という名前で呼びます。

![img](./img/workflow_if.png "コンポーネント配置後のワークフロー")

先に、if0から分岐した後で実行するtask0, task1を作成します。

それぞれのコンポーネントで新規ファイルを作成し、テキストエディタで次の内容を入力してください。
また、scriptプロパティに作成したファイルを指定しておいてください。

task0:

```
echo task0
```

task1:

```
echo task1
```

それぞれ、標準出力に対して __task0__ または __task1__ と出力します。

続いて、ifコンポーネントの条件分岐を指定します。
プロパティ画面を開いて、 `check.sh` という名前で新規ファイルを作成し、このファイルをテキストエディタで開いてください。

check.shの戻り値が0であれば緑色の▼（if節）、0以外であれば紫色の▼（else節）へと分岐するので
まずは、
```
exit 0
```
とだけ記入して必ず緑色の▼（if節）を通るようにしてみましょう。

コンポーネントのプロパティ画面に戻って __condition setting__ の行をクリックし __script name for condition check__ ドロップダウンリストから `check.sh` を指定してください。

![img](./img/property_if.png "ifコンポーネントのプロパティ")

最後に、if0の下に表示されている紫色の▼（else節）をtask0に、緑色の▼（if節）をtask1に接続してください。

緑色のコネクタ（if節）はcheck.shの戻り値が0のとき、紫色のコネクタ（else節）は戻り値が0以外のときに進むコンポーネントを示します。

![img](./img/workflow_if2.png "接続完了時のワークフロー")

このワークフローを実行すると、check.shは0を返すので、task1のみが実行されstdoutには `task1` とだけ表示されます。

![img](./img/workflow_if_result.png "ワークフロー実行結果")

一度、プロジェクトを初期化してcheck.shの内容を `exit 1` に変更して再度実行してみましょう。
今度は、task0のみが実行され、stdoutには `task0`とだけ表示されます。

### 2. ループ
ワークフローの中で繰り返し同じ処理を実行することがあります。

WHEELにはこのような時に使える、for(1)、while(2)、foreach(3)という3種類のループコンポーネントがあります。

![img](./img/component_library_loop.png "loopコンポーネント")

各コンポーネントの中には入れ子にしたワークフローを定義することができ、これらのコンポーネントに指定された条件を満たすまで下位ワークフローを繰り返し実行します。

それぞれのコンポーネントでは次の方法で条件を指定できます。

for
: 始値から終値までのカウントアップまたはカウントダウン

while
: 指定されたシェルスクリプトまたはjavascriptの文を実行して戻り値が0（javascriptの場合はtrue）の間

foreach
: 使用する値を全て列挙する

ここでは、代表例としてforコンポーネントを使って、1から10まで順に出力するワークフローを作りましょう。

始めにプロジェクトにforコンポーネントを1つ追加してください。

forコンポーネントのプロパティに __start__、__end__、__step__ という3つの数字を指定するテキストボックスがあります。
それぞれ、 1、5、2 と指定してください。

![img](./img/property_for.png "forコンポーネントの設定値")


次に、forコンポーネントをダブルクリックしてください。
これで、forコンポーネント内のコンポーネントが表示された状態になりますが、今は何もコンポーネントが無いので表示されていません。

![img](./img/graphview_for.png "forコンポーネントの内部")

ここに、taskコンポーネントを1つ追加してください。
また、taskコンポーネントに空のファイル run.sh を追加してscriptプロパティに指定してください。

![img](./img/graphview_for2.png "子コンポーネントを追加した後のforコンポーネントの内部")


forコンポーネント内のtaskコンポーネントでは、ループ変数の値を示す `$WHEEL_CURRENT_INDEX` 環境変数が利用できます。
スクリプトに指定したファイルをテキストエディタで開き、以下の行を記入してください。

```
echo $WHEEL_CURRENT_INDEX
```

![img](./img/script_for.png "forコンポーネント内で実行されるスクリプト")

プロジェクトを実行すると、標準出力に 1,3,5 と表示されます。

![img](./img/result_for.png "実行結果")

この例で示したように、forコンポーネントのendプロパティとindex変数(`$WHEEL_CURRENT_INDEX`)の値が等しい時も内部のコンポーネントは実行されます。

#### BreakおよびContinueコンポーネントによるループ制御
ループ処理の実行中に、条件によっては処理を終了したり、ループ内の処理の一部を実行せずに次のループに進ませたいことがあります。

WHEELには、このような処理を行なうBreakおよびContinueコンポーネントがあります。

![img](./img/component_library_break_continue.png "BreakおよびContinueコンポーネント")

なお、どちらのコンポーネントもfor, while, foreachコンポーネントを表示した時のみコンポーネントライブラリに表示されます。


さきほどのプロジェクトにBreakおよびContinueコンポーネントを追加して挙動を確かめましょう。

まず、プロジェクトをcleanし、for0コンポーネントの下にBreakコンポーネントを追加してください。
また、break0の後にtask0が実行されるように依存関係を設定してください。

![img](./img/workflow_break.png "Breakコンポーネント追加後のワークフロー")

break0のプロパティを開き `condition setting` パネルの `use javascript expression for condition chek` を有効にし
下のテキストエリアに `WHEEL_CURRENT_INDEX === "3"` と入力してください。

プロジェクトを実行すると、indexが3の時はループ内のそれ以降の処理(taskコンポーネント)は実行されず
forコンポーネントの処理も終了するため、1のみが出力されます。

![img](./img/result_break.png "Breakコンポーネント追加後の実行結果")

再度プロジェクトをcleanし、Breakコンポーネントを削除した後、Continueコンポーネントを追加して
Breakコンポーネントの時と同じくcontinue0の後にtask0が実行されるように依存関係を設定してください。

また、`condition setting` もBreakと同じく `WHEEL_CURRENT_INDEX === "3"` を設定してください。

プロジェクトを実行すると、indexが3の時にはtaskコンポーネントが実行されないので1および5のみが出力されます。

![img](./img/result_continue.png "Continueコンポーネント追加後の実行結果")

もし、BreakまたはContinueコンポーネントとtaskコンポーネントの依存関係を設定していなかった場合、
taskコンポーネントとBreakまたはContinueコンポーネントの実行順は制御されないため
"3" が出力されるかどうかは不定です。

このため、条件判定の結果によらず必ず実行するコンポーネントは、BreakまたはContinueコンポーネントより先に実行されるように、
逆に条件判定の結果によっては実行しないようにしたいコンポーネントは後に実行されるように依存関係を設定してください。


### 3. パラメータスタディ
計算機シミュレーションのワークフローでは、入力データのパラメータの一部を少しづつ変化させて、同じ計算を繰り返し実行することがあります。

WHEELには、このような処理をサポートするparameterStudyコンポーネント（以下、PSコンポーネント）があります。

![img](./img/component_library_ps.png "PSコンポーネント")

PSコンポーネントの中には入れ子にしたワークフローを定義することができます。
下位ワークフロー内の任意のファイルを指定されたパラメータ値で書き換えて実行することで、同じ処理をパラメータを変えながら複数回実行することができます。

ここでは、シェルスクリプト内のパラメータ値を書き換えて実行することで、echoコマンドに様々な引数を渡してみましょう。


始めにプロジェクトに1つPSコンポーネントを追加してください。

![img](./img/graphview_ps.png "PSグラフビュー")

続いて、PSコンポーネントをダブルクリックしてPSコンポーネント内部を表示しtaskコンポーネントを1つ追加してください。
また、taskコンポーネント内に `run.sh` という空ファイルを追加してscriptプロパティに指定してください。

`run.sh`の中には

```
echo number
```

と書いてください。

![img](./img/script_ps.png "PS内で実行するスクリプト")

run.shを保存したらグラフビューに戻ります。
さらに画面上部に表示されているプロジェクト名(以下の例では、__tutorial_PS__) をクリックして、プロジェクトのrootコンポーネントに戻ります。

![img](./img/component_tree_ps.png "PS内で実行するスクリプト")

PSコンポーネントのプロパティ画面を開いてFilesエリアを表示します。
parameterSetting.jsonをクリックして選択した状態でテキストエディタ画面へ移動します。

画面左側はこれまでと同様のテキストエディタですが、画面右側にパラメータスタディ用の設定を行なうための画面が表示されます。

![img](./img/texteditor_with_ps_config.png "PS内で実行するスクリプト")

まず、画面右上の __+ add new target file__ ボタンをクリックしてください。
コンポーネントツリー画面が表示されるので、 __task0__ をクリックします。ファイル名に __run.sh__ と入力して __OK__ ボタンをクリックしてください。

![img](./img/select_target_file.png "targetfile 選択ダイアログ")

テキストエディタ部に、さきほど作成したrun.shが表示されるので、`number`の部分をドラッグして選択してください。
画面右側の __parameters__ テキストボックスに __number__ と表示されます。

![img](./img/select_parameter_field.png "パラメータ置換フィールド選択状態")

この状態で、 __+ add new parameter__ ボタンをクリックすると、 __number__ の部分に対するパラメータ設定を行うことができます。
ここでは、ドロップダウンリストを __list__ に変更します。

![img](./img/list_parameter_dialog.png "listパラメータダイアログ")

続いて、 __foo__ __bar__ __baz__ の3つの値を設定します。
テキストボックスに __foo__ と入力し、__+__ ボタンをクリックしてください。同様の手順で __bar__、__baz__ を設定します。

![img](./img/create_parameter.png "パラメータ作成")

最後に __OK__ ボタンをクリックします。

![img](./img/created_parameters.png "パラメータ作成後")

__number__ に対するパラメータ設定が登録され、
__run.sh__ の __number__ の部分は、 __\{\{ number \}\}__ と書き換えられます。

![img](./img/texteditor_ps2.png "編集終了時のテキストエディタ")

実行時には、この __\{\{ number \}\}__ が実際のパラメータ(foo, bar, baz)で置き換えられてそれぞれ実行されます。

最後に、画面右上の __save all files__ ボタンをクリックして編集結果を保存してください。

プロジェクトを実行すると、stdoutに foo, bar, baz とそれぞれechoコマンドの出力結果が表示されます。

![img](./img/result_ps.png "PS実行結果")

__パラメータスタディの実行順について__
PSコンポーネントでは、parameterFileに指定されたパラメータ空間内で、全ての組み合わせについて下位コンポーネントを可能な限り並列実行します。
そのため、下位コンポーネントの実行順は順不同となり、結果の出力順も順不同となります。
{: .notice--info}

#### パラメータ置換に関する補足
先ほどの、 __{% raw %}{{ number }}{% endraw %}__ をtargetfileに指定したファイル内の別の場所に記載すれば、そちらも同様にパラメータに置換されます。

また、二重括弧の中には、フィルタを追加することができます。
例えば __{% raw %}{{ number | upper }}{% endraw %}__ とすればパラメータを大文字にすることができます。

他にも __{% raw %}{{ "true" if number == "foo" else "false" }}{% endraw %}__ とすれば、number がfooの時のみ "true"それ以外の時は"false" に置き換えられます。

利用可能なフィルタはこちらをご参照ください。

[https://mozilla.github.io/nunjucks/templating.html#builtin-filters](https://mozilla.github.io/nunjucks/templating.html#builtin-filters)


### 4. 入力ファイル
シミュレーションの内容によっては、プリプロセスはワークフロー実行前にインタラクティブに実施したいが、ソルバー以降の処理はワークフローで自動的に実行したいというケースもあります。

WHEELには、実行時にファイルをアップロードしてワークフローの __入力データ__ として扱うsourceコンポーネントが用意されています。

![img](./img/component_library_source.png "sourceコンポーネント")

ここでは、クライアントPCで作成した任意のテキストファイルをcatコマンドで表示するワークフローを作成して、sourceコンポーネントについて学びましょう。

まずはじめに、プロジェクトにtaskコンポーネントとsourceコンポーネントを1つずつ追加してください。

sourceコンポーネントのプロパティを開いて、upload settingの行をクリックし __upload on demand__ のスイッチを有効にしてください。
sourceコンポーネントのoutput filesに __UPLOAD_ON_DEMAND__ と表示されます。

続いて、taskコンポーネント内に `run.sh` という空ファイルを追加してscriptプロパティに指定してください。
run.shには次の内容を記載してください。

```
cat input.txt
```

最後にtaskコンポーネントのinput filesに __input.txt__ を追加し、sourceコンポーネントの __UPLOAD_ON_DEMAND__ と接続してください。
以上でワークフローの作成は完了です。

![img](./img/workflow_source.png "sourceコンポーネントのワークフロー完成図")

実際に、入力ファイルとして使うためのテキストファイルをクライアントPC上に用意してください。

プロジェトを実行すると、sourceコンポーネントのoutputfileとして使うファイルをアップロードするためのダイアログが表示されます。
先ほど用意したファイルを指定してください。
アップロードが完了すると、 __drop file here__ と書かれた部分がアップロードされたファイル名に変更されます。

![img](./img/upload_dialog.png "sourceコンポーネントのアップロードダイアログ")


__ok__ ボタンをクリックするとプロジェクトの実行が再開され、catコマンドによってアップロードされたファイルの中身がstdoutに出力されます。

なお、__ok__ ボタンをクリックするまでは、ファイルのアップロードは何度でもやり直すことができます。
指定するファイルを間違えた場合は、再度アップロードすれば後から指定したファイルが使われます。


### 5. 結果表示
ポストプロセスまで自動化されたワークフローでは、計算結果として画像ファイルを出力することがよくあります。

WHEELには、代表的な形式の画像ファイルをブラウザ上で表示するviewerコンポーネントが用意されています。
このコンポーネントを使うと、計算結果のファイルをクライアントPCにダウンロードすることなく簡単に結果を確認することができます。

![img](./img/component_library_viewer.png "viewerコンポーネント")

ここでは、事前に用意した画像ファイルをviewerコンポーネントに渡すワークフローを作成してviewerコンポーネントについて学びましょう。

まずはじめに、プロジェクトにtaskコンポーネントとviewerコンポーネントを1つずつ追加してください。

続いて、taskコンポーネント内に `run.sh` という空ファイルを追加してscriptプロパティに指定してください。
run.shには次の内容を記載してください。

```
ls *
```

viewerコンポーネントで表示するための画像データを、taskコンポーネントにアップロードします。
Filesエリアの __upload file__ ボタン、もしくはFilesエリアに画像データをドラッグ&ドロップすることでアップロードしてください。

![img](./img/upload_file.png "upload fileボタン")

output filesプロパティに、アップロードした画像データのファイル名を記述します。
__\*.拡張子__ と記載することで、同じ拡張子のファイルをまとめて指定したり、ファイル名を省略して指定することができます。(例えば、JPEGファイルの場合は、__\*.jpg__ と記載します)
画像データとして1ファイルのみを表示する場合は、ファイル名をそのまま指定しても構いません。
また、1つにまとめず複数のファイル名をoutput filesプロパティに指定しても問題ありません。


最後にviewerコンポーネントのinput filesに __./__ を追加し、taskコンポーネントのoutput filesと接続してください。
以上でワークフローの作成は完了です。

![img](./img/workflow_viewer.png "viewerコンポーネントのワークフロー完成図")

__input filesに "./" と設定した場合について__
input filesに __./__ と設定することで、input filesとして渡されるファイル（本チュートリアルの場合、\*.JPGと\*.webp）はすべてviewerコンポーネントディレクトリ直下に置かれます。
{: .notice--info}

プロジェクトを実行すると、 __open viewer screen__ というダイアログが表示されます。

![img](./img/open_viewer_screen_dialog.png "open viewer screen ダイアログ")

okボタンをクリックすると別のタブで画像ビューワーが表示されます。

![img](./img/image_viewer.png "画像ビューワー")

初期状態ではタイル表示になっていますが、表示された画像をクリックするとスライドショー状態になります。
この状態では、画像の拡大縮小などを行うことができます。

![img](./img/slideshow_display.png "スライドショー表示")

### 6. ファイル保存
WHEELでワークフローを実行した時に、作成される出力ファイルなどはプロジェクトを初期化した際に毎回削除されてしまいます。

人間が介在して、結果の確認や設定の調整を行ないながら同じワークフローを何度も実行する時には毎回の実行時の結果を保存しておきたいこともあります。

このような時には、storageコンポーネントを使うとプロジェクトの初期化時にも削除されずに残すことができます。

![img](./img/component_library_storage.png "storageコンポーネント")

ここでは、storageコンポーネントを使って、ファイルを保存しながら複数回プロジェクトの実行と初期化を繰り返して、全てのファイルが保存されることを確認しましょう。

まずはじめに、プロジェクトにtaskコンポーネントとstorageコンポーネントを1つずつ追加してください。

続いて、taskコンポーネント内に `run.sh` という空ファイルを追加してscriptプロパティに指定してください。
run.shには次の内容を記載してください。

```
echo foo >foo.txt
```

また、taskコンポーネントのoutput filesに __\*.txt__ を追加してください。
このコンポーネントは __foo.txt__ しか出力しませんが、これから出力ファイル名を書き換えながら何回かプロジェクトを実行するため、ファイル名を __\*__ で指定しています。

次にstorageコンポーネントのプロパティ画面を開き __directory path__ の欄に __/tmp__ と記述してください。
また、input filesに __./__ を指定してください。

__directory pathの設定について__
もし、/tmpが存在しない、または/tmpに書き込み権限が無い場合は他の任意のディレクトリを指定してください。
ただし、プロジェクトファイルが保存されているディレクトリツリーの範囲外のパスを指定する必要があります。
{: .notice--info}

最後に、taskコンポーネントのoutput filesと、storageコンポーネントのinputFileを接続してください。
以上でワークフローの作成は完了です。

![img](./img/workflow_storage.png "storageコンポーネントのワークフロー完成図")

プロジェクトを実行すると、task0, storage0それぞれのコンポーネントのFilesエリアに foo.txtが表示されます。

プロジェクトを初期化すると、task0のfoo.txtは削除されますが、storage0のfoo.txtは残ります。

task0のrun.shを編集して、出力ファイル名をbar.txtに変更して再実行すると、storage0コンポーネント内に foo.txt, bar.txt が表示されます。

このように、プロジェクトの初期化を行なってもstorageコンポーネント内に保存したファイルは保持されるので、リスタート計算用のファイルの保存などに活用することができます。



### 7. バルクジョブ
富岳を初めとした、富士通株式会社製HPCミドルウェア「FUJITSU Software Technical Computing Suite」を採用したシステムでは、バルクジョブ機能を使用することができます。

WHEELには、この機能をGUIから簡単に使うための bulkjobTask コンポーネントが用意されています。

![img](./img/component_library_bulkjob.png "bulkjobコンポーネント")

ここではバルクジョブを用いてパラメータスタディと同じ内容のワークフローを作成してみましょう。

はじめに、新規プロジェクトを作成し、builkjobTaskコンポーネントを1つ追加してください。

デフォルトではlocalhostでの実行になっているので、プロパティのhostを変更してbulkjob機能が利用可能なリモートホストを指定してください。

__バルクジョブ機能使用時のリモートホスト設定について__
実際に利用するホストで稼動しているバッチシステムがバルクジョブ機能をサポートしていても、remotehost設定で __use bulkjob__ を有効にしていないとバルクジョブ機能は使えませんので、ご注意ください。
![img](./img/remotehost.png "use bulkjobの設定")
{: .notice--info}

プロパティ画面を開いて、 `run.sh` という名前で空ファイルを作成し、テキストエディタを開いて `echo ${PJM_BULKNUM}` と記入してください。
ジョブ実行時には、`${PJM_BULKNUM}` の部分が設定したパラメータに置き換えられます。

プロパティ画面に戻って、scriptに `run.sh` を設定してください。

最後に、 __bulkjob setting__ の行をクリックしてパラメータを指定します。
ここでは、 __use parameter setting file for bulk number__ のチェックを外して、startに __0__ 、endに __5__ を指定してください。

![img](./img/property_bulkjob.png "bulknumの設定")


最後に、各サブジョブの標準出力を回収するために、__remote file setting__ の行をクリックして、__include__ に `run.sh*` と指定してください。

![img](./img/property_bulkjob2.png "includeの設定")

プロジェクトの実行が完了すると、標準出力がrun.sh.xxxxx[`${PJM_BULKNUM}`].out という形式のファイル名で出力されます。
各`PJM_BULKNUM`とファイルに出力されたechoコマンドの出力が一致することを確認してください。


### 8. ステップジョブ
富岳を初めとした、富士通株式会社製のHPCミドルウェア「FUJITSU Software Technical Computing Suite」を採用したシステムでは、ステップジョブ機能を使用することができます。

WHEELには、この機能をGUIから簡単に使うための stepJob および stepJobTask コンポーネントが用意されています。

![img](./img/component_library_stepjob.png "stepjobコンポーネント")

WHEELのステップジョブ機能は、stepJobコンポーネントの中にstepJobTaskコンポーネントを複数定義して依存関係を定義したものを、バッチシステムのstepjob機能を用いて実行するものです。

はじめに、新規プロジェクトを作成しstepJobコンポーネントを1つ追加してください。

デフォルトではlocalhostでの実行になっているので、プロパティのhostを変更してstepjob機能が利用可能なリモートホストを指定してください。

![img](./img/workflow_stepjob.png "stepjobコンポーネントの設定")

__ステップジョブ機能使用時のリモートホスト設定について__
実際に利用するホストで稼動しているバッチシステムがステップジョブ機能をサポートしていても、remotehost設定で __use stepjob__ を有効にしていないとステップジョブ機能は使えませんので、ご注意ください。
![img](./img/remotehost2.png "use stepjobの設定")
{: .notice--info}

続いて、__stepjob0__ をダブルクリックしてstepjob0コンポーネント以下を表示してください。

stepjob コンポーネント内には、stepjobTask コンポーネントしか配置できません。
そのため画面左側のコンポーネントライブラリ部分が切り替わって、stepjobTask コンポーネントのみが表示された状態になります。

![img](./img/component_library_stepjobTask.png "stepjobコンポーネント内でのcomponent library")

ここに、stepjobTaskコンポーネントを2つ追加してください。

sjTask0とsjTask1という2つのコンポーネントができるので、それぞれのコンポーネントに __run.sh__ という名前で空ファイルを作成し、__script__ プロパティに指定してください。

![img](./img/property_stepjobTask.png "stepjobtaskのプロパティ")

sjTask0のスクリプトには、次のように指定してください。

```
exit 1
```

これでsjTask0は毎回エラー終了するようになります。

sjTask1のスクリプトは次のように指定してください。

```
echo stepjobTask1 > stdout.txt
```

続いて、sjTask0とsjTask1の実行順を指定します。
sjTask0の ▼ をドラッグしてsjTask1にドロップしてください

線が接続され、sjTask1の左肩に表示されているアイコンの番号が1に変わります。

![img](./img/workflow_stepjobTask.png "依存関係指定後のワークフロー")

さらに、sjTask1の実行条件を指定します。
プロパティ画面の __stepjobtask setting__ エリアをクリックして開き、__use dependency__ を有効に、__dependencyForm__ に  `sd=ec==1`と入力してください。
これで、sjTask1はsjTask0の戻り値が1の時のみ実行されます。
__dependencyForm__ の記述方法については、TCSのドキュメントやお使いのスパコンシステムのユーザガイドを参照してください。

![img](./img/property_stepjobTask2.png "依存関係式")

最後にsjTask1が出力するファイルを回収するために、__remote file setting__ エリアをクリックして開き、includeテキストボックスに `stdout.txt` と入力してください。

![img](./img/property_stepjobTask3.png "include指定")

プロジェクトを実行するとsjTask0がfaildとなりますが、sjTask1は実行され、stdout.txtの中に `stepjobTask1` と出力されています。

一度、プロジェクトを初期化してから、sjTask1の __dependencyForm__ を `sd=ec==0` と変更して実行してください。

今度は、sjTask0がfaildになった後、sjTask1は実行されずそのままワークフロー全体が終了します。

これで、応用編のチュートリアルは終了です。

実際にアプリケーションを動かすワークフローについて知りたい方は [実践編チュートリアル]({{ site.baseurl }}/tutorial/3_application_tutorial/) に進んでください。

また、個々の機能の詳細な内容については、[リファレンスマニュアル]({{ site.baseurl }}/reference/) をご参照ください。



### 9. HPCI 共用ストレージの利用
WHEELには、HPCI共用ストレージにデータを保存するための HPCI-SS および HPCI-SS-tar コンポーネントが用意されています。
これらのコンポーネントは、storage コンポーネントと同じような機能を持ちますが、ファイルの保存場所としてHPCI共用ストレージを使う点が異なります。

![img](./img/component_library_hpciss.png "HPCI-SS および HPCI-SS-tarコンポーネント")

HPCI-SSコンポーネントでは、HPCI共用ストレージ内の指定したディレクトリ内にファイルを保存します。
この時同時に転送するファイル数に応じてファイル単位での並列転送(gfpcopyコマンド)か1ファイルの並列転送(gfcpコマンド)をWHEELが自動的に選択して実行します。

HPCI-SS-tarコンポーネントでは、gfptarコマンドを利用して並列にtarアーカイブをHPCI共用ストレージ内に作成します。

それぞれのコンポーネントを使って、ファイルを保存または取り出すサンプルプロジェクトを用意しています。
これらを用いて実際にHPCI-SSおよびHPCI-SS-tarコンポーネントを使ってみましょう。

1. [HPCI-SS への保存](sample/WHEEL_project_tutorial-HPCISS-store.tgz)
1. [HPCI-SS からの取り出し](sample/WHEEL_project_tutorial-HPCISS-load.tgz)
1. [HPCI-SS-tar への保存](sample/WHEEL_project_tutorial-HPCISStar-store.tgz)
1. [HPCI-SS-tar からの取り出し](sample/WHEEL_project_tutorial-HPCISStar-load.tgz)

#### 9.1 事前準備
HPCI-SS,HPCI-SS-tarコンポーネントを利用するためには、HPCI共用ストレージの利用申請を行なった上で
OAuth認証用のJWTトークンを発行しておく必要があります。
詳しくは、 [こちら](https://www.hpci-office.jp/for_users/hpci_info_manuals) のページにある `HPCI 共用ストレージ 利用マニュアル OAuth 利用編`
を参照してください。

#### 9.2 チュートリアルデータのダウンロード
上記リンクより、4つのプロジェクトアーカイブをダウンロードしてください。

#### 9.3 リモートホスト設定
リモートホスト設定画面を開いて、新規リモートホスト設定を作成してください。

![img](./img/remotehost_screen.png)

この時、`(1) use gfarm` をチェックし、`(2) HPCI-ID` に自分のHPCI-IDを入力してください。
`(3) JWT server's URL` には JWT server の URL を入力しますが、
規定値として、https://elpis.hpci.nii.ac.jp が入力されているため変更の必要はありません。

#### 9.4 プロジェクトアーカイブのインポート
HOME 画面で `IMPORT` ボタンをクリックし、ダウンロードした4つのプロジェクトアーカイブを順次インポートしてください。
プロジェクトのインポート方法は [こちら]({{ site.baseurl }}/reference/1_home_screen/#プロジェクトのインポート) のドキュメントに記載されています。

インポート時に `fugakuCSGW` のリモートホスト設定を、9.3で作成したリモートホスト設定に割り当ててください。

#### 9.5 HPCI-SS コンポートへの保存
はじめに、HPCI-SSコンポーネントへの保存を行ないます。
tutorial-HPCISS-store プロジェクトを開いてください。

![img](./img/workflow_hpciss_store.png)

task0コンポーネントはローカルホストで動作して、次のような構成のファイル、ディレクトリを生成します。

HPCI-SSコンポーネントは、task0コンポーネントから受け取ったデータを `test1` 以下に保存します。


プロジェクトを実行する前に、HPCI-SSコンポーネントのプロパティを開いて、 `directory path` にgfarm領域内の自分のアカウントで書き込めるパスを
指定してください。なお、パスの先頭に `gfarm://` を付けていなくても自動的にgfarm URLに変換して扱われます。

![img](./img/directory_path_HPCISS.png)

プロジェクトを実行すると、初めにcsgwへsshでログインするためのパスフレーズを聞かれます。

![img](./img/ssh_passphrase.png)

このダイアログにssh認証鍵のパスフレーズを入力してOKをクリックすると、
次にJWT serverのパスフレーズを聞かれます。

![img](./img/jwt_server_passphrase.png)

既にcsgwでjwt-agentが実行されている場合は、こちらのパスフレーズは聞かれることなくプロジェクトの実行が開始されます。

プロジェクトの実行が終了した後で、HPCI-SS0コンポーネントをクリックしてプロパティ画面を表示し、
`Files` の右側にある下矢印をクリックしてください。

`browse on remotehost` ボタンが表示されるので、これをクリックすることで
HPCI共用ストレージに保存されたファイル、ディレクトリを見ることができます。

![img](./img/browse_on_remote_button.png)

__パスフレーズについて__
WHEELは、プロジェクト実行開始時にユーザが入力したパスフレーズは、実行終了時に破棄しています。
ただし、ssh-agentが起動されていて、sshのconfigで `AddKeysToAgent yes` が設定されていた場合は
1回目のログイン成功時以降はssh-agentによる認証が行なわれるため、パスフレーズを聞かれることなく
ssh接続が行なわれます。
また、jwt-serverのパスフレーズは、富岳csgw上でjwt-agentを起動する際に入力されますが、jwt-agentのプロセスは
WHEELからは終了させていません。このため、既にjwt-agentが起動している場合はこちらのパスフレーズは入力することなく
HPCI共用ストレージを利用することができます。
ただし、富岳csgwはロードバランサが使われているため、jwt-agentを起動していない側のサーバにログイン処理が振り分けられてしまった場合は、
再度jwt-serverのパスフレーズを入力する必要があります。
{: .notice--info}

![img](./img/files_hpciss.png)

このエリアには、`directory path` で指定したパス配下のファイル、ディレクトリが表示されています。
操作方法は、他のコンポーネントと共通ですので、[リファレンスマニュアル]({{ site.baseurl }}/reference/4_component/00_common.html#ファイル操作エリア)を確認してください。

ただし、以下の2点が他のコンポーネントとは異なります。

1. [remove storage directory] ボタンをクリックすると、 `directory path` に指定したディレクトリ自体を削除します。
2. [新規ファイル作成]、[アップロード]、[ダウンロード]機能は使えません。

__remove storage directoryボタンに関連する補足__
HPCI-SSコンポーネントでは、保存先として指定したディレクトリが既に存在した場合そのディレクトリの中に
`WHEEL_TMP_XXXXX` という名前のディレクトリが作成され、さらにその中に先行コンポーネントのoutputFileに指定したファイル、ディレクトリが保存されます。
これはgfarmのコマンドの仕様により、既存のgfarm上のディレクトリに対してディレクトリをコピーすることができないことによる制約です。
inputFileに"./"を指定して、directory pathに指定したパス直下にファイル、ディレクトリを保存する設定にした場合
前述の現象を避けるためには、directory path自体を削除する必要があります。
このような場合、通常の`remove`ボタンではなく、`remove storage directory` ボタンを使用してください。
なお、`remove storage directory` ボタンはファイルやディレクトリを選択していた場合でも
選択中のファイル、ディレクトリだけではなく directory path 自体を削除するのでご注意ください
{: .notice--info}

続けて、HPCI-SSコンポーネントからデータを取り出すチュートリアルに移ります。
保存するプロジェクトでHPCI-SSコンポーネントに指定した `directory path` の値が必要になるので
メモしてから、HOME画面に戻ってください。

#### 9.6 HPCI-SS コンポートからの取り出し
tutorial-HPCISS-loadプロジェクトを開いてください。

![img](./img/workflow_hpciss_load.png)

こちらのプロジェクトには、HPCI-SSコンポーネントとtaskコンポーネントが1つづつ含まれており
HPCI-SSコンポーネントが持つファイル、ディレクトリを全てダウンロードして、taskコンポーネント内で `ls -lR` を
実行することで表示します。

HPCI-SS0コンポーネントを開いて、`directory_path` に 「9.5 HPCI-SSコンポーネントの保存」 と同じ値を設定してください。

コンポーネントプロパティ画面を開いて、下部の `Files` エリアを開き、`browse on remotehost` ボタンをクリックすると
さきほどと同じファイル、ディレクトリが表示されます。

![img](./img/files_hpciss.png)

プロジェクト実行ボタンをクリックすると実行が始まります。
ssh、jwt-serverのパスワードの再入力が必要なことがあるので
ダイアログが表示された場合は、それぞれのパスフレーズを入力してください。

実行が終了すると、task0コンポーネント内に `test1` ディレクトリが作成され
その中にHPCI-SSコンポーネントに保存されていたファイル、ディレクトリが入っています。

#### 9.7 HPCI-SS-tar コンポートへの保存
次に、HPCI-SS-tarコンポーネントを使ってアーカイブを保存するサンプルプロジェクトを実行してみましょう。

tutorial-HPCISS-storeプロジェクトを開いてください。

![img](./img/workflow_hpciss_tar_store.png)

こちらのプロジェクトは、tutoraial-HPCISS-storeとほぼ同じですが、HPCI-SSコンポーネントがHPCI-SS-tarコンポーネントに置き換わっています。
HPCI-SS-tarコンポーネントは、HPCI共用ストレージ内にtarアーカイブ(gzip圧縮)として、ファイルを並列転送して保存するコンポーネントです。

HPCI-SSコンポーネントと同じく、`directory path`を設定してください。ただし、「9.5 HPCI-SSコンポーネントの保存」「9.6 HPCI-SS コンポートからの取り出し」
で使ったパスを削除していない場合は、違うパスを指定してください。

設定後、プロジェクト実行ボタンをクリックすると実行が始まります。

実行終了後、HPCI-SS-tarコンポーネントをクリックしてコンポーネントプロパティ画面を開き
下部の `Files` 領域を展開してください。

HPCI-SSコンポーネントと同じく `browse on remotehost` ボタンが表示されるので
クリックして接続してください。

![img](./img/browse_on_remote_button.png)

tarアーカイブ内に保存されているファイル一覧が表示されます。

![img](./img/files_hpciss-tar.png)

HPCI-SSなど他のコンポーネントと異なり、HPCI-SS-tarコンポーネントでは
WHEELのGUIから個別のファイルに対する操作(削除、リネームなど)や、新規ディレクトリの作成などは行なえません。

`remove storage directory` ボタンの機能は、HPCI-SSコンポーネントと同じですので
HPCI共用ストレージ上のtarアーカイブを削除する時には、こちらのボタンをクリックして削除してください。


#### 9.8 HPCI-SS-tar コンポートからの取り出し
最後に、HPCI-SS-tarコンポーネントからファイルを取り出すサンプルプロジェクトを実行してみましょう。

tutorial-HPCISS-loadプロジェクトを開いてください。

![img](./img/workflow_hpciss_tar_load.png)

HPCI-SS-tarコンポーネントのプロパティ画面を表示し、 `directory path` に 「9.7 HPCI-SS-tar コンポートへの保存」 と同じパスを設定してください。

このプロジェクトでは、tarアーカイブに保存されている file2 ファイルのみを取り出してtask0コンポーネントに渡しています。

このようにWHEELのGUI上ではHPCI-SS-tarコンポーネント内のファイルに対して個別の操作は行なえませんが
ワークフローの中では一部のファイルのみを取り出して他のコンポーネントに渡すことができます。

それでは、プロジェクト実行ボタンをクリックして実行してください。

プロジェクトが終了した後でtask0コンポーネントを開くとHPCI-SS-tarコンポーネントのoutputFileに指定した
file2のみがtask0コンポーネントに渡っており、アーカイブ内の他のファイルはダウンロードされてこないことが分かります。

![img](./img/result_hpciss_tar_load.png)

--------
[利用者向けのトップページに戻る]({{ site.baseurl }}/tutorial/)
