---
title: チュートリアル 実践編
toc: false
toc_sticky: false
lang: ja
permalink: /tutorial/3_application_tutorial/
---

本チュートリアルでは、富岳を利用してOpenFOAM, TensorFlowといったアプリケーションを使ったワークフローを作成・実行します。

以降、リモートホストとして __fugaku__ という名前で富岳にアクセスできることを前提とします。
事前に富岳のリモートホスト設定を作成してから、チュートリアルを始めてください。

リモートホスト設定の作成方法については、[管理者向け リモートホスト設定]({{ site.baseurl }}/for_admins/how_to_boot/#リモートホスト設定) をご参照ください。

 * [OpenFOAMを利用したcavityケースの解析ワークフロー](1_OpenFOAM_cavity/)

 * [OpenFOAMを利用したパラメータスタディ解析ワークフロー](2_OpenFOAM_PS/)

 * [TensorFlowを利用したMNISTデータ解析ワークフロー](3_TensorFlow_mnist/)

 * [OpenFOAMのパラメータスタディ実行結果をJupyternotebook上で表示する解析ワークフロー](4_OpenFOAM_jupyter/)

__アプリケーションの動作確認について__
実践編チュートリアルで用いるアプリケーション(OpenFOAM, TensorFlow)の動作確認は、2023年3月に実施しています。
それ以降のアップデート等により、ファイルのパスなどが変更されている可能性もありますのでご注意ください。
{: .notice--info}
--------
[利用者向けのトップページに戻る]({{ site.baseurl }}/tutorial/)
