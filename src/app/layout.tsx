import "reflect-metadata";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";

import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_JP } from "next/font/google";

import { setupDI } from "@/shared/lib/di";
import { AppShell } from "@/shared/ui/components/layout/AppShell";
import { ColorModeProvider } from "@/shared/ui/providers/ColorModeProvider";

import "mapbox-gl/dist/mapbox-gl.css";
import "./globals.css";

setupDI();

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansJP = Noto_Sans_JP({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-noto-sans-jp",
});

export const metadata: Metadata = {
  title: "Polister",
  description: "Polisterプロジェクト",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={notoSansJP.variable}>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AppRouterCacheProvider>
          <ColorModeProvider>
            <AppShell>{children}</AppShell>
          </ColorModeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
