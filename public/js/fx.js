/** Particles, float text, afterimages */
export class FX {
  constructor() {
    this.particles = [];
    this.texts = [];
    this.rings = [];
    this.afterimages = [];
  }

  burst(x, y, color, n = 16, speed = 220, life = 0.55) {
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.4;
      const s = speed * (0.4 + Math.random() * 0.8);
      this.particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 40,
        life, max: life,
        size: 3 + Math.random() * 6,
        color,
        kind: Math.random() > 0.5 ? "petal" : "spark",
        rot: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 10,
      });
    }
  }

  fountain(x, y, color, n = 10) {
    for (let i = 0; i < n; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y,
        vx: (Math.random() - 0.5) * 120,
        vy: -180 - Math.random() * 220,
        life: 0.6 + Math.random() * 0.4,
        max: 1,
        size: 4 + Math.random() * 5,
        color,
        kind: "petal",
        rot: Math.random() * 6,
        spin: (Math.random() - 0.5) * 8,
      });
    }
  }

  trail(x, y, color) {
    this.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 40,
      vy: (Math.random() - 0.5) * 40,
      life: 0.25,
      max: 0.25,
      size: 8 + Math.random() * 10,
      color,
      kind: "spark",
      rot: 0,
      spin: 0,
    });
  }

  ring(x, y, color, r = 20, grow = 280) {
    this.rings.push({ x, y, r, grow, life: 0.35, max: 0.35, color });
  }

  text(x, y, str, color = "#fff") {
    this.texts.push({ x, y, str, color, life: 0.8, max: 0.8, vy: -70 });
  }

  afterimage(img, x, y, w, h, facing, alpha = 0.45) {
    this.afterimages.push({ img, x, y, w, h, facing, life: 0.22, max: 0.22, alpha });
  }

  update(dt) {
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 420 * dt;
      p.rot += p.spin * dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);

    for (const t of this.texts) {
      t.life -= dt;
      t.y += t.vy * dt;
    }
    this.texts = this.texts.filter((t) => t.life > 0);

    for (const r of this.rings) {
      r.life -= dt;
      r.r += r.grow * dt;
    }
    this.rings = this.rings.filter((r) => r.life > 0);

    for (const a of this.afterimages) a.life -= dt;
    this.afterimages = this.afterimages.filter((a) => a.life > 0);
  }

  draw(ctx, camX) {
    for (const a of this.afterimages) {
      const t = a.life / a.max;
      ctx.save();
      ctx.globalAlpha = a.alpha * t;
      ctx.translate(a.x - camX, a.y);
      ctx.scale(a.facing, 1);
      if (a.img) ctx.drawImage(a.img, -a.w / 2, -a.h, a.w, a.h);
      ctx.restore();
    }

    for (const r of this.rings) {
      const t = r.life / r.max;
      ctx.save();
      ctx.globalAlpha = t;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 4 * t;
      ctx.beginPath();
      ctx.arc(r.x - camX, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    for (const p of this.particles) {
      const t = p.life / p.max;
      ctx.save();
      ctx.translate(p.x - camX, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, t);
      ctx.fillStyle = p.color;
      if (p.kind === "petal") {
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      }
      ctx.restore();
    }

    for (const t of this.texts) {
      const a = t.life / t.max;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.font = "bold 22px 'Mochiy Pop One', sans-serif";
      ctx.fillStyle = t.color;
      ctx.strokeStyle = "rgba(0,0,0,.55)";
      ctx.lineWidth = 4;
      ctx.textAlign = "center";
      ctx.strokeText(t.str, t.x - camX, t.y);
      ctx.fillText(t.str, t.x - camX, t.y);
      ctx.restore();
    }
  }
}
