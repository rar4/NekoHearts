export type Rarity = "Common" | "Rare" | "Epic" | "Legendary" | "Mythic";

export interface GirlDef {
  id: string;
  name: string;
  emoji: string;
  title: string;
  rarity: Rarity;
  clickMult: number;
  cps: number;
  image: string;
  hair: string;
  hairDark: string;
  dress: string;
  dressDark: string;
  eyes: string;
  accessory: "bow" | "neko" | "halo" | "horns" | "star";
  dialogues: string[];
  personality: string;
}

export const RARITY_COLOR: Record<Rarity, string> = {
  Common: "#9ca3af",
  Rare: "#4da6ff",
  Epic: "#b366ff",
  Legendary: "#ffbe0b",
  Mythic: "#ff00d4",
};

export const GIRLS: GirlDef[] = [
  {
    id: "yuki",
    name: "Yuki",
    emoji: "❄️",
    title: "Shy Snow Senpai",
    rarity: "Common",
    clickMult: 1,
    cps: 1,
    image: "/girls/yuki.jpg",
    hair: "#bfe3ff",
    hairDark: "#7fb2e5",
    dress: "#8ecae6",
    dressDark: "#4a86b8",
    eyes: "#3a86ff",
    accessory: "bow",
    dialogues: [
      "C-click me, senpai... every click makes my heart beat faster~ 💓",
      "Ehehe... your fingers are so warm... don't stop~ ❄️",
      "Y-you came back! I was waiting all night... 🥺",
      "Combo going up... my doki-doki won't stop! 💗",
    ],
    personality: "Soft-spoken snow girl who blushes at every compliment. Starter waifu, loves attention.",
  },
  {
    id: "mimi",
    name: "Mimi",
    emoji: "🐰",
    title: "Bunny Idol",
    rarity: "Common",
    clickMult: 1.2,
    cps: 2,
    image: "/girls/mimi.jpg",
    hair: "#ffd6e8",
    hairDark: "#f49ac1",
    dress: "#ff8fb3",
    dressDark: "#c9184a",
    eyes: "#ff5d8f",
    accessory: "bow",
    dialogues: [
      "Mimi-tan is on stage! Click for an encore~ 🎤💖",
      "Pyon pyon! Faster, senpai, faster! 🐰",
      "You pulled me? BEST DAY EVER! 💝",
    ],
    personality: "Genki bunny idol. Always bouncing, always cheering you on.",
  },
  {
    id: "sakura",
    name: "Sakura",
    emoji: "🌸",
    title: "Blossom Princess",
    rarity: "Rare",
    clickMult: 1.5,
    cps: 4,
    image: "/girls/sakura.jpg",
    hair: "#ffc2d1",
    hairDark: "#fb8b9e",
    dress: "#ffafcc",
    dressDark: "#c9184a",
    eyes: "#9d4edd",
    accessory: "star",
    dialogues: [
      "Like petals in the wind... your clicks scatter my heart 🌸",
      "Ara ara~ such diligent fingers, senpai~ 💗",
      "Stay with me under the sakura tree a little longer... 🌸",
    ],
    personality: "Elegant ojou-sama of spring. Sweet, teasing, loves long click sessions.",
  },
  {
    id: "neko",
    name: "Neko",
    emoji: "🐱",
    title: "Midnight Neko",
    rarity: "Rare",
    clickMult: 2,
    cps: 6,
    image: "/girls/neko.jpg",
    hair: "#2b2d42",
    hairDark: "#12122b",
    dress: "#5e60ce",
    dressDark: "#2b2d84",
    eyes: "#ffd60a",
    accessory: "neko",
    dialogues: [
      "Nyaa~! Right there, senpai! That combo feels purrfect~ 🐱💖",
      "Pet me with clicks, human! Nya! 😻",
      "Golden heart? Nya, catch it before it runs away! 🌟",
    ],
    personality: "Mischievous catgirl. Purrs when combo is high, bites when you stop clicking.",
  },
  {
    id: "rin",
    name: "Rin",
    emoji: "🔥",
    title: "Crimson Tsundere",
    rarity: "Epic",
    clickMult: 3,
    cps: 10,
    image: "/girls/rin.jpg",
    hair: "#ff7b54",
    hairDark: "#c62f2f",
    dress: "#ff4d4d",
    dressDark: "#8d0801",
    eyes: "#ff4800",
    accessory: "horns",
    dialogues: [
      "I-it's not like I like your clicks or anything... b-baka! ///// 🔥",
      "Hmph! Fine, I'll go FRENZY for you... just this once! 🔥",
      "D-don't tell the others, but... your crits make me melt... 💘",
    ],
    personality: "Classic tsundere. Acts cold, secretly counts your clicks and brags about you.",
  },
  {
    id: "luna",
    name: "Luna",
    emoji: "🌙",
    title: "Moonlight Guardian",
    rarity: "Epic",
    clickMult: 4,
    cps: 15,
    image: "/girls/luna.jpg",
    hair: "#cdb4ff",
    hairDark: "#7b6fd0",
    dress: "#3a3a8c",
    dressDark: "#1a1a4d",
    eyes: "#80ffdb",
    accessory: "halo",
    dialogues: [
      "The moon watches over your harem, senpai. Even offline, I guard your hearts 🌙",
      "Calm clicks... deep combo... feel the lunar flow~ ✨",
      "You returned! The stars whispered you'd come back~ 💫",
    ],
    personality: "Serene moon priestess. Grants offline earnings, soothes tilted senpais.",
  },
  {
    id: "aiko",
    name: "Aiko",
    emoji: "💙",
    title: "Childhood Sweetheart",
    rarity: "Legendary",
    clickMult: 6,
    cps: 25,
    image: "/girls/aiko.jpg",
    hair: "#8ecae6",
    hairDark: "#219ebc",
    dress: "#caf0f8",
    dressDark: "#48cae4",
    eyes: "#023e8a",
    accessory: "star",
    dialogues: [
      "Senpai! Remember our promise? Click with me forever! 💙",
      "Sugoi! Critical doki-doki~! You were always amazing! 💘",
      "Every bond level is another memory with you... 💝",
    ],
    personality: "Your osananajimi. Warm, loyal, massive click multiplier when bonded.",
  },
  {
    id: "celestia",
    name: "Celestia",
    emoji: "✨",
    title: "Starlight Goddess",
    rarity: "Legendary",
    clickMult: 8,
    cps: 40,
    image: "/girls/celestia.jpg",
    hair: "#fff3b0",
    hairDark: "#e09f3e",
    dress: "#ffffff",
    dressDark: "#c4b5fd",
    eyes: "#b366ff",
    accessory: "halo",
    dialogues: [
      "Mortal senpai, your devotion ascends to the heavens~ ✨",
      "FRENZY? I shall bless it x2 with starlight! 🌟",
      "Even goddesses get lonely... keep clicking, beloved~ 💖",
    ],
    personality: "Radiant goddess. Blesses idle gains and golden luck. Ultra rare, ultra powerful.",
  },
  {
    id: "akari",
    name: "Akari",
    emoji: "🌌",
    title: "Isekai Empress MYTHIC",
    rarity: "Mythic",
    clickMult: 12,
    cps: 80,
    image: "/girls/akari.jpg",
    hair: "#ff5d8f",
    hairDark: "#7b2cbf",
    dress: "#240046",
    dressDark: "#10002b",
    eyes: "#ff00d4",
    accessory: "horns",
    dialogues: [
      "KYAAA~! MEGA CRIT! You're incredible, senpai!! 💥💖",
      "You rebirthed worlds to meet me... now rule the isekai by my side 🌌",
      "0.8% fate brought us together. Never let go... 💜",
    ],
    personality: "The 0.8% myth. Isekai empress who waited across prestiges. Strongest girl in the game.",
  },
];

export function rollGirl(): GirlDef {
  const r = Math.random() * 100;
  let pool: GirlDef[];
  if (r < 1.2) {
    pool = GIRLS.filter((g) => g.rarity === "Mythic");
  } else if (r < 8) {
    pool = GIRLS.filter((g) => g.rarity === "Legendary");
  } else if (r < 24) {
    pool = GIRLS.filter((g) => g.rarity === "Epic");
  } else if (r < 54) {
    pool = GIRLS.filter((g) => g.rarity === "Rare");
  } else {
    pool = GIRLS.filter((g) => g.rarity === "Common");
  }
  return pool[Math.floor(Math.random() * pool.length)] ?? GIRLS[0];
}
