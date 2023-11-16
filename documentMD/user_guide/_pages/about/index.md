---
title: WHEELについて
layout: single
permalink: /about/
toc: true
toc_sticky: true
---
WHEELは、解析ジョブの作成/実行をインタラクティブに操作するWebツールです。
ブラウザ上でワークフローを作成することで、CUIを使わずに複雑な解析ジョブを実行できます。

WHEELは、2016年に九州大学情報工学研究所 (RITT) によって開発が開始されました。
現在も[https://github.com/RIIT-KyushuUniv/WHEEL](https://github.com/RIIT-KyushuUniv/WHEEL "WHEEL")でホストされており、RIKEN R-CCSがフォークして開発を継続しています([https://github.com/RIKEN-RCCS/OPEN-WHEEL](https://github.com/RIKEN-RCCS/OPEN-WHEEL "OPEN-WHEEL"))。

## WHEELのシステム構成図
システム構成のイメージは以下の通りです。
![システム構成図]({{ site.baseurl }}/{{ site.include }}{{ page.url }}img/system_diagram.svg "システム構成図")

## 動作環境
WHEELはDocker上で起動します。したがって、PCには最新のDockerをインストールしてください。

## 使用上の注意事項
WHEELにはアカウント制御機能はありません。
そのため、WHEELは1ユーザで使用する必要があります。
複数のユーザが使用する場合は、ユーザごとにWHEEL環境(Docker+WHEEL)をご用意ください。

また、計算実行中にWHEEL環境を停止することはできません。
そのため、Dockerを停止しないでください。
Dockerを停止した場合、計算結果が得られません。


--------
[トップページに戻る]({{ site.baseurl }}/)