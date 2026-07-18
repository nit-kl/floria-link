# Floria Link

「フロリア・リンク ～芽吹きの少女たち～」の2D版と3D版を管理するモノレポです。

## 構成

| パス | 内容 |
| --- | --- |
| `2d/` | HTML / CSS / JavaScriptで作られた既存の2D Webゲーム |
| `3d/blender/` | Blender MCPで作成したマップ、素材、再生成スクリプト |
| `3d/godot/` | Godot 4で開発する3Dゲームプロジェクト |

## 2D版

```powershell
cd 2d
npm install
npm start
```

ブラウザで <http://localhost:5173> を開きます。

テストとLintは次のコマンドで実行します。

```powershell
cd 2d
npm test
npm run lint
```

## 3D版

Blender側の制作物は `3d/blender/` にあります。Godotプロジェクトは
`3d/godot/` に作成し、Blenderから書き出したGLBをGodotへ読み込む構成にします。

詳しくは各フォルダのREADMEを参照してください。
