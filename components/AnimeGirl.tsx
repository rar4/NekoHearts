"use client";
import { GirlDef } from "../lib/girls";

// Living chibi anime girl — pure SVG with expressive emotion faces + CSS motion.
// Moods drive eyes / mouth / brows / blush / extras, the wrapper drives body motion.
export type GirlMood =
  | "smile"   // gentle default smile (requested)
  | "happy"   // closed-eye joy ^^
  | "timid"   // shy, look-away + sweat + tremble (requested)
  | "love"    // heart eyes, doki-doki
  | "wow"     // crit surprise, wide eyes
  | "pout"    // tsundere huff
  | "sad"     // neglected, tear (makes you want to click her happy again)
  | "sleepy"  // idle too long, Zzz
  | "frenzy"  // combo hot state, starry grin
  | "dizzy"   // MEGA crit overload, X eyes
  | "wink";   // high-bond reward flirt

export const GIRL_MOODS: { id: GirlMood; emoji: string; label: string }[] = [
  { id: "smile", emoji: "😊", label: "Smile" },
  { id: "happy", emoji: "😄", label: "Happy" },
  { id: "timid", emoji: "🥺", label: "Timid" },
  { id: "love", emoji: "😍", label: "In love" },
  { id: "wow", emoji: "😲", label: "Wow" },
  { id: "pout", emoji: "😤", label: "Pout" },
  { id: "sad", emoji: "😢", label: "Sad" },
  { id: "sleepy", emoji: "😴", label: "Sleepy" },
  { id: "frenzy", emoji: "🤩", label: "Frenzy" },
  { id: "dizzy", emoji: "😵", label: "Dizzy" },
  { id: "wink", emoji: "😉", label: "Wink" },
];

export const MOOD_ANIM: Record<GirlMood, string> = {
  smile: "girlBob 3.2s ease-in-out infinite",
  happy: "girlHappy .9s ease-in-out infinite",
  timid: "girlTremble .5s ease-in-out infinite",
  love: "girlLove 1s ease-in-out infinite",
  wow: "girlPop .55s ease-in-out infinite",
  pout: "girlPout 1.1s ease-in-out infinite",
  sad: "girlSad 2.6s ease-in-out infinite",
  sleepy: "girlSleepy 3.8s ease-in-out infinite",
  frenzy: "girlFrenzy .6s ease-in-out infinite",
  dizzy: "girlDizzy 1.4s ease-in-out infinite",
  wink: "girlBob 3.2s ease-in-out infinite",
};

const BLUSH_OPACITY: Record<GirlMood, number> = {
  smile: 0.55, happy: 0.85, timid: 1, love: 1, wow: 0.4,
  pout: 0.75, sad: 0.35, sleepy: 0.4, frenzy: 1, dizzy: 0.6, wink: 0.85,
};

function Star({ x, y, s, fill }: { x: number; y: number; s: number; fill: string }) {
  return (
    <polygon
      points={`0,${-s} ${s * 0.22},${-s * 0.22} ${s},0 ${s * 0.22},${s * 0.22} 0,${s} ${-s * 0.22},${s * 0.22} ${-s},0 ${-s * 0.22},${-s * 0.22}`}
      transform={`translate(${x} ${y})`}
      fill={fill}
    />
  );
}

