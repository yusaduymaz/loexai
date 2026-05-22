import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LoexAI — Local Opportunity Engine",
  description:
    "AI-powered local business opportunity intelligence for agencies and freelancers.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`dark ${geistSans.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        {/*
          Material Symbols Outlined — referans HTML'ler bu ikon setini kullanıyor.
          Bu bir Google Fonts icon stylesheet'i (web font değil); `next/font` ile
          yüklenemez, bu yüzden klasik <link> kullanıyoruz. App Router root layout
          her sayfada paylaşıldığı için "single page custom font" uyarısı geçerli
          değil — kuralı bu satır için kapatıyoruz.
        */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="font-sans bg-background text-on-background antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
