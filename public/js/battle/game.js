import { SEASONS } from "../data/seasons.js";
import { getCareer } from "../data/careers-repository.js";
import { emitGameHud, emitGameResult, emitSeasonBanner } from "../shared/events.js";
import { FX } from "../shared/fx.js";
import { growthToBattleMods } from "../train/formulas.js";
import {
  BURST_COST,
  GREENHOUSE_CAPS,
  GREENHOUSE_COSTS,
  GREENHOUSE_RATES,
  GROUND,
  LINK_DAMAGE,
  LINK_RANGE,
  SEASON_LEN,
  W,
} from "./constants.js";
import { drawGame } from "./render.js";
import { Unit } from "./unit.js";

export class Game {
  constructor(canvas, catalog, audio) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.catalog = catalog;
    this.audio = audio;
    this.fx = new FX();

    this.state = "title";
    this.units = [];
    this.links = [];
    this.time = 0;
    this.shake = 0;
    this.camX = 0;
    this.fieldWidth = 2200;

    this.allyCastle = { x: 160, hp: 1300, maxHp: 1300 };
    this.enemyCastle = { x: 2000, hp: 1800, maxHp: 1800 };

    this.money = 160;
    this.nectar = 10;
    this.walletLevel = 0;
    this.recharge = {};
    for (const ch of catalog.characters) this.recharge[ch.id] = 0;

    this.stage = 1;
    this.enemySpawnTimer = 2;
    this.enemyBudget = 0;
    this.courierTimer = 12;
    this.ended = false;
    this.score = 0;
    this.winReason = "";

    this.seasonIndex = 0;
    this.seasonTimer = SEASON_LEN;
    this.burstFlash = 0;
    this.burstBuff = 0;

