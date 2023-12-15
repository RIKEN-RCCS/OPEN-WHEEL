---
title: Storage
---

![img](./img/storage.png "storage")

Storageコンポーネントは、プロジェクトディレクトリの範囲外にある
ディレクトリにファイルを保存するためのコンポーネントです。

ワークフロー内のファイルはgitによって管理されており
実行中に生成されたファイルや変更されたファイルは
cleanup projectボタンをクリックすることで実行開始前の状態に戻されます。

同じプロジェクトを設定を変えて繰り返し実行するような場合など
プロジェクトの初期化後にも保持したいファイルは、
input files/output filesの機構を用いてStorageコンポーネントに転送することで
gitの管理外の場所にファイルを保存することができます。


Storageコンポーネントに設定できるプロパティは以下のとおりです。

### host
hostには実際にファイルを保存するホストを設定できます。

`localhost`が指定された場合は、WHEELの動作するマシン上にファイルのコピーが保存されます。
`localhost`以外が指定された場合は、リモートホスト上にファイルのコピーが保存されます。

### directory path
![img](./img/storage_path.png "storage_path")

directory pathに指定したディレクトリ下に、storageコンポーネントに転送されてきたファイルをコピーします。

directory pathがプロジェクトディレクトリの範囲内に設定されていると、プロジェクトの初期化時に消されてしまいます。
WHEELでは設定したdirectory pathがプロジェクトディレクトリ内かどうかの判定はしていないため、
必要に応じてプロジェクトディレクトリ外のpathを設定してください。

--------
[コンポーネントの詳細に戻る]({{ site.baseurl }}/reference/4_component/)
