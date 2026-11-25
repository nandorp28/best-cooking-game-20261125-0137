// SIMMER & SERVE — state: orders, stations, scoring, win/lose, demo scenes.
// The chef carries one ingredient at a time; the tray holds chopped items.
// A dish is built on the stove pan from the tray, then plated, then served.

import {
  INGREDIENTS, RECIPES, CUSTOMERS, SHIFT_SECONDS, MAX_HEARTS, MAX_ORDERS,
  ORDER_SPAWN_SECONDS, ORDER_PATIENCE_SECONDS, mulberry32,
} from './config.js';

export function recipeById(id) { return RECIPES.find(r => r.id === id); }

export function newGame(seed = 20261125) {
  const rng = mulberry32(seed);
  return {
    rng,
    phase: 'menu', // menu | play | over
    won: false,
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    coins: 0,
    score: 0,
    combo: 0,
    bestCombo: 0,
    hearts: MAX_HEARTS,
    served: 0,
    missed: 0,
    burned: 0,
    spawnTimer: 4,
    customerIdx: 0,
    orders: [],
    chef: { x: 640, y: 470, tx: 640, ty: 470, carrying: null, busy: 0, busyLabel: '' },
    tray: [], // chopped ingredient ids waiting to be cooked
    chop: { active: false, item: null, progress: 0, need: 2.5 },
    pan: { state: 'empty', recipe: null, progress: 0, need: 0, burn: 0, items: [] },
    plate: { recipe: null },
    trash: { count: 0 },
    popups: [], // {x,y,text,color,life}
    shake: 0,
    flash: null,
    muted: false,
    log: [],
  };
}

function logLine(g, text) {
  g.log.unshift(text);
  if (g.log.length > 4) g.log.pop();
}

function spawnOrder(g) {
  if (g.orders.length >= MAX_ORDERS) return;
  const recipe = RECIPES[Math.floor(g.rng() * RECIPES.length)];
  const customer = CUSTOMERS[g.customerIdx % CUSTOMERS.length];
  g.customerIdx++;
  g.orders.push({
    id: g.elapsed + '-' + g.customerIdx,
    recipeId: recipe.id,
    customer: customer.name,
    tint: customer.tint,
    patience: ORDER_PATIENCE_SECONDS,
    maxPatience: ORDER_PATIENCE_SECONDS,
  });
}

export function startShift(g) {
  g.phase = 'play';
  g.orders = [];
  g.spawnTimer = 3;
  spawnOrder(g);
  spawnOrder(g);
  logLine(g, 'Shift started — serve ' + g.orders.length + ' hungry customers!');
}

export function endShift(g, won) {
  g.phase = 'over';
  g.won = won;
}

export function pickIngredient(g, id) {
  if (g.phase !== 'play') return;
  if (g.chef.carrying) return;
  g.chef.carrying = id;
  g.chef.tx = g.chef.x; g.chef.ty = g.chef.y;
}

export function startChop(g) {
  const id = g.chef.carrying;
  if (!id) return false;
  // The chop board is also the prep counter: items that need no chopping
  // are staged straight onto the tray.
  if (!INGREDIENTS[id].chop) {
    g.tray.push(id);
    g.chef.carrying = null;
    return 'staged';
  }
  if (g.chop.active) return false;
  g.chop = { active: true, item: id, progress: 0, need: 2.5 };
  g.chef.carrying = null;
  return 'chopping';
}

export function startCook(g) {
  if (g.pan.state !== 'empty') return false;
  if (g.tray.length === 0 && !g.chef.carrying) return false;
  // The pan takes the tray plus whatever the chef carries (uncut items go in whole).
  const items = [...g.tray];
  if (g.chef.carrying) items.push(g.chef.carrying);
  g.tray = [];
  g.chef.carrying = null;
  const match = matchRecipe(items);
  g.pan = {
    state: 'cooking',
    recipe: match,
    progress: 0,
    need: match ? match.cook : 4,
    burn: 0,
    items,
  };
  return true;
}

// Exact multiset match against the recipe book; null when no recipe fits.
export function matchRecipe(items) {
  const counts = {};
  for (const it of items) counts[it] = (counts[it] || 0) + 1;
  for (const r of RECIPES) {
    const keys = Object.keys(r.needs);
    if (keys.length !== Object.keys(counts).length) continue;
    if (keys.every(k => counts[k] === r.needs[k])) return r;
  }
  return null;
}

