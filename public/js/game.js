import { Unit, SEASONS } from "./entities.js";
import { FX } from "./fx.js";
import { getCareer, growthToBattleMods } from "./training.js";

const W = 1280;
const H = 720;
const GROUND = 560;

const GREENHOUSE_CAPS = [350, 520, 780, 1100, 1500];
const GREENHOUSE_COSTS = [120, 220, 360, 520];
const GREENHOUSE_RATES = [22, 34, 48, 64, 84];
const BURST_COST = 40;
const LINK_RANGE = 220;
const SEASON_LEN = 22;

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
    // 5 garden plots between bases
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
    this.syncHud();
  }

  addMoney(n) {
    this.money = Math.min(this.walletCap, this.money + n);
  }

  addNectar(n) {
    this.nectar = Math.min(120, this.nectar + n);
  }

  /** Apply開花育成 to a character's battle stats snapshot */
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

    // empower links: damage all enemies near any link beam, heal allies
    for (const u of this.units) {
      if (!u.alive) continue;
      if (u.team === -1) {
        u.damage(55, u.x - 10, this);
      } else {
        u.hp = Math.min(u.maxHp, u.hp + 35);
      }
    }
    // instant bloom nudge on all plots
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
      // prefer seed enemy for courier
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

  onCrystalDelivered(unit) {
    this.fx.burst(this.allyCastle.x + 40, GROUND - 60, "#c09ad8", 24, 280);
    this.fx.text(this.allyCastle.x + 100, GROUND - 140, "水晶奪われた…", "#ff8fab");
    this.hitAllyCastle(90);
    // heal enemy nest
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
    // more unique elements nearby = faster bloom
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
    }
  }

  _announceSeason() {
    const s = this.season;
    const el = document.getElementById("season-banner");
    if (el) {
      el.textContent = `${s.name} — ${s.desc}`;
      el.style.color = s.color;
      el.classList.add("show");
      clearTimeout(this._seasonHide);
      this._seasonHide = setTimeout(() => el.classList.remove("show"), 2800);
    }
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
        if (a.def.id === b.def.id) continue; // must be different spirits
        const dist = Math.abs(a.x - b.x);
        if (dist > LINK_RANGE || dist < 40) continue;
        a.linked = true;
        b.linked = true;
        this.links.push({
          a, b,
          power: 1 + (a.atkMul + b.atkMul) * 0.2 + ((a.stats.linkBonus || 0) + (b.stats.linkBonus || 0)) * 0.15,
        });
      }
    }

    // beam damage + nectar drip
    for (const link of this.links) {
      const x0 = Math.min(link.a.x, link.b.x);
      const x1 = Math.max(link.a.x, link.b.x);
      const y = GROUND - 70;
      for (const e of this.units) {
        if (!e.alive || e.team !== -1) continue;
        if (e.x >= x0 - 10 && e.x <= x1 + 10) {
          // tick damage
          if (Math.random() < dt * 3.5) {
            e.damage(Math.floor(6 * link.power * (this.burstFlash > 0 ? 2 : 1)), (x0 + x1) / 2, this);
            this.addNectar(0.15);
          }
        }
      }
      // linked units get slight buff via applySeasonBuffs
      this.addNectar(dt * 0.08 * Math.max(1, this.links.length));
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
    window.dispatchEvent(new CustomEvent("game:result", {
      detail: {
        won,
        score: this.score,
        bloomed: this.bloomedCount,
        reason: reason || (won ? "勝利" : "敗北"),
      },
    }));
  }

  update(dt) {
    if (this.state !== "play") return;

    this.time += dt;
    this.shake = Math.max(0, this.shake - dt * 24);
    this.burstFlash = Math.max(0, this.burstFlash - dt);
    this.burstBuff = Math.max(0, this.burstBuff - dt);

    // income from greenhouse + bloomed plots
    this.addMoney((this.walletRate + this.bloomedCount * 10) * dt);

    for (const id of Object.keys(this.recharge)) {
      if (this.recharge[id] > 0) this.recharge[id] = Math.max(0, this.recharge[id] - dt);
    }

    // seasons
    this.seasonTimer -= dt;
    if (this.seasonTimer <= 0) {
      this.seasonIndex += 1;
      this.seasonTimer = SEASON_LEN;
      this._announceSeason();
    }

    // links first so combat this frame gets buffs
    this.updateLinks(dt);
    this.applySeasonBuffs();

    // enemy spawns
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

    // crystal couriers
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

  syncHud() {
    if (this.state !== "play") return;
    const money = document.getElementById("money");
    const nectar = document.getElementById("nectar");
    const ally = document.getElementById("ally-hp");
    const enemy = document.getElementById("enemy-hp");
    const stage = document.getElementById("stage-label");
    const walletCost = document.getElementById("wallet-cost");
    const btnWallet = document.getElementById("btn-wallet");
    const btnBurst = document.getElementById("btn-burst");

    if (money) money.textContent = `蜜 ${Math.floor(this.money)}/${this.walletCap}`;
    if (nectar) nectar.textContent = `${Math.floor(this.nectar)}`;
    if (ally) ally.style.width = `${(100 * this.allyCastle.hp) / this.allyCastle.maxHp}%`;
    if (enemy) enemy.style.width = `${(100 * this.enemyCastle.hp) / this.enemyCastle.maxHp}%`;
    if (stage) {
      stage.textContent = `花畑 ${this.bloomedCount}/${this.plots.length} · ${this.season.name}`;
    }
    if (walletCost && btnWallet) {
      const cost = this.nextWalletCost;
      if (cost == null) {
        walletCost.textContent = "MAX";
        btnWallet.disabled = true;
      } else {
        walletCost.textContent = `蜜${cost}`;
        btnWallet.disabled = this.money < cost;
      }
    }
    if (btnBurst) {
      btnBurst.disabled = this.nectar < BURST_COST;
      const costEl = document.getElementById("burst-cost");
      if (costEl) costEl.textContent = `花蜜${BURST_COST}`;
    }

    window.dispatchEvent(new CustomEvent("game:hud", {
      detail: {
        money: this.money,
        nectar: this.nectar,
        bless: this.season.bless,
        recharge: { ...this.recharge },
        can: Object.fromEntries(this.catalog.characters.map((c) => [c.id, this.canDeploy(c.id)])),
        costs: Object.fromEntries(this.catalog.characters.map((c) => [c.id, this.battleDefFor(c.id)?.stats.cost])),
      },
    }));
  }

  drawBackground() {
    const ctx = this.ctx;
    const cam = this.camX;
    const seasonColor = this.season.color;
    const assets = this.catalog.visualAssets || {};

    // 1. Sky background
    if (assets.battleSky) {
      ctx.drawImage(assets.battleSky, 0, 0, W, H);
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#2d1f55");
      g.addColorStop(0.45, "#5a7ea0");
      g.addColorStop(0.75, "#9ec99a");
      g.addColorStop(1, "#7aaf6a");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    // season tint
    ctx.fillStyle = seasonColor;
    ctx.globalAlpha = 0.08 + (this.burstFlash > 0 ? 0.1 : 0);
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;

    const sg = ctx.createRadialGradient(1000 - cam * 0.04, 100, 8, 1000 - cam * 0.04, 100, 170);
    sg.addColorStop(0, "rgba(255,230,150,.5)");
    sg.addColorStop(1, "transparent");
    ctx.fillStyle = sg;
    ctx.fillRect(0, 0, W, H);

    for (const c of this.clouds) {
      const x = ((c.x - cam * 0.12 * c.s) % (W + 220) + W + 220) % (W + 220) - 110;
      ctx.globalAlpha = 0.32;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.ellipse(x, c.y, 58 * c.s, 20 * c.s, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 36 * c.s, c.y + 5, 40 * c.s, 16 * c.s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      c.x += c.v * 0.016;
    }

    // 2. Parallax scrolling hills
    if (assets.battleBackHills) {
      const x = -((cam * 0.22) % W);
      ctx.drawImage(assets.battleBackHills, x, 0, W, H);
      if (x < 0) ctx.drawImage(assets.battleBackHills, x + W, 0, W, H);
    } else {
      this._hill(-cam * 0.22, 420, "#5f8f6a");
    }

    if (assets.battleForeHills) {
      const x = -((cam * 0.38) % W);
      ctx.drawImage(assets.battleForeHills, x, 0, W, H);
      if (x < 0) ctx.drawImage(assets.battleForeHills, x + W, 0, W, H);
    } else {
      this._hill(-cam * 0.38, 460, "#457556");
    }

    for (const f of this.flowers) {
      if (f.layer !== 0) continue;
      const x = f.x - cam * 0.3;
      if (x < -20 || x > W + 20) continue;
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = f.c;
      ctx.beginPath();
      ctx.ellipse(x, f.y + Math.sin(this.time * 1.4 + f.phase) * 8, f.r, f.r * 0.55, this.time + f.phase, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = "#2f5a3a";
    ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.fillStyle = "#4c8a55";
    ctx.fillRect(0, GROUND, W, 16);
    ctx.fillStyle = "rgba(255,255,255,.08)";
    ctx.fillRect(0, GROUND - 6, W, 6);
  }

  _hill(offset, base, color) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 24) {
      const y = base + Math.sin((x + offset) * 0.007) * 36 + Math.sin((x + offset) * 0.018) * 14;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
  }

  drawPlots() {
    const ctx = this.ctx;
    for (const p of this.plots) {
      const x = p.x - this.camX;
      if (x < -100 || x > W + 100) continue;
      const glow = 0.25 + Math.sin(p.pulse) * 0.1;

      ctx.save();
      // bed
      ctx.fillStyle = p.bloomed ? `rgba(255, 180, 220, ${0.25 + glow})` : "rgba(80, 60, 40, 0.45)";
      ctx.beginPath();
      ctx.ellipse(x, GROUND - 4, p.w * 0.45, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      if (!p.bloomed) {
        ctx.strokeStyle = "rgba(255,255,255,.35)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, GROUND - 40, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p.progress);
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,.7)";
        ctx.font = "12px 'Zen Maru Gothic', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`${Math.floor(p.progress * 100)}%`, x, GROUND - 36);
      } else {
        // blooming flowers
        for (let i = 0; i < 5; i++) {
          const ang = p.pulse + i * 1.2;
          const fx = x + Math.cos(ang) * 28;
          const fy = GROUND - 28 - Math.sin(p.pulse + i) * 6;
          ctx.fillStyle = ["#ff8fab", "#ffd56a", "#d4a5ff", "#9ad8ff", "#c3f584"][i];
          ctx.beginPath();
          ctx.ellipse(fx, fy, 7, 4, ang, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = "#fff8";
        ctx.beginPath();
        ctx.arc(x, GROUND - 30, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  drawLinks() {
    const ctx = this.ctx;
    for (const link of this.links) {
      const ax = link.a.x - this.camX;
      const bx = link.b.x - this.camX;
      const ay = link.a.laneY - link.a.h * 0.5;
      const by = link.b.laneY - link.b.h * 0.5;
      const pulse = 0.45 + Math.sin(this.time * 6) * 0.2;

      ctx.save();
      ctx.strokeStyle = this.burstFlash > 0 ? "#fff" : "#ffb0e0";
      ctx.globalAlpha = pulse + (this.burstFlash > 0 ? 0.4 : 0);
      ctx.lineWidth = 3 + link.power;
      ctx.shadowColor = "#ff7eb6";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.quadraticCurveTo((ax + bx) / 2, Math.min(ay, by) - 40, bx, by);
      ctx.stroke();

      // traveling spark
      const t = (this.time * 1.5) % 1;
      const sx = ax + (bx - ax) * t;
      const sy = ay + (by - ay) * t - Math.sin(t * Math.PI) * 40;
      ctx.fillStyle = "#fff";
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(sx, sy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawCastle(castle, team) {
    const ctx = this.ctx;
    const x = castle.x - this.camX;
    const assets = this.catalog.visualAssets || {};
    const img = team === 1 ? assets.castleAlly : assets.castleEnemy;

    if (img) {
      ctx.save();
      ctx.translate(x, GROUND);
      if (team === 1) {
        // Ally castle
        const w = 180;
        const h = 180;
        ctx.drawImage(img, -w * 0.5, -h, w, h);
      } else {
        // Enemy castle
        const h = 220;
        const w = h * (img.width / img.height);
        ctx.drawImage(img, -w * 0.5, -h, w, h);
      }
      ctx.restore();
    } else {
      ctx.save();
      ctx.translate(x, GROUND);
      const color = team === 1 ? "#7ec8ff" : "#b080d0";
      const dark = team === 1 ? "#3a6fa0" : "#604070";
      ctx.fillStyle = dark;
      ctx.fillRect(-55, -150, 110, 150);
      ctx.fillStyle = color;
      ctx.fillRect(-48, -142, 96, 134);
      ctx.fillStyle = dark;
      for (let i = -50; i <= 40; i += 22) ctx.fillRect(i, -168, 14, 22);
      ctx.fillStyle = "rgba(0,0,0,.35)";
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(-18, -48);
      ctx.quadraticCurveTo(0, -68, 18, -48);
      ctx.lineTo(18, 0);
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -168);
      ctx.lineTo(0, -210);
      ctx.stroke();
      ctx.fillStyle = team === 1 ? "#9ad8ff" : "#c09ad8";
      ctx.beginPath();
      ctx.moveTo(0, -210);
      ctx.lineTo(36, -198);
      ctx.lineTo(0, -186);
      ctx.fill();
      ctx.restore();
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.save();
    if (this.shake > 0 && this.state === "play" && !this.ended) {
      ctx.translate((Math.random() - 0.5) * this.shake * 2, (Math.random() - 0.5) * this.shake * 2);
    }

    this.drawBackground();
    this.drawPlots();
    this.drawCastle(this.allyCastle, 1);
    this.drawCastle(this.enemyCastle, -1);
    this.drawLinks();

    if (this.state === "play" || this.state === "result") {
      const sorted = [...this.units].sort((a, b) => a.laneY - b.laneY || a.x - b.x);
      for (const u of sorted) u.draw(ctx, this.camX);
      this.fx.draw(ctx, this.camX);
    } else {
      this._drawParade(ctx);
    }

    if (this.burstFlash > 0) {
      ctx.fillStyle = `rgba(255,180,220,${this.burstFlash * 0.25})`;
      ctx.fillRect(0, 0, W, H);
    }

    const vg = ctx.createRadialGradient(W / 2, H / 2, 240, W / 2, H / 2, 540);
    vg.addColorStop(0, "transparent");
    vg.addColorStop(1, "rgba(10,6,24,.3)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  _drawParade(ctx) {
    const chars = this.catalog.characters;
    const poses = ["idle", "run", "attack", "carry", "hurt"];
    // draw links between parade chars for title flair
    chars.forEach((ch, i) => {
      if (i >= chars.length - 1) return;
      const x0 = 160 + i * 170;
      const x1 = 160 + (i + 1) * 170;
      ctx.save();
      ctx.strokeStyle = "rgba(255,176,224,.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x0, GROUND - 90);
      ctx.quadraticCurveTo((x0 + x1) / 2, GROUND - 140, x1, GROUND - 90);
      ctx.stroke();
      ctx.restore();
    });
    chars.forEach((ch, i) => {
      const poseName = poses[Math.floor(this.time * 1.5 + i) % poses.length];
      const img = ch.images?.[poseName] || ch.images?.idle;
      if (!img) return;
      const meta = ch.poses?.[poseName] || {};
      const native = meta.nativeFacing ?? ch.artFacing ?? -1;
      const anchor = meta.anchorX ?? 0.5;
      const x = 160 + i * 170;
      const y = GROUND + Math.sin(this.time * 2.2 + i) * 10;
      const scale = 0.32;
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1 * native, 1);
      ctx.drawImage(img, -anchor * w, -h, w, h);
      ctx.restore();
    });
    // enemy parade peek
    const enemies = this.catalog.enemies || [];
    enemies.forEach((en, i) => {
      const img = en.images?.run || en.images?.idle;
      if (!img) return;
      const x = 980 + i * 140;
      const y = GROUND;
      const scale = 0.28;
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(-1, 1); // face left toward heroes
      ctx.drawImage(img, -w * 0.5, -h, w, h);
      ctx.restore();
    });
  }
}
