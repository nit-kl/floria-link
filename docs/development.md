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

- [ ] タイトル画面が表示される
- [ ] 開花育成: キャラ選択 → サポート編成 → 練習 1 回 → 結果ポップ
- [ ] 育成完了または中止でセレクトに戻れる
- [ ] 花園出撃: HUD・出撃ボタンが表示される
- [ ] 1〜6 / 温室 / 共振爆発が動く
- [ ] 勝敗（敵城 or 花畑全開花）でリザルトが出てタイトルに戻れる
- [ ] 育成ランクが出撃ボタンとユニット頭上に表示される
- [ ] `npm test` と `npm run lint` が通る

## ディレクトリ変更時の注意

- `index.html` の `<script type="module" src="...">` パスを合わせる
- 相対 import（`./` / `../`）を壊さない
- `catalog.json` 内の画像パスは `public/` からの相対パス

## ドキュメント

- アーキテクチャ: [architecture.md](architecture.md)
- エージェント向け: [../AGENTS.md](../AGENTS.md)
- ADR: [adr/](adr/)
