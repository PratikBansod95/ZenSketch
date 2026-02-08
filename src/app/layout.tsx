import type { Metadata } from "next";
import { Inter } from "next/font/google"; // or Outfit if I want premium
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ZenSketch - Mandala Mind",
  description: "A calming, minimalist drawing app for creating mandalas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
