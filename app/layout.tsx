import type { Metadata } from "next";
import { Manrope, Oswald } from "next/font/google";

import "./globals.css";

const manrope = Manrope({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-manrope",
});

const oswald = Oswald({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-oswald",
});

export const metadata: Metadata = {
  title: "Alejandro Carrizo | Personal Trainer",
  description: "Sitio web de Alejandro Carrizo, Personal Trainer.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={`${manrope.variable} ${oswald.variable}`}>
      <body>{children}</body>
    </html>
  );
}
