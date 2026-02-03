import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Valentine's Day Games 💕",
  description: "Fun and romantic games for couples! Play together and may the best Valentine win! The loser gets to kiss the winner! 😘",
  keywords: "valentine, games, couples, romantic, fun, interactive, kiss, love",
  authors: [{ name: "Valentine Games" }],
  openGraph: {
    title: "Valentine's Day Games 💕",
    description: "Fun and romantic games for couples! Play together and may the best Valentine win!",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Valentine's Day Games",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Valentine's Day Games 💕",
    description: "Fun and romantic games for couples! Play together and may the best Valentine win!",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