export function plateDish(g) {
  if (g.pan.state !== 'done' || g.plate.recipe) return false;
  g.plate.recipe = g.pan.recipe;
  g.pan = { state: 'empty', recipe: null, progress: 0, need: 0, burn: 0, items: [] };
  return true;
}

export function serveOrder(g, orderId) {
  const order = g.orders.find(o => o.id === orderId);
  if (!order || !g.plate.recipe) return 'no-plate';
  if (g.plate.recipe.id !== order.recipeId) return 'wrong-dish';
  const patienceFrac = order.patience / order.maxPatience;
  const tip = Math.round(8 * patienceFrac);
  g.combo += 1;
  g.bestCombo = Math.max(g.bestCombo, g.combo);
  const mult = 1 + Math.min(g.combo - 1, 4) * 0.25;
  const earned = Math.round((g.plate.recipe.coins + tip) * mult);
  g.coins += earned;
  g.score += earned * 10;
  g.served += 1;
  g.orders = g.orders.filter(o => o.id !== orderId);
  g.plate.recipe = null;
  addPopup(g, 640, 250, '+' + earned + ' coins' + (g.combo > 1 ? '  x' + mult.toFixed(2) : ''), '#f2c14e');
  logLine(g, order.customer + ' loved the ' + order.recipeId.replace(/-/g, ' ') + ' (+' + earned + ')');
  return 'served';
}

export function trashPan(g) {
  if (g.pan.state === 'empty') return false;
  g.pan = { state: 'empty', recipe: null, progress: 0, need: 0, burn: 0, items: [] };
  g.trash.count += 1;
  g.burned += 1;
  g.combo = 0;
  return true;
}

export function addPopup(g, x, y, text, color) {
  g.popups.push({ x, y, text, color, life: 1.4 });
}

export function tick(g, dt) {
  if (g.phase !== 'play') return;
  g.elapsed += dt;
  g.timeLeft -= dt;
  if (g.timeLeft <= 10 && Math.floor(g.timeLeft) !== Math.floor(g.timeLeft + dt)) {
    // last-ten-seconds tick handled by the loop via sfx hook
  }
  // Orders spawn and age.
  g.spawnTimer -= dt;
  if (g.spawnTimer <= 0) { spawnOrder(g); g.spawnTimer = ORDER_SPAWN_SECONDS; }
  for (const o of [...g.orders]) {
    o.patience -= dt;
    if (o.patience <= 0) {
      g.orders = g.orders.filter(x => x.id !== o.id);
      g.hearts -= 1;
      g.missed += 1;
      g.combo = 0;
      g.shake = 10;
      addPopup(g, 150, 120, o.customer + ' walked out!', '#e5484d');
      logLine(g, o.customer + ' left hungry — a heart lost');
      if (g.hearts <= 0) { endShift(g, false); return; }
    }
  }
  // Chopping progresses.
  if (g.chop.active) {
    g.chop.progress += dt;
    if (g.chop.progress >= g.chop.need) {
      g.tray.push(g.chop.item);
      g.chop = { active: false, item: null, progress: 0, need: 2.5 };
      addPopup(g, 430, 330, 'Chopped!', '#58b368');
    }
  }
  // Cooking progresses; a finished dish burns if ignored.
  if (g.pan.state === 'cooking') {
    g.pan.progress += dt;
    if (g.pan.progress >= g.pan.need) {
      g.pan.state = 'done';
      g.pan.burn = 0;
    }
  } else if (g.pan.state === 'done') {
    g.pan.burn += dt;
    if (g.pan.burn > 6) {
      g.pan.state = 'burned';
      addPopup(g, 640, 300, 'Burned! Trash it (T)', '#e5484d');
    }
  }
  // Popups fade.
  for (const p of g.popups) p.life -= dt;
  g.popups = g.popups.filter(p => p.life > 0);
  if (g.shake > 0) g.shake -= dt * 30;
  // Chef walks toward target.
  const c = g.chef;
  const dx = c.tx - c.x, dy = c.ty - c.y;
  const d = Math.hypot(dx, dy);
  if (d > 4) {
    const step = Math.min(d, 340 * dt);
    c.x += (dx / d) * step;
    c.y += (dy / d) * step;
  }
  // Shift end.
  if (g.timeLeft <= 0) {
    g.timeLeft = 0;
    endShift(g, g.coins >= 150);
  }
}

