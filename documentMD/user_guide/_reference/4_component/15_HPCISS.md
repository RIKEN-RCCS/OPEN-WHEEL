---
title: HPCI-SS
lang: ja
permalink: /reference/4_component/15_HPCISS.html
---

![img](./img/hpciss.png "hpciss")

HPCI-SSコンポーネントは、Storageコンポーネントの亜種でファイルの保存場所として
HPCI共用ストレージを使うコンポーネントです。

HPCI-SSコンポーネントに設定できるプロパティは以下のとおりです。

### host
hostには、gfarmコマンド(gfcp, gfpcopyなど)を実行してHPCI共用ストレージへ
ファイルの転送を行うホストを設定します。ファイルの実体が保存されるのはHPCI共用ストレージであり、
host自体にファイルが保存されるわけではありません。

ただし、hostとして設定できるのはremotehost設定で `use gfarm` にチェックをつけたもの
だけです。

HPCI-SSコンポーネントは常にHPCI共用ストレージへファイルを転送する必要があるため、
hostの設定は必須です。storageコンポーネントと異なり、localhost（ローカルパス）を
指定することはできません。hostが未設定、またはlocalhostが設定されている場合、
プロジェクト実行時にバリデーションエラーとなります。


### directory path
![img](./img/storage_path.png "storage_path")

storageコンポーネントと同じく、実際にファイルを保存するパスですが
host上のパスではなくHPCI共用ストレージのパスを指定する必要があります。

directory pathの設定も必須です。空欄のままプロジェクトを実行しようとすると
バリデーションエラーとなります。

### memo
自由記述のメモを入力できます。ここに入力した内容は、ファイル転送時にHPCI共用ストレージ上の
ファイルに付与されるGFarm拡張属性のメタデータ（`wheel.workflow`）に `<memo>` として
そのまま出力されます。保存したファイルの由来や用途などを記録しておく用途に利用できます。

### 制約事項
HPCI共用ストレージでは既に存在するディレクトリに対して上書きでコピーを行なうことができません。
このため、HPCI-SSコンポーネントが `foo` ディレクトリを先行コンポーネントから受け取った時
初回実行時は、 directory pathに指定したパスの直下に foo ディレクトリが作成され
コンポーネントが受け取ったfooの中身がfooディレクトリ以下にコピーされますが
2回目以降に実行した時は、directory path直下に `WHEEL_TMP_XXXXXX (XXXXXX部分はランダムな文字列)` という
ディレクトリが作成され、その下にfooディレクトリがコピーされることになります。




--------
[コンポーネントの詳細に戻る]({{ site.baseurl }}/reference/4_component/)
