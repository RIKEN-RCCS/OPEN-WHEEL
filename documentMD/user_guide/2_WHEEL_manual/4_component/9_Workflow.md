# Workflow

![img](./img/workflow/workflow.png "workflow")  

Workflowコンポーネントは、複数のコンポーネントからなる処理を一つのコンポーネントにまとめるために用います。  
Workflowコンポーネントを使用することで、ワークフロー編集画面上を処理毎に集約することができ、ワークフロー全体の見通しを良くすることができます。  

Workflowコンポーネントのプロパティは以下です。

| プロパティ | 入力値 | プロパティ説明 |
|----|----|----|
| name | 文字列 | コンポーネント名 |
| description | 文字列 | コンポーネントの説明文 |
| inputFiles | ファイルまたはディレクトリ名 | 先行コンポーネントから受け取るファイル |
| outputFiles | ファイル, ディレクトリ名またはglobパターン | 後続コンポーネントへ渡すファイル |
| clean up flag | ラジオボタン | リモート環境に作成した一時ファイルの取り扱い決定フラグ |
|  | clean up | 削除する |
|  | keep files | 削除しない |
|  | follow parent setting | 親コンポーネントと同じ挙動をする |
| state clean | ボタン | コンポーネントの進行状態を初期状態に戻す *1 |

*1 コンポーネントの進行状態が"finished"もしくは"failed"の時のみ表示されます。

# Workflowコンポーネントの使用例

Workflowコンポーネントは、複数のコンポーネントからなる処理を一つのコンポーネントにまとめるために用います。  
Workflowコンポーネントを使用することで、ワークフロー編集画面上を処理毎に集約することができ、ワークフロー全体の見通しを良くすることができます。

サンプルプロジェクトは下記からダウンロード可能です。  
<a href="./sample/WorkflowSampleProject_1.wheel.zip">Workflowコンポーネント未使用</a>  
<a href="./sample/WorkflowSampleProject_2.wheel.zip">Workflowコンポーネント使用</a>  

#### Workflowコンポーネント未使用  

![img](./img/workflow/Workflow_1.png "Workflow_1")

#### Workflowコンポーネント使用  

![img](./img/workflow/Workflow_2.png "Workflow_2")

以下に実行結果を示します。  

#### Workflowコンポーネント未使用 実行結果  

![img](./img/workflow/Workflow_1_result.png "Workflow_1_result")

#### Workflowコンポーネント未使用実行結果（ログ）

![img](./img/workflow/Workflow_1_result_log.png "Workflow_1_result_log")

#### Workflowコンポーネント使用実行結果

![img](./img/workflow/Workflow_2_result.png "Workflow_2_result")