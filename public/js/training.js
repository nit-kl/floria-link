/** 開花育成 — Uma風 + サポートカード */

const STORAGE_KEY = "floria-bloom-careers-v1";
export const MAX_TURNS = 12;
export const STAT_MAX = 1200;
export const ENERGY_MAX = 100;
export const MAX_SUPPORTS = 3;
export const BOND_MAX = 100;

export const STAT_KEYS = ["speed", "stamina", "power", "harmony", "wit"];
export const STAT_LABELS = {
  speed: "疾走",
  stamina: "根気",
  power: "剛力",
  harmony: "調和",
  wit: "叡智",
};
export const STAT_COLORS = {
  speed: "#5eb8ff",
  stamina: "#5ed67a",
  power: "#ff7e6a",
  harmony: "#ff9ad4",
  wit: "#c9a0ff",
};

export const MOODS = [
  { id: "awful", label: "不調", mul: 0.8, color: "#7a9bb8", face: "😣" },
  { id: "bad", label: "低調", mul: 0.9, color: "#8ec5ff", face: "😕" },
  { id: "normal", label: "普通", mul: 1.0, color: "#ffffff", face: "😐" },
  { id: "good", label: "好調", mul: 1.1, color: "#ffe08a", face: "😊" },
  { id: "great", label: "絶好調", mul: 1.2, color: "#ff9ad4", face: "😄" },
];

export const TRAIN_OPTS = [
  { id: "speed", stat: "speed", energy: 18, base: 14, label: "疾走", facility: "疾走練習", hint: "移動速度↑", color: "#5eb8ff", pose: "run" },
  { id: "stamina", stat: "stamina", energy: 16, base: 15, label: "根気", facility: "根気練習", hint: "耐久↑", color: "#5ed67a", pose: "carry" },
  { id: "power", stat: "power", energy: 18, base: 14, label: "剛力", facility: "剛力練習", hint: "攻撃↑", color: "#ff7e6a", pose: "attack" },
  { id: "harmony", stat: "harmony", energy: 15, base: 13, label: "調和", facility: "調和練習", hint: "リンク・射程↑", color: "#ff9ad4", pose: "idle" },
  { id: "wit", stat: "wit", energy: 14, base: 13, label: "叡智", facility: "叡智練習", hint: "再出撃短縮", color: "#c9a0ff", pose: "idle" },
];

/**
 * サポートカード（出撃キャラとは別の園の先輩・導師）
 * glyph は UI 用の記号。バトルユニットとは紐づけない。
 */
