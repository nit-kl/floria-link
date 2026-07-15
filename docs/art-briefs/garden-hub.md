# Art brief — 園ハブ見取り図（Antigravity / Gemini 用）

Cursor 側に Antigravity MCP がないため、ハブは当面 CSS マップで表示しています。  
以下を Antigravity（Gemini）で生成し、`public/assets/art/garden_hub.png` に置いてください。

## プロンプト案

```
Top-down stylized map of a flower garden being reclaimed from a dark fungal blight,
2D game UI background, soft painterly flat illustration, no text, no UI chrome.
Left: bright blooming beds and a small greenhouse. Right: purple-black blight and a thorny nest.
Five garden plot markers as soft glowing clearings along a winding path.
Color: petal pink, leaf green, soft gold sunlight vs dusk violet blight.
Aspect 16:9, edge-to-edge, gentle atmosphere, no characters, no watermark.
```

## 使い方（実装側）

生成後:

1. `public/assets/art/garden_hub.png` に保存
2. `ASSET_VERSION` を1つ上げる
3. `#hub-map` の `background-image` をそのファイルに差し替え（`hub.css`）
