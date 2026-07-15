import { clamp } from "../shared/clamp.js";
import { loadCareers, saveCareers } from "../data/careers-repository.js";
import {
  BOND_MAX,
  ENERGY_MAX,
  EVENTS,
  GOALS,
  MAX_SUPPORTS,
  MAX_TURNS,
  MOODS,
  STAT_KEYS,
  STAT_MAX,
  TRAIN_OPTS,
} from "./constants.js";
import { emptyGrowth, failChance, rankFromStats } from "./formulas.js";
import { makeSupportSlot } from "./supports.js";

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

  _joiningSupports(statId) {
    const joined = [];
    for (const s of this.supports) {
      const specialtyMatch = s.specialty === statId;
      const rate = s.joinRate * (specialtyMatch ? 1.35 : 0.55) * (0.85 + s.bond / 200);
      if (Math.random() < rate) joined.push(s);
    }
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
