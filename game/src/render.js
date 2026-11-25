// SIMMER & SERVE — render: every pixel is drawn in code (canvas 2D).
// Layout 1280x720: HUD bar, order board (left), kitchen (centre), recipe
// book (right), ingredient bins (bottom). Cover = peak gameplay, no title.

import { W, H, INGREDIENTS, INGREDIENT_ORDER, RECIPES, PALETTE, formatClock, starsForCoins } from './config.js';
import { recipeById } from './state.js';

const C = PALETTE;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, weight = '700', align = 'left', font = 'sans-serif') {
  ctx.fillStyle = color;
  ctx.font = weight + ' ' + size + 'px ' + font;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function bar(ctx, x, y, w, h, frac, color, bg = '#3a2f6e') {
  rr(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = bg; ctx.fill();
  const f = Math.max(0, Math.min(1, frac));
  if (f > 0.005) {
    rr(ctx, x, y, Math.max(h, w * f), h, h / 2);
    ctx.fillStyle = color; ctx.fill();
  }
}

// Vector ingredient icons — original art, no images or fonts needed.
export function drawIngredientIcon(ctx, id, x, y, s) {
  const u = s / 48;
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = 2.4 * u;
  ctx.lineCap = 'round';
  if (id === 'noodle') {
    ctx.strokeStyle = '#f2c14e';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      for (let t = 0; t <= 10; t++) {
        const px = -18 * u + t * 3.6 * u;
        const py = i * 11 * u + Math.sin(t * 1.4) * 4 * u;
        t === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  } else if (id === 'egg') {
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath(); ctx.ellipse(0, 0, 19 * u, 15 * u, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2a541';
    ctx.beginPath(); ctx.arc(2 * u, 1 * u, 7.5 * u, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'chicken') {
    ctx.fillStyle = '#e8a06a';
    ctx.beginPath(); ctx.arc(-4 * u, 2 * u, 13 * u, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff6e0';
    ctx.beginPath(); ctx.moveTo(6 * u, -6 * u); ctx.lineTo(16 * u, -16 * u); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8 * u, -2 * u); ctx.lineTo(18 * u, -10 * u); ctx.stroke();
    ctx.fillStyle = '#fff6e0';
    ctx.beginPath(); ctx.arc(17 * u, -17 * u, 3.4 * u, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(19 * u, -11 * u, 3.4 * u, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'chilli') {
    ctx.strokeStyle = '#e5484d';
    ctx.lineWidth = 9 * u;
    ctx.beginPath(); ctx.moveTo(-14 * u, -8 * u);
    ctx.quadraticCurveTo(2 * u, 16 * u, 16 * u, -12 * u); ctx.stroke();
    ctx.strokeStyle = '#58b368';
    ctx.lineWidth = 3.4 * u;
    ctx.beginPath(); ctx.moveTo(14 * u, -12 * u); ctx.quadraticCurveTo(20 * u, -20 * u, 12 * u, -21 * u); ctx.stroke();
  } else if (id === 'greens') {
    ctx.fillStyle = '#58b368';
    for (const [rx, ry, rot] of [[-8, 4, -0.5], [6, -2, 0.4], [0, 8, 1.2]]) {
      ctx.save(); ctx.translate(rx * u, ry * u); ctx.rotate(rot);
      ctx.beginPath(); ctx.ellipse(0, 0, 11 * u, 5.5 * u, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.strokeStyle = '#2f7a3e'; ctx.lineWidth = 1.6 * u;
    ctx.beginPath(); ctx.moveTo(-16 * u, 10 * u); ctx.lineTo(16 * u, -8 * u); ctx.stroke();
  } else if (id === 'broth') {
    ctx.fillStyle = '#d98e32';
    ctx.beginPath(); ctx.arc(0, 2 * u, 17 * u, 0, Math.PI); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f6c453';
    ctx.beginPath(); ctx.ellipse(0, 2 * u, 17 * u, 4.5 * u, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2 * u;
    ctx.beginPath(); ctx.moveTo(-8 * u, -6 * u); ctx.quadraticCurveTo(-12 * u, -14 * u, -8 * u, -20 * u); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4 * u, -6 * u); ctx.quadraticCurveTo(0, -14 * u, 4 * u, -20 * u); ctx.stroke();
  }
  ctx.restore();
}

function drawFace(ctx, x, y, r, tint, mood) {
  ctx.fillStyle = tint;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#241d33';
  ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.15, r * 0.11, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + r * 0.35, y - r * 0.15, r * 0.11, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#241d33';
  ctx.lineWidth = Math.max(1.5, r * 0.09);
  ctx.beginPath();
  if (mood === 'happy') { ctx.arc(x, y + r * 0.1, r * 0.45, 0.15 * Math.PI, 0.85 * Math.PI); }
  else if (mood === 'worried') { ctx.arc(x, y + r * 0.75, r * 0.4, 1.15 * Math.PI, 1.85 * Math.PI); }
  else { ctx.moveTo(x - r * 0.3, y + r * 0.35); ctx.lineTo(x + r * 0.3, y + r * 0.35); }
  ctx.stroke();
}

function drawChef(ctx, x, y, carrying, walking) {
  const bob = walking ? Math.sin(Date.now() / 90) * 2 : 0;
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(x, y + 34, 30, 8, 0, 0, Math.PI * 2); ctx.fill();
  // body (apron)
  ctx.fillStyle = '#fff6e0';
  rr(ctx, x - 22, y - 6 + bob, 44, 40, 10); ctx.fill();
  ctx.fillStyle = '#3fa7d6';
  rr(ctx, x - 22, y + 18 + bob, 44, 16, 6); ctx.fill();
  // head + toque
  ctx.fillStyle = '#f2c9a0';
  ctx.beginPath(); ctx.arc(x, y - 18 + bob, 16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(x - 10, y - 32 + bob, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x, y - 36 + bob, 11, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 10, y - 32 + bob, 9, 0, Math.PI * 2); ctx.fill();
  rr(ctx, x - 14, y - 32 + bob, 28, 8, 3); ctx.fill();
  // eyes
  ctx.fillStyle = '#241d33';
  ctx.beginPath(); ctx.arc(x - 6, y - 18 + bob, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 6, y - 18 + bob, 2, 0, Math.PI * 2); ctx.fill();
  // carried ingredient above the head
  if (carrying) {
    ctx.fillStyle = 'rgba(255,246,224,0.92)';
    ctx.beginPath(); ctx.arc(x, y - 58 + bob, 20, 0, Math.PI * 2); ctx.fill();
    drawIngredientIcon(ctx, carrying, x, y - 58 + bob, 30);
  }
}

function drawStationLabel(ctx, x, y, label, sub) {
  text(ctx, label, x, y - 10, 15, C.cream, '800', 'center');
  if (sub) text(ctx, sub, x, y + 132, 11, '#c9b8f2', '600', 'center');
}

export function render(ctx, g) {
  ctx.save();
  if (g.shake > 0) ctx.translate((Math.random() - 0.5) * g.shake, (Math.random() - 0.5) * g.shake);
  drawBackground(ctx);
  if (g.phase === 'menu') { drawMenu(ctx, g); ctx.restore(); return; }
  drawHUD(ctx, g);
  drawOrderBoard(ctx, g);
  drawRecipeBook(ctx, g);
  drawKitchen(ctx, g);
  drawBins(ctx, g);
  drawLog(ctx, g);
  drawPopups(ctx, g);
  if (g.phase === 'over') drawGameOver(ctx, g);
  ctx.restore();
}

function drawBackground(ctx) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  // warm string lights across the top of the kitchen
  for (let i = 0; i < 16; i++) {
    const x = 40 + i * 78;
    const y = 66 + Math.sin(i * 1.1) * 8;
    ctx.fillStyle = i % 3 === 0 ? '#f2c14e' : i % 3 === 1 ? '#e5484d' : '#58b368';
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
  }
  // tiled floor in the kitchen area
  ctx.fillStyle = '#1d1838';
  ctx.fillRect(300, 72, 680, 580);
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let x = 300; x <= 980; x += 68) { ctx.beginPath(); ctx.moveTo(x, 72); ctx.lineTo(x, 652); ctx.stroke(); }
  for (let y = 72; y <= 652; y += 68) { ctx.beginPath(); ctx.moveTo(300, y); ctx.lineTo(980, y); ctx.stroke(); }
}

function drawHUD(ctx, g) {
  ctx.fillStyle = C.hud;
  ctx.fillRect(0, 0, W, 56);
  text(ctx, 'SIMMER & SERVE', 20, 29, 22, C.gold, '800');
  text(ctx, 'night-market kitchen', 218, 31, 12, '#c9b8f2', '600');
  // timer
  const urgent = g.timeLeft <= 30;
  text(ctx, '⏱ ' + formatClock(g.timeLeft), 470, 29, 22, urgent ? C.red : C.cream, '800', 'center');
  bar(ctx, 400, 44, 140, 7, g.timeLeft / 180, urgent ? C.red : C.green);
  // coins + target
  text(ctx, '◉ ' + g.coins + ' / ' + 150 + ' coins', 640, 29, 20, C.gold, '800', 'center');
  // combo
  text(ctx, g.combo > 1 ? 'COMBO x' + (1 + Math.min(g.combo - 1, 4) * 0.25).toFixed(2) : 'COMBO —', 800, 29, 16, g.combo > 1 ? '#ff9d5c' : '#8f86b8', '800', 'center');
  // hearts
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < g.hearts ? C.red : '#3a2f6e';
    ctx.beginPath(); ctx.arc(920 + i * 30, 28, 11, 0, Math.PI * 2); ctx.fill();
    text(ctx, '♥', 920 + i * 30, 29, 13, '#fff', '800', 'center');
  }
  // score + served
  text(ctx, 'SCORE ' + g.score, 1010, 22, 15, C.cream, '800');
  text(ctx, 'served ' + g.served + ' · missed ' + g.missed, 1010, 40, 12, '#c9b8f2', '600');
}

function drawOrderBoard(ctx, g) {
  text(ctx, 'ORDER BOARD', 150, 88, 15, C.cream, '800', 'center');
  text(ctx, 'click an order to serve the plated dish', 150, 106, 11, '#c9b8f2', '600', 'center');
  if (g.orders.length === 0) {
    rr(ctx, 16, 122, 268, 92, 12); ctx.fillStyle = C.panel; ctx.fill();
    text(ctx, 'No orders yet —', 150, 158, 14, '#c9b8f2', '600', 'center');
    text(ctx, 'the rush is coming…', 150, 178, 14, '#c9b8f2', '600', 'center');
  }
  g.orders.forEach((o, i) => {
    const y = 122 + i * 104;
    const r = recipeById(o.recipeId);
    const frac = o.patience / o.maxPatience;
    const mood = frac > 0.5 ? 'happy' : frac > 0.25 ? 'neutral' : 'worried';
    rr(ctx, 16, y, 268, 92, 12);
    ctx.fillStyle = frac < 0.25 ? '#4d1f33' : C.panel;
    ctx.fill();
    ctx.strokeStyle = frac < 0.25 ? C.red : C.panelEdge;
    ctx.lineWidth = 2; ctx.stroke();
    drawFace(ctx, 48, y + 30, 20, o.tint, mood);
    text(ctx, o.customer, 76, y + 20, 14, C.cream, '800');
    text(ctx, r.name, 76, y + 40, 16, C.gold, '800');
    text(ctx, r.coins + ' coins', 268, y + 20, 12, C.gold, '700', 'right');
    // needed ingredients
    let ix = 76;
    for (const [id, n] of Object.entries(r.needs)) {
      for (let k = 0; k < n; k++) { drawIngredientIcon(ctx, id, ix + 10, y + 66, 22); ix += 26; }
    }
    bar(ctx, 16, y + 84, 268, 6, frac, frac > 0.5 ? C.green : frac > 0.25 ? C.gold : C.red);
  });
  // hearts reminder under the board
  text(ctx, 'Lose a heart when a customer walks out.', 150, 122 + 4 * 104 + 6, 11, '#8f86b8', '600', 'center');
}

function drawRecipeBook(ctx, g) {
  text(ctx, 'RECIPE BOOK', 1130, 88, 15, C.cream, '800', 'center');
  text(ctx, '6 dishes · exact ingredients only', 1130, 106, 11, '#c9b8f2', '600', 'center');
  RECIPES.forEach((r, i) => {
    const y = 122 + i * 80;
    rr(ctx, 996, y, 268, 78, 12); ctx.fillStyle = C.panel; ctx.fill();
    ctx.strokeStyle = C.panelEdge; ctx.lineWidth = 1.5; ctx.stroke();
    text(ctx, r.name, 1010, y + 16, 15, C.cream, '800');
    text(ctx, r.coins + 'c · ' + r.cook + 's on stove', 1250, y + 16, 12, C.gold, '700', 'right');
    let ix = 1010;
    for (const [id, n] of Object.entries(r.needs)) {
      for (let k = 0; k < n; k++) { drawIngredientIcon(ctx, id, ix + 10, y + 42, 22); ix += 26; }
    }
    text(ctx, r.desc, 1010, y + 64, 11, '#c9b8f2', '600');
  });
  // rush meter
  const y = 122 + 6 * 80 + 8;
  text(ctx, 'RUSH METER', 1130, y, 13, C.cream, '800', 'center');
  bar(ctx, 996, y + 12, 268, 10, Math.min(1, g.orders.length / 4), '#ff9d5c');
  text(ctx, g.orders.length + ' / 4 orders on the board', 1130, y + 34, 11, '#c9b8f2', '600', 'center');
}

function drawKitchen(ctx, g) {
  // CHOP station
  rr(ctx, 330, 300, 150, 120, 12); ctx.fillStyle = C.wood; ctx.fill();
  rr(ctx, 344, 314, 122, 60, 8); ctx.fillStyle = '#d9b380'; ctx.fill();
  drawStationLabel(ctx, 405, 300, 'CHOP BOARD', 'click to chop or stage items');
  if (g.chop.active) {
    // knife + chopping item
    drawIngredientIcon(ctx, g.chop.item, 405, 344, 44);
    bar(ctx, 344, 380, 122, 8, g.chop.progress / g.chop.need, C.green);
    text(ctx, 'CHOPPING…', 405, 344, 13, C.ink, '800', 'center');
  } else if (g.tray.length) {
    let ix = 360;
    for (const id of g.tray) { drawIngredientIcon(ctx, id, ix, 344, 30); ix += 34; }
    text(ctx, 'tray: ' + g.tray.length + ' item' + (g.tray.length > 1 ? 's' : ''), 405, 396, 11, C.cream, '700', 'center');
  }
  // STOVE station
  rr(ctx, 510, 300, 240, 120, 12); ctx.fillStyle = C.counter; ctx.fill();
  ctx.fillStyle = '#171233';
  ctx.beginPath(); ctx.arc(590, 352, 46, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(700, 352, 46, 0, Math.PI * 2); ctx.fill();
  drawStationLabel(ctx, 630, 300, 'STOVE', 'click to cook the tray');
  const pan = g.pan;
  if (pan.state !== 'empty') {
    const px = 590, py = 352;
    ctx.fillStyle = '#3a3f4d';
    ctx.beginPath(); ctx.arc(px, py, 40, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = pan.state === 'burned' ? '#241d1d' : '#8a5a33';
    ctx.beginPath(); ctx.arc(px, py, 32, 0, Math.PI * 2); ctx.fill();
    if (pan.recipe) text(ctx, pan.recipe.name + ' · SIZZLING…', px, py + 62, 12, C.gold, '800', 'center');
    if (pan.state === 'cooking') {
      bar(ctx, px - 40, py + 44, 80, 8, pan.progress / pan.need, C.gold);
      // steam
      ctx.strokeStyle = C.steam; ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        const sx = px - 18 + i * 18;
        ctx.beginPath(); ctx.moveTo(sx, py - 34);
        ctx.quadraticCurveTo(sx - 6, py - 48, sx + 2, py - 58); ctx.stroke();
      }
    } else if (pan.state === 'done') {
      text(ctx, 'READY — plate it!', px, py + 62, 12, C.green, '800', 'center');
      // done glow
      ctx.strokeStyle = C.green; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(px, py, 44, 0, Math.PI * 2); ctx.stroke();
    } else if (pan.state === 'burned') {
      text(ctx, 'BURNED — trash it (T)', px, py + 62, 12, C.red, '800', 'center');
      ctx.strokeStyle = 'rgba(60,60,60,0.8)'; ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        const sx = px - 18 + i * 18;
        ctx.beginPath(); ctx.moveTo(sx, py - 34);
        ctx.quadraticCurveTo(sx + 8, py - 50, sx - 2, py - 62); ctx.stroke();
      }
    }
  } else {
    text(ctx, 'empty pan', 590, 352, 12, '#8f86b8', '600', 'center');
    text(ctx, 'burner 2', 700, 352, 12, '#8f86b8', '600', 'center');
  }
  // PLATE counter
  rr(ctx, 780, 300, 170, 120, 12); ctx.fillStyle = '#e8e0c8'; ctx.fill();
  drawStationLabel(ctx, 865, 300, 'SERVE COUNTER', 'click to plate, then serve');
  if (g.plate.recipe) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(865, 348, 52, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c9b8f2'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(865, 348, 52, 16, 0, 0, Math.PI * 2); ctx.stroke();
    let ix = 865 - (Object.values(g.plate.recipe.needs).reduce((a, b) => a + b, 0) - 1) * 13;
    for (const [id, n] of Object.entries(g.plate.recipe.needs)) {
      for (let k = 0; k < n; k++) { drawIngredientIcon(ctx, id, ix, 344, 24); ix += 26; }
    }
    text(ctx, g.plate.recipe.name + ' — READY', 865, 372, 12, C.ink, '800', 'center');
  } else {
    text(ctx, 'no dish plated', 865, 348, 12, '#8f86b8', '600', 'center');
  }
  // Chef
  const walking = Math.hypot(g.chef.tx - g.chef.x, g.chef.ty - g.chef.y) > 4;
  drawChef(ctx, g.chef.x, g.chef.y, g.chef.carrying, walking);
  // trash bin
  rr(ctx, 930, 440, 40, 40, 8); ctx.fillStyle = '#3a2f6e'; ctx.fill();
  text(ctx, '🗑', 950, 460, 18, C.cream, '800', 'center');
  text(ctx, 'trash (T)', 950, 488, 10, '#8f86b8', '600', 'center');
}

function drawBins(ctx, g) {
  text(ctx, 'INGREDIENT BINS — click a bin (or press 1–6) to pick it up', 640, 552, 13, C.cream, '800', 'center');
  INGREDIENT_ORDER.forEach((id, i) => {
    const x = 340 + i * 106;
    const ing = INGREDIENTS[id];
    rr(ctx, x, 566, 92, 80, 12);
    ctx.fillStyle = g.chef.carrying === id ? '#4d3a1f' : C.panel; ctx.fill();
    ctx.strokeStyle = g.chef.carrying === id ? C.gold : C.panelEdge; ctx.lineWidth = 2; ctx.stroke();
    drawIngredientIcon(ctx, id, x + 46, 596, 40);
    text(ctx, ing.name, x + 46, 628, 12, C.cream, '700', 'center');
    text(ctx, '[' + ing.key + ']' + (ing.chop ? ' · chop' : ''), x + 46, 642, 10, '#8f86b8', '600', 'center');
  });
}

function drawLog(ctx, g) {
  rr(ctx, 16, 540, 268, 112, 12); ctx.fillStyle = C.panel; ctx.fill();
  text(ctx, 'KITCHEN LOG', 30, 560, 12, C.gold, '800');
  g.log.forEach((line, i) => text(ctx, line, 30, 582 + i * 18, 12, '#c9b8f2', '600'));
  if (!g.log.length) text(ctx, 'Orders will appear here…', 30, 582, 12, '#8f86b8', '600');
  text(ctx, 'Click: bins → chop → stove → plate → order  ·  P pause · R restart · M mute · T trash', 640, 686, 13, '#c9b8f2', '600', 'center');
}

function drawPopups(ctx, g) {
  for (const p of g.popups) {
    ctx.globalAlpha = Math.min(1, p.life);
    text(ctx, p.text, p.x, p.y - (1.4 - p.life) * 30, 20, p.color, '800', 'center');
    ctx.globalAlpha = 1;
  }
}

function drawMenu(ctx, g) {
  ctx.fillStyle = 'rgba(16,12,38,0.72)';
  ctx.fillRect(0, 0, W, H);
  text(ctx, 'SIMMER & SERVE', 640, 150, 64, C.gold, '800', 'center');
  text(ctx, 'a night-market kitchen · 6 recipes · 3 stations · 1 rush hour', 640, 200, 20, C.cream, '600', 'center');
  const lines = [
    '1  Pick ingredients from the bins (click or keys 1–6).',
    '2  Chop chicken, chilli and greens — or stage other items — on the CHOP BOARD.',
    '3  Cook the tray on the STOVE — plate it before it burns.',
    '4  Serve the plated dish to the matching order. Tips for fast serves!',
    '   3 hearts. Reach 150 coins before the 3:00 shift ends.',
  ];
  lines.forEach((l, i) => text(ctx, l, 640, 268 + i * 34, 18, '#e8e0f8', '600', 'center'));
  rr(ctx, 520, 470, 240, 64, 14);
  ctx.fillStyle = C.gold; ctx.fill();
  text(ctx, 'START SHIFT  ▶', 640, 503, 24, C.ink, '800', 'center');
  text(ctx, 'mouse + keyboard · sound on (M to mute)', 640, 580, 13, '#8f86b8', '600', 'center');
}

function drawGameOver(ctx, g) {
  ctx.fillStyle = 'rgba(16,12,38,0.78)';
  ctx.fillRect(0, 0, W, H);
  const title = g.won ? 'SHIFT COMPLETE!' : 'SHIFT OVER';
  text(ctx, title, 640, 190, 54, g.won ? C.gold : C.red, '800', 'center');
  const stars = starsForCoins(g.coins);
  let starStr = '';
  for (let i = 0; i < 3; i++) starStr += i < stars ? '★' : '☆';
  text(ctx, starStr, 640, 250, 44, C.gold, '800', 'center');
  text(ctx, 'Coins ' + g.coins + '  ·  Served ' + g.served + ' dishes  ·  Best combo x' + g.bestCombo + '  ·  Missed ' + g.missed, 640, 310, 20, C.cream, '700', 'center');
  text(ctx, g.won
    ? 'The night market is fed. Target was 150 coins — you made ' + g.coins + '.'
    : (g.hearts <= 0 ? 'Three customers walked out hungry.' : 'Time ran out at ' + g.coins + ' / 150 coins.'), 640, 350, 17, '#c9b8f2', '600', 'center');
  rr(ctx, 520, 400, 240, 64, 14);
  ctx.fillStyle = C.gold; ctx.fill();
  text(ctx, 'PLAY AGAIN  (R)', 640, 433, 22, C.ink, '800', 'center');
}
