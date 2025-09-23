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
hostには実際にファイルを保存するホストを設定できます。
ただし、hostとして設定できるのはremotehost設定で `use gfarm` にチェックをつけたもの
だけです。

また、gfarmコマンド(gfcp, gfpcopyなど)を用いて
HPCI共用ストレージにファイルの転送を行うことができるホストのみが利用できます。


### directory path
![img](./img/storage_path.png "storage_path")

storageコンポーネントと同じく、実際にファイルを保存するパスですが
host上のパスではなくHPCI共用ストレージのパスを指定する必要があります。

### 制約事項
HPCI共用ストレージでは既に存在するディレクトリに対して上書きでコピーを行なうことができません。
このため、HPCI-SSコンポーネントが `foo` ディレクトリを先行コンポーネントから受け取った時
初回実行時は、 directory pathに指定したパスの直下に foo ディレクトリが作成され
コンポーネントが受け取ったfooの中身がfooディレクトリ以下にコピーされますが
2回目以降に実行した時は、directory path直下に `WHEEL_TMP_XXXXXX (XXXXXX部分はランダムな文字列)` という
ディレクトリが作成され、その下にfooディレクトリがコピーされることになります。




--------
[コンポーネントの詳細に戻る]({{ site.baseurl }}/reference/4_component/)
