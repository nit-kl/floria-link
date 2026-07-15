import { GROUND, H, W } from "./constants.js";

export function drawGame(game) {
  const ctx = game.ctx;
  ctx.save();
  if (game.shake > 0 && game.state === "play" && !game.ended) {
    ctx.translate((Math.random() - 0.5) * game.shake * 2, (Math.random() - 0.5) * game.shake * 2);
  }

  drawBackground(game);
  drawLinkZones(game);
  drawPlots(game);
  drawCastle(game, game.allyCastle, 1);
  drawCastle(game, game.enemyCastle, -1);
  drawLinks(game);

  if (game.state === "play" || game.state === "result") {
    const sorted = [...game.units].sort((a, b) => a.laneY - b.laneY || a.x - b.x);
    for (const u of sorted) u.draw(ctx, game.camX);
    game.fx.draw(ctx, game.camX);
  } else {
    drawParade(game, ctx);
  }

  if (game.burstFlash > 0) {
    ctx.fillStyle = `rgba(255,180,220,${game.burstFlash * 0.25})`;
    ctx.fillRect(0, 0, W, H);
  }

  const vg = ctx.createRadialGradient(W / 2, H / 2, 240, W / 2, H / 2, 540);
  vg.addColorStop(0, "transparent");
  vg.addColorStop(1, "rgba(10,6,24,.3)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function drawBackground(game) {
  const ctx = game.ctx;
  const cam = game.camX;
  const seasonColor = game.season.color;
  const assets = game.catalog.visualAssets || {};

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

  ctx.fillStyle = seasonColor;
  ctx.globalAlpha = 0.08 + (game.burstFlash > 0 ? 0.1 : 0);
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;

  const sg = ctx.createRadialGradient(1000 - cam * 0.04, 100, 8, 1000 - cam * 0.04, 100, 170);
  sg.addColorStop(0, "rgba(255,230,150,.5)");
  sg.addColorStop(1, "transparent");
  ctx.fillStyle = sg;
  ctx.fillRect(0, 0, W, H);

  for (const c of game.clouds) {
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

  if (assets.battleBackHills) {
    const x = -((cam * 0.22) % W);
    ctx.drawImage(assets.battleBackHills, x, 0, W, H);
    if (x < 0) ctx.drawImage(assets.battleBackHills, x + W, 0, W, H);
  } else {
    drawHill(ctx, -cam * 0.22, 420, "#5f8f6a");
  }

  if (assets.battleForeHills) {
    const x = -((cam * 0.38) % W);
    ctx.drawImage(assets.battleForeHills, x, 0, W, H);
    if (x < 0) ctx.drawImage(assets.battleForeHills, x + W, 0, W, H);
  } else {
    drawHill(ctx, -cam * 0.38, 460, "#457556");
  }

  for (const f of game.flowers) {
    if (f.layer !== 0) continue;
    const x = f.x - cam * 0.3;
    if (x < -20 || x > W + 20) continue;
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = f.c;
    ctx.beginPath();
    ctx.ellipse(x, f.y + Math.sin(game.time * 1.4 + f.phase) * 8, f.r, f.r * 0.55, game.time + f.phase, 0, Math.PI * 2);
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

function drawHill(ctx, offset, base, color) {
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

function drawLinkZones(game) {
  const ctx = game.ctx;
  for (const z of game.linkZones || []) {
    const x = z.x - game.camX;
    if (x < -120 || x > W + 120) continue;
    ctx.save();
    ctx.fillStyle = "rgba(255, 154, 212, 0.12)";
    ctx.strokeStyle = "rgba(255, 176, 224, 0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, GROUND - 6, z.w * 0.48, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 230, 250, 0.7)";
    ctx.font = "11px 'Zen Maru Gothic', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("リンク帯", x, GROUND - 28);
    ctx.restore();
  }
}

function drawPlots(game) {
  const ctx = game.ctx;
  for (const p of game.plots) {
    const x = p.x - game.camX;
    if (x < -100 || x > W + 100) continue;
    const glow = 0.25 + Math.sin(p.pulse) * 0.1;

    ctx.save();
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

function drawLinks(game) {
  const ctx = game.ctx;
  for (const link of game.links) {
    const ax = link.a.x - game.camX;
    const bx = link.b.x - game.camX;
    const ay = link.a.laneY - link.a.h * 0.5;
    const by = link.b.laneY - link.b.h * 0.5;
    const pulse = 0.5 + Math.sin(game.time * 7) * 0.25;

    ctx.save();
    ctx.strokeStyle = game.burstFlash > 0 ? "#fff" : "#ffb0e0";
    ctx.globalAlpha = pulse + (game.burstFlash > 0 ? 0.45 : 0.1);
    ctx.lineWidth = 4 + link.power * 1.5;
    ctx.shadowColor = "#ff7eb6";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.quadraticCurveTo((ax + bx) / 2, Math.min(ay, by) - 48, bx, by);
    ctx.stroke();

    const t = (game.time * 1.8) % 1;
    const sx = ax + (bx - ax) * t;
    const sy = ay + (by - ay) * t - Math.sin(t * Math.PI) * 48;
    ctx.fillStyle = "#fff";
    ctx.globalAlpha = 0.95;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(sx, sy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawCastle(game, castle, team) {
  const ctx = game.ctx;
  const x = castle.x - game.camX;
  const assets = game.catalog.visualAssets || {};
  const img = team === 1 ? assets.castleAlly : assets.castleEnemy;

  if (img) {
    ctx.save();
    ctx.translate(x, GROUND);
    if (team === 1) {
      const w = 180;
      const h = 180;
      ctx.drawImage(img, -w * 0.5, -h, w, h);
    } else {
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
    ctx.restore();
  }
}

function drawParade(game, ctx) {
  const chars = game.catalog.characters;
  const poses = ["idle", "run", "attack", "carry", "hurt"];
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
    const poseName = poses[Math.floor(game.time * 1.5 + i) % poses.length];
    const img = ch.images?.[poseName] || ch.images?.idle;
    if (!img) return;
    const meta = ch.poses?.[poseName] || {};
    const native = meta.nativeFacing ?? ch.artFacing ?? -1;
    const anchor = meta.anchorX ?? 0.5;
    const x = 160 + i * 170;
    const y = GROUND + Math.sin(game.time * 2.2 + i) * 10;
    const scale = 0.32;
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1 * native, 1);
    ctx.drawImage(img, -anchor * w, -h, w, h);
    ctx.restore();
  });
  const enemies = game.catalog.enemies || [];
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
    ctx.scale(-1, 1);
    ctx.drawImage(img, -w * 0.5, -h, w, h);
    ctx.restore();
  });
}
