import type { NextConfig } from "next";
import { execSync } from "node:child_process";

/**
 * Qual ambiente está sendo gerado. Na Vercel, VERCEL_ENV vale 'production'
 * (deploy de produção) ou 'preview' (deploy de teste); fora dela - npm run
 * dev, build local - não existe e vira 'local'.
 *
 * Só a produção fica sem nenhuma marcação na tela: qualquer outro ambiente
 * mostra uma faixa avisando, pra ninguém confundir o link de teste com o
 * validado. Ver a seção "Produção x Teste" do README.
 */
const ambiente = process.env.VERCEL_ENV ?? "local";

/** Versão (commit) que gerou este build, quando dá pra descobrir. */
function versao(): string {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return ""; // deploy pela CLI não leva a pasta .git
  }
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_AMBIENTE: ambiente,
    NEXT_PUBLIC_VERSAO: versao(),
  },
};

export default nextConfig;
