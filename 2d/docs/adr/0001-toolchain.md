# ADR 0001 — ツールチェーン方針

- 状態: Accepted
- 日付: 2026-07-15

## 文脈

MVP はバンドラなしの静的 ES modules（`public/` 直配信）で動いている。  
本番・拡張に向けて Vite + TypeScript 導入を検討した。

## 決定

**当面はバニラ ES modules を維持する。**  
品質ゲートは Node 標準の `node:test` + ESLint + GitHub Actions で足す。  
Vite / TypeScript は、次のいずれかが明確になった時点で再検討する。

- モジュール境界が安定し、大規模な型付けの投資対効果が高い
- 本番デプロイでハッシュ付きアセットや環境別ビルドが必要になる
- チームが増え、型・パスエイリアスの恩恵が運用コストを上回る

## 理由

- Phase 3 で責務分離済み。すぐの移行コスト（パス・アセット・配信）を避ける
- ゲーム体験の反復（Phase 3b）を優先しやすい
- テスト対象の純関数（`growthToBattleMods` 等）は Node から直接 import 可能

## 結果

- `npm start` はこれまでどおり `serve public`
- `npm test` / `npm run lint` / CI を追加
- 将来 Vite を入れる場合は別 ADR で記録する
