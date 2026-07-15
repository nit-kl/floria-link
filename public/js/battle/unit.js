/** Combat actor for Resonance Garden */
export class Unit {
  constructor(def, x, y, team, laneY, opts = {}) {
    this.def = def;
    this.stats = { ...def.stats };
    this.x = x;
    this.y = y;
    this.team = team;
    this.laneY = laneY;
    this.facing = team;
    this.alive = true;
    this.hp = this.stats.hp;
    this.maxHp = this.stats.hp;
    this.kbLeft = this.stats.kb;
    this.pose = "run";
    this.attackTimer = 0;
    this.attackCd = 0.8 + Math.random() * 0.2;
    this.hurtTimer = 0;
    this.hitFlash = 0;
    this.bob = Math.random() * Math.PI * 2;
    this.scale = opts.scale ?? (team === 1 ? 0.30 : 0.28);
    this.target = null;
    this.blocked = false;
    this.deadTimer = 0;
    this.linked = false;
    this.poison = 0;
    this.courier = !!opts.courier;
    this.element = this.stats.element || "neutral";
    this.atkMul = 1;
    this.spdMul = 1;
  }

  getPoseMeta() {
    return this.def.poses?.[this.pose] || this.def.poses?.idle || {};
  }

  get desiredFacing() {
    return this.team;
  }

  get nativeFacing() {
    return this.getPoseMeta().nativeFacing ?? this.def.artFacing ?? -1;
  }

  get anchorX() {
    return this.getPoseMeta().anchorX ?? 0.5;
  }

  get w() {
    return (this.sprite?.width || 200) * this.scale;
  }

  get h() {
    return (this.sprite?.height || 300) * this.scale;
  }

  get sprite() {
    return this.def.images[this.pose] || this.def.images.idle;
  }

  get range() {
    return this.stats.range;
  }

  damage(amount, fromX, world) {
    if (!this.alive) return false;
    this.hp -= amount;
    this.hitFlash = 0.12;
    this.hurtTimer = 0.28;
    this.pose = "hurt";
    world.fx.burst(this.x, this.laneY - this.h * 0.45, this.def.accent, 8, 160, 0.35);
    world.audio.hit();

    this.kbLeft -= 1;
    if (this.kbLeft <= 0 || this.hp <= 0) {
      const dir = Math.sign(this.x - fromX) || -this.team;
      this.x += dir * 30;
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this.pose = "hurt";
      this.deadTimer = 0.4;
      world.fx.burst(this.x, this.laneY - this.h * 0.4, this.def.color, 20, 260, 0.55);
      world.fx.ring(this.x, this.laneY - this.h * 0.35, this.def.accent, 8, 280);
      if (this.team === -1) {
        world.addMoney(Math.floor(this.stats.cost * 0.4));
        world.addNectar(this.courier ? 18 : 4);
        if (this.courier) {
          world.fx.text(this.x, this.laneY - this.h - 20, "花蜜ゲット!", "#ff9ad4");
          world.score += 80;
        }
      }
      return true;
    }
    return true;
  }

  findTarget(units, enemyCastleX, allyCastleX) {
    if (this.courier) {
      this.target = null;
      this.blocked = false;
      this.castleInRange = false;
      return null;
    }
    const foes = units.filter((u) => u.alive && u.team !== this.team && !u.courier);
    let best = null;
    let bestDist = Infinity;
    for (const f of foes) {
      const dist = (f.x - this.x) * this.team;
      if (dist < -20) continue;
      if (dist < bestDist) {
        bestDist = dist;
        best = f;
      }
    }
    if (this.team === 1) {
      const couriers = units.filter((u) => u.alive && u.team === -1 && u.courier);
      for (const c of couriers) {
        const dist = Math.abs(c.x - this.x);
        if (dist < bestDist + 40) {
          best = c;
          bestDist = (c.x - this.x) * this.team;
        }
      }
    }
    this.target = best;
    const castleX = this.team === 1 ? enemyCastleX : allyCastleX;
    const castleDist = (castleX - this.x) * this.team;
    this.castleInRange = castleDist > 0 && castleDist <= this.range + 40;
    this.blocked = !!(best && bestDist <= this.range);
    return best;
  }

