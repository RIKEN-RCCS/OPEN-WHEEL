# WHEELの起動方法

## 事前準備
WHEELの起動にはdockerを使用します。
最新の [docker](https://www.docker.com/) をインストールしてください。

## 起動方法
1. 任意の場所にディレクトリを作成します。(以降では、このディレクトリを`CONFIG_DIR`とします。)
2.  HTTPS通信用のサーバ証明書および鍵ファイルを、それぞれ`server.crt`, `server.key`という名前で`CONFIG_DIR`に格納します。
    自己証明書を使用する際は次のURLのドキュメントを参考にしてください。

    https://letsencrypt.org/docs/certificates-for-localhost/

    また、起動時に環境変数 WHEEL_USE_HTTP=1を指定することで、httpでの通信を行なうこともできます。
    ローカルネットワーク内での試用など、セキュリティ上の問題が無い環境でのみお使いください。

3. ターミナルを起動し、以下のコマンドを入力します。

```
> docker run -d -v ${HOME}:/root -v CONFIG_DIR:/usr/src/server/app/config -p 8089:8089 tmkawanabe/wheel:latest
```

このとき、`CONFIG_DIR`は、ホストマシン上での絶対パスである必要があります。

上記コマンドでは、

- プロジェクトファイルの作成先を${HOME}に指定しています
- WHHELのポート番号を8089に指定しています。

httpsの代わりにhttp通信を使いたい場合は`docker run`に次のオプションを追加して実行してください。
この場合は、サーバ証明書と鍵ファイルを`CONFIG_DIR`に置く必要はありません。

```
-e WHEEL_USE_HTTP=1
```

WHEELサーバが起動したら、ホストマシン上でwebブラウザを開いて、`http(s)://localhost:8089`にアクセスしてください。

--------
[トップページに戻る](../index.md)
