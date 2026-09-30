"use client";
import Image from "next/image";
import { GirlDef } from "../lib/girls";
import { RARITY_COLOR } from "../lib/girls";

export default function GirlImage({
  girl,
  size = 260,
  glow = false,
  eager = false,
}: {
  girl: GirlDef;
  size?: number;
  glow?: boolean;
  eager?: boolean;
}) {
  const color = RARITY_COLOR[girl.rarity];
  return (
    <div
      style={{
        width: size,
        height: size,
        maxWidth: "100%",
        borderRadius: size * 0.18,
        overflow: "hidden",
        border: `4px solid ${color}`,
        boxShadow: glow
          ? `0 0 30px ${color}cc, 0 0 80px ${color}66`
          : `0 8px 30px rgba(0,0,0,.45)`,
        position: "relative",
        background: "linear-gradient(135deg,#ff5d8f55,#b366ff55)",
        flexShrink: 0,
        touchAction: "manipulation",
      }}
    >
      <Image
        src={girl.image}
        alt={girl.name}
        width={size}
        height={size}
        sizes={`(max-width: 720px) 56px, ${size}px`}
        priority={eager}
        loading={eager ? undefined : "lazy"}
        draggable={false}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
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
