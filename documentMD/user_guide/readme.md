# WHEEL　ユーザーガイド 

## はじめに
### ・ 本ユーザガイドの目的  
本ユーザーガイドは、ワークフローシステムWHEELの初学者が自身の課題を解決するためのワークフローを、WHEELを使って実現するための自習用ドキュメントです。  
本チュートリアルの対象ユーザは、シェルスクリプトに関する知識、および「京」コンピュータのジョブスクリプトの作成方法とジョブの投入方法についての知識は有しているものとしています。  
### ・ 本ユーザガイドの構成  
本ユーザガイドは、以下の内容によって構成されています。  
1. WHEELの手順書
    1. [WHEELのインストール](WHEEL_introduction/1_install/install.md)
    1. [WHEELの起動（サーバ、クライアント）](WHEEL_introduction/2_start/start.md)
    1. [WHEELの終了（サーバ、クライアント）](WHEEL_introduction/3_finish/finish.md)
    1. [WHEELのアンインストール](WHEEL_introduction/4_uninstall/uninstall.md)
1. WHEELのマニュアル
    1. ホーム画面
        1. [新規プロジェクトの作成（ニュー、インポート）](WHEEL_manual/1_home_screen/create_project.md)
        1. [既存プロジェクトの編集（オープン、リネーム、デリート）](WHEEL_manual/1_home_screen/edit_project.md)
    1. [リモートホスト登録画面](WHEEL_manual/2_remotehost_screen/remotehost.md)
    1. ワークフロー画面
        1. [グラフビュー画面仕様説明](WHEEL_manual/3_workflow_screen/1_graphview.md)
        1. [リストビュー画面仕様説明](WHEEL_manual/3_workflow_screen/2_listview.md)
        1. [テキストエディタ画面仕様説明](WHEEL_manual/3_workflow_screen/3_rapid.md)
    1. コンポーネントの説明
        1. [Task](WHEEL_manual/4_component/1_Task.md)
        1. [If](WHEEL_manual/4_component/2_If.md)
        1. [For](WHEEL_manual/4_component/3_For.md)
        1. [Foreach](WHEEL_manual/4_component/4_Foreach.md)
        1. [While](WHEEL_manual/4_component/5_While.md)
        1. [Source](WHEEL_manual/4_component/6_Source.md)
        1. [Viewer](WHEEL_manual/4_component/7_Viewer.md)
        1. [ParameterStudy](WHEEL_manual/4_component/8_ParameterStudy.md)
        1. [Workflow](WHEEL_manual/4_component/9_Workflow.md)
        1. [Stepjob](WHEEL_manual/4_component/10_Stepjob.md)
        1. [コンポーネントのプロパティ仕様詳細](WHEEL_manual/4_component/11_component_design.md)
    1. [ワークフローの実行](WHEEL_manual/5_execute_workflow/execute_workflow.md)
    1. [ジョブスクリプトテンプレート作成画面](WHEEL_manual/6_jobScript_screen/jobScript.md)
1. WHEELのチュートリアル
    1. [OpenFOAMを利用したパラメトリックスタディ解析ワークフロー](WHEEL_tutorial/1_OpenFOAM_PS_sample/OpenFOAM_PS_sample.md)  
    1. [京プリポストクラウドを計算資源としたOpenFOAM解析ワークフロー](WHEEL_tutorial/2_2_OpenFOAM_KPrepostCloud_sample/OpenFOAM_KPrepostCloud_sample.md)  
    1. [OpenFOAMを利用したcavityケースの解析ワークフロー](WHEEL_tutorial/3_OpenFOAM_TCS_sample/OpenFOAM_TCS_sample.md)  
    1. [TensorFlowを利用したMNISTデータ解析ワークフロー](WHEEL_tutorial/4_TensorFlow_UGE_sample/TensorFlow_UGE_sample.md)  
1. WHEELの注意事項
    1. [WHEELの注意事項](ATTENTION.md)