"use client";
import { GirlDef } from "../lib/girls";
import { RARITY_COLOR } from "../lib/girls";

export default function GirlImage({
  girl,
  size = 260,
  glow = false,
}: {
  girl: GirlDef;
  size?: number;
  glow?: boolean;
}) {
  const color = RARITY_COLOR[girl.rarity];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.18,
        overflow: "hidden",
        border: `4px solid ${color}`,
        boxShadow: glow
          ? `0 0 30px ${color}cc, 0 0 80px ${color}66`
          : `0 8px 30px rgba(0,0,0,.45)`,
        position: "relative",
        background: "#221433",
        flexShrink: 0,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={girl.image}
        alt={girl.name}
        width={size}
        height={size}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        draggable={false}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, transparent 55%, rgba(0,0,0,.45) 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