  update(dt, world) {
    if (!this.alive) {
      this.deadTimer -= dt;
      return;
    }

    this.bob += dt * 5;
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.hurtTimer = Math.max(0, this.hurtTimer - dt);
    this.attackTimer = Math.max(0, this.attackTimer - dt);

    if (this.poison > 0) {
      this.poison -= dt;
      this.hp -= 6 * dt;
      if (this.hp <= 0) {
        this.hp = 0.01;
        this.damage(999, this.x, world);
        return;
      }
    }

    const speed = this.stats.speed * this.spdMul;
    this.findTarget(world.units, world.enemyCastle.x, world.allyCastle.x);

    if (this.hurtTimer > 0 && !this.courier) {
      this.pose = "hurt";
      return;
    }

    if (this.courier) {
      this.pose = "carry";
      this.x += this.team * speed * 1.15 * dt;
      if (this.x <= world.allyCastle.x + 50) {
        world.onCrystalDelivered(this);
        this.alive = false;
        this.deadTimer = 0;
      }
      return;
    }

    const canHitUnit = this.target && ((this.target.x - this.x) * this.team) <= this.range + (this.target.courier ? 30 : 0);
    const canHitCastle = this.castleInRange && !canHitUnit;

    if (canHitUnit || canHitCastle) {
      this.pose = this.stats.role === "heavy" && Math.sin(this.bob) > 0.5 ? "carry" : "attack";
      if (this.attackTimer <= 0) {
        this.attackTimer = this.attackCd / Math.max(0.7, this.atkMul * 0.5 + 0.5);
        this.doAttack(world, canHitUnit ? this.target : null);
      }
    } else {
      this.pose = "run";
      let spd = speed;
      if (this.team === -1) {
        const plot = world.plotAt(this.x);
        if (plot?.bloomed) spd *= 0.55;
      }
      this.x += this.team * spd * dt;
    }

    this.x = Math.max(world.allyCastle.x + 30, Math.min(world.enemyCastle.x - 30, this.x));

    if (this.team === 1) world.tendPlot(this.x, dt);
  }

  doAttack(world, target) {
    world.audio.attack();
    world.fx.ring(this.x + this.team * 30, this.laneY - this.h * 0.4, this.def.accent, 6, 180);
    world.shake = Math.max(world.shake, 3);
    const dmg = Math.floor(this.stats.atk * this.atkMul);

    if (target) {
      if (this.stats.role === "support" && Math.random() < 0.4) {
        const allies = world.units.filter((u) => u.alive && u.team === this.team && u !== this);
        if (allies.length) {
          allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
          const a = allies[0];
          const heal = 22;
          a.hp = Math.min(a.maxHp, a.hp + heal);
          world.fx.text(a.x, a.laneY - a.h - 8, `+${heal}`, "#9dffb0");
          world.addNectar(1);
          return;
        }
      }
      target.damage(dmg, this.x, world);
      if (this.stats.role === "spore") {
        target.poison = Math.max(target.poison, 2.4);
        world.fx.fountain(target.x, target.laneY - 40, "#a8ff7a", 8);
      }
      if (this.stats.role === "ranged") {
        world.fx.trail(this.x + this.team * 40, this.laneY - this.h * 0.5, this.def.accent);
      }
      return;
    }

    if (this.team === 1) world.hitEnemyCastle(dmg);
    else world.hitAllyCastle(dmg);
  }

  draw(ctx, camX) {
    if (!this.alive && this.deadTimer <= 0) return;
    const img = this.sprite;
    if (!img) return;

    const bob = this.pose === "run" ? Math.sin(this.bob) * 2.5 : Math.sin(this.bob * 0.6) * 1.2;
    const alpha = !this.alive ? Math.max(0, this.deadTimer / 0.4) : 1;
    const scaleX = this.desiredFacing * this.nativeFacing;
    const ax = this.anchorX * this.w;

    if (this.linked && this.alive) {
      ctx.save();
      ctx.globalAlpha = 0.35 + Math.sin(this.bob) * 0.1;
      ctx.fillStyle = this.def.accent;
      ctx.beginPath();
      ctx.arc(this.x - camX, this.laneY - this.h * 0.45, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.x - camX, this.laneY + bob);
    ctx.scale(scaleX, 1);
    if (this.hitFlash > 0) ctx.filter = "brightness(2.4) saturate(0.3)";
    if (this.poison > 0) ctx.filter = "hue-rotate(80deg) saturate(1.4)";
    ctx.drawImage(img, -ax, -this.h, this.w, this.h);
    ctx.filter = "none";

    ctx.globalAlpha = 0.22 * alpha;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(0, 0, this.w * 0.22, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (this.courier && this.alive) {
      ctx.save();
      ctx.font = "bold 14px 'Mochiy Pop One', sans-serif";
      ctx.fillStyle = "#e8b0ff";
      ctx.textAlign = "center";
      ctx.fillText("◆水晶", this.x - camX, this.laneY - this.h - 16);
      ctx.restore();
    }

    if (this.alive) {
      const pct = this.hp / this.maxHp;
      const bx = this.x - camX - 22;
      const by = this.laneY - this.h - 10;
      ctx.fillStyle = "rgba(0,0,0,.4)";
      ctx.fillRect(bx, by, 44, 5);
      ctx.fillStyle = this.team === 1 ? "#7dff9a" : "#ff7e9a";
      ctx.fillRect(bx, by, 44 * pct, 5);
      if (this.team === 1 && this.def.careerRank) {
        ctx.font = "bold 11px 'Zen Maru Gothic', sans-serif";
        ctx.fillStyle = "#ffe08a";
        ctx.textAlign = "center";
        ctx.fillText(this.def.careerRank, this.x - camX, by - 4);
      }
    }
  }
}
