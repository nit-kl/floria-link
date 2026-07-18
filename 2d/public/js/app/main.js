import { Game } from "../battle/index.js";
import { loadCatalog } from "../data/catalog.js";
import { withAssetVersion } from "../data/asset-version.js";
import { getCareer } from "../data/careers-repository.js";
import {
  completeChapter,
  loadCampaign,
  resetCampaign,
  saveCampaign,
} from "../data/campaign-repository.js";
import { getChapter, getNextChapter } from "../data/campaign/chapters.js";
import { AudioBus } from "../shared/audio.js";
import { onGameResult } from "../shared/events.js";
import { bindHud } from "../ui/hud.js";
import { createHubUi } from "../ui/hub-ui.js";
import { createStoryUi } from "../ui/story-ui.js";
import { createTrainUi } from "../ui/train-ui.js";

const canvas = document.getElementById("game");
const overlay = document.getElementById("overlay");
const titleScreen = document.getElementById("title-screen");
const hubScreen = document.getElementById("hub-screen");
const storyScreen = document.getElementById("story-screen");
const trainSelectScreen = document.getElementById("train-select-screen");
const supportDeckScreen = document.getElementById("support-deck-screen");
const trainScreen = document.getElementById("train-screen");
const resultScreen = document.getElementById("result-screen");
const hud = document.getElementById("hud");
const unitButtons = document.getElementById("unit-buttons");

const audio = new AudioBus();
const storyUi = createStoryUi();

let catalog = null;
let game = null;
let career = null;
let pendingFinished = null;
let trainee = null;
let deckIds = [];
let activeChapter = null;
let phaseAfterTrain = null; // "battle" | null
let campaignBattle = false;
let awaitingCampaignContinue = false;

const buttonMap = new Map();

const overlayScreens = [
  titleScreen,
  hubScreen,
  storyScreen,
  trainSelectScreen,
  supportDeckScreen,
  resultScreen,
];

function hideTrainOverlays() {
  document.getElementById("train-result-overlay")?.classList.add("hidden");
  document.getElementById("train-finish-overlay")?.classList.add("hidden");
  document.getElementById("train-choice-overlay")?.classList.add("hidden");
}

function show(screen) {
  overlayScreens.forEach((s) => s.classList.add("hidden"));
  trainScreen.classList.add("hidden");
  hideTrainOverlays();
  if (screen === trainScreen) {
    trainScreen.classList.remove("hidden");
  } else {
    screen.classList.remove("hidden");
  }
  overlay.style.pointerEvents = "auto";
}

function hideOverlay() {
  overlayScreens.forEach((s) => s.classList.add("hidden"));
  trainScreen.classList.add("hidden");
  hideTrainOverlays();
  overlay.style.pointerEvents = "none";
}

/** Story must sit above train-stage (z-index 20); always route through show(). */
async function presentStory(title, lines) {
  show(storyScreen);
  await storyUi.showLines(title, lines);
}

function buildUnitButtons() {
  unitButtons.innerHTML = "";
  buttonMap.clear();
  catalog.characters.forEach((ch, i) => {
    const careerData = getCareer(ch.id);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "unit-btn";
    btn.style.setProperty("--c", ch.color);
    btn.dataset.id = String(ch.id);
    btn.dataset.element = ch.stats.element;
    const rank = careerData?.rank ? `<span class="rank-tag">${careerData.rank}</span>` : "";
    const key = i < 6 ? `<span class="key-badge">${i + 1}</span>` : "";
    btn.innerHTML = `
      ${key}
      <img src="${withAssetVersion(ch.poses.idle.file)}" alt="${ch.name}" draggable="false" />
      <div class="name">${ch.name}${rank}</div>
      <div class="cost">蜜${ch.stats.cost}</div>
      <div class="cd"></div>
    `;
    btn.addEventListener("click", () => {
      audio.ensure();
      if (game.deploy(ch.id)) {
        btn.classList.remove("flash");
        void btn.offsetWidth;
        btn.classList.add("flash");
      } else {
        audio.tone(140, 0.06, "square", 0.02);
      }
    });
    unitButtons.appendChild(btn);
    buttonMap.set(ch.id, btn);
  });
}

