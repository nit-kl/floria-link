import { onGameHud, onSeasonBanner } from "../shared/events.js";

/**
 * Battle HUD DOM — listens to game:hud / game:season events.
 * @param {{ buttonMap: Map, catalog: object, refreshButtons: Function }} ctx
 */
export function bindHud(ctx) {
  onGameHud((e) => {
    const d = e.detail;
    const money = document.getElementById("money");
    const nectar = document.getElementById("nectar");
    const ally = document.getElementById("ally-hp");
    const enemy = document.getElementById("enemy-hp");
    const stage = document.getElementById("stage-label");
    const walletCost = document.getElementById("wallet-cost");
    const btnWallet = document.getElementById("btn-wallet");
    const btnBurst = document.getElementById("btn-burst");

    if (money) money.textContent = `蜜 ${Math.floor(d.money)}/${d.moneyCap}`;
    if (nectar) nectar.textContent = `${Math.floor(d.nectar)}`;
    if (ally) ally.style.width = `${(100 * d.allyHp) / d.allyMax}%`;
    if (enemy) enemy.style.width = `${(100 * d.enemyHp) / d.enemyMax}%`;
    if (stage) {
      stage.textContent = `花畑 ${d.bloomed}/${d.plots} · リンク${d.links} · ${d.seasonName}`;
    }
    if (walletCost && btnWallet) {
      if (d.walletCost == null) {
        walletCost.textContent = "MAX";
        btnWallet.disabled = true;
      } else {
        walletCost.textContent = `蜜${d.walletCost}`;
        btnWallet.disabled = d.money < d.walletCost;
      }
    }
    if (btnBurst) {
      btnBurst.disabled = d.nectar < d.burstCost;
      const costEl = document.getElementById("burst-cost");
      if (costEl) costEl.textContent = `花蜜${d.burstCost}`;
    }

    ctx.refreshButtons(d);
  });

  onSeasonBanner((e) => {
    const { name, desc, color } = e.detail;
    const el = document.getElementById("season-banner");
    if (!el) return;
    el.textContent = `${name} — ${desc}`;
    el.style.color = color;
    el.classList.add("show");
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(() => el.classList.remove("show"), 2800);
  });
}
