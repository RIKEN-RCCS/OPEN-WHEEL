---
title: リモートホスト設定の確認
layout: single
permalink: /preparation_before_use/
toc: true
---

## 利用開始前の確認
WHEELの利用開始前に、初期設定として行われたリモートホスト設定の内容が正しいことを確認します。

### リモートホスト設定の確認
まず、WHEELにアクセスし、画面右上のハンバーガーメニューをクリックします。

![hamburger menu](img/workflow6.png)

表示されたメニュー内の __Remotehost editor__ をクリックします。リモートホスト設定画面が別タブで表示されます。

!["リモートホストエディタリンク"](img/remotehost_editor_button.png)

[リモートホスト設定]({{ site.baseurl }}/how_to_boot/#リモートホスト設定)で登録されたリモートホスト一覧が表示されます。右端の鉛筆アイコンをクリックしてホスト情報編集ダイアログを表示します。

!["リモートホストエディタ追加編集"](img/remotehost_editor2.png)

設定内容が正しいことを確認します。

!["check the add new host dialog"](img/add_new_host.png)

Hostname
: 接続先のホスト名またはIPアドレス

User ID
: 接続先ホストでのユーザID

Host work dir
: リモートホスト内で使用するディレクトリのパス

もし設定内容に誤りがある場合は修正してください。
__OK__ ボタンをクリックして、ダイアログを閉じます。

### リモートホストへの接続確認
続いて、WHEELからリモートホストに接続できることを確認します。

リモートホスト設定画面を表示します。
!["List of remote hosts"](img/remotehost_list.png)

__connection test__ 列に表示された __TEST__ ボタンをクリックし、リモートホストへの接続テストを行います。
!["Connection test button"](img/connection_test.png)

パスワード入力ダイアログが表示されます。リモートホストに接続するためのパスワードを入力し、 __OK__ ボタンをクリックします。
!["Input password"](img/input_password.png)

リモートホストへの接続テストが実施され、リモートホスト一覧の __connection test__ 列に結果が表示されます。


リモートホストへの接続が成功した場合は、 __OK__ ボタン表示になります。
!["Result ok"](img/result_ok.png)

リモートホストへの接続が失敗した場合は、 __FAILED__ ボタン表示になります。  
[リモートホスト設定の確認](#リモートホスト設定の確認)に従い、設定内容を見直してください。
!["Result failed"](img/result_failed.png)




--------
[トップページに戻る]({{ site.baseurl }}/)