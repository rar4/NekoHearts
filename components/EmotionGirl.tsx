"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { GirlDef, RARITY_COLOR } from "../lib/girls";
import { GirlMood, MOOD_ANIM } from "./AnimeGirl";

// Real-photo anime girl with living emotions — no SVG.
// Motion (bounce/tremble/jump) + photo lighting filters + sticker overlays
// (blush, sweat, tears, hearts, Zzz, anger mark) are all driven by `mood`.
//
// TRUE facial-expression swaps: drop per-emotion art into /public/girls/ named
//   {girlId}-{mood}.jpg   e.g.  yuki-timid.jpg, rin-pout.jpg, aiko-love.jpg
// and it is picked up automatically (falls back to the base portrait).

const variantCache: Record<string, boolean> = {};

const PHOTO_FILTER: Record<GirlMood, string> = {
  smile: "none",
  happy: "saturate(1.18) brightness(1.04)",
  timid: "saturate(1.1) brightness(1.02)",
  love: "saturate(1.35) brightness(1.06) hue-rotate(-8deg)",
  wow: "brightness(1.12) contrast(1.05)",
  pout: "contrast(1.08) saturate(1.1)",
  sad: "grayscale(.45) brightness(.82)",
  sleepy: "brightness(.68) saturate(.65)",
  frenzy: "saturate(1.55) contrast(1.12) brightness(1.05)",
  dizzy: "blur(1.2px) saturate(1.2)",
  wink: "saturate(1.22) brightness(1.05)",
};

const BLUSH: Record<GirlMood, number> = {
  smile: 0.5, happy: 0.8, timid: 1, love: 1, wow: 0.35,
  pout: 0.7, sad: 0.3, sleepy: 0.35, frenzy: 1, dizzy: 0.55, wink: 0.8,
};

