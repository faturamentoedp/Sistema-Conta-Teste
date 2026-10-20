@echo off
call "%~dp0_preparar.bat" || exit /b 1
echo ================================================
echo   PUBLICAR TESTE  (nao mexe na producao)
echo ================================================
call npm run publicar:teste
echo.
if errorlevel 1 (echo [!] A publicacao NAO foi concluida - leia a mensagem acima.) else (echo [ok] Concluido.)
if not defined SEM_PAUSA pause
