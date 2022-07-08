# Viewer

![img](./img/viewer.png "viewer")

Viewerコンポーネントはプロジェクト実行中に生成される画像ファイルなどを
ブラウザから確認するためのコンポーネントです。
表示可能なファイルは次のとおりです。

- apng (Animated Portable Network Graphics)
- avif (AV1 Image File Format)
- gif (Graphics Interchange Format)
- jpeg (Joint Photographic Expert Group image)
- png (Portable Network Graphics)
- webp (Web Picture format)
- tiff (Tagged Image File Format)
- bmp (BitMaP image)
- svg (Scalable Vector Graphics)

Viewerコンポーネントに指定できる固有のプロパティはありません。
また、ViewerコンポーネントにはoutputFilesプロパティを設定することはできません。

### Viewerコンポーネントの挙動
Viewerコンポーネントは先行するコンポーネントの実行終了後に
inputFileから接続されたファイルを受け取ります。

これらのファイルに、ブラウザで表示可能な画像ファイルが含まれている時は
初回のみブラウザ上にダイアログが表示され、
`OK`をクリックすると別のタブでビューワー画面が表示されます。

![img](./img/viewer_dialog.png "viewer_dialog")

また、画面上部のビューワー画面表示ボタンが有効になり
以降はこのボタンをクリックすることでビューワー画面を表示することができます。




--------
[リファレンスマニュアルのトップページに戻る](../index.md)
