"use client";

let muted = false;
let ctx: AudioContext | null = null;

export function setMuted(m: boolean) {
  muted = m;
}

function ac(): AudioContext | null {
  if (muted) return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function beep(freq: number, dur = 0.08, type: OscillatorType = "sine", vol = 0.15, slide = 0) {
  const c = ac();
  if (!c) return;
  try {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, c.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), c.currentTime + dur);
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start();
    o.stop(c.currentTime + dur);
  } catch {}
}

function seq(notes: number[], step = 0.09, type: OscillatorType = "sine") {
  notes.forEach((f, i) => setTimeout(() => beep(f, 0.12, type, 0.16), i * step * 1000));
}

export const sfx = {
  click() {
    beep(600 + Math.random() * 400, 0.06, "sine", 0.08, 200);
  },
  crit() {
    beep(880, 0.1, "square", 0.12, 440);
    setTimeout(() => beep(1320, 0.12, "sine", 0.12), 60);
  },
  mega() {
    seq([523, 659, 784, 1046, 1318], 0.07, "sawtooth");
  },
  frenzy() {
    seq([392, 523, 659, 784], 0.08, "square");
  },
  golden() {
    seq([1046, 1318, 1568], 0.08, "sine");
  },
  gachaTick() {
    beep(300 + Math.random() * 500, 0.05, "square", 0.06);
  },
  gachaWin(rarity: string) {
    if (rarity === "Mythic") seq([523, 659, 784, 1046, 1318, 1568, 2093], 0.09, "sawtooth");
    else if (rarity === "Legendary") seq([523, 659, 784, 1046, 1568], 0.09, "square");
    else if (rarity === "Epic") seq([523, 784, 1046], 0.1, "square");
    else seq([659, 880], 0.1, "sine");
  },
  buy() {
    beep(440, 0.08, "triangle", 0.14, 220);
  },
  coin() {
    beep(988, 0.08, "square", 0.1);
    setTimeout(() => beep(1319, 0.15, "square", 0.1), 70);
  },
  levelup() {
    seq([523, 659, 784, 1046], 0.1, "triangle");
  },
  prestige() {
    seq([262, 392, 523, 659, 784, 1046, 1318], 0.12, "sine");
  },
};
