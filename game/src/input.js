// SIMMER & SERVE — input: mouse clicks on stations/bins/orders + keys.
// Clicking a station also walks the chef over to it. All hit boxes match
// the layout in render.js exactly.

import { INGREDIENT_ORDER } from './config.js';
import { pickIngredient, startChop, startCook, plateDish, serveOrder, trashPan, startShift, newGame, applyScene } from './state.js';
import { sfx, toggleMute, ensureAudio } from './audio.js';

const BINS = INGREDIENT_ORDER.map((id, i) => ({ id, x: 340 + i * 106, y: 566, w: 92, h: 80 }));

function inRect(x, y, r) { return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }

export function bindInput(canvas, getGame, setGame) {
  function pos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (canvas.width / r.width), y: (e.clientY - r.top) * (canvas.height / r.height) };
  }

  canvas.addEventListener('click', (e) => {
    ensureAudio();
    const g = getGame();
    const { x, y } = pos(e);
    if (g.phase === 'menu') {
      if (inRect(x, y, { x: 520, y: 470, w: 240, h: 64 })) { startShift(g); sfx.ding(); }
      return;
    }
    if (g.phase === 'over') {
      if (inRect(x, y, { x: 520, y: 400, w: 240, h: 64 })) {
        const fresh = newGame((Math.random() * 1e9) | 0);
        setGame(fresh);
        startShift(fresh);
        sfx.ding();
      }
      return;
    }
    if (g.paused) return;
    // Ingredient bins.
    for (const b of BINS) {
      if (inRect(x, y, b)) {
        if (!g.chef.carrying) { pickIngredient(g, b.id); sfx.pick(); }
        return;
      }
    }
    // Chop board.
    if (inRect(x, y, { x: 330, y: 300, w: 150, h: 120 })) {
      g.chef.tx = 405; g.chef.ty = 440;
      if (g.chef.carrying) {
        const res = startChop(g);
        if (res === 'chopping') sfx.chop();
        else if (res === 'staged') sfx.pick();
        else sfx.error();
      }
      return;
    }
    // Stove.
    if (inRect(x, y, { x: 510, y: 300, w: 240, h: 120 })) {
      g.chef.tx = 630; g.chef.ty = 440;
      if (g.pan.state === 'empty') {
        if (startCook(g)) sfx.sizzle(); else sfx.error();
      }
      return;
    }
    // Serve counter / plate.
    if (inRect(x, y, { x: 780, y: 300, w: 170, h: 120 })) {
      g.chef.tx = 865; g.chef.ty = 440;
      if (plateDish(g)) sfx.ding(); else if (g.pan.state !== 'done') sfx.error();
      return;
    }
    // Trash.
    if (inRect(x, y, { x: 930, y: 440, w: 40, h: 40 })) {
      if (trashPan(g)) sfx.burn();
      return;
    }
    // Order cards — serve the plated dish.
    for (let i = 0; i < g.orders.length; i++) {
      if (inRect(x, y, { x: 16, y: 122 + i * 104, w: 268, h: 92 })) {
        const res = serveOrder(g, g.orders[i].id);
        if (res === 'served') sfx.serve();
        else { sfx.error(); g.shake = 8; }
        return;
      }
    }
    // Anywhere else in the kitchen: walk there.
    if (x > 300 && x < 980 && y > 72 && y < 652) { g.chef.tx = x; g.chef.ty = Math.min(y, 520); }
  });

  window.addEventListener('keydown', (e) => {
    const g = getGame();
    if (e.key >= '1' && e.key <= '6') {
      ensureAudio();
      const id = INGREDIENT_ORDER[Number(e.key) - 1];
      if (g.phase === 'play' && !g.chef.carrying) { pickIngredient(g, id); sfx.pick(); }
    } else if (e.key === 't' || e.key === 'T') {
      if (g.phase === 'play' && trashPan(g)) sfx.burn();
    } else if (e.key === 'm' || e.key === 'M') {
      const m = toggleMute();
      g.muted = m;
    } else if (e.key === 'p' || e.key === 'P') {
      if (g.phase === 'play') g.paused = !g.paused;
    } else if (e.key === 'r' || e.key === 'R') {
      if (g.phase === 'play' || g.phase === 'over') {
        const fresh = newGame((Math.random() * 1e9) | 0);
        setGame(fresh);
        startShift(fresh);
      }
    } else if (e.key === 'Enter') {
      if (g.phase === 'menu') { startShift(g); sfx.ding(); }
      else if (g.phase === 'over') {
        const fresh = newGame((Math.random() * 1e9) | 0);
        setGame(fresh);
        startShift(fresh);
      }
    }
  });
}