function refreshTitleCta() {
  const progress = loadCampaign();
  const next = getNextChapter(progress);
  const btn = document.getElementById("btn-campaign");
  const hint = document.getElementById("title-progress");
  if (!btn) return;
  if (progress.freeMode) {
    btn.textContent = "園の見取り図を開く";
    if (hint) hint.textContent = "全章クリア済み — 図鑑やフリー出撃で遊べます";
  } else if (progress.completedChapters.length > 0 && next) {
    btn.textContent = "つづきから進む";
    if (hint) hint.textContent = `進行中: ${next.title}`;
  } else {
    btn.textContent = "花園奪還をはじめる";
    if (hint) hint.textContent = "約15分で、育成と共振リンクを体験できます";
  }
}

function refreshButtons(detail) {
  for (const ch of catalog.characters) {
    const btn = buttonMap.get(ch.id);
    if (!btn) continue;
    const cd = detail.recharge[ch.id] || 0;
    const cdEl = btn.querySelector(".cd");
    const costEl = btn.querySelector(".cost");
    if (costEl && detail.costs?.[ch.id] != null) costEl.textContent = `蜜${detail.costs[ch.id]}`;
    btn.classList.toggle("blessed", ch.stats.element === detail.bless);
    if (cd > 0) {
      btn.classList.add("cooling");
      cdEl.textContent = cd.toFixed(1);
      btn.disabled = true;
    } else {
      btn.classList.remove("cooling");
      cdEl.textContent = "";
      btn.disabled = !detail.can[ch.id];
    }
  }
}

const trainUi = createTrainUi({
  audio,
  getCatalog: () => catalog,
  getCareerSession: () => career,
  setCareerSession: (c) => { career = c; },
  getPendingFinished: () => pendingFinished,
  setPendingFinished: (v) => { pendingFinished = v; },
  getTrainee: () => trainee,
  setTrainee: (t) => { trainee = t; },
  getDeckIds: () => deckIds,
  setDeckIds: (ids) => { deckIds = ids; },
  show,
  screens: {
    supportDeck: supportDeckScreen,
    train: trainScreen,
    trainSelect: trainSelectScreen,
  },
  buildUnitButtons,
});

const hubUi = createHubUi({
  onSelectChapter: (ch) => startChapter(ch),
  onFreeBattle: () => startFreeBattle(),
  onReset: () => {
    resetCampaign();
    hubUi.render();
  },
  getCatalog: () => catalog,
});

bindHud({ buttonMap, catalog, refreshButtons });

function openHub() {
  hubUi.render();
  show(hubScreen);
  if (game) game.state = "title";
}

async function startChapter(chapter) {
  audio.ensure();
  activeChapter = chapter;
  const progress = loadCampaign();
  progress.currentChapterId = chapter.id;
  saveCampaign(progress);

  await presentStory(chapter.title, chapter.intro || [chapter.blurb]);

  const traineeChar = catalog.characters.find((c) => c.id === chapter.traineeId)
    || catalog.characters[0];

  if (chapter.trainLead) {
    await presentStory("開花準備", [chapter.trainLead]);
  }

  phaseAfterTrain = "battle";
  trainUi.startCampaignTraining({
    trainee: traineeChar,
    deckIds: chapter.supportDeck || [],
    maxTurns: chapter.trainTurns || 8,
    skipGoals: (chapter.trainTurns || 8) <= 4,
    scenarioGoal: chapter.scenarioGoal || null,
  });
  if (game) game.state = "train";
}

