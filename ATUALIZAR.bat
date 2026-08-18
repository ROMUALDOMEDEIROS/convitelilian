@echo off
chcp 65001 > nul
title Registro da Guarda - Atualizar
cd /d "%~dp0"
echo Recompilando o aplicativo apos uma atualizacao...
echo.
call npm install
call npm install --prefix server
rmdir /s /q dist 2>nul
call npm run build
if errorlevel 1 (
  echo.
  echo [ERRO] Falha ao recompilar. Veja as mensagens acima.
  pause
  exit /b 1
)
echo.
echo Pronto. Rode o INICIAR.bat para usar.
pause
