# WHEELの起動方法

## 事前準備
WHEELの起動にはdockerを使用します。
最新の [docker](https://www.docker.com/) を取得してください。

## 起動方法
1. 任意の場所にディレクトリを作成します。(以降では、このディレクトリを`CONFIG_DIR`とします。)
2. `CONFIG_DIR`に以下の2つのファイルをダウンロードします。
    - [jobScheduler.json](https://raw.githubusercontent.com/RIKEN-RCCS/OPEN-WHEEL/master/app/config/jobScheduler.json)
    - [server.json](https://raw.githubusercontent.com/RIKEN-RCCS/OPEN-WHEEL/master/app/config/server.json)
3.  HTTP通信用のサーバ証明書および鍵ファイルを作成し、`CONFIG_DIR`に格納します。(HTTP通信用自己証明書の作成方法は、[self-signed certification](../../../self-signed_certification.md)を参考ください。)
4. ターミナルを起動し、以下のコマンドを入力します。

```
> docker run -d -v ${HOME}:/root -v CONFIG_DIR:/usr/src/app/config -p 8089:8089 tmkawanabe/wheel:latest
```

このとき、`CONFIG_DIR`は、ホストマシン上での絶対パスである必要があります。

上記コマンドでは、

- プロジェクトファイルの作成先を${HOME}に指定しています
- WHHELのポート番号を8089に指定しています。

WHEELサーバが起動したら、ホストマシン上でwebブラウザを開いて、`https://localhost:8089`にアクセスしてください。



--------
[トップページに戻る](../../index.md)