async function beginChapterBattle() {
  if (!activeChapter) return;
  // Leave train UI so the sortie story is not buried under z-index:20
  hideTrainOverlays();
  trainScreen.classList.add("hidden");
  career = null;

  if (activeChapter.battleLead) {
    await presentStory("出撃", [activeChapter.battleLead]);
  }
  campaignBattle = true;
  audio.ensure();
  hideOverlay();
  hud.classList.remove("hidden");
  buildUnitButtons();
  game.start(activeChapter.battle || {});
  if (game.state === "play") {
    storyUi.showTip(activeChapter.battle?.tip || "1〜6で花精を出撃させよう", 3800);
  }
}

function startFreeBattle() {
  activeChapter = null;
  campaignBattle = false;
  audio.ensure();
  hideOverlay();
  hud.classList.remove("hidden");
  buildUnitButtons();
  game.start({ mode: "standard" });
}

async function onCampaignVictory() {
  const ch = activeChapter;
  if (!ch) {
    openHub();
    return;
  }
  completeChapter(ch.id, ch.plotId);
  await presentStory(ch.title, ch.outro || ["区画に色が戻った。"]);
  activeChapter = null;
  campaignBattle = false;
  openHub();
}

document.getElementById("btn-campaign").addEventListener("click", () => {
  audio.ensure();
  const progress = loadCampaign();
  if (progress.freeMode) {
    openHub();
    return;
  }
  let ch = getChapter(progress.currentChapterId) || getChapter("prologue");
  if (progress.completedChapters.includes(ch.id)) {
    ch = getNextChapter(progress);
    if (!ch) {
      openHub();
      return;
    }
  }
  startChapter(ch);
});

document.getElementById("btn-hub").addEventListener("click", () => {
  audio.ensure();
  openHub();
});

document.getElementById("btn-hub-title").addEventListener("click", () => {
  refreshTitleCta();
  show(titleScreen);
  if (game) game.state = "title";
});

// Legacy free-train entry kept for debugging via console if needed
document.getElementById("btn-train-back")?.addEventListener("click", () => openHub());
document.getElementById("btn-deck-back")?.addEventListener("click", () => {
  show(trainSelectScreen);
});
document.getElementById("btn-deck-start")?.addEventListener("click", () => {
  audio.ensure();
  trainUi.startCareerWithDeck();
  if (game) game.state = "train";
});
document.getElementById("btn-to-battle")?.addEventListener("click", () => startFreeBattle());

document.getElementById("btn-train-abort").addEventListener("click", () => {
  career = null;
  phaseAfterTrain = null;
  openHub();
});

async function goToChapterBattleFromTrain() {
  if (phaseAfterTrain !== "battle" || !activeChapter) {
    career = null;
    openHub();
    return;
  }
  phaseAfterTrain = null;
  audio.win();
  await beginChapterBattle();
}

document.getElementById("btn-train-finish").addEventListener("click", () => {
  goToChapterBattleFromTrain();
});

const _finishBtn = document.getElementById("btn-train-finish");
const _finishOk = document.getElementById("btn-finish-ok");
const finishLabelObserver = new MutationObserver(() => {
  if (phaseAfterTrain === "battle" && activeChapter) {
    if (_finishBtn && !_finishBtn.classList.contains("hidden")) {
      _finishBtn.textContent = "戦場へ出撃！";
    }
    if (_finishOk) _finishOk.textContent = "戦場へ！";
  }
});
if (_finishBtn) {
  finishLabelObserver.observe(_finishBtn, { attributes: true, attributeFilter: ["class"] });
}

document.getElementById("btn-rest").addEventListener("click", () => {
  if (!career || career.done) return;
  audio.ensure();
  trainUi.applyActionResult(career.rest());
});

document.getElementById("btn-outing").addEventListener("click", () => {
  if (!career || career.done) return;
  audio.ensure();
  trainUi.applyActionResult(career.recreate());
});

document.getElementById("btn-result-ok").addEventListener("click", () => {
  trainUi.resultOverlay.classList.add("hidden");
  if (career?.pendingChoice) {
    trainUi.showChoiceIfNeeded();
    return;
  }
  if (pendingFinished) {
    trainUi.showFinishFanfare(pendingFinished);
    pendingFinished = null;
  }
  trainUi.renderCareer();
});