export const SUPPORT_CARDS = [
  {
    id: "anemo",
    name: "アネモ",
    title: "風の先輩",
    specialty: "speed",
    rarity: "SR",
    tagline: "疾風の追い風",
    tip: "足取りが軽くなるよ！",
    tipBonus: { speed: 12 },
    joinRate: 0.74,
    color: "#5eb8ff",
    accent: "#b8e4ff",
    glyph: "風",
  },
  {
    id: "kagerou",
    name: "カゲロウ",
    title: "根守りの導師",
    specialty: "stamina",
    rarity: "SSR",
    tagline: "深く張る根",
    tip: "根気は一日にしてならず！",
    tipBonus: { stamina: 14 },
    joinRate: 0.7,
    color: "#5ed67a",
    accent: "#b8f0c4",
    glyph: "根",
  },
  {
    id: "hanagane",
    name: "ハナガネ",
    title: "鎚鍛冶の師匠",
    specialty: "power",
    rarity: "SSR",
    tagline: "花鋼の一打",
    tip: "剛力の芯を鍛えよう！",
    tipBonus: { power: 13 },
    joinRate: 0.72,
    color: "#ff7e6a",
    accent: "#ffc4b8",
    glyph: "鎚",
  },
  {
    id: "lunaria",
    name: "ルナリア",
    title: "月詠みの巫",
    specialty: "harmony",
    rarity: "SSR",
    tagline: "月下の共鳴",
    tip: "心がひとつに重なる…",
    tipBonus: { harmony: 14 },
    joinRate: 0.68,
    color: "#ff9ad4",
    accent: "#ffd0ea",
    glyph: "月",
  },
  {
    id: "mitsuba",
    name: "ミツバ",
    title: "蜜導士",
    specialty: "wit",
    rarity: "SR",
    tagline: "蜜の叡智",
    tip: "頭も花も、よく回して！",
    tipBonus: { wit: 13 },
    joinRate: 0.71,
    color: "#c9a0ff",
    accent: "#e6d0ff",
    glyph: "蜜",
  },
  {
    id: "tsuyuhime",
    name: "ツユヒメ",
    title: "朝露の書記",
    specialty: "wit",
    rarity: "R",
    tagline: "露のメモ書き",
    tip: "小さな気づき、大きな一歩",
    tipBonus: { wit: 9, harmony: 3 },
    joinRate: 0.76,
    color: "#9ad8ff",
    accent: "#d4efff",
    glyph: "露",
  },
  {
    id: "hiyori",
    name: "ヒヨリ",
    title: "陽だまりの世話係",
    specialty: "stamina",
    rarity: "R",
    tagline: "日向ぼっこ",
    tip: "まずは体力からだよ〜",
    tipBonus: { stamina: 10, speed: 3 },
    joinRate: 0.78,
    color: "#ffe08a",
    accent: "#fff3c4",
    glyph: "陽",
  },
  {
    id: "ibara",
    name: "イバラ",
    title: "茨守りの斥候",
    specialty: "power",
    rarity: "SR",
    tagline: "棘の鍛錬",
    tip: "痛みを力に変えて！",
    tipBonus: { power: 10, stamina: 4 },
    joinRate: 0.7,
    color: "#c09ad8",
    accent: "#e0c8f0",
    glyph: "茨",
  },
  {
    id: "koharu",
    name: "コハル",
    title: "蕾の伝令",
    specialty: "speed",
    rarity: "R",
    tagline: "早駆け便り",
    tip: "いち早く届けるのが仕事！",
    tipBonus: { speed: 10 },
    joinRate: 0.8,
    color: "#a8e6a0",
    accent: "#d4f5d0",
    glyph: "蕾",
  },
  {
    id: "shion",
    name: "シオン",
    title: "紫苑の調律師",
    specialty: "harmony",
    rarity: "SR",
    tagline: "花弦の調べ",
    tip: "調和は響き合いから",
    tipBonus: { harmony: 11, wit: 3 },
    joinRate: 0.69,
    color: "#d4a5ff",
    accent: "#ecd8ff",
    glyph: "弦",
  },
];

export function getSupportCard(id) {
  return SUPPORT_CARDS.find((c) => c.id === id) || null;
}

export const GOALS = [
  { turn: 4, name: "芽吹き試験", require: { total: 280 }, passBonus: { mood: 1, energy: 10 }, failMood: -1 },
  { turn: 8, name: "蕾の競演", require: { total: 520 }, passBonus: { mood: 1, energy: 12, all: 6 }, failMood: -1 },
  { turn: 12, name: "満開審査", require: { total: 780 }, passBonus: { mood: 1, all: 10 }, failMood: -1 },
];

const EVENTS = [
  { text: "庭で蝶と遊んだ。調子が上がった！", mood: 1, energy: 5, kind: "good" },
  { text: "突然の雨でびしょ濡れ…活力ダウン", mood: -1, energy: -12, kind: "bad" },
  { text: "仲間の花精と語り合った。調和のヒントを得た", bonus: { harmony: 8 }, mood: 1, kind: "good" },
  { text: "温室の実験が成功！叡智が芽吹く", bonus: { wit: 10 }, kind: "good" },
  { text: "食いすぎて眠い…", mood: -1, energy: 8, kind: "bad" },
  { text: "星空を見て決意を新たにした", mood: 1, bonus: { power: 5, speed: 5 }, kind: "good" },
  { text: "腐海の匂いが近い…気が引き締まる", bonus: { stamina: 8 }, mood: 0, kind: "good" },
  { text: "甘い蜜を分けてもらった", energy: 15, mood: 1, kind: "good" },
];

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function emptyGrowth() {
  return { speed: 50, stamina: 50, power: 50, harmony: 50, wit: 50 };
}

