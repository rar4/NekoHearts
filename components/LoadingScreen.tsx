"use client";

import { useEffect, useState } from "react";

const TIPS = [
  "Fast clicks build COMBO — 25 combo triggers FRENZY mode!",
  "Golden hearts spawn randomly — grab them for huge bonuses!",
  "Crits hit x10, MEGA crits hit x100. Keep clicking, senpai~",
  "Dupes from the gacha turn into precious Bond XP.",
  "Girls get lonely… come back every day to keep your streak!",
  "Prestige at 500K hearts for permanent gem power.",
];

export default function LoadingScreen({
  loaded,
  total,
}: {
  loaded: number;
  total: number;
}) {
  const [tip, setTip] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTip((v) => (v + 1) % TIPS.length), 2500);
    return () => clearInterval(t);
  }, []);
  const pct = Math.min(100, Math.round((loaded / Math.max(1, total)) * 100));
  return (
    <div className="loader-wrap" role="status" aria-live="polite">
      <div className="loader-card">
        <div className="loader-heart" aria-hidden>
          💖
        </div>
        <div className="loader-title">NEKO HEARTS</div>
        <div className="loader-sub">Summoning your waifus…</div>
        <div className="loader-bar">
          <div style={{ width: `${pct}%` }} />
        </div>
        <div className="loader-count">
          {loaded}/{total} • {pct}%
        </div>
        <div className="loader-tip">💡 {TIPS[tip]}</div>
      </div>
    </div>
  );
}
