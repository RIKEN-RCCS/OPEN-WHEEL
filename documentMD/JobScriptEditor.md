# JobScriptEditor画面で用いるデータ
JobScriptEditor画面のフォームを定義するデータは、以下の書式のJSONで定義する。

[
  {
    centerName: 元になったビルトインテンプレート名,
    name: 以下の設定一式を区別するためのlabel(重複不可、変更可),
    id: 設定一式を区別するためのユニーク文字列(重複、変更不可、自動採番),
    jobScheduler: 使うジョブスケジューラ(JobScheduler.json内で定義された項目のみ可)
    optionValues: [
      {
        label: この設定項目を区別するためのlabel(重複不可、変更不可),
        type: この設定項目に値を入力する方法(select, number, textのいずれか、変更不可),
        prop: この設定が使う変数名(重複不可、JSの変数として使える文字列),
        value: 設定値,
        items: [指定可能な値の一覧(selectの時のみ、変更不可)]
      }
    ]
  }
以下繰り返し
]

これらの設定は、`client/lib/hpcCenter.json`および `${WHEEL_CONFIG_DIR}/jobScriptTemplates.json` 内で定義され、前者はクライアントコードのビルド時に埋込み、
後者はjobScriptEditor上でregister/loadすることで、サーバサイドに登録/呼出しを行なう

hpcCenter.jsonのデータは、右ペインの一番上のドロップダウンリストに
表示される。
jobScriptTemplates.jsonのデータは、registerボタンをクリックした時の
右ペイン内での設定内容に名前をつけて保存したもので
LOADボタンをクリック -> 名前の一覧をダイアログで表示 -> ユーザが選択したものを読み込み
という流れで右ペインのフォームに値が読み込まれる

idは、組込みデータについては builtin+数字の形式とし
このidのデータに対するregister処理は新規データの追加として扱い
idを採番して新規にサーバサイドに保存する
