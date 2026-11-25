// SIMMER & SERVE — audio: tiny WebAudio synth, no sound files.
// Every effect is an oscillator/noise burst built in code. M toggles mute.

let ctx = null;
let muted = false;

export function ensureAudio() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}
export function isMuted() { return muted; }

function tone(freq, dur, type, vol, when = 0) {
  const ac = ensureAudio();
  if (!ac || muted) return;
  const t0 = ac.currentTime + when;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g).connect(ac.destination);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

function noiseBurst(dur, vol, filterFreq) {
  const ac = ensureAudio();
  if (!ac || muted) return;
  const len = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const f = ac.createBiquadFilter();
  f.type = 'bandpass'; f.frequency.value = filterFreq;
  const g = ac.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(ac.destination);
  src.start();
}

export const sfx = {
  pick()   { tone(520, 0.07, 'triangle', 0.12); },
  chop()   { noiseBurst(0.09, 0.25, 1800); tone(180, 0.06, 'square', 0.08); },
  sizzle() { noiseBurst(0.35, 0.10, 5200); },
  ding()   { tone(880, 0.12, 'sine', 0.16); tone(1318, 0.18, 'sine', 0.12, 0.09); },
  serve()  { tone(660, 0.10, 'triangle', 0.15); tone(990, 0.14, 'triangle', 0.15, 0.08); tone(1320, 0.2, 'sine', 0.12, 0.16); },
  error()  { tone(160, 0.18, 'sawtooth', 0.10); },
  burn()   { tone(220, 0.3, 'sawtooth', 0.10); tone(147, 0.35, 'sawtooth', 0.10, 0.12); },
  win()    { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.14, i * 0.11)); },
  lose()   { [392, 330, 262].forEach((f, i) => tone(f, 0.28, 'triangle', 0.12, i * 0.14)); },
  tick()   { tone(1200, 0.04, 'square', 0.05); },
};