document.getElementById("btn-finish-ok").addEventListener("click", () => {
  trainUi.finishOverlay.classList.add("hidden");
  if (phaseAfterTrain === "battle" && activeChapter) {
    goToChapterBattleFromTrain();
    return;
  }
  trainUi.renderCareer();
});

document.getElementById("btn-retry").addEventListener("click", async () => {
  if (awaitingCampaignContinue) {
    awaitingCampaignContinue = false;
    document.getElementById("btn-retry").textContent = "もう一度出撃";
    document.getElementById("btn-menu").classList.remove("hidden");
    document.getElementById("btn-result-train").classList.remove("hidden");
    await onCampaignVictory();
    return;
  }
  if (activeChapter) beginChapterBattle();
  else startFreeBattle();
});

document.getElementById("btn-menu").addEventListener("click", () => {
  hud.classList.add("hidden");
  game.state = "title";
  campaignBattle = false;
  awaitingCampaignContinue = false;
  show(titleScreen);
});

document.getElementById("btn-result-train").addEventListener("click", () => {
  hud.classList.add("hidden");
  awaitingCampaignContinue = false;
  openHub();
});

document.getElementById("btn-wallet").addEventListener("click", () => {
  audio.ensure();
  if (!game.upgradeWallet()) audio.tone(140, 0.06, "square", 0.02);
});

document.getElementById("btn-burst").addEventListener("click", () => {
  audio.ensure();
  if (!game.tryBurst()) audio.tone(140, 0.06, "square", 0.02);
});

onGameResult((e) => {
  hud.classList.add("hidden");
  const { won, score, bloomed, reason } = e.detail;
  const retry = document.getElementById("btn-retry");
  const menu = document.getElementById("btn-menu");
  const train = document.getElementById("btn-result-train");
  const emoji = document.getElementById("result-emoji");

  if (won && campaignBattle && activeChapter) {
    document.getElementById("result-title").textContent = "区画を取り戻した！";
    document.getElementById("result-score").textContent =
      `${reason}\nスコア ${score}  ·  花畑 ${bloomed}/5`;
    if (emoji) emoji.textContent = "❀";
    awaitingCampaignContinue = true;
    retry.textContent = "園の見取り図へ";
    menu.classList.add("hidden");
    train.classList.add("hidden");
    show(resultScreen);
    return;
  }

  awaitingCampaignContinue = false;
  document.getElementById("result-title").textContent = won ? "花園、復活！" : "散ってしまった…";
  document.getElementById("result-score").textContent =
    `${reason}\nスコア ${score}  ·  花畑 ${bloomed}/5`;
  if (emoji) emoji.textContent = won ? "❀" : "…";
  retry.textContent = "もう一度出撃";
  menu.classList.remove("hidden");
  train.classList.remove("hidden");
  train.textContent = "園の見取り図へ";
  show(resultScreen);
});

window.addEventListener("game:tip", (e) => {
  storyUi.showTip(e.detail?.text || "", e.detail?.celebrate ? 2800 : 3600);
});

window.addEventListener("keydown", (e) => {
  if (!game || game.state !== "play") return;
  const n = Number(e.key);
  if (n >= 1 && n <= 6) game.deploy(n - 1);
  if (e.key === "w" || e.key === "W") game.upgradeWallet();
  if (e.key === "e" || e.key === "E") game.tryBurst();
});

async function boot() {
  catalog = await loadCatalog();
  game = new Game(canvas, catalog, audio);
  buildUnitButtons();
  refreshTitleCta();
  show(titleScreen);

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    if (game.state === "play") game.update(dt);
    else game.time += dt;
    game.draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

boot().catch((err) => {
  console.error(err);
  document.body.innerHTML = `<pre style="color:#fff;padding:24px">読み込み失敗: ${err}</pre>`;
});
