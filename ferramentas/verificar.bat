@echo off
call "%~dp0_preparar.bat" || exit /b 1
echo ================================================
echo   VERIFICAR (regressao dos calculos + CIP)
echo ================================================
call npm run verificar
set RESULTADO=%errorlevel%
call npm run verificar-cip
if not "%RESULTADO%"=="0" (echo. & echo [!] Ha divergencia nos calculos.) else if errorlevel 1 (echo. & echo [!] Ha divergencia na CIP.) else (echo. & echo [ok] Tudo conferido.)
if not defined SEM_PAUSA pause
