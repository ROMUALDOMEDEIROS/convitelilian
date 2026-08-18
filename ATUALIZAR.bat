@echo off
chcp 65001 > nul
title Registro da Guarda - Atualizar
cd /d "%~dp0"

rem localiza o Node portatil ou instalado (igual ao INICIAR.bat)
call :ACHAR_NODE
where node > nul 2>&1
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado. Rode o INICIAR.bat primeiro, que ele
  echo        explica como obter o Node sem administrador.
  pause
  exit /b 1
)

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
exit /b 0

:ACHAR_NODE
set "NODE_DIR="
for %%D in ("%~dp0node" "%USERPROFILE%\node" "%USERPROFILE%\Downloads\node") do (
  if exist "%%~D\node.exe" set "NODE_DIR=%%~D"
)
if not defined NODE_DIR (
  for /d %%D in ("%~dp0node\node-v*-win-x64" "%USERPROFILE%\node\node-v*-win-x64" "%USERPROFILE%\Downloads\node-v*-win-x64") do (
    if exist "%%~D\node.exe" set "NODE_DIR=%%~D"
  )
)
if defined NODE_DIR set "PATH=%NODE_DIR%;%PATH%"
goto :eof
