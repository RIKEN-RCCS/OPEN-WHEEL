# user_guideについて
user_guide配下はgithub actions上でビルドされた上でgithub pagesに公開されます。
ここでは、user_guideに含まれるドキュメントの構成や公開方法等について説明します。

## ご利用の前に
### _config.ymlの設定
Jekyllの設定ファイル`_config.yml`の内容は作業リポジトリ用の設定になっています。
適宜、利用環境に合わせて修正してください。
```diff
-repository: taki-036/OPEN-WHEEL
-url: "https://taki-036.github.io"
+repository: `Your repository`
+url: "https://`Your site`"
 remote_theme: "mmistakes/minimal-mistakes"
```

### フォルダ構成
以下はuser_guideの配下のディレクトリです。
* ドキュメント(markdown)が格納されたディレクトリ
  * _for_admins: 管理者向けドキュメント
  * _pages: 特定メニューに紐づかない、独立したドキュメント
  * _reference: リファレンスマニュアル
  * _tutorial: チュートリアル
* サイトの構成/設定情報が格納されたディレクトリ
  * assets: css/js
  * _includes: ページフッタ設定(言語スイッチャ)
  * _data: ヘッダメニュー、サイドバーメニューの構成情報

原則として、[Jekyll](https://jekyllrb-ja.github.io/)のルールに従った配置になっています。

## テーマプラグイン
本ドキュメントは[Minimal Mistakes](https://mmistakes.github.io/minimal-mistakes/)テーマを採用しています。

### Minimal Mstakes利用のための環境設定
ここでは、Minimal Mistakesを利用するための設定について説明します。
本節の内容はドキュメントの更新のための主な変更内容を説明するものであり、すでに適用済みです。

#### docker-compose.ymlの修正
Minimal Mistakesは[jekyll-include-cache](https://github.com/benbalter/jekyll-include-cache)を必要とするため、コンテナ作成時にインストールします。
```diff
 command: >
   bash -c "gem install webrick &&
     gem install jekyll-remote-theme &&
+    gem install jekyll-include-cache &&
     jekyll serve"
```
#### _config.ymlの修正
リモートテーマとしてMinimal Mistakesを呼び出すよう変更。
```diff
-remote_theme: "pages-themes/slate@v0.2.0"
+remote_theme: "mmistakes/minimal-mistakes@4.24.0"
 plugins:
   - jekyll-remote-theme
+  - jekyll-include-cache
 title: "WHEEL user guide"
```

### テーマのカスタマイズ
本ドキュメントでは一部、テーマをカスタマイズしています。

#### 検索結果画面
標準では検索結果画面には「ページ先頭の20単語」を表示しますが、日本語の単語分割ができないため、「ページ先頭の200文字」を表示するようカスタマイズしています。

カスタムファイルは`assets/js/lunr-en.js`です。オリジナルのファイルを一部修正したものになります。なお、修正点は以下の通りです。
```diff
--- Minimal Mistakes標準
+++ カスタム版
@@ -52,7 +52,7 @@
               '<div class="archive__item-teaser">'+
                 '<img src="'+store[ref].teaser+'" alt="">'+
               '</div>'+
-              '<p class="archive__item-excerpt" itemprop="description">'+store[ref].excerpt.split(" ").splice(0,20).join(" ")+'...</p>'+
+              '<p class="archive__item-excerpt" itemprop="description">'+store[ref].excerpt.substr(0, 200)+'...</p>'+
             '</article>'+
           '</div>';
       }
@@ -63,11 +63,11 @@
               '<h2 class="archive__item-title" itemprop="headline">'+
                 '<a href="'+store[ref].url+'" rel="permalink">'+store[ref].title+'</a>'+
               '</h2>'+
-              '<p class="archive__item-excerpt" itemprop="description">'+store[ref].excerpt.split(" ").splice(0,20).join(" ")+'...</p>'+
+              '<p class="archive__item-excerpt" itemprop="description">'+store[ref].excerpt.substr(0, 200) + '...</p>'+
             '</article>'+
           '</div>';
       }
       resultdiv.append(searchitem);
     }
   });
-});
+});
```

#### 画面幅の変更
標準では左右のマージンが大きすぎるため、マージンを小さくしています。

カスタムファイルは`assets/css/main.scss`です。オリジナルのファイルを一部修正したものになります。なお、修正点は以下の通りです。
```diff
--- Minimal Mistakes標準
+++ カスタム版
@@ -5,5 +5,7 @@

 @charset "utf-8";

+$max-width: 90%;
+
 @import "minimal-mistakes/skins/{{ site.minimal_mistakes_skin | default: 'default' }}"; // skin
 @import "minimal-mistakes"; // main partials
```
#### 言語スイッチャの追加
英語版ドキュメントとの切り替えのため、カスタマイズ用のフッタファイル(`_includes/footer/custom.html`)を追加しています。

```diff
<div class="page__footer text-right">
	{% for tongue in site.languages %}
	    <a {% if tongue == site.active_lang %}style="font-weight: bold;"{% endif %} {% static_href %}href="{% if tongue == site.default_lang %}{{site.baseurl}}{{page.url}}{% else %}{{site.baseurl}}/{{ tongue }}{{page.url}}{% endif %}"{% endstatic_href %} >{{ tongue }}</a>{%- if forloop.last == false -%}{{" "}}{{ site.langsep }}{%- endif -%}
	{% endfor %}
</div>
```

言語スイッチャはMinimal Mistakes + Polyglotの環境でのみ動作するのでご注意ください。

### サイドバー、ヘッダメニューの設定
Minimal Mistakesのメニュー構成は`_data/navigation.yml`内にYAMLで定義します。
本ドキュメントでは下記、4つのメニューを用意しています。
* main: ヘッダメニュー
* admin-docs: 管理者向けドキュメントの左サイドバーメニュー
* user-docs: ユーザ向けドキュメントの左サイドバーメニュー
* refs: リファレンスマニュアルの左サイドバーメニュー

ここで定義した左サイドバーメニューはFront Matter(または`_config.yml`のdefaults)で呼び出しています。


## 多言語化
多言語化には[Polyglot](https://polyglot.untra.io/)を使用しています。

### Polyglot利用のための環境設定
ここでは、Polyglotを利用するための設定について説明します。
本節の内容はドキュメントの更新のための主な変更内容を説明するものであり、すでに適用済みです。

#### docker-compose.ymlの修正
コンテナ作成時にPolyglotをインストールします。
```diff
 command: >
   bash -c "gem install webrick &&
     gem install jekyll-remote-theme &&
     gem install jekyll-include-cache &&
+    gem install jekyll-polyglot &&
     jekyll serve"
```
#### _config.ymlの修正
pluginとしてPolyglotを呼び出すよう修正。
```diff
 remote_theme: "mmistakes/minimal-mistakes@4.24.0"
 plugins:
   - jekyll-remote-theme
   - jekyll-include-cache
+  - jekyll-polyglot
 title: "WHEEL user guide"
```

### 英語版のページ構成
#### 日本語・英語版のファイルの配置
日本語版、英語版のファイルは同じフォルダに配置するものとします。
また、ファイルの命名ルールは以下の通りです。

* 日本語：hogehoge.md
* 英語：hogehoge<strong>.en</strong>.md

本ルールはドキュメントの修正作業を円滑に進めるための、運用ルールです。システム的には後述の[Front Matterの設定](#front-matterの設定)に従って日本語・英語版を判別します。

#### Front Matterの設定
各ページごとに、日本語・英語それぞれに向けてFront Matterを設定する必要があります。例として、以下にトップページのFront Matterを示します。

```diff
--- 日本語版
+++ 英語版
 ---
 layout: single
-title: はじめに
+title: Introduction
 permalink: /
-lang: ja
+lang: en
 ---
```

日本語、英語の違いは`title`および`lang`の2箇所です。`title`はhtml化した際の`<title>`タグとして扱われます。

Jekyll+Polyglotは`permalink`でページのURLを決定し、`lang`によってページの言語設定を判別します。したがって、一つのURL(=`permalink`)に対し、`lang: ja`と`lang: en`の2つのファイルを作成してください。

上記の設定を行うことで、自動的に下記のような英語版のページ構成が作成されます。
|言語|URL|
|-|-|
|ja|/OPEN-WHEEL/xxx/yyy/zzzz.html|
|en|/OPEN-WHEEL/__en__/xxx/yyy/zzzz.html|

#### 英語版メニューの作成
英語版のメニューは`_data/en/navigation.yml`で定義します。文法や記載内容は日本語版と同じです。(メニュー項目の言語が異なるのみ)

メニュー構成を変更する際は日本語版`_data/navigation.yml`と英語版`_data/en/navigation.yml`の両方を変更する必要があります。

## ページのビルド

### 作業時
ドキュメント編集作業中はDockerコンテナ上でJekyllサーバを動かすことで、ローカルマシン上でビルド、サイトの確認が行えます。

#### Jekyll実行ユーザの設定
JekyllコンテナはデフォルトでUID=1000/GID=1000で動作します。作業中のローカルアカウントのUID/GIDに合わせるため、`.env`ファイルを作成します。
(`.env`ファイルがない場合、Jekyllでビルドしたフォルダ・ファイルのオーナがUID=1000/GID=1000になります)
```
$ cd ${OPEN-WHEEL}/documentMD/user_guide
$ echo UID=`id -u` > .env && echo GID=`id -g` >> .env
```

#### Jekyllサーバの起動
以下のコマンドでJekyllサーバを起動します。
```
$ cd ${OPEN-WHEEL}/documentMD/user_guide
$ docker compose up
```

起動後はmarkdownファイルを変更すると自動的にhtmlが更新されます。
ファイルの追加・削除やメニュー(`navigation.yml`)の変更時にも自動更新されるので、Jekyllサーバを起動したままドキュメントの更新作業が可能です。

ただし、`_config.yml`を編集した場合のみ、Jekyllサーバの再起動が必要になるのでご注意ください。

### github actions上でのビルド
多言語化プラグインPolyglot使用しているサイトはgithub pages上でビルドできません。
そのため、カスタムワークフローを使用し、github actions上でビルド+デプロイを行います。使用しているワークフローは`${OPEN-WHEEL}/.github/workflow/jekyll-gh-pages.yml`です。

#### docker_compose.build.ymlについて
`docker-compose.build.yml`はgithub actions上でビルドするためのファイルです。
基本的な内容は`docker-dompose.yml`と同じですが、github actions上で動かすため、
以下の点が異なります。
* Jekyllの実行アカウントをUID=1001(github actionsでのUID)をセット
* Jekyllサーバを使わずにビルドのみで終了
* Jekyllサーバは使わないのでport設定を削除
```diff
--- docker-compose.yml
+++ docker-compose.build.yml
@@ -3,8 +3,8 @@
   service_jekyll:
     image: "jekyll/jekyll:latest"
     environment:
-      - JEKYLL_UID=${UID}
-      - JEKYLL_GID=${GID}
+      - JEKYLL_UID=1001
     volumes:
       - .:/srv/jekyll/
     command: >
@@ -12,8 +12,6 @@
       gem install jekyll-remote-theme &&
       gem install jekyll-include-cache &&
       gem install jekyll-polyglot &&
-      jekyll serve"
-    ports:
-      - "4000:4000"
+      jekyll build"
     tty: true
     stdin_open: true
```
