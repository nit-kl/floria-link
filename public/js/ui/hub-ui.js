import {
  CAMPAIGN_CHAPTERS,
  GARDEN_PLOTS,
  getChapter,
  getNextChapter,
  isChapterUnlocked,
} from "../data/campaign/chapters.js";
import { loadCampaign } from "../data/campaign-repository.js";
import { renderCodex } from "./codex-ui.js";

export function createHubUi({ onSelectChapter, onFreeBattle, onReset, getCatalog }) {
  const root = document.getElementById("hub-screen");
  const map = document.getElementById("hub-map");
  const list = document.getElementById("hub-chapter-list");
  const status = document.getElementById("hub-status");
  const nextBtn = document.getElementById("btn-hub-next");

  function playableChapter(ch, progress) {
    return ch && isChapterUnlocked(ch, progress);
  }

  function render() {
    const progress = loadCampaign();
    const next = getNextChapter(progress);

    map.innerHTML = "";
    for (const plot of GARDEN_PLOTS) {
      const ch = getChapter(plot.chapterId);
      const unlocked = progress.unlockedPlots.includes(plot.id);
      const chapterOpen = playableChapter(ch, progress);
      const isNext = next && ch && next.id === ch.id;
      const el = document.createElement("button");
      el.type = "button";
      el.className = `hub-plot ${unlocked ? "unlocked" : "locked"} ${isNext ? "next" : ""}`;
      el.style.left = `${plot.x}%`;
      el.style.top = `${plot.y}%`;
      el.title = chapterOpen ? `${plot.name} — ${ch.title}` : `${plot.name}（未解放）`;
      el.disabled = !chapterOpen;
      el.setAttribute("aria-label", plot.name);
      el.innerHTML = `<span>${unlocked || isNext ? "❀" : "·"}</span><small>${plot.name}</small>`;
      if (chapterOpen) {
        el.addEventListener("click", () => onSelectChapter(ch));
      }
      map.appendChild(el);
    }

    list.innerHTML = "";
    for (const ch of CAMPAIGN_CHAPTERS) {
      const unlocked = isChapterUnlocked(ch, progress);
      const done = progress.completedChapters.includes(ch.id);
      const current = next?.id === ch.id || (!next && progress.currentChapterId === ch.id);
      const card = document.createElement("button");
      card.type = "button";
      card.className = `hub-chapter ${done ? "done" : ""} ${current ? "current" : ""} ${unlocked ? "" : "locked"}`;
      card.disabled = !unlocked;
      const action = done ? "もう一度挑む" : current ? "ここから進む" : "この章へ";
      card.innerHTML = `
        <div class="hc-top">
          <strong>${ch.title}</strong>
          <span class="hc-badge">${done ? "奪還済" : unlocked ? (current ? "次はここ" : "解放") : "未解放"}</span>
        </div>
        <p class="hc-sub">${ch.subtitle}</p>
        <p class="hc-blurb">${unlocked ? ch.blurb : ch.lockedHint || "？？？"}</p>
        ${unlocked ? `<span class="hc-action">${action}</span>` : ""}
      `;
      if (unlocked) card.addEventListener("click", () => onSelectChapter(ch));
      list.appendChild(card);
    }

    if (progress.freeMode) {
      status.textContent = "全章クリア！ マップやフリー出撃で遊べます";
    } else if (next) {
      status.textContent = `次の目標: ${next.title} — 光る❀をタップ`;
    } else {
      status.textContent = "園の状態を確認しよう";
    }

    if (nextBtn) {
      if (next) {
        nextBtn.disabled = false;
        nextBtn.textContent = `${next.title.replace(/^プロローグ・|^第.|章・/, "")}へ進む`;
        nextBtn.onclick = () => onSelectChapter(next);
      } else {
        nextBtn.disabled = true;
        nextBtn.textContent = "全章クリア";
        nextBtn.onclick = null;
      }
    }

    const freeBtn = document.getElementById("btn-hub-free");
    if (freeBtn) {
      const canFree = progress.completedChapters.includes("prologue") || progress.freeMode;
      freeBtn.classList.toggle("hidden", !canFree);
      freeBtn.disabled = false;
    }
    renderCodex(getCatalog?.());
  }

  document.getElementById("btn-hub-free")?.addEventListener("click", () => onFreeBattle?.());
  document.getElementById("btn-hub-reset")?.addEventListener("click", () => {
    if (confirm("キャンペーン進行をリセットしますか？（育成セーブは残ります）")) {
      onReset?.();
      render();
    }
  });

  return { root, render };
}
