# Floria Link — Awakening Garden

共有企画「フロリア・リンク ～芽吹きの少女たち～」のMVP用フィールド、
エリア1「目覚めの庭園」のBlenderシーンです。

## ファイル

- `floria_awakening_garden.blend` — 完成シーン
- `floria_awakening_garden_preview.png` — ゲームカメラからのプレビュー
- `floria_awakening_garden_gameplay.blend` — 画像素材を統合したゲームプレイ版
- `floria_awakening_garden_gameplay_preview.png` — ゲームプレイ版の全景
- `floria_awakening_garden_combat_preview.png` — 序盤戦闘用の近接カメラ
- `build_floria_map.py` — Blender MCPから再生成できるスクリプト
- `enhance_floria_with_assets.py` — `images` の素材を統合するスクリプト

## マップ構成

- 左下: プレイヤー開始地点、巨大なスプーン
- 左上: 帰還拠点（温室・工房・帰還ビーコン）
- 中央: 小川、修理対象の木橋、主探索ルート
- 右下: 苔むした旧庭園遺跡
- 右上: 巨大な空き缶と世界樹
- 全域: 花畑、岩、木、草地、分岐路

## ゲーム実装用アンカー

BlenderのEmptyとして次の地点を配置しています。各Emptyには `gameplay_type` カスタムプロパティがあります。

- `SPAWN_Player`
- `GOAL_WorldTree`
- `GIMMICK_BridgeRepair`
- `GIMMICK_WaterCrossing`
- `ENCOUNTER_Meadow`
- `ENCOUNTER_Ruins`
- `RETURN_Base`

単位は1 Blender unit = 1 mです。`Game_Camera` は企画書に合わせた斜め上の見下ろしカメラです。

ゲームプレイ版には炎・水・風・雷・大地・光の6属性分隊と、葉食い虫、胞子スライム、
トゲ甲羅、花粉コウモリ、苔岩ゴーレム、腐花ボスを配置しています。各カットアウトには
属性・敵種・ティア・状態などのカスタムプロパティが設定されています。
