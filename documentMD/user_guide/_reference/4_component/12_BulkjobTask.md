---
title: BulkjobTask
---

![img](./img/bulkjobTask.png)

BulkjobTaskコンポーネントは、HPCミドルウェア「FUJITSU Software Technical Computing Suite（TCS）」のバルクジョブ機能に基づいた機能です。
バルクジョブを利用できるリモートホストが設定されている場合のみ使用することができます。

BuildjobTaskコンポーネントには、バルク番号、インプットファイルを指定することができ
これらの設定に基づいてサブジョブとして複数のジョブが投入されます。

バルクジョブ機能の詳細に関しては、HPCミドルウェア「FUJITSU Software Technical Computing Suite（TCS）」のドキュメントをご確認ください。

BulkjobTaskコンポーネントに設定できるプロパティは以下のとおりです。

### use parameter setting file for bulk number
バルク番号をパラメータ設定ファイルから指定するかどうかを設定します。

有効の時はパラメータ設定ファイルを指定することができます。

無効の時は、startおよびendの値を指定することができ、それぞれ開始バルク番号、終了バルク番号として扱われます。

### manual finish condition
コンポーネントの終了状態の判定を独自に指定するかどうかを設定します。

--------
[コンポーネントの詳細に戻る]({{ site.baseurl }}/reference/4_component/)
