---
title: 利用開始前の設定確認
layout: single
permalink: /preparation_for_use/
toc: true
toc_sticky: true
sidebar:
    nav: "user-docs"
---

WHEELの利用開始前に、初期設定として行われたリモートホスト設定の内容が正しいことを確認します。

### リモートホスト設定の確認
WHEELにアクセスし、画面右上のハンバーガーメニューをクリックします。

![hamburger menu]({{ site.baseurl }}/{{ site.include }}{{ page.url }}img/workflow6.png "hamburger menu")

表示されたメニュー内の __Remotehost editor__ をクリックします。リモートホスト設定画面が別タブで表示されます。

!["Remotehost editor"]({{ site.baseurl }}/{{ site.include }}{{ page.url }}img/remotehost_editor_button.png "Remotehost editor")

[リモートホスト設定]({{ site.baseurl }}/how_to_boot/#リモートホスト設定)で登録されたリモートホスト一覧が表示されます。右端の鉛筆アイコンをクリックしてホスト情報編集ダイアログを表示します。

!["edit icon"]({{ site.baseurl }}/{{ site.include }}{{ page.url }}img/remotehost_editor2.png "edit icon")

設定内容が正しいことを確認します。

!["設定内容の確認"]({{ site.baseurl }}/{{ site.include }}{{ page.url }}img/add_new_host.png "設定内容の確認")

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
!["リモートホスト一覧"]({{ site.baseurl }}/{{ site.include }}{{ page.url }}img/remotehost_list.png "リモートホスト一覧")

__connection test__ 列に表示された __TEST__ ボタンをクリックし、リモートホストへの接続テストを行います。

!["connection test"]({{ site.baseurl }}/{{ site.include }}{{ page.url }}img/connection_test.png "connection test")

パスワード入力ダイアログが表示されます。リモートホストに接続するためのパスワードを入力し、 __OK__ ボタンをクリックします。

!["Input password"]({{ site.baseurl }}/{{ site.include }}{{ page.url }}img/input_password.png "Input password")

リモートホストへの接続テストが実施され、リモートホスト一覧の __connection test__ 列に結果が表示されます。


リモートホストへの接続が成功した場合は、 __OK__ ボタン表示になります。

!["Result ok"]({{ site.baseurl }}/{{ site.include }}{{ page.url }}img/result_ok.png "Result ok")

リモートホストへの接続が失敗した場合は、 __FAILED__ ボタン表示になります。  
[リモートホスト設定の確認](#リモートホスト設定の確認)に従い、設定内容を見直してください。

!["Result failed"]({{ site.baseurl }}/{{ site.include }}{{ page.url }}img/result_failed.png "Result failed")




--------
[トップページに戻る]({{ site.baseurl }}/)