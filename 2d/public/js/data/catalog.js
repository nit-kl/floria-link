import { withAssetVersion } from "./asset-version.js";
import { UNIT_STATS } from "./unit-stats.js";

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = withAssetVersion(src);
  });
}

export async function loadCatalog() {
  const res = await fetch("assets/sprites/catalog.json");
  const catalog = await res.json();
  for (const ch of catalog.characters) {
    ch.images = {};
    ch.stats = { ...UNIT_STATS[ch.id] };
    for (const [pose, meta] of Object.entries(ch.poses)) {
      ch.images[pose] = await loadImage(meta.file);
    }
  }
  if (catalog.enemies) {
    for (const en of catalog.enemies) {
      en.images = {};
      en.stats = { ...UNIT_STATS[en.id] };
      if (en.poses?.run) en.poses.run.nativeFacing = 1;
      en.artFacing = 1;
      for (const [pose, meta] of Object.entries(en.poses)) {
        en.images[pose] = await loadImage(meta.file);
      }
    }
  }

  catalog.visualAssets = {};
  const assetsToLoad = {
    battleSky: "assets/art/battle_sky.png",
    battleBackHills: "assets/art/battle_back_hills.png",
    battleForeHills: "assets/art/battle_fore_hills.png",
    castleAlly: "assets/art/castle_ally.png",
    castleEnemy: "assets/art/castle_enemy.png",
  };
  for (const [key, path] of Object.entries(assetsToLoad)) {
    catalog.visualAssets[key] = await loadImage(path);
  }

  return catalog;
}
