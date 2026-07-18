# Floria Link — Resonance Garden

花精を育て、共振リンクで戦場をつなぎ、腐海の巣を打ち破る静的 Web ゲームです。  
バックエンドなし・ブラウザ完結（育成結果は `localStorage` に保存）。

## 起動

```bash
npm start
```

ブラウザで http://localhost:5173 を開きます。

## 遊び方（概要）

1. **花園奪還をはじめ** — 章ごとに短い育成 → 戦場へ直結
2. **共振リンク** — 違う花精を近づけ、光の線で敵を削る
3. **園の見取り図** — 奪還した区画が色づき、次章へ進む

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
