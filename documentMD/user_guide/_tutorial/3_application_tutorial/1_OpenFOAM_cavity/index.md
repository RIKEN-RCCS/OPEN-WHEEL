---
title: OpenFOAMを利用したcavityケースの解析ワークフロー
lang: ja
permalink: /tutorial/3_application_tutorial/1_OpenFOAM_cavity/
---
本章では、WHEELを用いた計算事例として「OpenFOAMを利用したcavityケースの解析ワークフロー」を紹介します。

## 1. 概要

### 解析の内容について
この章で扱うモデルはCFDソフトウェアの基礎的な検証として有名な "cavity"モデルです。
上端の壁が水平方向に一定速度で動き、引きずられるように内部の流体が動くようなモデルの解析を行ないます。

![img](./img/cavity.png "cavity")

OpenFOAMの配布物には例題として、このモデルを用いる解析用のデータが含まれているので
そのファイルを用いて計算を実行します。

なお、本チュートリアルの最終ステップでは、WHEELサーバに
インストールされたParaViewを使用して
計算結果の可視化を行ないます。

このため、WHEELをリモートのサーバにインストールしてチュートリアルを実行していたり
ParaViewがインストールされていない環境で実行している場合は、
「解析結果の確認」の章は実行できません。

### ワークフローの概要

本章ではチュートリアルを通して、以下の3つのタスクコンポーネントからなるワークフローを作成します。

![img](./img/workflow.png "ワークフロー完成図")

preprocessコンポーネント
: OpenFOAM付属のcavityモデルを準備し、プリプロセス(メッシュ生成・領域分割)を行う。

solveコンポーネント
: preprocessコンポーネントで作成されたデータを用い、解析を実施する。また、後処理として、計算結果ファイルを圧縮する。

extractコンポーネント
: solveコンポーネントの出力を展開し、ParaViewで開ける状態にする。

## 2. ワークフローの作成
新規プロジェクトを作成し、始めに3つのTaskコンポーネントを追加してください。

各コンポーネントのプロパティ画面から、名前をそれぞれ __preprocess__、__solve__、__extract__ に変更してください。

### preprocess コンポーネントの設定
__preprocess__ コンポーネントのスクリプトファイルを作成します。
__preprocess__ コンポーネント内に __run.sh__  という名前で新規ファイルを作成し次の内容を記入してください。

```
. /vol0004/apps/oss/spack-v0.17.0/share/spack/setup-env.sh

spack load 'openfoam@2012%fj@4.8.0'

echo $FOAM_TUTORIALS
cp -r ${FOAM_TUTORIALS}/incompressible/icoFoam/cavity/cavity ./
mv decomposeParDict cavity/system/

cd cavity
blockMesh
decomposePar
```

このスクリプトでは、OpenFOAMのシステムディレクトリから
cavityケースをコピーした後、blockMeshによるメッシュ生成、decomposeParによる
領域分割を行ないます。

続いて、コンポーネントのプロパティ画面を開いて、以下の4項目を設定してください。

- script: run.sh
- host: fugaku
- use job scheduler: 有効
- output files: cavity

以上で __preprocess__ の設定は終了です。

### solveコンポーネントの設定
__solve__ コンポーネントにスクリプトファイルをします。
__solve__ コンポーネント内に __run.sh__  という名前で新規ファイルを作成し次の内容を記入してください。

```
. /vol0004/apps/oss/spack-v0.17.0/share/spack/setup-env.sh

spack load 'openfoam@2012%fj@4.8.0'

cd  cavity
mpiexec -np 4 icoFoam -parallel > ./log.icoFoam 2>&1
reconstructPar
touch result.foam

cd ../
tar cfzh  cavity.tgz ./cavity/
```

このスクリプトでは、 __preprocess__ コンポーネントで作成した入力データを用いて
icoFoamを用いた解析を実施します。
また、ParaViewでの可視化のために後処理を行ない、結果ファイルを圧縮しています。

続いて、コンポーネントのプロパティ画面を開いて、以下の4項目を設定してください。

- script: run.sh
- host: fugaku
- use job scheduler: 有効
- output files: cavity.tgz

### extractコンポーネントの設定
__extract__ コンポーネントに
__run.sh__  という名前で新規ファイルを作成し次の内容を記入してください。

```
tar xfz cavity.tgz
```

このスクリプトは、 __solve__ コンポーネントの出力結果を展開し、ParaViewを起動する準備をします。

最後にコンポーネントのプロパティを開いて、scriptに __run.sh__ を設定してください。

### ファイル依存関係の設定
最後にコンポーネント間の入出力設定を行います。
__preprocess__ のoutput filesに設定した `cavity` の▶を __solve__ コンポーネントにドロップして接続してください。
また、__solve__ コンポーネントのoutput filesに設定した `cavity.tgz` の▶を __extract__ コンポーネントにドロップして接続してください。

以上でワークフローの作成は完了です。__save project__ ボタンをクリックして作成したプロジェクトをsaveします。

![img](./img/workflow.png "ワークフロー完成図")

## 3. プロジェクトの実行
__run project__ ボタンをクリックして、プロジェクトを実行してください。
初めに、富岳へのログインに必要な秘密鍵のパスワードを聞かれますが、それ以降はワークフローの終了まで操作は不要です。

## 4. 解析結果の確認

本節では解析結果の確認を行います。

計算結果ファイルのパスを取得するため、
__extract__ コンポーネントのプロパティ画面を開いてFilesエリアを表示し
`cavity` ディレクトリを開いてください。
その下に `result.foam` ファイルが表示されるので、クリックして選択し __share file__ ボタンをクリックしてください。

![img](./img/file_share_button.png "ファイル共有ボタン")

__result.foam__ ファイルのパスが表示されます。
コピーボタンをクリックするとファイルのパスがクリップボードにコピーされるので、このファイル名を引数にParaViewを起動してください。

![img](./img/file_share_dialog.png "ファイル共有ダイアログ")


### 解析結果

参考として流速ベクトルの可視化結果を記載します。

![img](./img/cavity_result.png "流速ベクトル")


以上で、cavityケースの実行ワークフローは終了です。

--------
[実践編チュートリアルに戻る]({{ site.baseurl }}/tutorial/3_application_tutorial/)