// Demo scenes for the screenshot set: real game states, rendered by the
// game's own draw code. Each scene is a state normal play reaches.
export function applyScene(g, scene) {
  startShift(g);
  g.phase = 'play';
  if (scene === 'cover') {
    g.timeLeft = 92; g.coins = 86; g.score = 860; g.combo = 3; g.bestCombo = 3; g.served = 3;
    g.orders = [
      { id: 's1', recipeId: 'mie-goreng', customer: 'Maya', tint: '#f2a541', patience: 34, maxPatience: 48 },
      { id: 's2', recipeId: 'chicken-rice', customer: 'Budi', tint: '#58b368', patience: 22, maxPatience: 48 },
      { id: 's3', recipeId: 'ayam-penyet', customer: 'Sari', tint: '#e5484d', patience: 41, maxPatience: 48 },
      { id: 's4', recipeId: 'broth-bowl', customer: 'Dewi', tint: '#7c6ff0', patience: 12, maxPatience: 48 },
    ];
    g.chef = { x: 500, y: 470, tx: 500, ty: 470, carrying: 'chilli', busy: 0, busyLabel: '' };
    g.tray = ['noodle', 'egg'];
    g.pan = { state: 'cooking', recipe: recipeById('mie-goreng'), progress: 2.4, need: 4, burn: 0, items: ['noodle', 'egg', 'chilli'] };
    g.plate = { recipe: recipeById('chicken-rice') };
    g.popups = [{ x: 640, y: 250, text: '+22 coins', color: '#f2c14e', life: 1.2 }];
  } else if (scene === 'orders') {
    g.timeLeft = 128; g.coins = 44; g.score = 440; g.combo = 2; g.bestCombo = 2; g.served = 1;
    g.orders = [
      { id: 's1', recipeId: 'chilli-noodle', customer: 'Maya', tint: '#f2a541', patience: 6, maxPatience: 48 },
      { id: 's2', recipeId: 'egg-fried', customer: 'Agus', tint: '#d98e32', patience: 18, maxPatience: 48 },
      { id: 's3', recipeId: 'broth-bowl', customer: 'Rina', tint: '#3fa7d6', patience: 39, maxPatience: 48 },
      { id: 's4', recipeId: 'mie-goreng', customer: 'Sari', tint: '#e5484d', patience: 45, maxPatience: 48 },
    ];
    g.chef = { x: 700, y: 490, tx: 700, ty: 490, carrying: 'noodle', busy: 0, busyLabel: '' };
    g.tray = ['chilli'];
  } else if (scene === 'cook') {
    g.timeLeft = 104; g.coins = 62; g.score = 620; g.combo = 1; g.bestCombo = 2; g.served = 2;
    g.orders = [
      { id: 's1', recipeId: 'ayam-penyet', customer: 'Budi', tint: '#58b368', patience: 30, maxPatience: 48 },
      { id: 's2', recipeId: 'mie-goreng', customer: 'Dewi', tint: '#7c6ff0', patience: 26, maxPatience: 48 },
    ];
    g.chef = { x: 480, y: 470, tx: 480, ty: 470, carrying: null, busy: 0, busyLabel: '' };
    g.chop = { active: true, item: 'chicken', progress: 1.4, need: 2.5 };
    g.tray = ['greens'];
    g.pan = { state: 'cooking', recipe: recipeById('chicken-rice'), progress: 3.1, need: 5, burn: 0, items: ['chicken', 'broth', 'greens'] };
  } else if (scene === 'serve') {
    g.timeLeft = 61; g.coins = 132; g.score = 1320; g.combo = 4; g.bestCombo = 4; g.served = 5;
    g.orders = [
      { id: 's1', recipeId: 'mie-goreng', customer: 'Maya', tint: '#f2a541', patience: 28, maxPatience: 48 },
      { id: 's2', recipeId: 'chicken-rice', customer: 'Rina', tint: '#3fa7d6', patience: 36, maxPatience: 48 },
    ];
    g.chef = { x: 760, y: 470, tx: 760, ty: 470, carrying: null, busy: 0, busyLabel: '' };
    g.plate = { recipe: recipeById('mie-goreng') };
    g.popups = [
      { x: 640, y: 250, text: '+27 coins  x1.75', color: '#f2c14e', life: 1.3 },
      { x: 900, y: 250, text: 'Maya loved it!', color: '#58b368', life: 1.3 },
    ];
  }
}
