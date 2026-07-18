# 開発手順

## 必要環境

- Node.js（`npm start` 用。依存パッケージのインストールは不要なことが多い）
- アセット再抽出時のみ: Python 3 + Pillow + NumPy

## 起動

```bash
npm start
```

http://localhost:5173 で `public/` が配信される。

## よく使うコマンド

| コマンド | 説明 |
|----------|------|
| `npm start` | ローカル静的サーバ |
| `npm test` | ユニットテスト（`node:test`） |
| `npm run lint` | ESLint |
| `npm run extract` | `scripts/extract_sprites.py` |
| `npm run extract:supports` | サポート画像抽出 |

## アセット抽出

```bash
# キャラ / 敵スプライト → public/assets/sprites/ + catalog.json
python scripts/extract_sprites.py

# サポートカード（ある場合）
python scripts/extract_supports.py
```

元画像は `public/assets/art/` や `supports_src/` を参照する。  
キャッシュバスト用クエリは [`public/js/data/asset-version.js`](../public/js/data/asset-version.js) の `ASSET_VERSION` を更新する。

初回または依存追加後:

```bash
npm install
```

## 手動検証チェックリスト

- [ ] タイトル →「花園奪還をはじめる」でプロローグ導入が出る
- [ ] 短期育成（3日）→ 完了 → チュートリアル出撃へ直結する
- [ ] 違う花精を近づけて共振リンク／リンク帯が見える
- [ ] 勝利後に園ハブで区画が解放される
- [ ] 第一章以降が順に解放される（ロック表示が正しい）
- [ ] 育成中の分岐選択が表示される（2日目など）
- [ ] ハブの開花図鑑・奪還区画が表示される
- [ ] `npm test` と `npm run lint` が通る

## アート依頼

園ハブ背景は [`docs/art-briefs/garden-hub.md`](art-briefs/garden-hub.md) を Antigravity（Gemini）に渡して生成してください。

## ディレクトリ変更時の注意

- `index.html` の `<script type="module" src="...">` パスを合わせる
- 相対 import（`./` / `../`）を壊さない
- `catalog.json` 内の画像パスは `public/` からの相対パス

## ドキュメント

- アーキテクチャ: [architecture.md](architecture.md)
- エージェント向け: [../AGENTS.md](../AGENTS.md)
- ADR: [adr/](adr/)
