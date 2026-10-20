@echo off
call "%~dp0_preparar.bat" || exit /b 1
echo ================================================
echo   PUBLICAR PRODUCAO  (so o que foi validado)
echo ================================================
echo Regras: precisa estar na branch main, sem alteracao pendente,
echo com a regressao passando - e voce confirma digitando PRODUCAO.
echo.
call npm run publicar
echo.
if errorlevel 1 (echo [!] Producao NAO foi publicada - leia a mensagem acima.) else (echo [ok] Concluido.)
if not defined SEM_PAUSA pause
