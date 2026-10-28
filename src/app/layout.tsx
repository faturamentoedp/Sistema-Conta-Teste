import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Casca from "@/plataforma/componentes/Casca";
import FaixaAmbiente from "@/plataforma/componentes/FaixaAmbiente";
import { SCRIPT_TEMA_INICIAL } from "@/plataforma/tema";

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
      // A classe "dark" é posta no <html> pelo script abaixo antes da hidratação.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA_INICIAL }} />
      </head>
      <body className="min-h-full flex flex-col">
        <Casca faixa={<FaixaAmbiente />}>{children}</Casca>
      </body>
    </html>
  );
}
