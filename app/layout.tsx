import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEKO HEARTS — Anime Girl Clicker",
  description:
    "The most addictive anime girl clicker. Collect waifus, build combos, pull gacha! Tap-friendly idle game, playable on any phone.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Neko Hearts",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/girls/yuki.jpg" }],
  },
  openGraph: {
    title: "NEKO HEARTS — Anime Girl Clicker",
    description: "Collect waifus • Build combos • Never stop clicking",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1a1033",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
