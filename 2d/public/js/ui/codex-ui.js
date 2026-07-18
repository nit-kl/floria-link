import { loadCareers } from "../data/careers-repository.js";
import { withAssetVersion } from "../data/asset-version.js";
import { loadCampaign } from "../data/campaign-repository.js";
import { GARDEN_PLOTS } from "../data/campaign/chapters.js";

/** Collapsible 開花図鑑 inside hub */
export function renderCodex(catalog) {
  const el = document.getElementById("hub-codex");
  if (!el || !catalog) return;
  const careers = loadCareers();
  const progress = loadCampaign();
  const bloomed = catalog.characters.filter((ch) => careers[String(ch.id)]).length;
  const plotsOk = progress.unlockedPlots.length;

  const chars = catalog.characters.map((ch) => {
    const c = careers[String(ch.id)];
    return `<div class="codex-card" style="--c:${ch.color}">
      <img src="${withAssetVersion(ch.poses.idle.file)}" alt="" />
      <div>
        <strong>${ch.name}</strong>
        <div class="muted">${c ? `評価 ${c.rank}` : "未開花"}</div>
      </div>
    </div>`;
  }).join("");

  const plots = GARDEN_PLOTS.map((p) => {
    const ok = progress.unlockedPlots.includes(p.id);
    return `<li class="${ok ? "ok" : ""}">${ok ? "❀" : "·"} ${p.name}</li>`;
  }).join("");

  el.innerHTML = `
    <details>
      <summary>図鑑・区画（花精 ${bloomed}/${catalog.characters.length} · 区画 ${plotsOk}/${GARDEN_PLOTS.length}）</summary>
      <h3>開花図鑑</h3>
      <div class="codex-grid">${chars}</div>
      <h3>奪還区画</h3>
      <ul class="codex-plots">${plots}</ul>
    </details>
  `;
}