    this.plots = this._makePlots();
    this.flowers = this._seedFlowers();
    this.clouds = Array.from({ length: 6 }, (_, i) => ({
      x: i * 400 + Math.random() * 80,
      y: 50 + Math.random() * 110,
      s: 0.55 + Math.random() * 0.7,
      v: 10 + Math.random() * 18,
    }));
  }

  _makePlots() {
    const xs = [420, 700, 980, 1260, 1540];
    return xs.map((x, i) => ({
      id: i,
      x,
      w: 150,
      progress: 0,
      bloomed: false,
      pulse: Math.random() * Math.PI * 2,
    }));
  }

  _seedFlowers() {
    const colors = ["#ff8fab", "#ffd56a", "#9ad8ff", "#c3f584", "#d4a5ff", "#ffb08a"];
    return Array.from({ length: 36 }, () => ({
      x: Math.random() * this.fieldWidth,
      y: 40 + Math.random() * 240,
      r: 3 + Math.random() * 5,
      c: colors[(Math.random() * colors.length) | 0],
      phase: Math.random() * Math.PI * 2,
      layer: Math.random() < 0.5 ? 0 : 1,
    }));
  }

  get walletCap() { return GREENHOUSE_CAPS[this.walletLevel]; }
  get walletRate() { return GREENHOUSE_RATES[this.walletLevel]; }
  get nextWalletCost() {
    return this.walletLevel >= GREENHOUSE_COSTS.length ? null : GREENHOUSE_COSTS[this.walletLevel];
  }
  get season() { return SEASONS[this.seasonIndex % SEASONS.length]; }
  get bloomedCount() { return this.plots.filter((p) => p.bloomed).length; }

  /** Highest trained ranks for battle-start flair */
  trainedSummary() {
    return this.catalog.characters
      .map((ch) => {
        const c = getCareer(ch.id);
        return c ? { id: ch.id, name: ch.name, rank: c.rank, color: ch.color } : null;
      })
      .filter(Boolean);
  }

  start() {
    this.units = [];
    this.links = [];
    this.fx = new FX();
    this.time = 0;
    this.shake = 0;
    this.camX = 0;
    this.allyCastle = { x: 160, hp: 1300, maxHp: 1300 };
    this.enemyCastle = { x: 2000, hp: 1800, maxHp: 1800 };
    this.money = 180;
    this.nectar = 12;
    this.walletLevel = 0;
    for (const id of Object.keys(this.recharge)) this.recharge[id] = 0;
    this.enemySpawnTimer = 1.2;
    this.enemyBudget = 60;
    this.courierTimer = 10;
    this.ended = false;
    this.score = 0;
    this.winReason = "";
    this.seasonIndex = 0;
    this.seasonTimer = SEASON_LEN;
    this.burstFlash = 0;
    this.burstBuff = 0;
    this.plots = this._makePlots();
    this.state = "play";
    this._announceSeason();
    const trained = this.trainedSummary();
    if (trained.length) {
      const best = [...trained].sort((a, b) => b.rank.localeCompare(a.rank))[0];
      this.fx.text(this.allyCastle.x + 160, GROUND - 160, `開花戦力 ${trained.length}体 · 最高${best.rank}`, "#ffe08a");
    } else {
      this.fx.text(this.allyCastle.x + 160, GROUND - 160, "未育成でも出撃可 · 育てると強くなる", "#c8f0a8");
    }
    this.syncHud();
  }

  addMoney(n) {
    this.money = Math.min(this.walletCap, this.money + n);
  }

  addNectar(n) {
    this.nectar = Math.min(120, this.nectar + n);
  }

  battleDefFor(charId) {
    const ch = this.catalog.characters.find((c) => c.id === charId);
    if (!ch) return null;
    const career = getCareer(charId);
    const mods = growthToBattleMods(career?.stats);
    const base = ch.stats;
    return {
      ...ch,
      careerRank: career?.rank || null,
      stats: {
        ...base,
        hp: Math.floor(base.hp * mods.hp),
        atk: Math.floor(base.atk * mods.atk),
        speed: Math.floor(base.speed * mods.speed),
        range: Math.floor(base.range * mods.range),
        recharge: Math.max(0.8, base.recharge * mods.recharge),
        cost: Math.floor(base.cost * mods.cost),
        linkBonus: mods.linkBonus,
      },
    };
  }

  canDeploy(id) {
    const def = this.battleDefFor(id);
    if (!def) return false;
    if (this.recharge[id] > 0) return false;
    if (this.money < def.stats.cost) return false;
    return true;
  }

  deploy(id) {
    if (this.state !== "play" || this.ended) return false;
    if (!this.canDeploy(id)) return false;
    const def = this.battleDefFor(id);
    this.money -= def.stats.cost;
    this.recharge[id] = def.stats.recharge;
    const lane = GROUND - 8 - ((Math.random() * 18) | 0);
    this.units.push(new Unit(def, this.allyCastle.x + 70, lane, 1, lane));
    this.audio.tone(480, 0.06, "triangle", 0.03, 120);
    this.fx.fountain(this.allyCastle.x + 70, GROUND - 20, def.accent, 8);
    if (def.careerRank) {
      this.fx.text(this.allyCastle.x + 100, GROUND - 100, `${def.name} ${def.careerRank}`, "#ffe08a");
    }
    this.syncHud();
    return true;
  }

  upgradeWallet() {
    const cost = this.nextWalletCost;
    if (cost == null || this.money < cost) return false;
    this.money -= cost;
    this.walletLevel += 1;
    this.audio.special();
    this.fx.text(this.allyCastle.x + 80, GROUND - 120, "温室アップ!", "#ffd56a");
    this.syncHud();
    return true;
  }

  tryBurst() {
    if (this.state !== "play" || this.ended) return false;
    if (this.nectar < BURST_COST) return false;
    this.nectar -= BURST_COST;
    this.burstFlash = 0.9;
    this.burstBuff = 6;
    this.audio.special();
    this.shake = 14;

    for (const u of this.units) {
      if (!u.alive) continue;
      if (u.team === -1) u.damage(55, u.x - 10, this);
      else u.hp = Math.min(u.maxHp, u.hp + 35);
    }
    for (const p of this.plots) {
      if (!p.bloomed) p.progress = Math.min(1, p.progress + 0.28);
    }
    this.fx.text(this.camX + W / 2, 180, "RESONANCE!", "#ff9ad4");
    for (let i = 0; i < 8; i++) {
      this.fx.burst(this.camX + 100 + i * 140, GROUND - 80, "#ffb0e0", 14, 240, 0.5);
    }
    this.score += 100;
    this.syncHud();
    return true;
  }

  spawnEnemy(asCourier = false) {
    const pool = this.catalog.enemies?.length
      ? this.catalog.enemies
      : this.catalog.characters;
    let pick;
    if (asCourier) {
      pick = pool.find((e) => e.id === 101) || pool[pool.length - 1];
    } else {
      const sorted = [...pool].sort((a, b) => a.stats.cost - b.stats.cost);
      const maxCost = 70 + this.time * 1.5;
      const affordable = sorted.filter((c) => c.stats.cost <= maxCost);
      pick = (affordable.length ? affordable : sorted)[(Math.random() * (affordable.length || sorted.length)) | 0];
    }

    const def = {
      ...pick,
      stats: {
        ...pick.stats,
        hp: Math.floor(pick.stats.hp * (0.95 + this.bloomedCount * 0.05) * (asCourier ? 1.4 : 1)),
        atk: Math.floor(pick.stats.atk * (1 + this.time * 0.004)),
        speed: pick.stats.speed * (asCourier ? 1.25 : 1),
      },
      images: pick.images,
      poses: pick.poses,
      artFacing: 1,
    };
    const lane = GROUND - 8 - ((Math.random() * 18) | 0);
    const unit = new Unit(def, this.enemyCastle.x - 70, lane, -1, lane, {
      courier: asCourier,
      scale: asCourier ? 0.32 : 0.28,
    });
    this.units.push(unit);
    if (asCourier) {
      this.fx.text(unit.x, GROUND - 140, "水晶輸送！", "#e8b0ff");
      this.audio.tone(220, 0.15, "sawtooth", 0.04, 180);
    }
    this.fx.ring(unit.x, GROUND - 40, pick.color || "#a080ff", 8, 200);
  }

  onCrystalDelivered(_unit) {
    this.fx.burst(this.allyCastle.x + 40, GROUND - 60, "#c09ad8", 24, 280);
    this.fx.text(this.allyCastle.x + 100, GROUND - 140, "水晶奪われた…", "#ff8fab");
    this.hitAllyCastle(90);
    this.enemyCastle.hp = Math.min(this.enemyCastle.maxHp, this.enemyCastle.hp + 120);
    this.shake = 10;
    this.audio.hurt();
  }

  plotAt(x) {
    return this.plots.find((p) => Math.abs(p.x - x) < p.w / 2) || null;
  }

  tendPlot(x, dt) {
    const p = this.plotAt(x);
    if (!p || p.bloomed) return;
    const nearby = this.units.filter(
      (u) => u.alive && u.team === 1 && Math.abs(u.x - p.x) < p.w
    );
    const unique = new Set(nearby.map((u) => u.def.id)).size;
    const rate = 0.08 + unique * 0.05 + (this.links.length > 0 ? 0.03 : 0);
    p.progress = Math.min(1, p.progress + rate * dt);
    if (p.progress >= 1) {
      p.bloomed = true;
      this.addNectar(12);
      this.addMoney(40);
      this.score += 150;
      this.fx.fountain(p.x, GROUND - 20, "#ffd6ef", 20);
      this.fx.text(p.x, GROUND - 130, "花畑・開花!", "#ffe08a");
      this.audio.win();
      // Alternate win: reclaim all garden plots
      if (this.bloomedCount >= this.plots.length && !this.ended) {
        this.end(true, "花畑制圧 — 花園を取り戻した！");
      }
    }
  }

  _announceSeason() {
    const s = this.season;
    emitSeasonBanner({ name: s.name, desc: s.desc, color: s.color });
    this.fx.text(this.camX + W * 0.5, 160, s.name, s.color);
  }

  updateLinks(dt) {
    this.links = [];
    const allies = this.units.filter((u) => u.alive && u.team === 1);
    for (const u of allies) u.linked = false;

    for (let i = 0; i < allies.length; i++) {
      for (let j = i + 1; j < allies.length; j++) {
        const a = allies[i];
        const b = allies[j];
        if (a.def.id === b.def.id) continue;
        const dist = Math.abs(a.x - b.x);
        if (dist > LINK_RANGE || dist < 40) continue;
        a.linked = true;
        b.linked = true;
        this.links.push({
          a,
          b,
          power: 1 + (a.atkMul + b.atkMul) * 0.2 + ((a.stats.linkBonus || 0) + (b.stats.linkBonus || 0)) * 0.15,
        });
      }
    }

    for (const link of this.links) {
      const x0 = Math.min(link.a.x, link.b.x);
      const x1 = Math.max(link.a.x, link.b.x);
      for (const e of this.units) {
        if (!e.alive || e.team !== -1) continue;
        if (e.x >= x0 - 10 && e.x <= x1 + 10) {
          if (Math.random() < dt * 3.5) {
            e.damage(Math.floor(LINK_DAMAGE * link.power * (this.burstFlash > 0 ? 2 : 1)), (x0 + x1) / 2, this);
            this.addNectar(0.2);
          }
        }
      }
      this.addNectar(dt * 0.1 * Math.max(1, this.links.length));
    }
  }

  applySeasonBuffs() {
    const bless = this.season.bless;
    for (const u of this.units) {
      if (!u.alive) continue;
      if (u.team !== 1) {
        u.atkMul = 1;
        u.spdMul = 1;
        continue;
      }
      const blessed = u.element === bless;
      let atk = 1;
      let spd = 1;
      if (blessed) { atk = 1.45; spd = 1.25; }
      if (u.linked) atk = Math.max(atk, 1.2);
      if (this.burstBuff > 0) { atk *= 1.35; spd *= 1.15; }
      u.atkMul = atk;
      u.spdMul = spd;
    }
  }

  hitEnemyCastle(dmg) {
    this.enemyCastle.hp = Math.max(0, this.enemyCastle.hp - dmg);
    this.fx.burst(this.enemyCastle.x - 20, GROUND - 80, "#ff8fab", 10, 180);
    this.shake = Math.max(this.shake, 5);
    this.score += dmg;
    this.addNectar(0.5);
    if (this.enemyCastle.hp <= 0 && !this.ended) this.end(true, "腐海の巣を浄化！");
  }

  hitAllyCastle(dmg) {
    this.allyCastle.hp = Math.max(0, this.allyCastle.hp - dmg);
    this.fx.burst(this.allyCastle.x + 20, GROUND - 80, "#ffd56a", 10, 180);
    this.shake = Math.max(this.shake, 6);
    this.audio.hurt();
    if (this.allyCastle.hp <= 0 && !this.ended) this.end(false, "花園拠点が落ちた…");
  }

  end(won, reason = "") {
    this.ended = true;
    this.state = "result";
    this.shake = 0;
    this.winReason = reason;
    if (won) {
      this.audio.win();
      this.score += 400 + this.bloomedCount * 120 + this.walletLevel * 80;
    } else {
      this.audio.lose();
    }
    emitGameResult({
      won,
      score: this.score,
      bloomed: this.bloomedCount,
      reason: reason || (won ? "勝利" : "敗北"),
    });
  }

  update(dt) {
    if (this.state !== "play") return;

    this.time += dt;
    this.shake = Math.max(0, this.shake - dt * 24);
    this.burstFlash = Math.max(0, this.burstFlash - dt);
    this.burstBuff = Math.max(0, this.burstBuff - dt);

    this.addMoney((this.walletRate + this.bloomedCount * 10) * dt);

    for (const id of Object.keys(this.recharge)) {
      if (this.recharge[id] > 0) this.recharge[id] = Math.max(0, this.recharge[id] - dt);
    }

    this.seasonTimer -= dt;
    if (this.seasonTimer <= 0) {
      this.seasonIndex += 1;
      this.seasonTimer = SEASON_LEN;
      this._announceSeason();
    }

    this.updateLinks(dt);
    this.applySeasonBuffs();

    this.enemySpawnTimer -= dt;
    this.enemyBudget += (16 + this.time * 0.35 + this.bloomedCount * 2) * dt;
    if (this.enemySpawnTimer <= 0) {
      const enemyCount = this.units.filter((u) => u.alive && u.team === -1 && !u.courier).length;
      if (enemyCount < 7 && this.enemyBudget > 55) {
        this.spawnEnemy(false);
        this.enemyBudget -= 65;
      }
      this.enemySpawnTimer = Math.max(0.85, 2.2 - this.time * 0.015);
    }

    this.courierTimer -= dt;
    if (this.courierTimer <= 0) {
      const livingCouriers = this.units.filter((u) => u.alive && u.courier).length;
      if (livingCouriers < 1) this.spawnEnemy(true);
      this.courierTimer = Math.max(8, 16 - this.time * 0.05);
    }

    for (const u of this.units) u.update(dt, this);
    this.units = this.units.filter((u) => u.alive || u.deadTimer > 0);

    this.fx.update(dt);

    for (const p of this.plots) p.pulse += dt * 2.5;

    const allies = this.units.filter((u) => u.alive && u.team === 1);
    const focusX = allies.length
      ? allies.reduce((s, u) => s + u.x, 0) / allies.length
      : this.allyCastle.x + 200;
    const targetCam = Math.max(0, Math.min(this.fieldWidth - W, focusX - W * 0.35));
    this.camX += (targetCam - this.camX) * Math.min(1, dt * 2.2);

    this.syncHud();
  }

  /** Emit HUD snapshot only — DOM updates live in ui/hud.js */
  syncHud() {
    if (this.state !== "play") return;
    emitGameHud({
      money: this.money,
      moneyCap: this.walletCap,
      nectar: this.nectar,
      allyHp: this.allyCastle.hp,
      allyMax: this.allyCastle.maxHp,
      enemyHp: this.enemyCastle.hp,
      enemyMax: this.enemyCastle.maxHp,
      bloomed: this.bloomedCount,
      plots: this.plots.length,
      seasonName: this.season.name,
      links: this.links.length,
      walletCost: this.nextWalletCost,
      burstCost: BURST_COST,
      bless: this.season.bless,
      recharge: { ...this.recharge },
      can: Object.fromEntries(this.catalog.characters.map((c) => [c.id, this.canDeploy(c.id)])),
      costs: Object.fromEntries(this.catalog.characters.map((c) => [c.id, this.battleDefFor(c.id)?.stats.cost])),
    });
  }

  draw() {
    drawGame(this);
  }
}
