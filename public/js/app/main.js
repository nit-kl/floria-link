import { Game } from "../battle/index.js";
import { loadCatalog } from "../data/catalog.js";
import { withAssetVersion } from "../data/asset-version.js";
import { getCareer } from "../data/careers-repository.js";
import { AudioBus } from "../shared/audio.js";
import { onGameResult } from "../shared/events.js";
import { bindHud } from "../ui/hud.js";
import { createTrainUi } from "../ui/train-ui.js";

const canvas = document.getElementById("game");
const overlay = document.getElementById("overlay");
const titleScreen = document.getElementById("title-screen");
const trainSelectScreen = document.getElementById("train-select-screen");
const supportDeckScreen = document.getElementById("support-deck-screen");
const trainScreen = document.getElementById("train-screen");
const resultScreen = document.getElementById("result-screen");
const hud = document.getElementById("hud");
const unitButtons = document.getElementById("unit-buttons");

const audio = new AudioBus();
let catalog = null;
let game = null;
let career = null;
let pendingFinished = null;
let trainee = null;
let deckIds = [];
const buttonMap = new Map();

const overlayScreens = [titleScreen, trainSelectScreen, supportDeckScreen, resultScreen];

function show(screen) {
  overlayScreens.forEach((s) => s.classList.add("hidden"));
  trainScreen.classList.add("hidden");
  document.getElementById("train-result-overlay").classList.add("hidden");
  document.getElementById("train-finish-overlay").classList.add("hidden");
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
  document.getElementById("train-result-overlay").classList.add("hidden");
  document.getElementById("train-finish-overlay").classList.add("hidden");
  overlay.style.pointerEvents = "none";
}

function buildUnitButtons() {
  unitButtons.innerHTML = "";
  buttonMap.clear();
  for (const ch of catalog.characters) {
    const careerData = getCareer(ch.id);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "unit-btn";
    btn.style.setProperty("--c", ch.color);
    btn.dataset.id = String(ch.id);
    btn.dataset.element = ch.stats.element;
    const rank = careerData?.rank ? `<span class="rank-tag">${careerData.rank}</span>` : "";
    btn.innerHTML = `
      <img src="${withAssetVersion(ch.poses.idle.file)}" alt="${ch.name}" draggable="false" />
      <div class="name">${ch.name}${rank}</div>
      <div class="cost">蜜${ch.stats.cost}</div>
      <div class="cd"></div>
    `;
    btn.addEventListener("click", () => {
      audio.ensure();
      if (!game.deploy(ch.id)) audio.tone(140, 0.06, "square", 0.02);
    });
    unitButtons.appendChild(btn);
    buttonMap.set(ch.id, btn);
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

bindHud({ buttonMap, catalog, refreshButtons });

function startBattle() {
  audio.ensure();
  hideOverlay();
  hud.classList.remove("hidden");
  buildUnitButtons();
  game.start();
}

document.getElementById("btn-train").addEventListener("click", () => {
  audio.ensure();
  trainUi.buildTrainRoster();
  show(trainSelectScreen);
  if (game) game.state = "train";
});

document.getElementById("btn-train-back").addEventListener("click", () => {
  show(titleScreen);
  if (game) game.state = "title";
});

document.getElementById("btn-deck-back").addEventListener("click", () => {
  show(trainSelectScreen);
});

document.getElementById("btn-deck-start").addEventListener("click", () => {
  audio.ensure();
  trainUi.startCareerWithDeck();
  if (game) game.state = "train";
});

document.getElementById("btn-to-battle").addEventListener("click", () => startBattle());

document.getElementById("btn-train-abort").addEventListener("click", () => {
  career = null;
  trainUi.buildTrainRoster();
  show(trainSelectScreen);
});

document.getElementById("btn-train-finish").addEventListener("click", () => {
  career = null;
  trainUi.buildTrainRoster();
  buildUnitButtons();
  show(trainSelectScreen);
  audio.win();
});

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
  if (pendingFinished) {
    trainUi.showFinishFanfare(pendingFinished);
    pendingFinished = null;
  }
  trainUi.renderCareer();
});

document.getElementById("btn-finish-ok").addEventListener("click", () => {
  trainUi.finishOverlay.classList.add("hidden");
  trainUi.renderCareer();
});

document.getElementById("btn-start").addEventListener("click", () => startBattle());
document.getElementById("btn-retry").addEventListener("click", () => startBattle());

document.getElementById("btn-menu").addEventListener("click", () => {
  hud.classList.add("hidden");
  game.state = "title";
  show(titleScreen);
});

document.getElementById("btn-result-train").addEventListener("click", () => {
  hud.classList.add("hidden");
  game.state = "train";
  trainUi.buildTrainRoster();
  show(trainSelectScreen);
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
  document.getElementById("result-title").textContent = won ? "花園、復活！" : "散ってしまった…";
  document.getElementById("result-score").textContent =
    `${reason}  ·  スコア ${score}  ·  花畑 ${bloomed}/5`;
  show(resultScreen);
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
