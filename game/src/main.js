// SIMMER & SERVE — main: game loop, scene param for screenshots, pause.
// ?scene=cover|orders|cook|serve loads a real mid-play state (the game's
// own attract mode) so the screenshot set shows peak gameplay.

import { W, H } from './config.js';
import { newGame, tick, applyScene } from './state.js';
import { render } from './render.js';
import { bindInput } from './input.js';
import { sfx } from './audio.js';

const canvas = document.getElementById('game');
canvas.width = W;
canvas.height = H;
const ctx = canvas.getContext('2d');

let g = newGame();

const params = new URLSearchParams(window.location.search);
const scene = params.get('scene');
if (scene) applyScene(g, scene);

bindInput(canvas, () => g, (next) => { g = next; });

let last = performance.now();
let lastWholeSecond = -1;

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!g.paused && g.phase === 'play') {
    tick(g, dt);
    const whole = Math.ceil(g.timeLeft);
    if (g.timeLeft <= 10 && whole !== lastWholeSecond && whole > 0) {
      lastWholeSecond = whole;
      sfx.tick();
    }
    if (g.phase === 'over') {
      if (g.won) sfx.win(); else sfx.lose();
    }
  }
  render(ctx, g);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