export default function EmotionGirl({
  girl,
  size = 280,
  mood = "smile",
  squish = false,
  sparkle = false,
  priority = false,
}: {
  girl: GirlDef;
  size?: number;
  mood?: GirlMood;
  squish?: boolean;
  sparkle?: boolean;
  priority?: boolean;
}) {
  const color = RARITY_COLOR[girl.rarity];
  const key = `${girl.id}-${mood}`;
  const variantSrc = `/girls/${key}.jpg`;
  const [src, setSrc] = useState(variantCache[key] === false ? girl.image : variantSrc);

  useEffect(() => {
    setSrc(variantCache[key] === false ? girl.image : variantSrc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const u = size / 280; // sticker scale unit
  const sticker = (s: React.CSSProperties, content: string, anim?: string, fontSize = 30) => (
    <span style={{ position: "absolute", pointerEvents: "none", fontSize: fontSize * u, animation: anim, ...s }}>
      {content}
    </span>
  );

  return (
    <div style={{ width: size, height: size, maxWidth: "100%", animation: MOOD_ANIM[mood], touchAction: "manipulation" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: squish ? "scale(.9,.94)" : "scale(1)",
          transition: "transform .09s",
          borderRadius: size * 0.12,
          overflow: "hidden",
          border: `4px solid ${color}`,
          boxShadow: sparkle
            ? `0 0 30px ${color}cc, 0 0 80px ${color}66`
            : "0 8px 30px rgba(0,0,0,.45)",
          position: "relative",
          background: "#221433",
          flexShrink: 0,
          touchAction: "manipulation",
        }}
      >
        <Image
          src={src}
          alt={girl.name}
          width={size}
          height={size}
          sizes="(max-width: 720px) 72vw, 300px"
          priority={priority}
          loading={priority ? undefined : "lazy"}
          draggable={false}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: PHOTO_FILTER[mood], transition: "filter .3s" }}
          onError={() => {
            if (src !== girl.image) {
              variantCache[key] = false;
              setSrc(girl.image);
            }
          }}
          onLoad={() => {
            if (src === variantSrc) variantCache[key] = true;
          }}
        />
        {/* bottom vignette for readability */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 55%, rgba(0,0,0,.45) 100%)", pointerEvents: "none" }} />
        {/* sleepy / sad dim */}
        {(mood === "sleepy" || mood === "sad") && (
          <div style={{ position: "absolute", inset: 0, background: mood === "sleepy" ? "rgba(10,10,40,.35)" : "rgba(20,20,60,.22)", pointerEvents: "none" }} />
        )}
        {/* love glow */}
        {(mood === "love" || mood === "frenzy") && (
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 40%, rgba(255,93,143,.28), transparent 65%)", pointerEvents: "none" }} />
        )}

        {/* blush stickers (cheeks sit ~mid-face on portraits) */}
        <div style={{
          position: "absolute", left: "6%", top: "44%", width: "32%", height: "11%",
          background: "radial-gradient(ellipse, rgba(255,110,160,.85), transparent 70%)",
          opacity: BLUSH[mood], pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", right: "6%", top: "44%", width: "32%", height: "11%",
          background: "radial-gradient(ellipse, rgba(255,110,160,.85), transparent 70%)",
          opacity: BLUSH[mood], pointerEvents: "none",
        }} />

        {/* mood stickers */}
        {mood === "timid" && sticker({ right: "8%", top: "10%" }, "💧", "sweatSlide 1.2s ease-in infinite", 34)}
        {mood === "timid" && sticker({ left: "10%", top: "8%" }, "💦", "heartFloat 1.6s ease-in-out infinite", 24)}
        {mood === "love" && sticker({ left: "6%", top: "10%" }, "💖", "heartFloat 1.6s ease-in-out infinite", 34)}
        {mood === "love" && sticker({ right: "8%", top: "22%" }, "💗", "heartFloat 1.6s ease-in-out .5s infinite", 28)}
        {mood === "happy" && sticker({ left: "8%", top: "8%" }, "✨", "sparkleTwinkle 1.6s ease-in-out infinite", 28)}
        {mood === "happy" && sticker({ right: "8%", top: "14%" }, "💖", "sparkleTwinkle 1.6s ease-in-out .4s infinite", 24)}
        {mood === "smile" && sparkle && sticker({ right: "10%", top: "8%" }, "✨", "sparkleTwinkle 1.6s ease-in-out infinite", 26)}
        {mood === "wow" && sticker({ right: "6%", top: "6%" }, "❗", "pop .5s infinite", 44)}
        {mood === "pout" && sticker({ right: "6%", top: "8%" }, "💢", "pop .8s infinite", 36)}
        {mood === "sad" && sticker({ left: "38%", top: "48%" }, "💧", "tearFall 1.4s ease-in infinite", 30)}
        {mood === "sleepy" && sticker({ right: "8%", top: "6%" }, "💤", "zzzFloat 2.4s ease-out infinite", 40)}
        {mood === "frenzy" && sticker({ left: "4%", top: "8%" }, "🔥", "sparkleTwinkle 1s ease-in-out infinite", 32)}
        {mood === "frenzy" && sticker({ right: "5%", top: "12%" }, "⚡", "sparkleTwinkle 1s ease-in-out .3s infinite", 30)}
        {mood === "dizzy" && sticker({ left: "10%", top: "6%" }, "💫", "spinSlow 3s linear infinite", 30)}
        {mood === "dizzy" && sticker({ right: "10%", top: "8%" }, "🌀", "spinSlow 3s linear infinite", 28)}
        {mood === "wink" && sticker({ right: "8%", top: "12%" }, "😉", "heartFloat 1.8s ease-in-out infinite", 32)}
        {sparkle && mood !== "smile" && mood !== "happy" && sticker({ left: "6%", bottom: "8%" }, "✨", "sparkleTwinkle 1.6s ease-in-out infinite", 24)}
      </div>
    </div>
  );
}
