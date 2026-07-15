# Floria Link — Resonance Garden

花精を育て、共振リンクで戦場をつなぎ、腐海の巣を打ち破る静的 Web ゲームです。  
バックエンドなし・ブラウザ完結（育成結果は `localStorage` に保存）。

## 起動

```bash
npm start
```

ブラウザで http://localhost:5173 を開きます。

## 遊び方（概要）

1. **開花育成** — 花精を選び、サポート最大 3 枚で 12 ターン育成
2. **花園出撃** — 蜜でユニット出撃、温室強化、花蜜で共振爆発
3. **勝利** — 敵城（腐海の巣）破壊、または花畑 5 区画すべて開花

操作: `1`〜`6` 出撃 / `W` 温室 / `E` 共振爆発

## ディレクトリ

| パス | 内容 |
|------|------|
| `public/` | 配信ルート（HTML / CSS / JS / アセット） |
| `public/js/` | ゲームロジック（ES modules） |
| `scripts/` | スプライト切り出しなど前処理（Python） |
| `docs/` | アーキテクチャ・開発手順・ADR |

詳細は [docs/architecture.md](docs/architecture.md) と [docs/development.md](docs/development.md) を参照。

## アセット抽出

```bash
npm run extract
```

Pillow / NumPy が必要です。詳細は開発ドキュメントを参照。

## ライセンス

プライベートプロジェクト（`package.json` の `private: true`）。
