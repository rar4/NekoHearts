"use client";

// Static voice clips: pre-generated cute-girl TTS mp3s in public/voices/.
// One signature line per girl. A clip plays ONLY when its line is on screen,
// and playback NEVER interrupts itself: a new line waits its turn
// (latest-wins for the waiting slot, so fast clicking can't build a backlog).

interface GirlClip {
  src: string;
  keys: string[]; // lowercase fragments identifying the line
  click: boolean; // may appear in the click dialogue rotation
  say: (name: string) => string; // exact on-screen line for this clip
}

const CLIPS: Record<string, GirlClip> = {
  yuki: {
    src: "/voices/yuki-click-me.mp3",
    keys: ["every click makes my heart beat faster"],
    click: true,
    say: (n) => `${n}: C-click me, senpai... every click makes my heart beat faster~ 💓`,
  },
  mimi: {
    src: "/voices/mimi-encore.mp3",
    keys: ["click for an encore"],
    click: true,
    say: (n) => `${n}: Mimi-tan is on stage! Click for an encore~ 🎤💖`,
  },
  sakura: {
    src: "/voices/sakura-petals.mp3",
    keys: ["your clicks scatter my heart"],
    click: true,
    say: (n) => `${n}: Like petals in the wind... your clicks scatter my heart 🌸`,
  },
  neko: {
    src: "/voices/neko-purrfect.mp3",
    keys: ["purrfect"],
    click: true,
    say: (n) => `${n}: Nyaa~! Right there, senpai! That combo feels purrfect~ 🐱💖`,
  },
  rin: {
    src: "/voices/rin-tsundere.mp3",
    keys: ["not like i like your clicks"],
    click: true,
    say: (n) => `${n}: I-it's not like I like your clicks or anything... b-baka! ///// 🔥`,
  },
  luna: {
    src: "/voices/luna-miss-you.mp3",
    keys: ["i miss your clicks"],
    click: false, // neglect line — only speaks when she's actually lonely
    say: (n) => `${n}: Senpai... are you still there? I miss your clicks... 🥺`,
  },
  aiko: {
    src: "/voices/aiko-promise.mp3",
    keys: ["remember our promise"],
    click: true,
    say: (n) => `${n}: Senpai! Remember our promise? Click with me forever! 💙`,
  },
  celestia: {
    src: "/voices/celestia-devotion.mp3",
    keys: ["devotion ascends"],
    click: true,
    say: (n) => `${n}: Mortal senpai, your devotion ascends to the heavens~ ✨`,
  },
  akari: {
    src: "/voices/akari-isekai.mp3",
    keys: ["rebirthed worlds"],
    click: true,
    say: (n) => `${n}: You rebirthed worlds to meet me... now rule the isekai by my side 🌌`,
  },
};

let voiceMuted = false;
let unlocked = false;
let playing = false;
let nextUp: string | null = null;
let currentAudio: HTMLAudioElement | null = null;
// Id of the most recently STARTED clip. A clip never plays twice in a row.
let lastStartedId: string | null = null;
const cache: Record<string, HTMLAudioElement> = {};

export function setVoiceMuted(m: boolean) {
  voiceMuted = m;
  if (m) {
    nextUp = null;
    // Explicit user mute is the only thing allowed to stop audio.
    try {
      if (currentAudio) currentAudio.pause();
    } catch {}
    playing = false;
  }
}

// Call from any user gesture (click/tap/key). Preloads the clips.
export function unlockVoiceAudio() {
  if (typeof window === "undefined") return;
  unlocked = true;
  try {
    Object.keys(CLIPS).forEach((id) => {
      if (!cache[id]) {
        const a = new Audio(CLIPS[id].src);
        a.preload = "auto";
        cache[id] = a;
      }
    });
  } catch {}
}

function audioFor(id: string): HTMLAudioElement | null {
  try {
    if (cache[id]) return cache[id];
    const a = new Audio(CLIPS[id].src);
    a.preload = "auto";
    cache[id] = a;
    return a;
  } catch {
    return null;
  }
}

function playId(id: string, force = false) {
  if (voiceMuted) return;
  if (typeof window === "undefined") return;
  if (!unlocked) return;
  // No repeats: the same clip never plays twice in a row
  // (unless explicitly forced, e.g. the replay button).
  if (!force && id === lastStartedId) return;
  // Busy: remember only the newest waiting line. The current clip
  // always plays to the end — it is never paused or cut.
  if (playing) {
    nextUp = id;
    return;
  }
  const a = audioFor(id);
  if (!a) return;
  playing = true;
  currentAudio = a;
  const prevStarted = lastStartedId;
  lastStartedId = id;
  try {
    a.currentTime = 0;
  } catch {}
  const done = () => {
    playing = false;
    if (currentAudio === a) currentAudio = null;
    if (nextUp && !voiceMuted) {
      const n = nextUp;
      nextUp = null;
      playId(n);
    } else {
      nextUp = null;
    }
  };
  a.onended = done;
  a.onerror = done;
  try {
    const p = a.play();
    if (p && typeof (p as Promise<void>).catch === "function") {
      (p as Promise<void>).catch(() => {
        playing = false;
        // Didn't actually play — allow it again later.
        if (lastStartedId === id) lastStartedId = prevStarted;
      });
    }
  } catch {
    playing = false;
    if (lastStartedId === id) lastStartedId = prevStarted;
  }
}

function matchClip(girlId: string, rawLine: string): string | null {
  const c = CLIPS[girlId];
  if (!c) return null;
  const t = rawLine.toLowerCase();
  for (const k of c.keys) {
    if (t.indexOf(k) !== -1) return girlId;
  }
  return null;
}

export function lineHasClip(girlId: string, rawLine: string): boolean {
  return matchClip(girlId, rawLine) !== null;
}

// Play the clip for this line, if it has one. Otherwise silent.
// force=true bypasses the no-repeat rule (explicit replay / preview).
export function playLine(girlId: string, rawLine: string, force = false) {
  const id = matchClip(girlId, rawLine);
  if (id) playId(id, force);
}

// Signature line usable in the click rotation (null when the girl's only
// clip doesn't fit active clicking, e.g. Luna's lonely line).
export function clickSignatureSay(girlId: string, girlName: string): string | null {
  const c = CLIPS[girlId];
  if (!c || !c.click) return null;
  return c.say(girlName);
}

// Any signature line (gacha intros, voice preview).
export function signatureSay(girlId: string, girlName: string): string | null {
  const c = CLIPS[girlId];
  if (!c) return null;
  return c.say(girlName);
}
