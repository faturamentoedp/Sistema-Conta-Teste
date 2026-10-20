@echo off
rem Preparacao comum dos botoes do Excel: vai para a raiz do projeto e
rem libera o certificado corporativo (Netskope) para o Node/Vercel.
chcp 65001 >nul
cd /d "%~dp0.."
if exist "%USERPROFILE%\edp-ca.pem" set "NODE_EXTRA_CA_CERTS=%USERPROFILE%\edp-ca.pem"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao encontrado. Instale o Node.js e tente de novo.
  if not defined SEM_PAUSA pause
  exit /b 1
)
