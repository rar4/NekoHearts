"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import GirlImage from "../components/GirlImage";
import { GirlMood, GIRL_MOODS } from "../components/AnimeGirl";
import EmotionGirl from "../components/EmotionGirl";
import { GIRLS, RARITY_COLOR, rollGirl, GirlDef } from "../lib/girls";
import { sfx, setMuted } from "../lib/sound";
import { preloadCritical, preloadRest } from "../lib/preload";
import LoadingScreen from "../components/LoadingScreen";
import { playLine, lineHasClip, clickSignatureSay, signatureSay, unlockVoiceAudio, setVoiceMuted } from "../lib/voiceAudio";

type Owned = Record<string, number>;
type Bond = Record<string, number>;

interface FloatNum { id: number; x: number; y: number; text: string; color: string; big: boolean }
interface Toast { id: number; title: string; desc: string; color: string }
interface Golden { id: number; x: number; y: number; expires: number }

type Tab = "shop" | "gacha" | "quests" | "girls" | "pass" | "vip";

interface Save {
  hearts: number; totalHearts: number; totalClicks: number;
  gems: number; prestiges: number; rolls: number;
  owned: Owned; bond: Bond; selected: string;
  upgrades: Record<string, number>;
  gemShop: Record<string, number>;
  claimed: string[]; lastSeen: number; streak: number; lastDaily: string;
  pity: number; pityLegend: number; bpXp: number; bpClaimed: number[];
  muted: boolean; voiceMuted?: boolean;
}

// Battle Pass — 20 levels, XP from playing, free track rewards (grindier, but juicier)
const BP_LEVELS = Array.from({ length: 20 }, (_, i) => {
  const lvl = i + 1;
  const need = lvl * 1200; // cumulative xp needed (was 800 — 1.5x grindier)
  const hearts = 1500 * lvl; // was 500*lvl — 3x payout to stay addictive
  const gems = lvl % 5 === 0 ? lvl / 5 : 0;
  return { lvl, need, hearts, gems };
});

const SAVE_KEY = "neko-hearts-v1";

// ---- mobile: single hook for responsive sizes + lightweight bg ----
function useMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 720px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return { isMobile, girlSize: isMobile ? 232 : 300, bgCount: isMobile ? 6 : 14 };
}
const fmt = (n: number) => {
  if (n < 1000) return Math.floor(n).toString();
  const u = ["K", "M", "B", "T", "Qa", "Qi"];
  let v = n, i = -1;
  while (v >= 1000 && i < u.length - 1) { v /= 1000; i++; }
  return v.toFixed(v < 10 ? 2 : 1) + u[i];
};

const UPGRADES = [
  { id: "finger", name: "💪 Senpai Fingers", desc: "+1 base click power", base: 1500, growth: 2.1, max: 200 },
  { id: "crit", name: "💘 Doki-Doki Charm", desc: "+2% crit chance (x10 dmg)", base: 12000, growth: 2.7, max: 15 },
  { id: "combo", name: "🔥 Combo Lessons", desc: "+18% combo multiplier", base: 9000, growth: 2.45, max: 50 },
  { id: "idol", name: "🎤 Idol Contract", desc: "+30% idle hearts/sec", base: 7500, growth: 2.35, max: 100 },
  { id: "gold", name: "🌟 Golden Luck", desc: "Golden hearts appear more often", base: 20000, growth: 2.9, max: 10 },
  { id: "love", name: "💝 Bond Perfume", desc: "+25% bond XP + affection bonus", base: 15000, growth: 2.5, max: 30 },
];

// 💎 GEM SHOP — donate currency. Permanent, survives prestige. Whale-priced on purpose.
const GEM_SHOP = [
  { id: "soul", name: "💖 Soulmate Contract", desc: "+50% ALL hearts per level (click + idle). The ultimate whale flex.", costs: [30, 90, 200], tag: "🐋 WHALE", color: "#ff00d4" },
  { id: "auto", name: "🤖 Neko Auto-Clicker", desc: "+1 free auto-click/sec per level (uses your click power, even offline-minded).", costs: [10, 25, 50, 100, 200], tag: "🔥 ADDICTIVE", color: "#4da6ff" },
  { id: "godcrit", name: "💥 Crit God Blessing", desc: "+5% crit chance, +0.5% MEGA chance, +50x MEGA dmg per level.", costs: [20, 55, 130], tag: "🎰 GAMBLE", color: "#ffbe0b" },
  { id: "overdrive", name: "🔥 Eternal Frenzy", desc: "+4s frenzy duration & +1x frenzy power per level. Stay in the hot state.", costs: [8, 25, 60], tag: "🔥 ADDICTIVE", color: "#ff8f00" },
  { id: "whale", name: "🐋 Golden Whale", desc: "Goldens spawn +80%/lvl, worth +100%/lvl, last +6s/lvl.", costs: [12, 35, 90], tag: "🌟 FOMO", color: "#ffd60a" },
  { id: "saver", name: "🛟 Combo Saver", desc: "Combo window 2s → 3.5s → 5s. Never lose your streak again.", costs: [18, 45], tag: "😱 NO LOSS", color: "#4ade80" },
  { id: "luna", name: "🌙 Luna's Blessing", desc: "Offline rate 50%→75%→100%, cap 8h→16h→24h. She grinds while you sleep.", costs: [25, 70], tag: "🌙 IDLE", color: "#b366ff" },
];
const GEM_DIVINE_COST = 8;
const GEM_WARP_COST = 6;

const QUESTS = [
  { id: "q1", name: "First Doki-Doki", desc: "Click 25 times", need: 25, reward: 400, check: (s: Save) => s.totalClicks },
  { id: "q2", name: "Warming Up", desc: "Click 200 times", need: 200, reward: 3000, check: (s: Save) => s.totalClicks },
  { id: "q3", name: "Finger Destroyer", desc: "Click 1,000 times", need: 1000, reward: 20000, check: (s: Save) => s.totalClicks },
  { id: "q4", name: "First Date", desc: "Own 2 girls", need: 2, reward: 1500, check: (s: Save) => Object.keys(s.owned).length },
  { id: "q5", name: "Harem Start", desc: "Own 4 girls", need: 4, reward: 10000, check: (s: Save) => Object.keys(s.owned).length },
  { id: "q6", name: "Collector", desc: "Pull gacha 10x", need: 10, reward: 15000, check: (s: Save) => s.rolls },
  { id: "q7", name: "Rich Senpai", desc: "Earn 50K lifetime hearts", need: 50000, reward: 10000, check: (s: Save) => s.totalHearts },
  { id: "q8", name: "Millionaire Waifu", desc: "Earn 1.5M lifetime hearts", need: 1500000, reward: 80000, check: (s: Save) => s.totalHearts },
  { id: "q9", name: "True Love", desc: "Reach bond Lv.5 with any girl", need: 5, reward: 18000, check: (s: Save) => Math.max(0, ...Object.values(s.bond)) },
  { id: "q10", name: "Combo God", desc: "Own 6 girls", need: 6, reward: 35000, check: (s: Save) => Object.keys(s.owned).length },
  { id: "q11", name: "Isekai Traveler", desc: "Prestige once", need: 1, reward: 0, check: (s: Save) => s.prestiges },
  { id: "q12", name: "Addicted", desc: "Click 5,000 times", need: 5000, reward: 120000, check: (s: Save) => s.totalClicks },
];

function freshSave(): Save {
  return {
    hearts: 0, totalHearts: 0, totalClicks: 0, gems: 0, prestiges: 0, rolls: 0,
    owned: { yuki: 1 }, bond: { yuki: 0 }, selected: "yuki",
    upgrades: {}, gemShop: {}, claimed: [], lastSeen: Date.now(), streak: 0, lastDaily: "",
    pity: 0, pityLegend: 0, bpXp: 0, bpClaimed: [], muted: false, voiceMuted: false,
  };
}
function loadSave(): Save {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return freshSave();
    return { ...freshSave(), ...JSON.parse(raw) };
  } catch { return freshSave(); }
}

