<div align="center">

# 💖 NEKO HEARTS — Anime Girl Clicker
### *Collect waifus • Build combos • Never stop clicking*

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-pink?style=for-the-badge)

<p align="center">
  <b>Wciągający, dopracowany clicker webowy inspirowany grami gacha, mechanikami incremental/idle oraz interaktywnymi awatarami reagującymi na emocje.</b>
</p>

</div>

---

## ✨ Kluczowe Funkcjonalności

* 🎭 **Żywe Emocje & Reaktywny Awatar:**
  * Postać na żywo reaguje na styl gry (szybkie serie, krytyki, tryb Frenzy czy brak aktywności ze strony gracza).
  * Bezpośrednie interakcje: **Pat** (głaskanie), **Tease** (droczenie się) oraz **Hug** (przytulanie) wpływające na nastrój i relację.
* 🎙️ **Kwestie Głosowe & Efekty SFX:**
  * Udźwiękowienie kliknięć, krytyków, poziomu combo i wygranych w gacha.
  * Autorskie linie dialogowe i kwestie głosowe przypisane do konkretnych bohaterek.
* 🎰 **Doki-Doki Gacha & System Pity:**
  * Losowanie bohaterek o różnych rzadkościach: od *Common* po *Mythic*.
  * Wbudowany system gwarancji (Pity): pewny drop *Epic+* co 10 pulli oraz *Legendary+* co 30 pulli.
  * Zdublowane karty automatycznie zamieniają się w cenne punkty **Bond XP**.
* 🔥 **Dynamiczny System Combo & Frenzy:**
  * Budowanie mnożnika za szybkie klikanie z krótkim oknem czasowym (degradacja streaków).
  * Aktywacja stanu **Frenzy** po 25 kliknięciach (x3+ mnożnik bazowy, dynamiczne efekty wizualne).
* 🎫 **Doki-Doki Pass & Quests:**
  * 20-poziomowa przepustka sezonowa z nagrodami w sercach i walucie premium (Gems).
  * Zestaw zadań (Quests) i bonusy za codzienne logowanie (**Daily Streak**).
* 🌌 **Isekai Rebirth (Prestige) & VIP Gem Shop:**
  * Opcja prestiżu po osiągnięciu 500k serc – reset w zamian za permanentne Diamenty.
  * Ekskluzywny sklep VIP z trwałymi ulepszeniami: *Neko Auto-Clicker*, *Combo Saver*, *Luna's Blessing* (zarobki offline) czy *Divine Pull*.

---

## 🎮 Mechanika Rozgrywki

| Mechanika | Wskaźnik / Warunek | Działanie |
| :--- | :---: | :--- |
| **Normal Hit** | 100% | Generuje bazową wartość serc powiększoną o mnożniki bohaterki i bond. |
| **Critical Hit** | ~8% (+sklep) | **x10** do wartości uderzenia + unikalny dźwięk i reakcja zdziwienia. |
| **Mega Crit** | ~1% (+sklep) | **x100** (lub więcej) do uderzenia + trzęsienie ekranu i oszołomienie bohaterki. |
| **Combo** | Ciągłe klikanie | Rosnący mnożnik obrażeń (progi: x2, x3, x5, x8). |
| **Frenzy Mode** | Combo = 25 | 12s trwania szału: mnożnik zysków x3+ oraz zmiana palety barw i poświaty. |
| **Golden Heart** | Losowy spawn | Kliknięcie daje natychmiastowy potężny zastrzyk waluty (skalowany z CPS/Click). |

---

## 🛠️ Stos Technologiczny

* **Core:** [Next.js](https://nextjs.org/) (React, App Router)
* **Język:** [TypeScript](https://www.typescriptlang.org/)
* **Warstwa Wizualna:** Nowoczesny CSS (złożone `@keyframes`, filtry `backdrop-filter: blur()`, responsywny CSS Grid/Flexbox)
* **Zarządzanie Stanem i Zapis:** React Hooks (`useState`, `useRef`, `useMemo`) + synchronizacja z `localStorage`
* **Audio:** Web Audio API & HTML5 Audio (z optymalizacją pod blokady autoplay w przeglądarkach)

---

## 📂 Struktura Katalogów

```text
neko-hearts/
├── app/
│   ├── globals.css        # Złożone animacje CSS (ruchy postaci, mimika, cząsteczki)
│   ├── layout.tsx         # Konfiguracja HTML i metadane SEO
│   └── page.tsx           # Silnik gry, pętla idle, zarządzanie stanem i sklep
├── components/
│   ├── AnimeGirl.tsx      # Stałe i definicje typów stanów emocjonalnych
│   ├── EmotionGirl.tsx    # Interaktywny komponent awatara reagujący na nastrój
│   └── GirlImage.tsx      # Wizualna reprezentacja kart bohaterek i obramowań
├── lib/
│   ├── girls.ts           # Baza waifu: statystyki CPS, mnożniki, rzadkości, dialogi
│   ├── sound.ts           # Obsługa efektów dźwiękowych (SFX)
│   └── voiceAudio.ts      # Moduł odtwarzania ścieżek dialogowych bohaterek
├── public/                # Assety statyczne, grafiki i klipy dźwiękowe
└── next.config.js         # Konfiguracja środowiska Next.js
