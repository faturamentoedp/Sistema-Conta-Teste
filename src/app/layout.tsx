import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Casca from "@/plataforma/componentes/Casca";
import FaixaAmbiente from "@/plataforma/componentes/FaixaAmbiente";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Plataforma de Faturamento - EDP",
    template: "%s | Plataforma de Faturamento",
  },
  description: "Plataforma com as ferramentas de faturamento da EDP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Casca faixa={<FaixaAmbiente />}>{children}</Casca>
      </body>
    </html>
  );
}
