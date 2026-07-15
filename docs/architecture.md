# アーキテクチャ

## 全体像

```
ブラウザ
  └─ public/index.html
       ├─ css/          UI スタイル
       ├─ assets/       画像・catalog.json
       └─ js/           ES modules（アプリ本体）
            ├─ app/     boot / 画面遷移 / ループ
            ├─ ui/      DOM（育成・HUD）
            ├─ battle/  シミュレーション + render/
            ├─ train/   育成ロジック
            ├─ data/    定数・カタログ・セーブ
            └─ shared/  audio / fx / utils / events
```

ビルドステップなし（現状）。`npm start` は `public/` を静的配信する。

## 画面遷移（花園奪還キャンペーン）

```
title
  ├─→ campaign chapter → story → train → battle → result → hub
  └─→ hub（園の見取り図）→ chapter / free battle
```

URL ルーティングは使わない。オーバーレイの `.screen` 表示切替のみ。  
章定義: `data/campaign/chapters.js` / 進行セーブ: `data/campaign-repository.js`

## モジュール依存（目標）

```
app ──► ui, battle, train, data, shared
ui  ──► train, data, shared
battle ──► data, shared
train ──► data, shared
data ──► (catalog.json, localStorage)
```

UI は `game:hud` / `game:result` などのイベントでバトル状態を受け取る。  
バトルシミュレーションは DOM を触らない。

## データ定義の所在

| データ | 場所 |
|--------|------|
| 見た目・名前・ポーズ | `public/assets/sprites/catalog.json` |
| 戦闘ステ | `public/js/data/unit-stats.js`（旧 `entities.js` の `UNIT_STATS`） |
| 季節バフ | `public/js/data/seasons.js` |
| サポートカード | `public/js/train/` または `data/` |
| 育成セーブ | `localStorage` key `floria-bloom-careers-v1`（`CareersRepository`） |
| スプライト生成元 | `scripts/extract_sprites.py` の `ROSTER` |

キャラ ID は catalog / UNIT_STATS / 抽出スクリプトで揃える必要がある。

## 勝利条件

- 敵城（腐海の巣）HP 0
- 花畑区画をすべて開花（花畑制圧）

## 永続化

- リポジトリ: `data/careers-repository.js`
- 形状: `{ [charId]: { id, name, stats, rank, total, goals, supports, updatedAt } }`
- バトル側は `getCareer` → `growthToBattleMods` でステ補正

## イベント

| イベント | 発信 | 用途 |
|----------|------|------|
| `game:hud` | battle | HUD 数値・出撃可否 |
| `game:season` | battle | 季節バナー |
| `game:result` | battle | 勝敗画面表示 |

## 関連作業ログ

過去のビジュアル改修メモは `docs/archive/game_visual_assets_upgrade/` にある。
