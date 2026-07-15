import { withAssetVersion } from "../data/asset-version.js";
import {
  BOND_MAX,
  BloomCareer,
  ENERGY_MAX,
  MAX_SUPPORTS,
  MAX_TURNS,
  STAT_COLORS,
  STAT_KEYS,
  STAT_LABELS,
  STAT_MAX,
  SUPPORT_CARDS,
  failChance,
  getSupportCard,
  loadCareers,
  nextGoal,
} from "../train/index.js";

/**
 * Training UI factory. Returns helpers bound to shared app state.
 */
export function createTrainUi({
  audio,
  getCatalog,
  getCareerSession,
  setCareerSession,
  getPendingFinished,
  setPendingFinished,
  getTrainee,
  setTrainee,
  getDeckIds,
  setDeckIds,
  show,
  screens,
  buildUnitButtons: _buildUnitButtons,
}) {
  const trainRoster = document.getElementById("train-roster");
  const resultOverlay = document.getElementById("train-result-overlay");
  const finishOverlay = document.getElementById("train-finish-overlay");
  const btnRest = document.getElementById("btn-rest");
  const btnOuting = document.getElementById("btn-outing");
  const btnTrainFinish = document.getElementById("btn-train-finish");
  const btnTrainAbort = document.getElementById("btn-train-abort");

  function supportGlyphHtml(card) {
    return `
    <div class="support-glyph" aria-hidden="true" style="overflow: hidden; display: flex; align-items: center; justify-content: center;">
      <img class="support-avatar" src="assets/supports/${card.id}.png" alt="${card.name}" draggable="false" style="width: 100%; height: 100%; object-fit: cover;" />
    </div>
  `;
  }

  function buildTrainRoster() {
    const catalog = getCatalog();
    trainRoster.innerHTML = "";
    const careers = loadCareers();
    for (const ch of catalog.characters) {
      const saved = careers[String(ch.id)];
      const card = document.createElement("button");
      card.type = "button";
      card.className = "roster-card";
      card.style.setProperty("--c", ch.color);
      card.innerHTML = `
      <img src="${withAssetVersion(ch.poses.idle.file)}" alt="${ch.name}" />
      <div class="name">${ch.name}</div>
      <div class="muted">${ch.title}</div>
      <div class="rank ${saved ? "" : "none"}">${saved ? `評価 ${saved.rank}` : "未開花"}</div>
    `;
      card.addEventListener("click", () => {
        audio.ensure();
        openSupportDeck(ch);
      });
      trainRoster.appendChild(card);
    }
  }

  function openSupportDeck(ch) {
    setTrainee(ch);
    setDeckIds([]);
    document.getElementById("support-deck-trainee").textContent =
      `${ch.name} を育成 · サポートカード最大${MAX_SUPPORTS}枚（園の先輩・導師）`;
    renderDeckUI();
    show(screens.supportDeck);
    audio.tone(440, 0.06, "triangle", 0.03);
  }

  function renderDeckUI() {
    const deckIds = getDeckIds();
    const slots = document.getElementById("deck-slots");
    slots.innerHTML = "";
    for (let i = 0; i < MAX_SUPPORTS; i++) {
      const id = deckIds[i];
      const slot = document.createElement("div");
      slot.className = `deck-slot ${id != null ? "filled" : ""}`;
      if (id == null) {
        slot.textContent = `空きスロット ${i + 1}`;
      } else {
        const card = getSupportCard(id);
        slot.style.setProperty("--c", card.color);
        slot.innerHTML = `
        <div class="srarity">${card.rarity}</div>
        ${supportGlyphHtml(card)}
        <div class="sname">${card.name}</div>
        <div class="sspec">${card.title}</div>
        <div class="sspec">得意: ${STAT_LABELS[card.specialty]}</div>
      `;
        slot.title = "クリックで外す";
        slot.addEventListener("click", () => {
          setDeckIds(deckIds.filter((x) => x !== id));
          renderDeckUI();
        });
      }
      slots.appendChild(slot);
    }

    const pool = document.getElementById("support-pool");
    pool.innerHTML = "";
    for (const card of SUPPORT_CARDS) {
      const selected = deckIds.includes(card.id);
      const full = deckIds.length >= MAX_SUPPORTS && !selected;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `support-pick ${selected ? "selected" : ""} rarity-${card.rarity.toLowerCase()}`;
      btn.style.setProperty("--c", card.color);
      btn.disabled = full;
      btn.innerHTML = `
      <div class="pick-top">
        <span class="srarity">${card.rarity}</span>
        <span class="sspec-pill" style="color:${STAT_COLORS[card.specialty]}">${STAT_LABELS[card.specialty]}</span>
      </div>
      ${supportGlyphHtml(card)}
      <div class="sname">${card.name}</div>
      <div class="meta">${card.title}</div>
      <div class="meta">${card.tagline}</div>
    `;
      btn.addEventListener("click", () => {
        let next = [...getDeckIds()];
        if (selected) next = next.filter((x) => x !== card.id);
        else if (next.length < MAX_SUPPORTS) next.push(card.id);
        setDeckIds(next);
        audio.tone(selected ? 200 : 520, 0.05, "triangle", 0.03);
        renderDeckUI();
      });
      pool.appendChild(btn);
    }
  }

  function renderSupportStrip(joinedIds = [], rainbowId = null) {
    const career = getCareerSession();
    const strip = document.getElementById("support-strip");
    if (!career) {
      strip.innerHTML = "";
      return;
    }
    strip.innerHTML = career.supports.map((s) => {
      const join = joinedIds.includes(s.id) ? "join" : "";
      const rainbow = rainbowId === s.id ? "rainbow" : "";
      const bondPct = Math.min(100, (100 * s.bond) / BOND_MAX);
      return `<div class="support-chip ${join} ${rainbow}" style="--c:${s.color}" data-id="${s.id}">
      <span class="spec-tag" style="color:${STAT_COLORS[s.specialty]}">${STAT_LABELS[s.specialty]}</span>
      ${supportGlyphHtml(s)}
      <div class="cn">${s.name}</div>
      <div class="bond-bar"><i style="width:${bondPct}%"></i></div>
      <div class="bond-label">絆 ${s.bond}</div>
    </div>`;
    }).join("") || `<div class="muted" style="font-size:12px">サポートなし</div>`;
  }

  function setPortrait(pose = "idle") {
    const career = getCareerSession();
    const ch = career.char;
    const file = ch.poses[pose]?.file || ch.poses.idle.file;
    document.getElementById("train-portrait").src = withAssetVersion(file);
  }

  function spawnSparks(n = 14) {
    const layer = document.getElementById("train-sparks");
    for (let i = 0; i < n; i++) {
      const s = document.createElement("div");
      s.className = "spark";
      s.style.left = `${40 + Math.random() * 20}%`;
      s.style.top = `${35 + Math.random() * 30}%`;
      s.style.setProperty("--dx", `${(Math.random() - 0.5) * 160}px`);
      s.style.setProperty("--dy", `${-40 - Math.random() * 120}px`);
      layer.appendChild(s);
      setTimeout(() => s.remove(), 850);
    }
  }

  function spawnFloatNums(deltas) {
    const layer = document.getElementById("train-float-nums");
    let delay = 0;
    for (const [k, v] of Object.entries(deltas || {})) {
      const el = document.createElement("div");
      el.className = `float-num ${k === "harmony" ? "pink" : ""}`;
      el.textContent = `${STAT_LABELS[k]} +${v}`;
      el.style.color = STAT_COLORS[k];
      el.style.animationDelay = `${delay}s`;
      el.style.left = `${45 + Math.random() * 10}%`;
      layer.appendChild(el);
      setTimeout(() => el.remove(), 1100);
      delay += 0.12;
    }
  }

  function showTrainResult(res) {
    const career = getCareerSession();
    const card = document.getElementById("train-result-card");
    const ribbon = document.getElementById("result-ribbon");
    const deltasEl = document.getElementById("result-deltas");
    const extra = document.getElementById("result-extra");
    const poseImg = document.getElementById("result-pose-img");

    card.classList.toggle("fail", !!res.failed);
    if (res.failed) {
      ribbon.textContent = "練習失敗…";
      poseImg.src = withAssetVersion(career.char.poses.hurt?.file || career.char.poses.idle.file);
      audio.tone(140, 0.18, "sawtooth", 0.04, -60);
    } else if (res.action === "rest") {
      ribbon.textContent = "休憩完了";
      poseImg.src = withAssetVersion(career.char.poses.idle.file);
      audio.tone(360, 0.1, "sine", 0.035);
    } else if (res.action === "recreate") {
      ribbon.textContent = "お出かけ！";
      poseImg.src = withAssetVersion(career.char.poses.run?.file || career.char.poses.idle.file);
      audio.tone(620, 0.08, "triangle", 0.035);
    } else {
      ribbon.textContent = `${res.opt?.facility || "練習"} 成功！`;
      const pose = res.opt?.pose || "attack";
      poseImg.src = withAssetVersion(career.char.poses[pose]?.file || career.char.poses.idle.file);
      audio.tone(540, 0.07, "triangle", 0.04, 120);
      audio.tone(720, 0.1, "sine", 0.025);
    }

    deltasEl.innerHTML = "";
    const supportsEl = document.getElementById("result-supports");
    supportsEl.innerHTML = "";
    if (res.joined?.length) {
      for (const s of res.joined) {
        const span = document.createElement("span");
        span.textContent = res.tipTriggered?.id === s.id ? `✦ ${s.name}` : `＋${s.name}`;
        supportsEl.appendChild(span);
      }
    }
    if (res.rainbow && res.tipTriggered) {
      ribbon.textContent = `絆イベント！ ${res.tipTriggered.name}`;
    }

    const entries = Object.entries(res.deltas || {});
    if (!entries.length && res.failed) {
      deltasEl.innerHTML = `<span class="delta-chip" style="color:#ff8fab">成長なし</span>`;
    }
    entries.forEach(([k, v], i) => {
      const chip = document.createElement("span");
      chip.className = "delta-chip";
      chip.style.color = STAT_COLORS[k];
      chip.style.animationDelay = `${i * 0.08}s`;
      chip.textContent = `${STAT_LABELS[k]} +${v}`;
      deltasEl.appendChild(chip);
    });

    const bits = [];
    if (res.energyDelta) bits.push(`活力 ${res.energyDelta > 0 ? "+" : ""}${res.energyDelta}`);
    if (res.tipTriggered) bits.push(res.tipTriggered.tip);
    if (res.events?.length) bits.push(res.events.map((e) => e.text).join(" / "));
    extra.textContent = bits.join(" · ");

    setPendingFinished(res.finished || null);
    resultOverlay.classList.remove("hidden");
  }

  function showFinishFanfare(finished) {
    const career = getCareerSession();
    document.getElementById("finish-rank").textContent = finished.rank;
    document.getElementById("finish-name").textContent = career.char.name;
    document.getElementById("finish-total").textContent = `ステータス合計 ${finished.total}`;
    finishOverlay.classList.remove("hidden");
    audio.win();
  }

  function pushLog(msgs) {
    const log = document.getElementById("train-log");
    for (const m of [...(msgs || [])].reverse()) {
      const div = document.createElement("div");
      div.textContent = `› ${m}`;
      log.prepend(div);
    }
  }

  function renderCareer(highlightDeltas = null, joinedIds = [], rainbowId = null) {
    const career = getCareerSession();
    if (!career) return;
    const ch = career.char;
    document.documentElement.style.setProperty("--chara", ch.color);
    document.getElementById("train-portrait-wrap").style.setProperty("--chara", ch.color);

    setPortrait(career.lastPose || "idle");
    document.getElementById("train-name").textContent = ch.name;
    document.getElementById("train-title").textContent = ch.title;

    const remain = career.done ? 0 : MAX_TURNS - career.turn + 1;
    document.getElementById("train-remain").textContent = String(remain);

    const goal = nextGoal(career.turn);
    const need = goal.require.total;
    const pct = Math.min(100, (100 * career.total) / need);
    document.getElementById("train-goal-text").textContent =
      `${goal.name}（合計 ${career.total} / ${need}）· ${career.turn}日目`;
    document.getElementById("train-goal-fill").style.width = `${pct}%`;

    const mood = career.mood;
    document.getElementById("train-mood").textContent = mood.label;
    document.getElementById("train-mood").style.color = mood.color;
    document.getElementById("train-mood-face").textContent = mood.face;
    const chip = document.getElementById("train-mood-chip");
    chip.classList.remove("pulse");
    void chip.offsetWidth;
    chip.classList.add("pulse");

    document.getElementById("train-energy-fill").style.width =
      `${(100 * career.energy) / ENERGY_MAX}%`;
    document.getElementById("train-energy-label").textContent =
      `${career.energy}/${ENERGY_MAX}`;

    renderSupportStrip(joinedIds, rainbowId);

    const statsEl = document.getElementById("train-stats");
    statsEl.innerHTML = STAT_KEYS.map((k) => {
      const v = career.stats[k];
      const barPct = Math.min(100, (100 * v) / STAT_MAX);
      const pop = highlightDeltas?.[k] ? "pop" : "";
      return `<div class="stat-row ${pop}" data-stat="${k}">
      <span class="label" style="color:${STAT_COLORS[k]}">${STAT_LABELS[k]}</span>
      <div class="bar"><i style="width:${barPct}%;background:${STAT_COLORS[k]}"></i></div>
      <span class="val">${v}</span>
    </div>`;
    }).join("");

    const specialtySet = new Set(career.supports.map((s) => s.specialty));
    const actions = document.getElementById("train-actions");
    actions.innerHTML = "";
    if (!career.done) {
      for (const opt of career.trainOptions) {
        const chance = failChance(career.energy, opt.energy);
        const pctFail = Math.round(chance * 100);
        const hasSup = specialtySet.has(opt.id);
        const b = document.createElement("button");
        b.type = "button";
        b.className = `facility-card ${hasSup ? "has-support" : ""}`;
        b.style.setProperty("--fc", opt.color);
        b.disabled = career.energy < opt.energy;
        b.innerHTML = `
        <span class="fail-badge ${pctFail === 0 ? "zero" : ""}">${pctFail === 0 ? "安全" : `失敗${pctFail}%`}</span>
        <div class="fname">${opt.label}</div>
        <div class="fhint">${opt.hint}${hasSup ? " · サポ得意" : ""}</div>
        <div class="fcost">活力 -${opt.energy}</div>
      `;
        b.addEventListener("click", () => {
          audio.ensure();
          applyActionResult(career.train(opt.id));
        });
        actions.appendChild(b);
      }
    }

    btnRest.disabled = career.done;
    btnOuting.disabled = career.done;
    btnTrainFinish.classList.toggle("hidden", !career.done);
    btnTrainAbort.classList.toggle("hidden", career.done);
  }

  function applyActionResult(res) {
    const career = getCareerSession();
    if (!res.ok) {
      audio.tone(140, 0.06, "square", 0.02);
      pushLog(res.msgs);
      return;
    }
    const wrap = document.getElementById("train-portrait-wrap");
    wrap.classList.remove("react", "fail");
    void wrap.offsetWidth;
    if (res.failed) wrap.classList.add("fail");
    else wrap.classList.add("react");

    setPortrait(career.lastPose || "idle");
    if (!res.failed && res.deltas && Object.keys(res.deltas).length) {
      spawnSparks(res.rainbow ? 28 : 16);
      spawnFloatNums(res.deltas);
    }
    const joinedIds = (res.joined || []).map((s) => s.id);
    pushLog(res.msgs);
    renderCareer(res.deltas, joinedIds, res.tipTriggered?.id);
    showTrainResult(res);
  }

  function startCareerWithDeck() {
    const career = new BloomCareer(getTrainee(), getDeckIds());
    setCareerSession(career);
    setPendingFinished(null);
    document.getElementById("train-log").innerHTML = "";
    pushLog(career.log);
    renderCareer();
    show(screens.train);
    audio.tone(480, 0.1, "triangle", 0.04, 200);
  }

  return {
    buildTrainRoster,
    renderDeckUI,
    renderCareer,
    applyActionResult,
    startCareerWithDeck,
    showFinishFanfare,
    resultOverlay,
    finishOverlay,
    getPendingFinished,
  };
}