export default function AnimeGirl({
  girl,
  size = 260,
  mood = "smile",
  sparkle = false,
  squish = false,
}: {
  girl: GirlDef;
  size?: number;
  mood?: GirlMood;
  sparkle?: boolean;
  squish?: boolean;
}) {
  const gid = `${girl.id}-${size}-${mood}`;
  const openBlink = mood === "smile" || mood === "wink" || mood === "pout" || mood === "sad";

  const renderEyes = () => {
    switch (mood) {
      case "happy":
        return (
          <g stroke="#4a2b2b" strokeWidth="4.5" fill="none" strokeLinecap="round">
            <path d="M84 119 Q98 104 112 119" />
            <path d="M128 119 Q142 104 156 119" />
          </g>
        );
      case "timid":
        // looking down + aside, half covered by lid
        return (
          <g>
            <ellipse cx="98" cy="119" rx="12" ry="16" fill="white" />
            <ellipse cx="142" cy="119" rx="12" ry="16" fill="white" />
            <ellipse cx="94" cy="125" rx="7" ry="10" fill={girl.eyes} />
            <ellipse cx="138" cy="125" rx="7" ry="10" fill={girl.eyes} />
            <circle cx="95.5" cy="122" r="3.4" fill="white" />
            <circle cx="139.5" cy="122" r="3.4" fill="white" />
            <path d="M85 108 Q98 102 111 108" stroke="#4a2b2b" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M129 108 Q142 102 155 108" stroke="#4a2b2b" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          </g>
        );
      case "love":
        return (
          <g>
            <ellipse cx="98" cy="118" rx="13" ry="17" fill="white" />
            <ellipse cx="142" cy="118" rx="13" ry="17" fill="white" />
            <text x="86" y="128" fontSize="20">💖</text>
            <text x="130" y="128" fontSize="20">💖</text>
            <circle cx="103" cy="112" r="3.4" fill="white" />
            <circle cx="147" cy="112" r="3.4" fill="white" />
          </g>
        );
      case "wow":
        return (
          <g>
            <ellipse cx="98" cy="118" rx="15" ry="19" fill="white" />
            <ellipse cx="142" cy="118" rx="15" ry="19" fill="white" />
            <ellipse cx="98" cy="120" rx="5.5" ry="8" fill={girl.eyes} />
            <ellipse cx="142" cy="120" rx="5.5" ry="8" fill={girl.eyes} />
            <circle cx="100" cy="117" r="2.6" fill="white" />
            <circle cx="144" cy="117" r="2.6" fill="white" />
            <path d="M85 106 Q98 100 111 106" stroke="#4a2b2b" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M129 106 Q142 100 155 106" stroke="#4a2b2b" strokeWidth="3" fill="none" strokeLinecap="round" />
          </g>
        );
      case "pout":
        // tsundere half-lidded, looking away
        return (
          <g>
            <ellipse cx="98" cy="120" rx="12" ry="14" fill="white" />
            <ellipse cx="142" cy="120" rx="12" ry="14" fill="white" />
            <ellipse cx="93" cy="122" rx="7" ry="10" fill={girl.eyes} />
            <ellipse cx="137" cy="122" rx="7" ry="10" fill={girl.eyes} />
            <rect x="84" y="100" width="28" height="12" rx="6" fill="#ffe3c9" />
            <rect x="128" y="100" width="28" height="12" rx="6" fill="#ffe3c9" />
            <path d="M85 111 Q98 109 111 111" stroke="#4a2b2b" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M129 111 Q142 109 155 111" stroke="#4a2b2b" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          </g>
        );
      case "sad":
        return (
          <g className={openBlink ? "girl-blink" : undefined}>
            <ellipse cx="98" cy="120" rx="12" ry="14" fill="white" />
            <ellipse cx="142" cy="120" rx="12" ry="14" fill="white" />
            <ellipse cx="98" cy="122" rx="6" ry="8" fill={girl.eyes} />
            <ellipse cx="142" cy="122" rx="6" ry="8" fill={girl.eyes} />
            <circle cx="100" cy="119" r="2.6" fill="white" />
            <circle cx="144" cy="119" r="2.6" fill="white" />
          </g>
        );
      case "sleepy":
        return (
          <g stroke="#4a2b2b" strokeWidth="3.5" fill="none" strokeLinecap="round">
            <path d="M86 119 Q98 125 110 119" />
            <path d="M130 119 Q142 125 154 119" />
            <path d="M90 124 L86 128 M150 124 L154 128" strokeWidth="2.5" />
          </g>
        );
      case "frenzy":
        return (
          <g>
            <ellipse cx="98" cy="118" rx="13" ry="17" fill="white" />
            <ellipse cx="142" cy="118" rx="13" ry="17" fill="white" />
            <Star x={98} y={120} s={8} fill={girl.eyes} />
            <Star x={142} y={120} s={8} fill={girl.eyes} />
            <circle cx="103" cy="112" r="3" fill="white" />
            <circle cx="147" cy="112" r="3" fill="white" />
            <path d="M85 106 Q98 100 111 106" stroke="#4a2b2b" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M129 106 Q142 100 155 106" stroke="#4a2b2b" strokeWidth="3" fill="none" strokeLinecap="round" />
          </g>
        );
      case "dizzy":
        return (
          <g stroke="#4a2b2b" strokeWidth="3.5" strokeLinecap="round">
            <line x1="90" y1="111" x2="106" y2="127" />
            <line x1="106" y1="111" x2="90" y2="127" />
            <line x1="134" y1="111" x2="150" y2="127" />
            <line x1="150" y1="111" x2="134" y2="127" />
          </g>
        );
      case "wink":
        return (
          <g>
            <ellipse cx="98" cy="118" rx="13" ry="17" fill="white" />
            <ellipse cx="99" cy="121" rx="8" ry="12" fill={girl.eyes} />
            <circle cx="101" cy="117" r="4.5" fill="white" />
            <circle cx="99" cy="124" r="2" fill="white" opacity="0.9" />
            <path d="M129 118 Q142 126 155 118" stroke="#4a2b2b" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M85 106 Q98 100 111 106" stroke="#4a2b2b" strokeWidth="3" fill="none" strokeLinecap="round" />
          </g>
        );
      case "smile":
      default:
        return (
          <g className="girl-blink">
            <ellipse cx="98" cy="118" rx="13" ry="17" fill="white" />
            <ellipse cx="142" cy="118" rx="13" ry="17" fill="white" />
            <ellipse cx="99" cy="121" rx="8" ry="12" fill={girl.eyes} />
            <ellipse cx="141" cy="121" rx="8" ry="12" fill={girl.eyes} />
            <circle cx="101" cy="117" r="4.5" fill="white" />
            <circle cx="143" cy="117" r="4.5" fill="white" />
            <circle cx="99" cy="124" r="2" fill="white" opacity="0.9" />
            <circle cx="141" cy="124" r="2" fill="white" opacity="0.9" />
            <path d="M85 106 Q98 100 111 106" stroke="#4a2b2b" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M129 106 Q142 100 155 106" stroke="#4a2b2b" strokeWidth="3" fill="none" strokeLinecap="round" />
          </g>
        );
    }
  };

  const renderMouth = () => {
    switch (mood) {
      case "happy":
        return (
          <g>
            <path d="M106 137 Q120 158 134 137 Z" fill="#7a2b2b" />
            <path d="M112 146 Q120 152 128 146 Q124 152 120 152 Q116 152 112 146" fill="#ff8fb3" />
          </g>
        );
      case "timid":
        return <path d="M113 142 Q117 145 121 142 Q125 139 129 143" stroke="#7a2b2b" strokeWidth="2.4" strokeLinecap="round" fill="none" />;
      case "love":
        return (
          <g>
            <path d="M107 137 Q113 148 120 142 Q127 148 133 137 Q127 154 120 154 Q113 154 107 137" fill="#c9184a" />
            <ellipse cx="120" cy="148" rx="4" ry="2.6" fill="#ff8fb3" />
          </g>
        );
      case "wow":
        return <ellipse cx="120" cy="143" rx="7" ry="9" fill="#7a2b2b" />;
      case "pout":
        return (
          <g>
            <path d="M110 144 L130 144 L126 150 L114 150 Z" fill="#7a2b2b" />
            <circle cx="131" cy="141" r="3" fill="#7a2b2b" />
          </g>
        );
      case "sad":
        return <path d="M109 147 Q120 139 131 147" stroke="#7a2b2b" strokeWidth="3" strokeLinecap="round" fill="none" />;
      case "sleepy":
        return <ellipse cx="120" cy="144" rx="4.5" ry="5.5" fill="#7a2b2b" />;
      case "frenzy":
        return (
          <g>
            <path d="M104 136 Q120 160 136 136 Q120 142 104 136" fill="white" stroke="#7a2b2b" strokeWidth="2.5" />
            <path d="M108 142 Q120 156 132 142" stroke="#7a2b2b" strokeWidth="2" fill="none" />
          </g>
        );
      case "dizzy":
        return <path d="M109 143 Q114 140 119 143 Q124 146 129 143" stroke="#7a2b2b" strokeWidth="2.6" strokeLinecap="round" fill="none" />;
      case "wink":
        return <path d="M108 139 Q120 150 133 138" stroke="#7a2b2b" strokeWidth="3" strokeLinecap="round" fill="none" />;
      case "smile":
      default:
        return <path d="M110 140 Q120 150 130 140" stroke="#7a2b2b" strokeWidth="3" strokeLinecap="round" fill="none" />;
    }
  };

  const renderBrows = () => {
    switch (mood) {
      case "timid":
      case "sad":
        return (
          <g stroke="#4a2b2b" strokeWidth="2.5" strokeLinecap="round">
            <line x1="88" y1="96" x2="108" y2="102" />
            <line x1="152" y1="96" x2="132" y2="102" />
          </g>
        );
      case "wow":
        return (
          <g stroke="#4a2b2b" strokeWidth="2.5" strokeLinecap="round">
            <line x1="88" y1="96" x2="108" y2="92" />
            <line x1="152" y1="96" x2="132" y2="92" />
          </g>
        );
      case "pout":
      case "frenzy":
        return (
          <g stroke="#4a2b2b" strokeWidth="3" strokeLinecap="round">
            <line x1="88" y1="100" x2="108" y2="106" />
            <line x1="152" y1="100" x2="132" y2="106" />
          </g>
        );
      case "happy":
      case "love":
        return (
          <g stroke="#4a2b2b" strokeWidth="2.5" strokeLinecap="round" fill="none">
            <path d="M88 99 Q98 94 108 99" />
            <path d="M132 99 Q142 94 152 99" />
          </g>
        );
      default:
        return null;
    }
  };

  const blush = BLUSH_OPACITY[mood];

  return (
    <div style={{ width: size, height: size, display: "inline-block", animation: MOOD_ANIM[mood] }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: squish ? "scale(.88, .94)" : "scale(1)",
          transition: "transform .09s",
        }}
      >
        <svg width={size} height={size} viewBox="0 0 240 240" style={{ overflow: "visible", display: "block" }}>
          <defs>
            <linearGradient id={`hair-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={girl.hair} />
              <stop offset="100%" stopColor={girl.hairDark} />
            </linearGradient>
            <linearGradient id={`dress-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={girl.dress} />
              <stop offset="100%" stopColor={girl.dressDark} />
            </linearGradient>
            <radialGradient id={`blush-${gid}`} cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#ff8fb3" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ff8fb3" stopOpacity="0" />
            </radialGradient>
          </defs>

          {sparkle && (
            <g opacity="0.9" className="girl-sparkle">
              <text x="18" y="60" fontSize="22">✨</text>
              <text x="198" y="80" fontSize="18">💖</text>
              <text x="190" y="190" fontSize="20">✨</text>
              <text x="22" y="180" fontSize="18">💫</text>
            </g>
          )}

          {/* back hair */}
          <ellipse cx="120" cy="105" rx="72" ry="78" fill={`url(#hair-${gid})`} />
          <path d="M48 110 Q40 180 62 195 Q70 160 58 120 Z" fill={girl.hairDark} />
          <path d="M192 110 Q200 180 178 195 Q170 160 182 120 Z" fill={girl.hairDark} />

          {/* body / dress */}
          <ellipse cx="120" cy="212" rx="52" ry="30" fill={`url(#dress-${gid})`} stroke="rgba(0,0,0,0.08)" />
          <rect x="108" y="168" width="24" height="26" rx="8" fill="#ffd9c4" />
          <path d="M95 200 L145 200 L155 228 L85 228 Z" fill={`url(#dress-${gid})`} />
          <circle cx="120" cy="205" r="5" fill="#ff5d8f" />

          {/* face */}
          <ellipse cx="120" cy="118" rx="54" ry="52" fill="#ffe3c9" />
          {/* bangs */}
          <path
            d="M66 100 Q70 52 120 48 Q170 52 174 100 Q160 78 150 92 Q142 70 130 88 Q120 66 110 88 Q98 70 90 92 Q80 78 66 100 Z"
            fill={`url(#hair-${gid})`}
          />
          {/* side locks */}
          <path d="M68 95 Q60 140 72 158 Q80 130 78 100 Z" fill={`url(#hair-${gid})`} />
          <path d="M172 95 Q180 140 168 158 Q160 130 162 100 Z" fill={`url(#hair-${gid})`} />

          {/* accessory */}
          {girl.accessory === "bow" && (
            <g>
              <ellipse cx="160" cy="58" rx="14" ry="10" fill="#ff5d8f" transform="rotate(20 160 58)" />
              <ellipse cx="180" cy="66" rx="14" ry="10" fill="#ff5d8f" transform="rotate(-20 180 66)" />
              <circle cx="170" cy="62" r="6" fill="#d90429" />
            </g>
          )}
          {girl.accessory === "neko" && (
            <g>
              <path d="M78 62 L70 28 L102 50 Z" fill={girl.hairDark} />
              <path d="M162 62 L170 28 L138 50 Z" fill={girl.hairDark} />
              <path d="M80 55 L76 36 L94 48 Z" fill="#ffb7d5" />
              <path d="M160 55 L164 36 L146 48 Z" fill="#ffb7d5" />
            </g>
          )}
          {girl.accessory === "halo" && (
            <ellipse cx="120" cy="30" rx="28" ry="8" fill="none" stroke="#ffd60a" strokeWidth="5" opacity="0.9" />
          )}
          {girl.accessory === "horns" && (
            <g>
              <path d="M82 60 Q70 38 88 30 Q86 48 96 58 Z" fill={girl.dressDark} />
              <path d="M158 60 Q170 38 152 30 Q154 48 144 58 Z" fill={girl.dressDark} />
            </g>
          )}
          {girl.accessory === "star" && (
            <text x="158" y="52" fontSize="26">⭐</text>
          )}

          {/* ahoge */}
          <path className="girl-ahoge" d="M120 48 Q126 30 142 28" stroke={girl.hairDark} strokeWidth="4" fill="none" strokeLinecap="round" />

          {/* eyes + brows + mouth */}
          {renderEyes()}
          {renderBrows()}

          {/* blush */}
          <g opacity={blush} className="girl-blush">
            <ellipse cx="86" cy="132" rx={mood === "timid" || mood === "love" || mood === "frenzy" ? 16 : 12} ry={mood === "timid" || mood === "love" ? 10 : 7} fill={`url(#blush-${gid})`} />
            <ellipse cx="154" cy="132" rx={mood === "timid" || mood === "love" || mood === "frenzy" ? 16 : 12} ry={mood === "timid" || mood === "love" ? 10 : 7} fill={`url(#blush-${gid})`} />
          </g>

          {renderMouth()}

          {/* mood extras */}
          {mood === "timid" && (
            <g className="girl-sweat">
              <path d="M172 108 Q178 120 172 126 Q166 120 172 108" fill="#7dd3fc" stroke="#0284c7" strokeWidth="1.5" />
            </g>
          )}
          {mood === "sad" && (
            <g className="girl-tear">
              <path d="M152 128 Q156 136 152 140 Q148 136 152 128" fill="#7dd3fc" stroke="#0284c7" strokeWidth="1.2" />
            </g>
          )}
          {mood === "pout" && (
            <g stroke="#ef4444" strokeWidth="2.5" fill="none" strokeLinecap="round">
              <path d="M168 84 L176 92 M176 84 L168 92" />
            </g>
          )}
          {mood === "love" && (
            <g className="girl-hearts" fontSize="16" textAnchor="middle">
              <text x="60" y="90">💖</text>
              <text x="180" y="100">💗</text>
            </g>
          )}
          {mood === "sleepy" && (
            <g fill="#c4b5fd" fontWeight="900" className="girl-zzz">
              <text x="172" y="80" fontSize="18">z</text>
              <text x="184" y="64" fontSize="24">Z</text>
              <text x="198" y="44" fontSize="30">Z</text>
            </g>
          )}
          {mood === "wow" && (
            <text x="176" y="70" fontSize="30" fontWeight="900" fill="#ffbe0b">!</text>
          )}
          {mood === "frenzy" && (
            <g fontSize="18" className="girl-sparkle">
              <text x="40" y="70">🔥</text>
              <text x="186" y="60">⚡</text>
            </g>
          )}
          {mood === "dizzy" && (
            <g fontSize="16" className="girl-dizzy-stars">
              <text x="70" y="60">💫</text>
              <text x="160" y="52">⭐</text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
