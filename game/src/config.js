// SIMMER & SERVE — config: recipes, ingredients, palette, tuning.
// Original night-market kitchen game. All art is drawn in code; no assets.

export const W = 1280;
export const H = 720;

export const SHIFT_SECONDS = 180;
export const TARGET_COINS = 150;
export const MAX_HEARTS = 3;
export const MAX_ORDERS = 4;
export const ORDER_SPAWN_SECONDS = 12;
export const ORDER_PATIENCE_SECONDS = 48;

// Ingredient ids, drawn as vector icons in render.js.
export const INGREDIENTS = {
  noodle:  { name: 'Noodle',  color: '#f2c14e', chop: false, key: '1' },
  egg:     { name: 'Egg',     color: '#fff3c4', chop: false, key: '2' },
  chicken: { name: 'Chicken', color: '#e8a06a', chop: true,  key: '3' },
  chilli:  { name: 'Chilli',  color: '#e5484d', chop: true,  key: '4' },
  greens:  { name: 'Greens',  color: '#58b368', chop: true,  key: '5' },
  broth:   { name: 'Broth',   color: '#d98e32', chop: false, key: '6' },
};
export const INGREDIENT_ORDER = ['noodle', 'egg', 'chicken', 'chilli', 'greens', 'broth'];

// Recipes: id, display name, ingredients (with counts), base coins, cook seconds.
export const RECIPES = [
  { id: 'mie-goreng',   name: 'Mie Goreng',    needs: { noodle: 1, egg: 1, chilli: 1 },          coins: 18, cook: 4, desc: 'Wok-fried noodles, egg, chilli' },
  { id: 'chicken-rice', name: 'Chicken Rice',  needs: { chicken: 1, broth: 1, greens: 1 },        coins: 22, cook: 5, desc: 'Poached chicken, broth, greens' },
  { id: 'chilli-noodle',name: 'Chilli Noodle', needs: { noodle: 1, chilli: 2, egg: 1 },           coins: 24, cook: 5, desc: 'Fiery noodles, double chilli' },
  { id: 'broth-bowl',   name: 'Broth Bowl',    needs: { broth: 1, noodle: 1, greens: 1 },         coins: 16, cook: 4, desc: 'Steaming broth over noodles' },
  { id: 'egg-fried',    name: 'Egg Fried Rice',needs: { egg: 2, greens: 1, chilli: 1 },           coins: 20, cook: 4, desc: 'Golden egg, greens, chilli' },
  { id: 'ayam-penyet',  name: 'Ayam Penyet',   needs: { chicken: 1, chilli: 1, broth: 1 },        coins: 26, cook: 6, desc: 'Smashed fried chicken, sambal' },
];

export const CUSTOMERS = [
  { name: 'Maya',  tint: '#f2a541' },
  { name: 'Budi',  tint: '#58b368' },
  { name: 'Sari',  tint: '#e5484d' },
  { name: 'Dewi',  tint: '#7c6ff0' },
  { name: 'Agus',  tint: '#d98e32' },
  { name: 'Rina',  tint: '#3fa7d6' },
];

export const PALETTE = {
  bg: '#171233',
  panel: '#221c46',
  panelEdge: '#3a2f6e',
  wood: '#8a5a33',
  woodDark: '#6e4525',
  counter: '#2e2a55',
  hud: '#100c26',
  cream: '#fff6e0',
  ink: '#241d33',
  gold: '#f2c14e',
  green: '#58b368',
  red: '#e5484d',
  blue: '#3fa7d6',
  steam: 'rgba(255,255,255,0.55)',
};

// Deterministic RNG so demo scenes and replays are stable.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.ceil(totalSeconds));
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}

export function starsForCoins(coins) {
  if (coins >= 260) return 3;
  if (coins >= 180) return 2;
  if (coins >= 120) return 1;
  return 0;
}
