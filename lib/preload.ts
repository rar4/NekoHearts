"use client";

import { GIRLS } from "./girls";

// Moods that have real variant art files (/girls/{id}-{mood}.jpg).
// "smile" has no variant file — it always uses the base portrait.
export const VARIANT_MOODS = [
  "dizzy",
  "frenzy",
  "happy",
  "love",
  "pout",
  "sad",
  "sleepy",
  "timid",
  "wink",
  "wow",
] as const;

// Shared knowledge about which variant files actually exist.
// Seeded by the preloader (and by EmotionGirl itself on load/error),
// so components never flash a 404 before falling back to the base portrait.
const knownExists = new Set<string>();
const knownMissing = new Set<string>();

export function markVariantKnown(key: string, exists: boolean) {
  if (exists) {
    knownExists.add(key);
    knownMissing.delete(key);
  } else {
    knownMissing.add(key);
    knownExists.delete(key);
  }
}

export function variantKnownMissing(key: string) {
  return knownMissing.has(key);
}

// Preload through the Next.js image optimizer so the exact bytes that
// <Image> will render are already warm in the HTTP cache (no black flash).
function optimized(src: string, w: number) {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=75`;
}

function loadOne(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

async function runPool(jobs: (() => Promise<void>)[], limit: number) {
  const workers = Array.from({ length: Math.min(limit, jobs.length) }, async () => {
    while (jobs.length > 0) {
      const job = jobs.shift()!;
      try {
        await job();
      } catch {
        /* counted as done by the caller */
      }
    }
  });
  await Promise.all(workers);
}

// Critical set: every girl's portrait (stage + thumbnail sizes) plus all
// expressions of the currently selected girl. The game starts after these.
export async function preloadCritical(
  selectedId: string,
  onProgress: (loaded: number, total: number) => void
): Promise<void> {
  const jobs: { url: string; key?: string }[] = [];
  for (const g of GIRLS) {
    jobs.push({ url: optimized(g.image, 640) });
    jobs.push({ url: optimized(g.image, 128) });
  }
  for (const m of VARIANT_MOODS) {
    const key = `${selectedId}-${m}`;
    if (!variantKnownMissing(key)) {
      jobs.push({ url: optimized(`/girls/${key}.jpg`, 640), key });
    }
  }
  const total = jobs.length;
  let loaded = 0;
  onProgress(0, total);
  await runPool(
    jobs.map(
      ({ url, key }) =>
        async () => {
          const ok = await loadOne(url);
          if (key) markVariantKnown(key, ok);
          loaded++;
          onProgress(loaded, total);
        }
    ),
    6
  );
}

// Everything else (other girls' expressions) loads quietly after the game
// starts, so switching girls never flashes either.
export function preloadRest(selectedId: string) {
  try {
    const jobs: { url: string; key: string }[] = [];
    for (const g of GIRLS) {
      if (g.id === selectedId) continue;
      for (const m of VARIANT_MOODS) {
        const key = `${g.id}-${m}`;
        if (!variantKnownMissing(key) && !knownExists.has(key)) {
          jobs.push({ url: optimized(`/girls/${key}.jpg`, 640), key });
        }
      }
    }
    void runPool(
      jobs.map(
        ({ url, key }) =>
          async () => {
            const ok = await loadOne(url);
            markVariantKnown(key, ok);
          }
      ),
      3
    );
  } catch {
    /* background warming must never break the game */
  }
}