export default function Page() {
  const [s, setS] = useState<Save>(freshSave);
  const [loaded, setLoaded] = useState(false);
  const [combo, setCombo] = useState(0);
  const [frenzy, setFrenzy] = useState(0);
  const [floats, setFloats] = useState<FloatNum[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [goldens, setGoldens] = useState<Golden[]>([]);
  const [tab, setTab] = useState<Tab>("shop");
  // ---- mobile bottom-nav: clicker is its own screen, shop/gacha/etc are separate menu screens ----
  const [mScreen, setMScreen] = useState<"clicker" | Tab>("clicker");
  const goMobile = (s: "clicker" | Tab) => {
    setMScreen(s);
    if (s !== "clicker") setTab(s);
    try { window.scrollTo({ top: 0 }); } catch {}
  };
  const [gachaAnim, setGachaAnim] = useState<null | { rolling: boolean; result?: GirlDef; isNew?: boolean }>(null);
  const [dialogue, setDialogue] = useState("Yuki: C-click me, senpai... every click makes my heart beat faster~ 💓");
  const [squish, setSquish] = useState(false);
  const [shake, setShake] = useState(0);
  // ---- living emotions: she reacts to clicks, combos, neglect & affection ----
  const [mood, setMood] = useState<GirlMood>("smile");
  const [previewMood, setPreviewMood] = useState<GirlMood>("smile");
  const moodTimer = useRef<any>(null);
  const lastClickAt = useRef(Date.now());
  const flashMood = (m: GirlMood, ms = 1400, fallback: GirlMood = "smile") => {
    setMood(m);
    if (moodTimer.current) clearTimeout(moodTimer.current);
    moodTimer.current = setTimeout(() => setMood(fallback), ms);
  };
  const [offlineMsg, setOfflineMsg] = useState("");
  const [assets, setAssets] = useState({ loaded: 0, total: 1, done: false });
  const comboTimer = useRef<any>(null);
  const idRef = useRef(1);
  const sRef = useRef(s);
  sRef.current = s;
  const { isMobile, girlSize, bgCount } = useMobile();

  // ---- derived stats (EXPENSIVE economy, JUICED payouts to stay addictive) ----
  const stats = useMemo(() => {
    const up = (id: string) => s.upgrades[id] ?? 0;
    const gs = (id: string) => (s.gemShop ?? {})[id] ?? 0;
    const girl = GIRLS.find((g) => g.id === s.selected) ?? GIRLS[0];
    const soulMult = 1 + gs("soul") * 0.5;
    const overdriveLvl = gs("overdrive");
    const whaleLvl = gs("whale");
    const godcritLvl = gs("godcrit");
    const saverLvl = gs("saver");
    const autoLvl = gs("auto");
    const ownedCps = GIRLS.reduce((sum, g) => sum + (s.owned[g.id] ?? 0) * g.cps, 0);
    const idolMult = 1 + up("idol") * 0.3;
    const cps = ownedCps * idolMult * (1 + s.gems * 0.15) * (1 + s.prestiges * 0.08) * soulMult;
    const comboMult = (combo >= 100 ? 8 : combo >= 50 ? 5 : combo >= 25 ? 3 : combo >= 10 ? 2 : 1) * (1 + up("combo") * 0.18);
    const frenzyMult = frenzy > 0 ? 3 + overdriveLvl : 1;
    const prestigeMult = (1 + s.gems * 0.15 + s.prestiges * 0.08) * soulMult;
    const bondLvl = Math.floor(Math.sqrt((s.bond[s.selected] ?? 0) / 20));
    const bondMult = 1 + bondLvl * 0.05 * (1 + up("love") * 0.25);
    const baseClick = (1 + up("finger")) * girl.clickMult;
    const clickPower = baseClick * comboMult * frenzyMult * prestigeMult * bondMult;
    const critChance = 0.08 + up("crit") * 0.02 + godcritLvl * 0.05;
    const megaChance = 0.01 + godcritLvl * 0.005;
    const megaMult = 100 + godcritLvl * 50;
    const comboWindow = 2 + saverLvl * 1.5;
    const frenzyTime = 12 + overdriveLvl * 4;
    const level = Math.floor(Math.sqrt(s.totalHearts / 1200)) + 1;
    const levelProg = (() => {
      const cur = (level - 1) * (level - 1) * 1200;
      const nxt = level * level * 1200;
      return Math.min(1, (s.totalHearts - cur) / Math.max(1, nxt - cur));
    })();
    const gachaCost = Math.floor(2500 * Math.pow(1.9, s.rolls * 0.65));
    return { up, gs, girl, cps, comboMult, frenzyMult, prestigeMult, bondLvl, bondMult, clickPower, critChance, megaChance, megaMult, comboWindow, frenzyTime, soulMult, overdriveLvl, whaleLvl, godcritLvl, saverLvl, autoLvl, level, levelProg, gachaCost, ownedCps };
  }, [s, combo, frenzy]);

  // ---- load + offline earnings (Luna's Blessing boosts rate + cap) ----
  useEffect(() => {
    const sv = loadSave();
    if (!sv.gemShop) (sv as Save).gemShop = {};
    const lunaLvl = (sv.gemShop ?? {})["luna"] ?? 0;
    const offRate = [0.5, 0.75, 1.0][Math.min(2, lunaLvl)] ?? 0.5;
    const offCap = [8 * 3600, 16 * 3600, 24 * 3600][Math.min(2, lunaLvl)] ?? 8 * 3600;
    const awaySec = Math.min(offCap, Math.max(0, (Date.now() - (sv.lastSeen || Date.now())) / 1000));
    const soulMult = 1 + (((sv.gemShop ?? {})["soul"] ?? 0) * 0.5);
    const approxCps = GIRLS.reduce((sum, g) => sum + (sv.owned[g.id] ?? 0) * g.cps, 0) * (1 + (sv.upgrades["idol"] ?? 0) * 0.3) * soulMult;
    if (awaySec > 60 && approxCps > 0) {
      const gain = Math.floor(awaySec * approxCps * offRate);
      sv.hearts += gain; sv.totalHearts += gain;
      setOfflineMsg(`🌙 Luna guarded your harem while you were away (${Math.floor(awaySec / 60)} min) → +${fmt(gain)} hearts!`);
    }
    setS(sv); setLoaded(true);
    setMuted(!!sv.muted);
    setVoiceMuted(!!sv.muted || !!(sv as Save).voiceMuted);
    // Gate the game on preloaded portraits so images never flash black.
    // Remaining expressions keep warming in the background after start.
    // Failsafe: never trap the player on the loader — start anyway after 12s.
    const sel = sv.selected ?? "yuki";
    const gate = preloadCritical(sel, (loaded, total) =>
      setAssets({ loaded, total, done: false })
    );
    void Promise.race([
      gate,
      new Promise<void>((res) => setTimeout(res, 12000)),
    ]).then(() => {
      setAssets((a) => ({ ...a, done: true }));
      preloadRest(sel);
    });
  }, []);

  // ---- voice clips: browsers require a user gesture before any audio ----
  useEffect(() => {
    const h = () => unlockVoiceAudio();
    window.addEventListener("pointerdown", h);
    window.addEventListener("keydown", h);
    return () => {
      window.removeEventListener("pointerdown", h);
      window.removeEventListener("keydown", h);
    };
  }, []);

  // Show a dialogue line + play its voice clip when it has one.
  // The clip always plays to the end — never cut off (see lib/voiceAudio.ts).
  const say = (girlId: string, fullLine: string) => {
    setDialogue(fullLine);
    try { unlockVoiceAudio(); playLine(girlId, fullLine); } catch {}
  };

  useEffect(() => {
    if (!loaded) return;
    const t = setInterval(() => {
      setS((prev) => ({ ...prev, lastSeen: Date.now() }));
      localStorage.setItem(SAVE_KEY, JSON.stringify({ ...sRef.current, lastSeen: Date.now() }));
    }, 5000);
    return () => clearInterval(t);
  }, [loaded]);

  // ---- idle tick (auto-clicker + golden FOMO) ----
  useEffect(() => {
    if (!loaded) return;
    const t = setInterval(() => {
      const autoLvl = (sRef.current.gemShop ?? {})["auto"] ?? 0;
      const whaleLvl = (sRef.current.gemShop ?? {})["whale"] ?? 0;
      const gain = stats.cps / 10;
      const autoGain = autoLvl > 0 ? (stats.clickPower / 10) * autoLvl : 0;
      const total = gain + autoGain;
      if (total > 0) setS((p) => ({ ...p, hearts: p.hearts + total, totalHearts: p.totalHearts + total, bpXp: p.bpXp + total * 0.03 }));
      setFrenzy((f) => Math.max(0, f - 0.1));
      // golden hearts spawn (variable-ratio surprise! + whale boost)
      const luck = (1 + (sRef.current.upgrades["gold"] ?? 0) * 0.35) * (1 + whaleLvl * 0.8);
      if (Math.random() < 0.008 * luck && goldens.length < 2 + Math.min(2, whaleLvl)) {
        const id = idRef.current++;
        const life = 12000 + whaleLvl * 6000;
        setGoldens((g) => [...g, { id, x: 10 + Math.random() * 80, y: 5 + Math.random() * 60, expires: Date.now() + life }]);
        setTimeout(() => setGoldens((g) => g.filter((x) => x.id !== id)), life);
      }
    }, 100);
    return () => clearInterval(t);
  }, [loaded, stats.cps, stats.clickPower, goldens.length]);

  const pushToast = (title: string, desc: string, color = "#ff5d8f") => {
    const id = idRef.current++;
    setToasts((t) => [...t.slice(-2), { id, title, desc, color }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  };

  // ---- CLICK (the core addiction loop — juiced to afford the expensive shop) ----
  // Pointer-first: onPointerDown fires instantly on touch (no click delay)
  // and per-finger for multi-touch. clientX/Y works for mouse+touch.
  const doClick = (e: React.PointerEvent<HTMLElement> | React.MouseEvent<HTMLElement>) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const roll = Math.random();
    const isMega = roll < stats.megaChance;
    const isCrit = !isMega && roll < stats.critChance;
    const mult = isMega ? stats.megaMult : isCrit ? 10 : 1;
    const gain = Math.max(1, stats.clickPower * mult);
    const newCombo = combo + 1;

    setCombo(newCombo);
    lastClickAt.current = Date.now();
    if (comboTimer.current) clearTimeout(comboTimer.current);
    comboTimer.current = setTimeout(() => {
      setCombo((c) => {
        // combo broke — she gets sad if you dropped a good streak (loss aversion hook)
        if (c >= 10) {
          flashMood("sad", 2200);
          setDialogue(`${stats.girl.name}: N-nooo... our ${c} combo broke... hold me again, senpai? 🥺`);
        }
        return 0;
      });
    }, stats.comboWindow * 1000);

    // frenzy trigger — the "hot state" hook (earlier now, to keep hope alive vs high prices)
    if (newCombo === 25) {
      setFrenzy(stats.frenzyTime);
      sfx.frenzy();
      pushToast("🔥 FRENZY TIME!", `x${3 + stats.overdriveLvl} hearts for ${stats.frenzyTime} seconds! KEEP CLICKING!`, "#ff8f00");
    }
    // ---- living emotion reactions (the addictive part: she FEELS your clicks) ----
    if (isMega) flashMood("dizzy", 1800, frenzy > 0 ? "frenzy" : "love");
    else if (isCrit) flashMood("wow", 1300, frenzy > 0 ? "frenzy" : "smile");
    else if (frenzy > 0 || newCombo >= 25) setMood("frenzy");
    else if (newCombo >= 50) setMood("love");
    else if (newCombo >= 10) setMood("happy");
    else if (Math.random() < 0.08) {
      // shy girls get flustered when you click fast out of nowhere — timid!
      flashMood(stats.girl.id === "rin" ? "pout" : "timid", 1500);
      setDialogue(`${stats.girl.name}: K-kyah! Too fast, senpai... you're making me all flustered... 🥺💓`);
    } else flashMood("happy", 900);
    // combo milestones — engineered near-wins.
    // Big ones (50+) are valuable: she speaks her voiced line in celebration.
    if ([10, 25, 50, 100, 250, 500].includes(newCombo)) {
      const bonus = gain * 8;
      setS((p) => ({ ...p, hearts: p.hearts + bonus, totalHearts: p.totalHearts + bonus }));
      pushToast(`⚡ ${newCombo} COMBO!`, `Combo bonus +${fmt(bonus)} hearts`, "#ffbe0b");
      if (newCombo >= 50) {
        const sig = clickSignatureSay(stats.girl.id, stats.girl.name);
        if (sig) say(stats.girl.id, sig);
      }
    }

    setS((p) => {
      const b = { ...p.bond };
      b[p.selected] = (b[p.selected] ?? 0) + 1 + Math.floor((p.upgrades["love"] ?? 0) * 0.25);
      const prevLvl = Math.floor(Math.sqrt((p.bond[p.selected] ?? 0) / 20));
      const newLvl = Math.floor(Math.sqrt((b[p.selected] ?? 0) / 20));
      if (newLvl > prevLvl) {
        setTimeout(() => {
          const g = GIRLS.find((x) => x.id === p.selected);
          const t = g?.dialogues[newLvl % g.dialogues.length] ?? "Doki doki!";
          pushToast(`💝 ${g?.name} Bond Lv.${newLvl}!`, t, "#ff5d8f");
          // Bond level-ups are precious: if her level-up line is her voiced
          // line, she says it out loud (rare, never twice in a row).
          if (g) {
            const full = `${g.name}: ${t}`;
            if (lineHasClip(g.id, full)) say(g.id, full);
          }
        }, 50);
      }
      return {
        ...p,
        hearts: p.hearts + gain,
        totalHearts: p.totalHearts + gain,
        totalClicks: p.totalClicks + 1,
        bpXp: p.bpXp + 8,
      };
    });
    if (isMega) { sfx.mega(); setShake(idRef.current); }
    else if (isCrit) { sfx.crit(); setShake(idRef.current); }
    else sfx.click();

    const id = idRef.current++;
    setFloats((f) => [...f.slice(-24), {
      id, x, y,
      text: (isMega ? "MEGA +" : isCrit ? "CRIT +" : "+") + fmt(gain),
      color: isMega ? "#ff00d4" : isCrit ? "#ffbe0b" : "#fff",
      big: isMega || isCrit,
    }]);
    setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 1000);

    setSquish(true);
    setTimeout(() => setSquish(false), 90);

    // parasocial dialogue — she "notices" you (intermittent reward).
    // Her voiced signature line is a RARE treat (~1% of clicks), never twice in a row.
    if (Math.random() < 0.12 || isMega) {
      const g = stats.girl;
      let line: string;
      if (isMega) {
        line = `${g.name}: KYAAA~! MEGA CRIT! You're incredible, senpai!! 💥💖`;
      } else if (isCrit) {
        line = `${g.name}: Sugoi! Critical doki-doki~! 💘`;
      } else {
        const sig = clickSignatureSay(g.id, g.name);
        if (sig && Math.random() < 0.08) line = sig;
        else line = `${g.name}: ${g.dialogues[Math.floor(Math.random() * g.dialogues.length)]}`;
      }
      say(g.id, line);
    }
  };

  const claimGolden = (id: number) => {
    const whaleLvl = (sRef.current.gemShop ?? {})["whale"] ?? 0;
    const bonus = Math.max(stats.cps * 45, stats.clickPower * 25, 500) * (1 + whaleLvl);
    sfx.golden();
    setS((p) => ({ ...p, hearts: p.hearts + bonus, totalHearts: p.totalHearts + bonus, bpXp: p.bpXp + 40 }));
    setGoldens((g) => g.filter((x) => x.id !== id));
    const fid = idRef.current++;
    setFloats((f) => [...f, { id: fid, x: 150, y: 100, text: "GOLDEN +" + fmt(bonus), color: "#ffd60a", big: true }]);
    pushToast("🌟 GOLDEN HEART!", `+${fmt(bonus)} bonus hearts! Lucky~`, "#ffd60a");
  };

  // ---- neglect system (tamagotchi hook): ignore her and she gets sleepy, then sad ----
  useEffect(() => {
    if (!loaded) return;
    const t = setInterval(() => {
      const idleSec = (Date.now() - lastClickAt.current) / 1000;
      if (idleSec > 25) {
        setMood((m) => (m === "sad" ? m : "sad"));
        const gid = sRef.current.selected;
        const gnow = GIRLS.find((x) => x.id === gid) ?? stats.girl;
        const line = `${gnow.name}: Senpai... are you still there? I miss your clicks... 🥺`;
        // Speak once per neglect episode: only queue audio when the text changes.
        setDialogue((d) => {
          if (d === line || d.startsWith(gnow.name + ": *yawn*") || d.startsWith(gnow.name + ": Senpai...")) return d;
          setTimeout(() => { try { unlockVoiceAudio(); playLine(gnow.id, line); } catch {} }, 0);
          return line;
        });
      } else if (idleSec > 12) {
        setMood((m) => (m === "sleepy" || m === "sad" ? m : "sleepy"));
      }
    }, 2000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  // ---- affection interactions: pet / tease / hug — tiny bonuses, big dopamine ----
  const interact = (kind: "pat" | "tease" | "hug") => {
    lastClickAt.current = Date.now();
    const g = stats.girl;
    if (kind === "pat") {
      const bonus = Math.max(1, stats.clickPower * 0.5);
      setS((p) => {
        const b = { ...p.bond };
        b[p.selected] = (b[p.selected] ?? 0) + 2;
        return { ...p, hearts: p.hearts + bonus, totalHearts: p.totalHearts + bonus, bond: b, bpXp: p.bpXp + 4 };
      });
      flashMood("happy", 1600);
      sfx.click();
      setDialogue(`${g.name}: Ehehe~ headpats feel nice... pat me more, senpai! 😊💓`);
    } else if (kind === "tease") {
      const bonus = Math.max(1, stats.clickPower * 0.3);
      setS((p) => {
        const b = { ...p.bond };
        b[p.selected] = (b[p.selected] ?? 0) + 1;
        return { ...p, hearts: p.hearts + bonus, totalHearts: p.totalHearts + bonus, bond: b, bpXp: p.bpXp + 4 };
      });
      flashMood(g.id === "rin" ? "pout" : "timid", 1800);
      sfx.gachaTick();
      setDialogue(g.id === "rin" ? `${g.name}: H-hmph! Teasing me again... b-baka! ...don't stop, okay? 😤💓` : `${g.name}: M-mou... don't tease me like that... my face is all red... 🥺💓`);
    } else {
      const bonus = Math.max(1, stats.clickPower * 1.2);
      setS((p) => {
        const b = { ...p.bond };
        b[p.selected] = (b[p.selected] ?? 0) + 3;
        return { ...p, hearts: p.hearts + bonus, totalHearts: p.totalHearts + bonus, bond: b, bpXp: p.bpXp + 6 };
      });
      flashMood(stats.bondLvl >= 3 ? "wink" : "love", 2000);
      sfx.golden();
      setDialogue(stats.bondLvl >= 3 ? `${g.name}: Senpai... that hug was everything... you're mine, okay? 😉💖` : `${g.name}: Kyaa~! So warm... my heart is pounding! 😍💖`);
    }
  };

  const moodLabel = GIRL_MOODS.find((m) => m.id === mood);

  // ---- GACHA with PITY (guaranteed dopamine) ----
  const pullGacha = () => {
    if (s.hearts < stats.gachaCost) return;
    setGachaAnim({ rolling: true });
    sfx.gachaTick();
    setS((p) => ({ ...p, hearts: p.hearts - stats.gachaCost }));
    // suspense animation — near-miss psychology
    let ticks = 0;
    const iv = setInterval(() => {
      ticks++;
      sfx.gachaTick();
      if (ticks < 8) {
        setGachaAnim({ rolling: true, result: GIRLS[Math.floor(Math.random() * GIRLS.length)] });
      } else {
        clearInterval(iv);
        // PITY: Epic+ guaranteed every 10 pulls, Legendary+ every 30 (kinder pity vs brutal prices)
        let result = rollGirl();
        const pity = (sRef.current.pity ?? 0) + 1;
        const pityLegend = (sRef.current.pityLegend ?? 0) + 1;
        if (pityLegend >= 30) {
          const pool = GIRLS.filter((g) => g.rarity === "Legendary" || g.rarity === "Mythic");
          result = pool[Math.floor(Math.random() * pool.length)];
        } else if (pity >= 10) {
          const pool = GIRLS.filter((g) => g.rarity === "Epic" || g.rarity === "Legendary" || g.rarity === "Mythic");
          result = pool[Math.floor(Math.random() * pool.length)];
        }
        sfx.gachaWin(result.rarity);
        if (result.rarity === "Legendary" || result.rarity === "Mythic") setShake(idRef.current);
        setS((p) => {
          const owned = { ...p.owned };
          const isNew = !owned[result.id];
          owned[result.id] = (owned[result.id] ?? 0) + 1;
          const bond = { ...p.bond };
          if (!isNew) bond[result.id] = (bond[result.id] ?? 0) + 25; // dupes → love shards
          const isEpicPlus = result.rarity === "Epic" || result.rarity === "Legendary" || result.rarity === "Mythic";
          const isLegendPlus = result.rarity === "Legendary" || result.rarity === "Mythic";
          return { ...p, owned, bond, rolls: p.rolls + 1, selected: isNew ? result.id : p.selected, bpXp: p.bpXp + 150, pity: isEpicPlus ? 0 : p.pity + 1, pityLegend: isLegendPlus ? 0 : p.pityLegend + 1 };
        });
        const ownedBefore = s.owned[result.id] ?? 0;
        setGachaAnim({ rolling: false, result, isNew: ownedBefore === 0 });
        if (ownedBefore === 0) pushToast(`💖 NEW GIRL: ${result.name}!`, `${result.title} joined your harem!`, RARITY_COLOR[result.rarity]);
        // New girl greets you OUT LOUD with her own voice clip.
        try {
          unlockVoiceAudio();
          const greet = signatureSay(result.id, result.name);
          if (greet) {
            setDialogue(greet);
            playLine(result.id, greet);
          }
        } catch {}
      }
    }, 120);
  };

  const buyUpgrade = (id: string) => {
    const u = UPGRADES.find((x) => x.id === id)!;
    const lvl = s.upgrades[id] ?? 0;
    if (lvl >= u.max) return;
    const cost = Math.floor(u.base * Math.pow(u.growth, lvl));
    if (s.hearts < cost) return;
    sfx.buy();
    setS((p) => ({ ...p, hearts: p.hearts - cost, upgrades: { ...p.upgrades, [id]: lvl + 1 }, bpXp: p.bpXp + 50 }));
  };

  const claimQuest = (qid: string, reward: number) => {
    sfx.coin();
    setS((p) => ({ ...p, hearts: p.hearts + reward, totalHearts: p.totalHearts + reward, claimed: [...p.claimed, qid], bpXp: p.bpXp + 80 }));
    pushToast("🎁 Quest complete!", `+${fmt(reward)} hearts claimed!`, "#4ade80");
  };

  const claimDaily = () => {
    const today = new Date().toDateString();
    if (s.lastDaily === today) return;
    const isStreak = new Date(Date.now() - 86400000).toDateString() === s.lastDaily;
    const streak = isStreak ? s.streak + 1 : 1;
    const reward = 1200 * streak * (1 + s.prestiges);
    sfx.coin();
    setS((p) => ({ ...p, hearts: p.hearts + reward, totalHearts: p.totalHearts + reward, streak, lastDaily: today, bpXp: p.bpXp + 120 }));
    pushToast(`📅 Day ${streak} login!`, `+${fmt(reward)} hearts. Come back tomorrow for more!`, "#4da6ff");
  };

  const claimBP = (lvl: number, hearts: number, gems: number) => {
    sfx.levelup();
    setS((p) => ({ ...p, hearts: p.hearts + hearts, totalHearts: p.totalHearts + hearts, gems: p.gems + gems, bpClaimed: [...(p.bpClaimed ?? []), lvl] }));
    pushToast(`🎫 Pass Lv.${lvl} claimed!`, `+${fmt(hearts)} hearts${gems ? ` +${gems} 💎` : ""}`, "#ffbe0b");
  };

  // ---- 💎 GEM SHOP (donate currency, permanent, survives prestige) ----
  const buyGemItem = (id: string) => {
    const item = GEM_SHOP.find((x) => x.id === id)!;
    const lvl = (s.gemShop ?? {})[id] ?? 0;
    if (lvl >= item.costs.length) return;
    const cost = item.costs[lvl];
    if (s.gems < cost) return;
    sfx.prestige();
    setS((p) => ({ ...p, gems: p.gems - cost, gemShop: { ...(p.gemShop ?? {}), [id]: lvl + 1 } }));
    pushToast(`💎 ${item.name} Lv.${lvl + 1}!`, lvl + 1 >= item.costs.length ? "MAXED! You absolute whale 🐋💖" : "Permanent boost — survives prestige. Next level costs more...", item.color);
  };

  const divinePull = () => {
    if (s.gems < GEM_DIVINE_COST) return;
    // Epic+ guaranteed, 30% Legendary/Mythic — instant dopamine, no waiting
    const r = Math.random();
    let pool = GIRLS.filter((g) => g.rarity === "Epic");
    if (r < 0.05) pool = GIRLS.filter((g) => g.rarity === "Mythic");
    else if (r < 0.3) pool = GIRLS.filter((g) => g.rarity === "Legendary");
    else if (r < 0.55) pool = GIRLS.filter((g) => g.rarity === "Epic" || g.rarity === "Legendary");
    else pool = GIRLS.filter((g) => g.rarity === "Epic" || g.rarity === "Rare");
    const result = pool[Math.floor(Math.random() * pool.length)] ?? GIRLS[4];
    sfx.gachaWin(result.rarity);
    if (result.rarity === "Legendary" || result.rarity === "Mythic") setShake(idRef.current);
    setS((p) => {
      const owned = { ...p.owned };
      const isNew = !owned[result.id];
      owned[result.id] = (owned[result.id] ?? 0) + 1;
      const bond = { ...p.bond };
      if (!isNew) bond[result.id] = (bond[result.id] ?? 0) + 25;
      return { ...p, gems: p.gems - GEM_DIVINE_COST, owned, bond, rolls: p.rolls + 1, selected: isNew ? result.id : p.selected, bpXp: p.bpXp + 150 };
    });
    pushToast(`🎰 DIVINE: ${result.emoji} ${result.name}!`, `${result.rarity} • ${result.title}`, RARITY_COLOR[result.rarity]);
  };

  const timeWarp = () => {
    if (s.gems < GEM_WARP_COST) return;
    const warpGain = Math.max(stats.cps * 4 * 3600, stats.clickPower * 500, 5000);
    sfx.levelup();
    setS((p) => ({ ...p, gems: p.gems - GEM_WARP_COST, hearts: p.hearts + warpGain, totalHearts: p.totalHearts + warpGain, bpXp: p.bpXp + 200 }));
    pushToast("⏳ TIME WARP!", `+${fmt(warpGain)} hearts (4h grind in 1 click)!`, "#4da6ff");
  };

  const toggleMute = () => {
    const m = !s.muted;
    setS((p) => ({ ...p, muted: m }));
    setMuted(m);
    setVoiceMuted(m || !!s.voiceMuted);
  };

  const toggleVoice = () => {
    const v = !(s.voiceMuted ?? false);
    setS((p) => ({ ...p, voiceMuted: v }));
    setVoiceMuted(v || !!s.muted);
    // Instant feedback: preview the CURRENT girl's own clip.
    if (!v && !s.muted) {
      try {
        unlockVoiceAudio();
        const preview = signatureSay(stats.girl.id, stats.girl.name);
        if (preview) {
          setDialogue(preview);
          playLine(stats.girl.id, preview, true);
        }
      } catch {}
    }
  };

  const canPrestige = s.totalHearts >= 500000;
  const prestigeGain = Math.floor(Math.sqrt(s.totalHearts / 300000));
  const doPrestige = () => {
    if (!canPrestige) return;
    if (!confirm(`Isekai rebirth? Reset hearts, girls & upgrades for ${prestigeGain} 💎 (+${prestigeGain * 15}% forever)? Akari is waiting...`)) return;
    sfx.prestige();
    setS((p) => ({
      ...freshSave(),
      gems: p.gems + prestigeGain,
      gemShop: p.gemShop ?? {},
      prestiges: p.prestiges + 1,
      totalHearts: 0, hearts: 0,
      streak: p.streak, lastDaily: p.lastDaily, muted: p.muted, voiceMuted: p.voiceMuted,
      bpXp: p.bpXp, bpClaimed: p.bpClaimed,
    }));
    setCombo(0);
    pushToast("🌌 ISEKAI REBIRTH!", `+${prestigeGain} gems. You are eternally stronger.`, "#b366ff");
  };

  const resetAll = () => {
    if (!confirm("Delete ALL progress? The girls will cry...")) return;
    localStorage.removeItem(SAVE_KEY);
    setS(freshSave());
  };

  if (!loaded || !assets.done) return <LoadingScreen loaded={assets.loaded} total={assets.total} />;

  const upgradeCost = (base: number, growth: number, lvl: number) => Math.floor(base * Math.pow(growth, lvl));

  return (
    <div key={shake} className={`app-shell${isMobile ? (mScreen === "clicker" ? " m-clicker" : " m-menu") : ""}`} style={{ animation: shake ? "shakeAnim .45s" : undefined }}>
      <style>{`@keyframes shakeAnim{0%,100%{transform:translate(0)}15%{transform:translate(-10px,4px) rotate(-1deg)}30%{transform:translate(9px,-6px) rotate(1deg)}45%{transform:translate(-7px,-4px)}60%{transform:translate(6px,5px)}80%{transform:translate(-3px,2px)}}`}</style>
      {/* falling hearts bg (fewer nodes on phones for smooth 60fps) */}
      <div className="bg-hearts" aria-hidden>
        {Array.from({ length: bgCount }).map((_, i) => (
          <div key={i} style={{ position: "absolute", left: `${(i * 73) % 100}%`, top: -30, animation: `heartFall ${7 + (i % 5) * 2}s linear ${i * 0.9}s infinite`, fontSize: 14 + (i % 3) * 8, opacity: 0.5 }}>
            {["💖", "💗", "✨", "🌸"][i % 4]}
          </div>
        ))}
      </div>

      {/* HEADER */}
      <div className="card header-card">
        <div>
          <div style={{ fontSize: 26, fontWeight: 900 }}>💖 NEKO HEARTS <span style={{ fontSize: 13, background: "linear-gradient(135deg,#ff00d4,#b366ff)", padding: "2px 10px", borderRadius: 99 }}>v3.0 💎VIP</span></div>
          <div style={{ opacity: 0.8, fontSize: 13 }}>Collect waifus • Build combos • Never stop clicking</div>
        </div>
        <div className="header-stats">
          <div><div style={{ fontSize: 12, opacity: 0.7 }}>💓 HEARTS</div><div style={{ fontSize: 28, fontWeight: 900, color: "#ff8fb3" }}>{fmt(s.hearts)}</div></div>
          <div><div style={{ fontSize: 12, opacity: 0.7 }}>⚡ PER CLICK</div><div style={{ fontSize: 22, fontWeight: 800 }}>{fmt(stats.clickPower)}</div></div>
          <div><div style={{ fontSize: 12, opacity: 0.7 }}>⏱ PER SEC</div><div style={{ fontSize: 22, fontWeight: 800, color: "#7ef0c9" }}>{fmt(stats.cps)}</div></div>
          <div><div style={{ fontSize: 12, opacity: 0.7 }}>💎 GEMS</div><div style={{ fontSize: 22, fontWeight: 800, color: "#c4b5fd" }}>{s.gems}</div></div>
          <button className="btn-pink" onClick={() => goMobile("vip")} style={{ padding: "8px 14px", fontSize: 13 }}>💎 VIP SHOP</button>
          <button className="btn-ghost" onClick={toggleMute} title="toggle all sound">{s.muted ? "🔇 muted" : "🔊 sound"}</button>
          <button className="btn-ghost" onClick={toggleVoice} title="toggle girl voice clips">{(s.voiceMuted || s.muted) ? "🎙 voice off" : "🎙 voice on"}</button>
        </div>
      </div>

      {/* LEVEL BAR — always almost leveling ( endowed progress effect ) */}
      <div className="card" style={{ marginTop: 12, padding: "10px 16px", zIndex: 1, position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
          <span>🎚 Senpai Lv.{stats.level} <span style={{ opacity: 0.6 }}>({fmt(s.totalClicks)} clicks • {fmt(s.totalHearts)} lifetime)</span></span>
          <span style={{ color: "#ffbe0b" }}>{Math.floor(stats.levelProg * 100)}% — SO CLOSE!</span>
        </div>
        <div className="progress"><div style={{ width: `${stats.levelProg * 100}%` }} /></div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, margin: "8px 0 4px" }}>
          <span>🎫 Pass S1: {(s.bpClaimed ?? []).length}/20 claimed • {fmt(s.bpXp ?? 0)} XP</span>
          <button className="btn-ghost" style={{ padding: "2px 10px", fontSize: 12 }} onClick={() => goMobile("pass")}>Open pass →</button>
        </div>
        <div className="progress"><div style={{ width: `${Math.min(100, ((s.bpXp ?? 0) / 24000) * 100)}%` }} /></div>
      </div>

      {offlineMsg && (
        <div className="card toast" style={{ marginTop: 12, padding: 12, borderColor: "#4da6ff", position: "relative", zIndex: 1 }}>
          {offlineMsg} <button className="btn-ghost" style={{ marginLeft: 8 }} onClick={() => setOfflineMsg("")}>Kyaa, thanks!</button>
        </div>
      )}

      <div className="main-grid">
        {/* LEFT: HAREM */}
        <div className="card panel-harem" style={{ padding: 14, alignSelf: "start" }}>
          <h3 style={{ margin: "0 0 4px" }}>💒 My Harem ({Object.keys(s.owned).length}/{GIRLS.length})</h3>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 10 }}>Each girl boosts clicks + idle. Dupes → Bond XP.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 560, overflowY: "auto" }} className="scroll-thin">
            {GIRLS.map((g) => {
              const n = s.owned[g.id] ?? 0;
              const locked = n === 0;
              const sel = s.selected === g.id;
              const blvl = Math.floor(Math.sqrt((s.bond[g.id] ?? 0) / 20));
              return (
                <div key={g.id} onClick={() => {
                  if (locked) return;
                  setS((p) => ({ ...p, selected: g.id }));
                  lastClickAt.current = Date.now();
                  flashMood("timid", 1600);
                  setDialogue(`${g.name}: E-eh? You chose me? ...I'm all shy now, but I'll do my best~ 🥺💓`);
                }}
                  style={{
                    display: "flex", gap: 10, alignItems: "center", padding: 8, borderRadius: 14,
                    background: sel ? "linear-gradient(135deg,#ff5d8f44,#b366ff44)" : "rgba(255,255,255,.05)",
                    border: sel ? "2px solid #ff5d8f" : "1px solid rgba(255,255,255,.12)",
                    opacity: locked ? 0.45 : 1, cursor: locked ? "not-allowed" : "pointer",
                  }}>
                  <div style={{ background: RARITY_COLOR[g.rarity] + "33", borderRadius: 12, padding: 2 }}>
                    {locked ? <div style={{ width: 56, height: 56, display: "grid", placeItems: "center", fontSize: 28 }}>🔒</div>
                      : <GirlImage girl={g} size={56} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{locked ? "???" : `${g.emoji} ${g.name}`} {n > 1 && <span style={{ color: "#ffbe0b" }}>x{n}</span>}</div>
                    <div style={{ fontSize: 11, color: RARITY_COLOR[g.rarity], fontWeight: 700 }}>{g.rarity} • x{g.clickMult} click • +{g.cps}/s</div>
                    {!locked && <div style={{ fontSize: 11, opacity: 0.75 }}>💝 Bond Lv.{blvl} ({s.bond[g.id] ?? 0} XP)</div>}
                  </div>
                </div>
              );
            })}
          </div>
          <button className="btn-ghost" style={{ marginTop: 10, width: "100%" }} onClick={claimDaily}>
            📅 Daily: {s.lastDaily === new Date().toDateString() ? `claimed (streak ${s.streak}🔥)` : `claim Day ${s.streak + 1} (+${fmt(1200 * (s.streak + 1) * (1 + s.prestiges))})`}
          </button>
        </div>

        {/* CENTER: CLICKER */}
        <div className="panel-clicker">
          <div className="card" style={{
            padding: "18px 14px 10px", textAlign: "center", position: "relative", overflow: "hidden",
            animation: frenzy > 0 ? "glowPulse 1s infinite, frenzyBg 2s infinite" : "glowPulse 3s infinite",
            borderColor: frenzy > 0 ? "#ff8f00" : "rgba(255,255,255,.15)",
          }}>
            {frenzy > 0 && <div style={{ background: "linear-gradient(90deg,#ff8f00,#ff0080)", fontWeight: 900, borderRadius: 99, display: "inline-block", padding: "4px 18px", marginBottom: 6 }}>🔥 FRENZY x{3 + stats.overdriveLvl} — {frenzy.toFixed(1)}s — DON'T STOP!</div>}
            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 4 }}>
              <span style={{ background: combo >= 50 ? "#ff0080" : combo >= 10 ? "#ff5d8f" : "rgba(255,255,255,.12)", padding: "4px 14px", borderRadius: 99, fontWeight: 800, fontSize: 14 }}>
                ⚡ COMBO {combo} {combo >= 10 && `(x${stats.comboMult.toFixed(2)})`}
              </span>
              <span style={{ background: "rgba(255,255,255,.12)", padding: "4px 14px", borderRadius: 99, fontWeight: 700, fontSize: 14 }}>🎯 CRIT {(stats.critChance * 100).toFixed(0)}%</span>
            </div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>Now clicking with <b style={{ color: "#ff8fb3" }}>{stats.girl.emoji} {stats.girl.name}</b> • Bond Lv.{stats.bondLvl} (x{stats.bondMult.toFixed(2)})</div>

            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 2, flexWrap: "wrap" }}>
              <span style={{ background: "rgba(255,255,255,.12)", padding: "4px 14px", borderRadius: 99, fontWeight: 800, fontSize: 14 }}>
                {moodLabel?.emoji} {moodLabel?.label}
              </span>
              <span style={{ background: RARITY_COLOR[stats.girl.rarity] + "33", border: `1px solid ${RARITY_COLOR[stats.girl.rarity]}`, padding: "4px 14px", borderRadius: 99, fontWeight: 700, fontSize: 14 }}>{stats.girl.rarity}</span>
            </div>
            <div
              className="girl-stage"
              onPointerDown={doClick}
              onContextMenu={(e) => e.preventDefault()}
              role="button"
              tabIndex={0}
              aria-label={`Click ${stats.girl.name} for hearts`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  doClick({ currentTarget: e.currentTarget, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 } as any);
                }
              }}
              style={{ position: "relative", display: "inline-block", marginTop: 6, maxWidth: "100%" }}
            >
              <div className="girl-responsive">
                <EmotionGirl girl={stats.girl} size={girlSize} mood={mood} squish={squish} sparkle={frenzy > 0 || combo >= 25} priority />
              </div>
              {(frenzy > 0 || combo >= 25) && (
                <div style={{ position: "absolute", inset: -14, pointerEvents: "none", fontSize: 26 }}>
                  <span style={{ position: "absolute", top: 0, left: 6 }}>✨</span>
                  <span style={{ position: "absolute", top: 10, right: 0 }}>💖</span>
                  <span style={{ position: "absolute", bottom: 10, right: 12 }}>✨</span>
                  <span style={{ position: "absolute", bottom: 0, left: 14 }}>💫</span>
                </div>
              )}
              <div style={{ marginTop: 8, fontSize: 13, fontWeight: 800, opacity: 0.9 }}>
                {mood === "frenzy" ? "🤩 FRENZY MODE — SHE'S OVERLOADED!" : mood === "love" ? "😍 MEGA DOKI-DOKI MODE!" : mood === "dizzy" ? "😵 MEGA CRIT — SHE'S SEEING STARS!" : mood === "wow" ? "😲 CRIT! SHE'S SHOCKED!" : mood === "timid" ? "🥺 S-she's all flustered..." : mood === "pout" ? "😤 H-hmph! Tsundere mode!" : mood === "sad" ? "😢 She misses you... click to cheer her up!" : mood === "sleepy" ? "😴 Shhh... she's dozing off. Click to wake her!" : mood === "wink" ? "😉 She only winks for YOU, senpai~" : combo >= 10 ? "😘 Feeling the love~" : "😊 Click me, senpai!"}
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 8, flexWrap: "wrap" }}>
                <button className="btn-ghost" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); interact("pat"); }} title="Headpat: small hearts + bond, she smiles">😊 Pat</button>
                <button className="btn-ghost" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); interact("tease"); }} title="Tease: she goes timid (or pouts if tsundere)">🥺 Tease</button>
                <button className="btn-ghost" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); interact("hug"); }} title="Hug: big love + bond, wink at high bond">💖 Hug</button>
              </div>
              {floats.map((f) => (
                <span key={f.id} className="float-num" style={{ left: f.x, top: f.y, color: f.color, fontSize: f.big ? 30 : 20 }}>{f.text}</span>
              ))}
              {goldens.map((g) => (
                <button key={g.id} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); claimGolden(g.id); }}
                  className="golden-btn"
                  style={{ position: "absolute", left: `${g.x}%`, top: `${g.y}%`, fontSize: 40, background: "none", border: "none", cursor: "pointer", animation: "pop .5s infinite", zIndex: 60 }}>🌟</button>
              ))}
            </div>

            <div style={{ fontSize: 15, minHeight: 44, background: "rgba(0,0,0,.3)", borderRadius: 12, padding: "8px 12px", margin: "6px 4px 0", fontStyle: "italic" }}>
              💬 {dialogue}
              {lineHasClip(stats.girl.id, dialogue) && !(s.voiceMuted || s.muted) && (
                <button className="btn-ghost" style={{ marginLeft: 8, padding: "2px 10px", fontSize: 12, fontStyle: "normal" }}
                  title="Hear her say it again"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); try { unlockVoiceAudio(); playLine(stats.girl.id, dialogue, true); } catch {} }}>
                  🔈 replay
                </button>
              )}
            </div>
            <div style={{ fontSize: 12, opacity: 0.65, marginTop: 6 }}>TIP: fast clicks build COMBO → FRENZY x{3 + stats.overdriveLvl}. Golden 🌟 spawn randomly — grab them! Crits x10, MEGA x{stats.megaMult}.{stats.autoLvl > 0 ? ` 🤖 Auto +${stats.autoLvl}/s active!` : ""}</div>
          </div>

          {/* toasts */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {toasts.map((t) => (
              <div key={t.id} className="card toast" style={{ padding: "10px 14px", borderLeft: `6px solid ${t.color}` }}>
                <b>{t.title}</b><div style={{ fontSize: 13, opacity: 0.85 }}>{t.desc}</div>
              </div>
            ))}
          </div>

          {/* prestige */}
          <div className="card" style={{ padding: 14, display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
            <div>
              <b>🌌 Isekai Rebirth (Prestige)</b>
              <div style={{ fontSize: 13, opacity: 0.75 }}>Reset everything, gain 💎 gems (+15% power each, forever). Requires 500K lifetime hearts. The ultimate sunk-cost hook.</div>
            </div>
            <button className="btn-pink" disabled={!canPrestige} onClick={doPrestige}>
              {canPrestige ? `Rebirth +${prestigeGain} 💎` : `Need ${fmt(500000 - s.totalHearts)} more hearts`}
            </button>
          </div>
        </div>

        {/* RIGHT: TABS */}
        <div className="card panel-tabs" style={{ padding: 14, alignSelf: "start" }}>
          <div className="tabs-bar">
            {(["shop", "gacha", "quests", "girls", "pass", "vip"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={tab === t ? "btn-pink tab-active" : "btn-ghost"} style={{ flex: 1, padding: "8px 4px", fontSize: 12, textTransform: "capitalize", border: t === "vip" ? "1px solid #ff00d4" : undefined }}>{t === "gacha" ? "🎰" : t === "shop" ? "🛒" : t === "quests" ? "📜" : t === "pass" ? "🎫" : t === "vip" ? "💎" : "🌸"} {t}</button>
            ))}
          </div>

          {tab === "shop" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {UPGRADES.map((u) => {
                const lvl = s.upgrades[u.id] ?? 0;
                const cost = upgradeCost(u.base, u.growth, lvl);
                const maxed = lvl >= u.max;
                return (
                  <div key={u.id} style={{ background: "rgba(255,255,255,.06)", borderRadius: 12, padding: 10 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{u.name} <span style={{ color: "#ffbe0b" }}>Lv.{lvl}</span></div>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>{u.desc}</div>
                    <button className="btn-pink" disabled={maxed || s.hearts < cost} onClick={() => buyUpgrade(u.id)} style={{ marginTop: 6, width: "100%", padding: "8px" }}>
                      {maxed ? "MAXED 💪" : `Buy — ${fmt(cost)} 💓`}
                    </button>
                    <div className="progress" style={{ marginTop: 6 }}><div style={{ width: `${(lvl / u.max) * 100}%` }} /></div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "gacha" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 44 }}>🎰</div>
              <h3 style={{ margin: "4px 0" }}>Doki-Doki Gacha</h3>
              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 8 }}>Variable-ratio jackpot. Mythic Akari: 0.8%. One more pull...?<br />🛡 PITY: Epic+ in {Math.max(0, 10 - (s.pity ?? 0))} pulls • Legendary+ in {Math.max(0, 30 - (s.pityLegend ?? 0))} pulls</div>
              <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap", fontSize: 11, marginBottom: 10 }}>
                {GIRLS.map((g) => (
                  <span key={g.id} style={{ background: RARITY_COLOR[g.rarity] + "33", border: `1px solid ${RARITY_COLOR[g.rarity]}`, borderRadius: 99, padding: "2px 8px", opacity: s.owned[g.id] ? 1 : 0.5 }}>
                    {s.owned[g.id] ? "✅" : "🔒"} {g.name}
                  </span>
                ))}
              </div>
              <button className="btn-pink" onClick={pullGacha} disabled={s.hearts < stats.gachaCost || gachaAnim?.rolling} style={{ width: "100%", fontSize: 18, animation: "chestShake 2s infinite" }}>
                {gachaAnim?.rolling ? "Rolling... 💫" : `PULL — ${fmt(stats.gachaCost)} 💓`}
              </button>
              <div style={{ minHeight: 220, marginTop: 10 }}>
                {gachaAnim?.result && (
                  <div className="toast" style={{ background: RARITY_COLOR[gachaAnim.result.rarity] + "22", border: `2px solid ${RARITY_COLOR[gachaAnim.result.rarity]}`, borderRadius: 16, padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "center", gap: 8, alignItems: "flex-end" }}>
                      <GirlImage girl={gachaAnim.result} size={130} glow />
                      {!gachaAnim.rolling && (
                        <EmotionGirl
                          girl={gachaAnim.result}
                          size={130}
                          mood={gachaAnim.result.rarity === "Mythic" || gachaAnim.result.rarity === "Legendary" ? "love" : gachaAnim.result.rarity === "Epic" ? "happy" : "smile"}
                          sparkle={gachaAnim.result.rarity === "Epic" || gachaAnim.result.rarity === "Legendary" || gachaAnim.result.rarity === "Mythic"}
                        />
                      )}
                    </div>
                    <div style={{ fontWeight: 900, fontSize: 18 }}>{gachaAnim.rolling ? "???" : `${gachaAnim.result.emoji} ${gachaAnim.result.name}!`}</div>
                    {!gachaAnim.rolling && (
                      <div style={{ fontSize: 13 }}>
                        <span style={{ color: RARITY_COLOR[gachaAnim.result.rarity], fontWeight: 800 }}>{gachaAnim.result.rarity}</span> • {gachaAnim.result.title}
                        <div style={{ opacity: 0.8 }}>{gachaAnim.isNew ? "NEW! She boosts you forever 💖" : "DUPE! +25 Bond XP 💝"}</div>
                      </div>
                    )}
                  </div>
                )}
                {!gachaAnim?.result && <div style={{ opacity: 0.5, fontSize: 13, paddingTop: 40 }}>Your next waifu is one pull away...<br />🎰✨🎰✨</div>}
              </div>
            </div>
          )}

          {tab === "quests" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 560, overflowY: "auto" }} className="scroll-thin">
              {QUESTS.map((q) => {
                const prog = Math.min(q.need, q.check(s));
                const done = prog >= q.need;
                const claimed = s.claimed.includes(q.id);
                return (
                  <div key={q.id} style={{ background: "rgba(255,255,255,.06)", borderRadius: 12, padding: 10, border: done && !claimed ? "2px solid #4ade80" : "1px solid rgba(255,255,255,.1)" }}>
                    <div style={{ fontWeight: 800, fontSize: 13 }}>{done && !claimed ? "✅ " : ""}{q.name}</div>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>{q.desc} — {fmt(prog)}/{fmt(q.need)}</div>
                    <div className="progress" style={{ margin: "6px 0" }}><div style={{ width: `${(prog / q.need) * 100}%` }} /></div>
                    <button className="btn-pink" disabled={!done || claimed} onClick={() => claimQuest(q.id, q.reward)} style={{ width: "100%", padding: 6, fontSize: 13 }}>
                      {claimed ? "Claimed ✓" : done ? `Claim +${fmt(q.reward)} 💓` : `Reward: ${fmt(q.reward)} 💓`}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "girls" && (
            <div style={{ fontSize: 13, lineHeight: 1.7 }}>
              <h3 style={{ margin: "0 0 6px" }}>🌸 {stats.girl.name} — {stats.girl.title}</h3>
              <div style={{ display: "flex", justifyContent: "center" }}><EmotionGirl girl={stats.girl} size={220} mood={previewMood} sparkle={previewMood === "love" || previewMood === "frenzy"} /></div>
              <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.8, marginTop: 6, textAlign: "center" }}>🎭 Emotion dress-up room — try her faces on the real photo!</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", margin: "8px 0" }}>
                {GIRL_MOODS.map((m) => (
                  <button key={m.id} className={previewMood === m.id ? "btn-pink tab-active" : "btn-ghost"} style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => { setPreviewMood(m.id); sfx.click(); }} title={m.label}>
                    {m.emoji}
                  </button>
                ))}
              </div>
              <p><i>"{stats.girl.personality}"</i></p>
              <p>💝 Bond Lv.{stats.bondLvl} — {s.bond[stats.girl.id] ?? 0} XP (next: {Math.pow(stats.bondLvl + 1, 2) * 20} XP). Each level = +5% click power with her.</p>
              <p>🧠 Why you can't stop: <b>collection completion</b> ({Object.keys(s.owned).length}/{GIRLS.length}) exploits the endowed-progress + Zeigarnik effect — your brain hates the 🔒 slots.</p>
              <button className="btn-ghost" style={{ width: "100%", marginTop: 6 }} onClick={resetAll}>🗑 Reset save (girls will cry)</button>
            </div>
          )}

          {tab === "pass" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 560, overflowY: "auto" }} className="scroll-thin">
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 36 }}>🎫</div>
                <h3 style={{ margin: "4px 0" }}>Doki-Doki Pass S1</h3>
                <div style={{ fontSize: 12, opacity: 0.75 }}>Play anything → earn Pass XP. FOMO season track, 20 levels.</div>
                <div style={{ fontSize: 13, fontWeight: 800, marginTop: 6 }}>✨ {fmt(s.bpXp ?? 0)} Pass XP</div>
              </div>
              {BP_LEVELS.map((bp) => {
                const unlocked = (s.bpXp ?? 0) >= bp.need;
                const claimed = (s.bpClaimed ?? []).includes(bp.lvl);
                return (
                  <div key={bp.lvl} style={{ background: "rgba(255,255,255,.06)", borderRadius: 12, padding: 10, border: unlocked && !claimed ? "2px solid #ffbe0b" : "1px solid rgba(255,255,255,.1)" }}>
                    <div style={{ fontWeight: 800, fontSize: 13 }}>Lv.{bp.lvl} — {unlocked ? "✅ UNLOCKED" : `${fmt(s.bpXp ?? 0)}/${fmt(bp.need)} XP`}</div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>🎁 +{fmt(bp.hearts)} 💓{bp.gems ? ` +${bp.gems} 💎` : ""}</div>
                    <div className="progress" style={{ margin: "6px 0" }}><div style={{ width: `${Math.min(100, ((s.bpXp ?? 0) / bp.need) * 100)}%` }} /></div>
                    <button className="btn-pink" disabled={!unlocked || claimed} onClick={() => claimBP(bp.lvl, bp.hearts, bp.gems)} style={{ width: "100%", padding: 6, fontSize: 13 }}>
                      {claimed ? "Claimed ✓" : unlocked ? "Claim!" : `Need ${fmt(bp.need - (s.bpXp ?? 0))} more XP`}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "vip" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 560, overflowY: "auto" }} className="scroll-thin">
              <div style={{ textAlign: "center", background: "linear-gradient(135deg,#ff00d422,#b366ff22)", border: "1px solid #ff00d4", borderRadius: 14, padding: 12 }}>
                <div style={{ fontSize: 36 }}>💎</div>
                <h3 style={{ margin: "4px 0" }}>VIP Gem Shop</h3>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Donate currency. Permanent — survives prestige. Whale-priced on purpose 🐋</div>
                <div style={{ fontSize: 16, fontWeight: 900, marginTop: 6, color: "#c4b5fd" }}>Balance: {s.gems} 💎</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>Get gems: Prestige (500K hearts) • Pass Lv.5/10/15/20 • 💖 donate</div>
              </div>
              {GEM_SHOP.map((g) => {
                const lvl = (s.gemShop ?? {})[g.id] ?? 0;
                const maxed = lvl >= g.costs.length;
                const cost = maxed ? 0 : g.costs[lvl];
                return (
                  <div key={g.id} style={{ background: "rgba(255,255,255,.06)", borderRadius: 12, padding: 10, border: `1px solid ${g.color}55` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                      <div style={{ fontWeight: 800, fontSize: 13 }}>{g.name} <span style={{ color: "#ffbe0b" }}>Lv.{lvl}/{g.costs.length}</span></div>
                      <span style={{ fontSize: 10, fontWeight: 800, background: g.color + "33", border: `1px solid ${g.color}`, borderRadius: 99, padding: "2px 8px", whiteSpace: "nowrap" }}>{g.tag}</span>
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>{g.desc}</div>
                    <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>Price path: {g.costs.map((c) => `${c}💎`).join(" → ")}</div>
                    <button className="btn-pink" disabled={maxed || s.gems < cost} onClick={() => buyGemItem(g.id)} style={{ marginTop: 6, width: "100%", padding: "8px", background: maxed ? undefined : `linear-gradient(135deg,${g.color},#b366ff)` }}>
                      {maxed ? "MAXED 🐋💖" : `Buy Lv.${lvl + 1} — ${cost} 💎`}
                    </button>
                    <div className="progress" style={{ marginTop: 6 }}><div style={{ width: `${(lvl / g.costs.length) * 100}%` }} /></div>
                  </div>
                );
              })}
              <div style={{ background: "rgba(255,0,212,.08)", border: "1px solid #ff00d4", borderRadius: 12, padding: 10 }}>
                <div style={{ fontWeight: 800, fontSize: 13 }}>🎰 Divine Pull <span style={{ fontSize: 10, background: "#ff00d4", borderRadius: 99, padding: "2px 8px" }}>INSTANT HIT</span></div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>No waiting animation. Epic+ guaranteed, 30% Legendary+, 5% Mythic. For when you can't wait.</div>
                <button className="btn-pink" disabled={s.gems < GEM_DIVINE_COST} onClick={divinePull} style={{ marginTop: 6, width: "100%", padding: "10px", fontSize: 15, animation: "chestShake 2s infinite" }}>
                  PULL — {GEM_DIVINE_COST} 💎
                </button>
              </div>
              <div style={{ background: "rgba(77,166,255,.08)", border: "1px solid #4da6ff", borderRadius: 12, padding: 10 }}>
                <div style={{ fontWeight: 800, fontSize: 13 }}>⏳ Time Warp <span style={{ fontSize: 10, background: "#4da6ff", borderRadius: 99, padding: "2px 8px" }}>4H SKIP</span></div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>Instantly gain 4h of idle (+{fmt(Math.max(stats.cps * 4 * 3600, stats.clickPower * 500, 5000))} 💓 right now).</div>
                <button className="btn-pink" disabled={s.gems < GEM_WARP_COST} onClick={timeWarp} style={{ marginTop: 6, width: "100%", padding: "10px" }}>
                  WARP — {GEM_WARP_COST} 💎
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE BOTTOM NAV — separate menu screens (hidden on desktop via CSS) */}
      <nav className="mobile-nav" aria-label="Game menu">
        <button className={mScreen === "clicker" ? "mnav-btn active" : "mnav-btn"} onClick={() => goMobile("clicker")} aria-label="Main clicker">
          <span className="ico">🏠</span><span>Click</span>
        </button>
        {(["shop", "gacha", "quests", "girls", "pass", "vip"] as const).map((t) => (
          <button key={t} className={mScreen === t ? "mnav-btn active" : "mnav-btn"} onClick={() => goMobile(t)} aria-label={t} style={{ textTransform: "capitalize" }}>
            <span className="ico">{t === "gacha" ? "🎰" : t === "shop" ? "🛒" : t === "quests" ? "📜" : t === "pass" ? "🎫" : t === "vip" ? "💎" : "🌸"}</span><span>{t}</span>
          </button>
        ))}
      </nav>

    </div>
  );
}
