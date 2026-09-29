import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "NEKO HEARTS — Anime Girl Clicker",
  description: "The most addictive anime girl clicker. Collect waifus, build combos, pull gacha!",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