export function loadCareers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveCareers(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getCareer(charId) {
  const all = loadCareers();
  return all[String(charId)] || null;
}

export function rankFromStats(stats) {
  const total = STAT_KEYS.reduce((s, k) => s + (stats[k] || 0), 0);
  if (total >= 4200) return "SS";
  if (total >= 3600) return "S";
  if (total >= 3000) return "A";
  if (total >= 2400) return "B";
  if (total >= 1800) return "C";
  if (total >= 1200) return "D";
  return "G";
}

export function nextGoal(turn) {
  return GOALS.find((g) => g.turn >= turn) || GOALS[GOALS.length - 1];
}

export function failChance(energy, cost) {
  if (energy < cost) return 1;
  const after = energy - cost;
  if (after >= 50) return 0;
  if (after >= 30) return 0.08;
  if (after >= 15) return 0.22;
  return 0.4;
}

export function growthToBattleMods(growth) {
  if (!growth) {
    return { hp: 1, atk: 1, speed: 1, range: 1, recharge: 1, cost: 1, linkBonus: 0 };
  }
  const s = (k) => growth[k] || 50;
  return {
    hp: 1 + (s("stamina") - 50) / 800,
    atk: 1 + (s("power") - 50) / 750,
    speed: 1 + (s("speed") - 50) / 900,
    range: 1 + (s("harmony") - 50) / 1000,
    recharge: Math.max(0.55, 1 - (s("wit") - 50) / 1100),
    cost: Math.max(0.75, 1 - (s("wit") - 50) / 2000),
    linkBonus: Math.floor((s("harmony") - 50) / 80),
  };
}

/** Build runtime support slot from a dedicated support card def / id */
export function makeSupportSlot(cardOrId) {
  const def = typeof cardOrId === "string" ? getSupportCard(cardOrId) : cardOrId;
  if (!def) return null;
  return {
    id: def.id,
    name: def.name,
    title: def.title,
    color: def.color,
    accent: def.accent,
    glyph: def.glyph,
    specialty: def.specialty,
    rarity: def.rarity,
    tagline: def.tagline,
    tip: def.tip,
    tipBonus: { ...def.tipBonus },
    joinRate: def.joinRate,
    bond: 0,
  };
}

export class BloomCareer {
  /** @param {object} charDef trainee character
   *  @param {Array<string|object>} supportDeck support card ids or defs */
  constructor(charDef, supportDeck = []) {
    this.char = charDef;
    const seen = new Set();
    this.supports = supportDeck
      .map(makeSupportSlot)
      .filter((s) => {
        if (!s || seen.has(s.id)) return false;
        seen.add(s.id);
        return true;
      })
      .slice(0, MAX_SUPPORTS);
    this.turn = 1;
    this.energy = ENERGY_MAX;
    this.moodIndex = 2;
    this.stats = emptyGrowth();
    const supportNames = this.supports.map((s) => s.name).join("・") || "なし";
    this.log = [`${charDef.name}の開花育成、スタート！`, `サポート: ${supportNames}`];
    this.done = false;
    this.goalResults = [];
    this.lastPose = "idle";
  }

  get mood() {
    return MOODS[this.moodIndex];
  }

  get total() {
    return STAT_KEYS.reduce((s, k) => s + this.stats[k], 0);
  }

  get trainOptions() {
    return TRAIN_OPTS;
  }

  shiftMood(delta) {
    this.moodIndex = clamp(this.moodIndex + delta, 0, MOODS.length - 1);
  }

  gainStat(key, amount) {
    const before = this.stats[key];
    const gained = Math.floor(amount * this.mood.mul * (0.85 + Math.random() * 0.35));
    this.stats[key] = clamp(before + gained, 0, STAT_MAX);
    return this.stats[key] - before;
  }

  _snapshotStats() {
    return { ...this.stats };
  }

  _diffStats(before) {
    const deltas = {};
    for (const k of STAT_KEYS) {
      const d = this.stats[k] - before[k];
      if (d) deltas[k] = d;
    }
    return deltas;
  }

  /** Supports that join this facility training */
  _joiningSupports(statId) {
    const joined = [];
    for (const s of this.supports) {
      const specialtyMatch = s.specialty === statId;
      const rate = s.joinRate * (specialtyMatch ? 1.35 : 0.55) * (0.85 + s.bond / 200);
      if (Math.random() < rate) joined.push(s);
    }
    // guarantee at least specialty supports sometimes when bond high
    if (!joined.length) {
      const specs = this.supports.filter((s) => s.specialty === statId && s.bond >= 40);
      if (specs.length && Math.random() < 0.45) joined.push(specs[0]);
    }
    return joined;
  }

  _applySupportBonuses(statId, joined) {
    const notes = [];
    let bonusMul = 1;
    let tipTriggered = null;

    for (const s of joined) {
      const specialtyMatch = s.specialty === statId;
      const bondGain = specialtyMatch ? 12 + ((Math.random() * 6) | 0) : 7 + ((Math.random() * 4) | 0);
      s.bond = clamp(s.bond + bondGain, 0, BOND_MAX);

      if (specialtyMatch) {
        bonusMul += 0.18 + s.bond / 500;
        notes.push(`${s.name}が得意練習に合流！ 絆+${bondGain}`);
      } else {
        bonusMul += 0.08;
        notes.push(`${s.name}が応援に来た 絆+${bondGain}`);
      }

      // Friendship tip / rainbow-ish event
      if (s.bond >= 80 && specialtyMatch && Math.random() < 0.55) {
        tipTriggered = s;
        for (const [k, v] of Object.entries(s.tipBonus || {})) {
          this.gainStat(k, v);
        }
        notes.push(`✦ ${s.name}「${s.tip}」`);
        this.shiftMood(1);
      } else if (s.bond >= 60 && Math.random() < 0.2) {
        this.gainStat(s.specialty, 6);
        notes.push(`${s.name}の小さなヒント…`);
      }
    }

    return { bonusMul, notes, tipTriggered, joined };
  }

  _randomEvent() {
    // Prefer support hangout events if available
    if (this.supports.length && Math.random() < 0.28) {
      const s = this.supports[(Math.random() * this.supports.length) | 0];
      const before = this._snapshotStats();
      const energyBefore = this.energy;
      s.bond = clamp(s.bond + 8, 0, BOND_MAX);
      this.gainStat(s.specialty, 5);
      if (Math.random() < 0.5) this.shiftMood(1);
      return {
        text: `${s.name}とおしゃべり。絆が深まった！`,
        kind: "support",
        deltas: this._diffStats(before),
        energyDelta: this.energy - energyBefore,
        supportId: s.id,
      };
    }

    if (Math.random() > 0.4) return null;
    const before = this._snapshotStats();
    const energyBefore = this.energy;
    const moodBefore = this.moodIndex;
    const ev = EVENTS[(Math.random() * EVENTS.length) | 0];
    if (ev.mood) this.shiftMood(ev.mood);
    if (ev.energy) this.energy = clamp(this.energy + ev.energy, 0, ENERGY_MAX);
    if (ev.bonus) {
      for (const [k, v] of Object.entries(ev.bonus)) this.gainStat(k, v);
    }
    return {
      text: ev.text,
      kind: ev.kind || "good",
      deltas: this._diffStats(before),
      energyDelta: this.energy - energyBefore,
      moodChanged: this.moodIndex !== moodBefore,
    };
  }

  _checkGoal() {
    const goal = GOALS.find((g) => g.turn === this.turn);
    if (!goal) return null;
    const before = this._snapshotStats();
    const ok = this.total >= goal.require.total;
    this.goalResults.push({ name: goal.name, ok, turn: this.turn });
    if (ok) {
      this.shiftMood(goal.passBonus.mood || 0);
      if (goal.passBonus.energy) this.energy = clamp(this.energy + goal.passBonus.energy, 0, ENERGY_MAX);
      if (goal.passBonus.all) {
        for (const k of STAT_KEYS) this.gainStat(k, goal.passBonus.all);
      }
      return {
        text: `【${goal.name}】クリア！`,
        ok: true,
        name: goal.name,
        deltas: this._diffStats(before),
      };
    }
    this.shiftMood(goal.failMood || -1);
    return {
      text: `【${goal.name}】未達…（必要 ${goal.require.total}）`,
      ok: false,
      name: goal.name,
      deltas: {},
    };
  }

  _advanceTurn() {
    const events = [];
    const ev = this._randomEvent();
    if (ev) {
      events.push(ev);
      this.log.push(ev.text);
    }
    const goal = this._checkGoal();
    if (goal) {
      events.push({ ...goal, kind: goal.ok ? "goal-ok" : "goal-ng" });
      this.log.push(goal.text);
    }

    let finished = null;
    if (this.turn >= MAX_TURNS) {
      this.done = true;
      const rank = rankFromStats(this.stats);
      finished = { rank, total: this.total };
      this.log.push(`開花完了！ 評価 ${rank}`);
      this._persist(rank);
    } else {
      this.turn += 1;
    }
    return { events, finished };
  }

  _persist(rank) {
    const all = loadCareers();
    all[String(this.char.id)] = {
      id: this.char.id,
      name: this.char.name,
      stats: { ...this.stats },
      rank,
      total: this.total,
      goals: this.goalResults,
      supports: this.supports.map((s) => ({ id: s.id, name: s.name, bond: s.bond })),
      updatedAt: Date.now(),
    };
    saveCareers(all);
  }

  train(statId) {
    if (this.done) return { ok: false, msgs: ["育成は終了しています"] };
    const opt = TRAIN_OPTS.find((o) => o.id === statId);
    if (!opt) return { ok: false, msgs: ["不明な特訓"] };
    if (this.energy < opt.energy) {
      return { ok: false, msgs: ["活力が足りない…休憩しよう"] };
    }

    const chance = failChance(this.energy, opt.energy);
    this.energy -= opt.energy;
    this.lastPose = opt.pose;

    if (Math.random() < chance) {
      this.shiftMood(-1);
      // still tiny bond if supports "tried" to come
      for (const s of this.supports) {
        if (s.specialty === statId) s.bond = clamp(s.bond + 2, 0, BOND_MAX);
      }
      const msgs = [`${opt.facility}…失敗！ 調子が下がった`];
      const adv = this._advanceTurn();
      this.log.push(...msgs);
      return {
        ok: true,
        failed: true,
        action: "train",
        opt,
        deltas: {},
        energyDelta: -opt.energy,
        joined: [],
        msgs: msgs.concat(adv.events.map((e) => e.text)),
        events: adv.events,
        finished: adv.finished,
        failChance: chance,
      };
    }

    const before = this._snapshotStats();
    const joined = this._joiningSupports(statId);
    const { bonusMul, notes, tipTriggered } = this._applySupportBonuses(statId, joined);

    this.gainStat(opt.stat, opt.base * bonusMul);
    const secondary = STAT_KEYS.filter((k) => k !== opt.stat);
    const sec = secondary[(Math.random() * secondary.length) | 0];
    this.gainStat(sec, (3 + Math.random() * 3) * Math.min(1.4, bonusMul));
    const deltas = this._diffStats(before);

    let msgs = [`${opt.facility} 成功！`];
    if (joined.length) msgs.push(`サポート合流 ×${joined.length}`);
    msgs = msgs.concat(notes);
    if (this.energy < 25 && Math.random() < 0.3) {
      this.shiftMood(-1);
      msgs.push("少し疲れた…");
    }
    const adv = this._advanceTurn();
    this.log.push(...msgs);
    return {
      ok: true,
      failed: false,
      action: "train",
      opt,
      deltas,
      energyDelta: -opt.energy,
      joined: joined.map((s) => ({ id: s.id, name: s.name, bond: s.bond, specialty: s.specialty })),
      tipTriggered: tipTriggered
        ? { id: tipTriggered.id, name: tipTriggered.name, tip: tipTriggered.tip }
        : null,
      rainbow: !!tipTriggered,
      msgs: msgs.concat(adv.events.map((e) => e.text)),
      events: adv.events,
      finished: adv.finished,
      failChance: chance,
    };
  }

  rest() {
    if (this.done) return { ok: false, msgs: ["育成は終了しています"] };
    this.lastPose = "idle";
    const recovered = 35 + ((Math.random() * 25) | 0);
    this.energy = clamp(this.energy + recovered, 0, ENERGY_MAX);
    const moodUp = Math.random() < 0.4;
    if (moodUp) this.shiftMood(1);
    // supports recover bond slightly on rest hangout
    for (const s of this.supports) {
      if (Math.random() < 0.35) s.bond = clamp(s.bond + 3, 0, BOND_MAX);
    }
    const msgs = [`休憩して活力+${recovered}`];
    const adv = this._advanceTurn();
    this.log.push(...msgs);
    return {
      ok: true,
      action: "rest",
      deltas: {},
      energyDelta: recovered,
      moodUp,
      joined: [],
      msgs: msgs.concat(adv.events.map((e) => e.text)),
      events: adv.events,
      finished: adv.finished,
    };
  }

  recreate() {
    if (this.done) return { ok: false, msgs: ["育成は終了しています"] };
    this.lastPose = "run";
    const before = this._snapshotStats();
    this.energy = clamp(this.energy - 10, 0, ENERGY_MAX);
    this.shiftMood(1 + (Math.random() < 0.35 ? 1 : 0));
    this.gainStat("harmony", 6);
    // outing with a random support
    let outingNote = "";
    if (this.supports.length) {
      const s = this.supports[(Math.random() * this.supports.length) | 0];
      s.bond = clamp(s.bond + 10, 0, BOND_MAX);
      this.gainStat(s.specialty, 4);
      outingNote = `${s.name}とお出かけ！`;
    }
    const deltas = this._diffStats(before);
    const msgs = [outingNote || `お出かけ！`, `調子→${this.mood.label}`];
    const adv = this._advanceTurn();
    this.log.push(...msgs);
    return {
      ok: true,
      action: "recreate",
      deltas,
      energyDelta: -10,
      joined: [],
      msgs: msgs.concat(adv.events.map((e) => e.text)),
      events: adv.events,
      finished: adv.finished,
    };
  }
}
